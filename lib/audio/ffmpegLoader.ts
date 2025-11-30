/**
 * FFmpeg loader utility untuk memuat FFmpeg.wasm dengan benar di browser
 * Menggunakan UMD approach untuk kompatibilitas dengan Next.js
 */

export interface FFmpegInstance {
    load: () => Promise<void>;
    writeFile: (path: string, data: Uint8Array) => Promise<void>;
    readFile: (path: string) => Promise<Uint8Array>;
    exec: (args: string[]) => Promise<void>;
    terminate: () => void;
}

let ffmpegInstance: FFmpegInstance | null = null;

/**
 * Mendapatkan base URL dari origin (ngrok atau localhost)
 * Ini memastikan semua resource FFmpeg dimuat dari origin yang sama untuk menghindari CORS
 */
function getBaseUrl(): string {
    if (typeof window === 'undefined') {
        return '';
    }
    
    // Gunakan origin saat ini (ngrok atau localhost)
    const origin = window.location.origin;
    return origin;
}

/**
 * Membuat full URL untuk resource FFmpeg
 */
function getFFmpegResourceUrl(path: string): string {
    const baseUrl = getBaseUrl();
    // Pastikan path dimulai dengan /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
}

/**
 * Utility function untuk convert file ke Uint8Array
 */
export async function fetchFile(file: Blob | File | string): Promise<Uint8Array> {
    if (typeof file === 'string') {
        const response = await fetch(file);
        return new Uint8Array(await response.arrayBuffer());
    }
    return new Uint8Array(await file.arrayBuffer());
}

/**
 * Memuat script eksternal ke halaman dan menunggu onload
 */
async function loadScript(src: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        // Check if script already loaded - use more flexible matching
        const existingScripts = Array.from(document.querySelectorAll('script[src]'));
        const alreadyLoaded = existingScripts.some(s => {
            const scriptSrc = (s as HTMLScriptElement).src;
            return scriptSrc.includes('ffmpeg') && (scriptSrc === src || scriptSrc.includes(new URL(src).pathname));
        });
        
        if (alreadyLoaded) {
            // Give it a moment to ensure it's fully initialized
            setTimeout(() => resolve(), 100);
            return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = false; // Load synchronously to ensure order
        s.crossOrigin = 'anonymous'; // Allow CORS if needed
        
        // Use both onload and a small delay to ensure script execution completes
        let resolved = false;
        s.onload = () => {
            // Give script a moment to execute and expose globals
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            }, 100);
        };
        
        s.onerror = (err) => {
            console.error('[FFmpegLoader] Script load error:', src, err);
            reject(new Error(`Failed to load script: ${src}`));
        };
        
        // Also resolve after a timeout as fallback
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        }, 5000);
        
        document.head.appendChild(s);
    });
}

/**
 * Mendapatkan instance FFmpeg menggunakan UMD approach
 */
export async function getFFmpegInstance(): Promise<FFmpegInstance> {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
        throw new Error('FFmpeg can only be loaded in browser environment');
    }

    if (ffmpegInstance) {
        return ffmpegInstance;
    }

    try {
        // First, try dynamic import with explicit string (works better with Next.js webpack)
        try {
            // Use explicit string to avoid "expression is too dynamic" error
            const ffmpegModule = await import('@ffmpeg/ffmpeg');
            
            // Try to get FFmpeg class
            const FFmpegClass = ffmpegModule.FFmpeg || (ffmpegModule as any).default?.FFmpeg || (ffmpegModule as any).default;
            
            if (FFmpegClass && typeof FFmpegClass === 'function') {
                const ffmpeg = new FFmpegClass();
                
                // Pre-load worker as blob to avoid CORS issues
                let workerBlobURL: string | null = null;
                
                try {
                    const workerUrl = getFFmpegResourceUrl('/ffmpeg/umd/814.ffmpeg.js');
                    const workerResponse = await fetch(workerUrl);
                    if (workerResponse.ok) {
                        const workerBlob = await workerResponse.blob();
                        workerBlobURL = URL.createObjectURL(workerBlob);
                    } else {
                        console.warn('[FFmpegLoader] Worker file not found, may cause CORS issues');
                    }
                } catch (workerErr) {
                    console.warn('[FFmpegLoader] Could not pre-load worker file:', workerErr);
                }
                
                const loadOptions: any = {
                    coreURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.js'),
                    wasmURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.wasm'),
                };
                
                // If we have worker blob, use it
                if (workerBlobURL) {
                    loadOptions.mainScriptUrlOrBlob = workerBlobURL;
                }
                
                try {
                    await ffmpeg.load(loadOptions);
                    // Clean up blob URL after successful load
                    if (workerBlobURL) {
                        URL.revokeObjectURL(workerBlobURL);
                    }
                } catch (loadErr) {
                    // Clean up blob URL on error
                    if (workerBlobURL) {
                        URL.revokeObjectURL(workerBlobURL);
                    }
                    
                    // If load fails due to worker CORS, try without worker
                    if (loadErr instanceof Error && (
                        loadErr.message.includes('Worker') || 
                        loadErr.message.includes('cannot be accessed') ||
                        loadErr.name === 'SecurityError' ||
                        loadErr.message.includes('CORS')
                    )) {
                        // Try loading without worker configuration
                        const noWorkerOptions = {
                            coreURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.js'),
                            wasmURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.wasm'),
                        };
                        await ffmpeg.load(noWorkerOptions);
                    } else {
                        throw loadErr;
                    }
                }
                
                // Wrap dalam interface yang konsisten
                ffmpegInstance = {
                    load: async () => {},
                    writeFile: async (path: string, data: Uint8Array) => {
                        await ffmpeg.writeFile(path, data);
                    },
                    readFile: async (path: string) => {
                        const data = await ffmpeg.readFile(path);
                        return data as Uint8Array;
                    },
                    exec: async (args: string[]) => {
                        await ffmpeg.exec(args);
                    },
                    terminate: () => {
                        if (ffmpeg.terminate) {
                            ffmpeg.terminate();
                        }
                        ffmpegInstance = null;
                    }
                };
                
                return ffmpegInstance;
            }
        } catch (importErr) {
            // Fall through to UMD approach
        }

        // Check if FFmpeg is already available globally - try multiple ways
        const checkGlobal = () => {
            const g = globalThis as any;
            const w = window as any;
            
            // Try various possible locations for FFmpeg class or createFFmpeg function
            // Also check common UMD export patterns
            const ffmpegModule = (
                g.FFmpeg || 
                g.window?.FFmpeg || 
                w.FFmpeg ||
                g['@ffmpeg/ffmpeg'] ||
                g.ffmpeg ||
                w.ffmpeg ||
                // Check for UMD exports
                (g.exports && g.exports.FFmpeg) ||
                (g.module && g.module.exports && g.module.exports.FFmpeg) ||
                // Check for different naming patterns
                g.FFmpegWASM ||
                w.FFmpegWASM ||
                g.ffmpegWASM ||
                w.ffmpegWASM
            );
            
            // Also check for createFFmpeg function (older UMD format)
            const createFFmpegFn = (
                g.createFFmpeg ||
                w.createFFmpeg ||
                ffmpegModule?.createFFmpeg ||
                (g['@ffmpeg/ffmpeg'] as any)?.createFFmpeg ||
                // Check UMD exports
                (g.exports && g.exports.createFFmpeg) ||
                (g.module && g.module.exports && g.module.exports.createFFmpeg)
            );
            
            return { ffmpegModule, createFFmpegFn };
        };

        let { ffmpegModule, createFFmpegFn } = checkGlobal();
        
        // If not available, load UMD script
        if (!ffmpegModule && !createFFmpegFn) {
            // Try local UMD first (using base URL for ngrok support), then fallback to CDN
            const localUmd = getFFmpegResourceUrl('/ffmpeg/umd/ffmpeg.js');
            // Use same version as package.json (0.12.15) and try multiple CDNs
            const cdnUmd = (process.env.NEXT_PUBLIC_FFMPEG_UMD_URL || '').trim() || 
                           'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.min.js';
            const cdnUmdAlt = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.min.js';
            
            let scriptLoaded = false;
            let loadedFrom = '';
            
            // Try local UMD first to avoid CORS issues with worker
            // Local UMD will use local worker files, avoiding CDN CORS
            // Using base URL ensures ngrok compatibility
            try {
                const localCheck = await fetch(localUmd, { method: 'HEAD' });
                if (localCheck.ok) {
                    await loadScript(localUmd);
                    scriptLoaded = true;
                    loadedFrom = 'local';
                } else {
                    throw new Error('Local UMD file not found (404)');
                }
            } catch (localErr) {
                // Fallback to CDN if local not available
                try {
                    await loadScript(cdnUmd);
                    scriptLoaded = true;
                    loadedFrom = 'CDN (unpkg)';
                } catch (cdnErr) {
                    try {
                        await loadScript(cdnUmdAlt);
                        scriptLoaded = true;
                        loadedFrom = 'CDN (jsdelivr)';
                    } catch (cdnAltErr) {
                        console.error('[FFmpegLoader] All sources failed');
                        throw new Error(`Failed to load FFmpeg UMD from local (${localErr instanceof Error ? localErr.message : String(localErr)}), CDN (${cdnErr instanceof Error ? cdnErr.message : String(cdnErr)}), and alternative CDN (${cdnAltErr instanceof Error ? cdnAltErr.message : String(cdnAltErr)})`);
                    }
                }
            }
            
            if (!scriptLoaded) {
                throw new Error('Script loading reported success but scriptLoaded flag is false');
            }
            
            // Wait for script to initialize - try multiple times with increasing delays
            let attempts = 0;
            const maxAttempts = 20;
            while (!ffmpegModule && !createFFmpegFn && attempts < maxAttempts) {
                // Increase delay with each attempt
                const delay = Math.min(300 + (attempts * 100), 1000);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                const result = checkGlobal();
                ffmpegModule = result.ffmpegModule;
                createFFmpegFn = result.createFFmpegFn;
                attempts++;
                
                // Wait for script to initialize
            }
        }

        // Handle both old (createFFmpeg) and new (FFmpeg class) API
        let ffmpeg: any;
        let isOldAPI = false;
        
        if (createFFmpegFn && typeof createFFmpegFn === 'function') {
            // Old API: use createFFmpeg function
            isOldAPI = true;
            const corePath = getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.js');
            ffmpeg = createFFmpegFn({ log: true, corePath });
            await ffmpeg.load();
        } else if (ffmpegModule) {
            // New API: use FFmpeg class
            let FFmpegClass = 
                ffmpegModule.FFmpeg || 
                (ffmpegModule as any).default?.FFmpeg || 
                (ffmpegModule as any).default ||
                ffmpegModule;
            
            // If still not a function, try accessing it differently
            if (typeof FFmpegClass !== 'function') {
                const g = globalThis as any;
                const w = window as any;
                FFmpegClass = g.FFmpeg || w.FFmpeg || (g as any)['@ffmpeg/ffmpeg']?.FFmpeg;
            }
            
            if (!FFmpegClass || typeof FFmpegClass !== 'function') {
                console.error('[FFmpegLoader] FFmpegClass type:', typeof FFmpegClass, FFmpegClass);
                throw new Error(`FFmpeg class not found or not a function. Found: ${typeof FFmpegClass}`);
            }

            ffmpeg = new FFmpegClass();

            // Pre-load worker as blob to avoid CORS issues
            let workerBlobURL: string | null = null;
            
            try {
                const workerUrl = getFFmpegResourceUrl('/ffmpeg/umd/814.ffmpeg.js');
                const workerResponse = await fetch(workerUrl);
                if (workerResponse.ok) {
                    const workerBlob = await workerResponse.blob();
                    workerBlobURL = URL.createObjectURL(workerBlob);
                } else {
                    console.warn('[FFmpegLoader] Worker file not found, may cause CORS issues');
                }
            } catch (workerErr) {
                console.warn('[FFmpegLoader] Could not pre-load worker file:', workerErr);
            }
            
            const loadOptions: any = {
                coreURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.js'),
                wasmURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.wasm'),
            };
            
            // If we have worker blob, use it
            if (workerBlobURL) {
                loadOptions.mainScriptUrlOrBlob = workerBlobURL;
            }
            
            try {
                await ffmpeg.load(loadOptions);
                // Clean up blob URL after successful load
                if (workerBlobURL) {
                    URL.revokeObjectURL(workerBlobURL);
                }
            } catch (loadErr) {
                // Clean up blob URL on error
                if (workerBlobURL) {
                    URL.revokeObjectURL(workerBlobURL);
                }
                
                // If load fails due to worker CORS, try alternative approach
                if (loadErr instanceof Error && (
                    loadErr.message.includes('Worker') || 
                    loadErr.message.includes('cannot be accessed') ||
                    loadErr.name === 'SecurityError' ||
                    loadErr.message.includes('CORS')
                )) {
                    // Some FFmpeg versions can work without worker (main thread mode)
                    // Try loading without worker configuration
                    try {
                        const noWorkerOptions: any = {
                            coreURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.js'),
                            wasmURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.wasm'),
                        };
                        
                        await ffmpeg.load(noWorkerOptions);
                    } catch (noWorkerErr) {
                        console.error('[FFmpegLoader] Failed to load FFmpeg core:', loadErr);
                        const errorDetails = loadErr instanceof Error 
                            ? `${loadErr.message}${loadErr.stack ? `\n${loadErr.stack}` : ''}`
                            : String(loadErr);
                        throw new Error(`Failed to load FFmpeg core files: ${errorDetails}. Make sure /ffmpeg/ffmpeg-core.js and /ffmpeg/ffmpeg-core.wasm are accessible. Worker error: ${noWorkerErr instanceof Error ? noWorkerErr.message : String(noWorkerErr)}`);
                    }
                } else {
                    console.error('[FFmpegLoader] Failed to load FFmpeg core:', loadErr);
                    const errorDetails = loadErr instanceof Error 
                        ? `${loadErr.message}${loadErr.stack ? `\n${loadErr.stack}` : ''}`
                        : String(loadErr);
                    throw new Error(`Failed to load FFmpeg core files: ${errorDetails}. Make sure /ffmpeg/ffmpeg-core.js and /ffmpeg/ffmpeg-core.wasm are accessible.`);
                }
            }
        } else {
            // Final debug dump - very comprehensive
            const g = globalThis as any;
            const w = window as any;
            
            // Check all possible locations
            const possibleLocations = {
                'globalThis.FFmpeg': g.FFmpeg,
                'window.FFmpeg': w.FFmpeg,
                'globalThis.createFFmpeg': g.createFFmpeg,
                'window.createFFmpeg': w.createFFmpeg,
                'globalThis["@ffmpeg/ffmpeg"]': g['@ffmpeg/ffmpeg'],
                'window["@ffmpeg/ffmpeg"]': w['@ffmpeg/ffmpeg'],
                'globalThis.ffmpeg': g.ffmpeg,
                'window.ffmpeg': w.ffmpeg,
            };
            
            console.error('[FFmpegLoader] FFmpeg not found. Comprehensive debug:', {
                possibleLocations,
                globalThisSampleKeys: Object.keys(g).slice(0, 50),
                windowSampleKeys: Object.keys(w).slice(0, 50),
                allFFmpegRelatedKeys: [
                    ...Object.keys(g).filter(k => k.toLowerCase().includes('ff') || k.toLowerCase().includes('mp')),
                    ...Object.keys(w).filter(k => k.toLowerCase().includes('ff') || k.toLowerCase().includes('mp'))
                ],
                scriptTags: Array.from(document.querySelectorAll('script')).map(s => ({
                    src: (s as HTMLScriptElement).src,
                    id: s.id,
                    loaded: s.getAttribute('data-loaded')
                })),
            });
            
            throw new Error('FFmpeg UMD loaded but not found in global scope after multiple attempts.');
        }

        // Store API type for use in wrapper functions
        const usingOldAPI = isOldAPI;

        // Wrap dalam interface yang konsisten
        ffmpegInstance = {
            load: async () => {
                // Already loaded
            },
            writeFile: async (path: string, data: Uint8Array) => {
                if (usingOldAPI) {
                    // Old API uses FS
                    ffmpeg.FS('writeFile', path, data);
                } else {
                    await ffmpeg.writeFile(path, data);
                }
            },
            readFile: async (path: string) => {
                if (usingOldAPI) {
                    // Old API uses FS
                    const data = ffmpeg.FS('readFile', path) as Uint8Array;
                    return data;
                } else {
                    const data = await ffmpeg.readFile(path);
                    return data as Uint8Array;
                }
            },
            exec: async (args: string[]) => {
                if (usingOldAPI) {
                    // Old API uses run
                    await ffmpeg.run(...args);
                } else {
                    await ffmpeg.exec(args);
                }
            },
            terminate: () => {
                if (ffmpeg.terminate) {
                    ffmpeg.terminate();
                }
                ffmpegInstance = null;
            }
        };

        return ffmpegInstance;
    } catch (err) {
        console.error('[FFmpegLoader] Failed to load FFmpeg - Full error:', err);
        const errorMessage = err instanceof Error 
            ? `${err.message}${err.stack ? `\nStack: ${err.stack}` : ''}`
            : err && typeof err === 'object' && 'toString' in err
            ? err.toString()
            : String(err);
        throw new Error(`Failed to load FFmpeg: ${errorMessage}`);
    }
}
