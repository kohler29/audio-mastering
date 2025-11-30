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
    console.log('[FFmpegLoader] Using base URL:', origin);
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
            console.log('[FFmpegLoader] Script already loaded (similar):', src);
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
            console.log('[FFmpegLoader] Script onload event fired:', src);
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
                console.log('[FFmpegLoader] Script load timeout, assuming loaded:', src);
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
        console.log('[FFmpegLoader] Using cached instance');
        return ffmpegInstance;
    }

    try {
        // First, try dynamic import with explicit string (works better with Next.js webpack)
        try {
            console.log('[FFmpegLoader] Attempting dynamic import of @ffmpeg/ffmpeg...');
            // Use explicit string to avoid "expression is too dynamic" error
            const ffmpegModule = await import('@ffmpeg/ffmpeg');
            
            // Try to get FFmpeg class
            const FFmpegClass = ffmpegModule.FFmpeg || (ffmpegModule as any).default?.FFmpeg || (ffmpegModule as any).default;
            
            if (FFmpegClass && typeof FFmpegClass === 'function') {
                console.log('[FFmpegLoader] Successfully imported FFmpeg via dynamic import');
                const ffmpeg = new FFmpegClass();
                
                // Setup logging
                if (typeof ffmpeg.on === 'function') {
                    ffmpeg.on('log', ({ message }: { message: string }) => {
                        console.log('[FFmpeg]', message);
                    });
                    ffmpeg.on('progress', ({ progress, time }: { progress: number; time: number }) => {
                        console.log(`[FFmpeg] Progress: ${(progress * 100).toFixed(2)}% (time: ${time})`);
                    });
                }
                
                console.log('[FFmpeg] Loading core...');
                // Pre-load worker as blob to avoid CORS issues
                let workerBlobURL: string | null = null;
                
                try {
                    console.log('[FFmpegLoader] Pre-loading worker file as blob to avoid CORS...');
                    const workerUrl = getFFmpegResourceUrl('/ffmpeg/umd/814.ffmpeg.js');
                    const workerResponse = await fetch(workerUrl);
                    if (workerResponse.ok) {
                        const workerBlob = await workerResponse.blob();
                        workerBlobURL = URL.createObjectURL(workerBlob);
                        console.log('[FFmpegLoader] Worker file loaded as blob from:', workerUrl);
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
                    console.log('[FFmpegLoader] Using local worker blob URL');
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
                        console.log('[FFmpegLoader] Worker CORS error, trying without worker config...');
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
                
                console.log('[FFmpeg] Loaded successfully via dynamic import');
                
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
            console.log('[FFmpegLoader] Dynamic import failed, falling back to UMD:', importErr);
            // Fall through to UMD approach
        }
        
        console.log('[FFmpegLoader] Loading FFmpeg via UMD...');

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
                console.log('[FFmpegLoader] Trying local UMD first (to avoid worker CORS):', localUmd);
                const localCheck = await fetch(localUmd, { method: 'HEAD' });
                if (localCheck.ok) {
                    console.log('[FFmpegLoader] Local UMD exists, loading...');
                    await loadScript(localUmd);
                    scriptLoaded = true;
                    loadedFrom = 'local';
                    console.log('[FFmpegLoader] Local UMD script loaded successfully');
                } else {
                    throw new Error('Local UMD file not found (404)');
                }
            } catch (localErr) {
                console.log('[FFmpegLoader] Local UMD failed, trying CDN:', localErr);
                // Fallback to CDN if local not available
                try {
                    console.log('[FFmpegLoader] Trying CDN UMD:', cdnUmd);
                    await loadScript(cdnUmd);
                    scriptLoaded = true;
                    loadedFrom = 'CDN (unpkg)';
                    console.log('[FFmpegLoader] CDN UMD script loaded successfully');
                } catch (cdnErr) {
                    console.log('[FFmpegLoader] First CDN failed, trying alternative CDN:', cdnErr);
                    try {
                        console.log('[FFmpegLoader] Trying alternative CDN:', cdnUmdAlt);
                        await loadScript(cdnUmdAlt);
                        scriptLoaded = true;
                        loadedFrom = 'CDN (jsdelivr)';
                        console.log('[FFmpegLoader] Alternative CDN UMD script loaded successfully');
                    } catch (cdnAltErr) {
                        console.error('[FFmpegLoader] All sources failed');
                        throw new Error(`Failed to load FFmpeg UMD from local (${localErr instanceof Error ? localErr.message : String(localErr)}), CDN (${cdnErr instanceof Error ? cdnErr.message : String(cdnErr)}), and alternative CDN (${cdnAltErr instanceof Error ? cdnAltErr.message : String(cdnAltErr)})`);
                    }
                }
            }
            
            if (!scriptLoaded) {
                throw new Error('Script loading reported success but scriptLoaded flag is false');
            }
            
            console.log('[FFmpegLoader] Script loaded from:', loadedFrom);
            
            // Immediately check what the script exposed
            const immediateCheck = checkGlobal();
            console.log('[FFmpegLoader] Immediate check after script load:', {
                hasFFmpegModule: !!immediateCheck.ffmpegModule,
                hasCreateFFmpeg: !!immediateCheck.createFFmpegFn,
                ffmpegModuleType: typeof immediateCheck.ffmpegModule,
                createFFmpegType: typeof immediateCheck.createFFmpegFn,
            });
            
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
                
                if (!ffmpegModule && !createFFmpegFn && attempts < maxAttempts) {
                    // Debug: log what's actually in global scope - more comprehensive
                    const g = globalThis as any;
                    const w = window as any;
                    
                    // Get all keys that might be relevant
                    const allGlobalKeys = Object.keys(g).filter(k => {
                        const lower = k.toLowerCase();
                        return lower.includes('ff') || lower.includes('mp') || lower.includes('create') || lower.includes('video') || lower.includes('wasm');
                    });
                    const allWindowKeys = Object.keys(w).filter(k => {
                        const lower = k.toLowerCase();
                        return lower.includes('ff') || lower.includes('mp') || lower.includes('create') || lower.includes('video') || lower.includes('wasm');
                    });
                    
                    // Try to access via different patterns
                    const testAccess = {
                        'window.FFmpeg': w.FFmpeg,
                        'window.createFFmpeg': w.createFFmpeg,
                        'globalThis.FFmpeg': g.FFmpeg,
                        'globalThis.createFFmpeg': g.createFFmpeg,
                        'window["@ffmpeg/ffmpeg"]': w['@ffmpeg/ffmpeg'],
                        'window.ffmpeg': w.ffmpeg,
                    };
                    
                    const debugInfo = {
                        attempt: attempts,
                        maxAttempts,
                        delay,
                        globalThisKeys: allGlobalKeys,
                        windowKeys: allWindowKeys,
                        testAccess,
                        // Check for common UMD patterns
                        hasModule: !!g.module,
                        hasExports: !!g.exports,
                        hasDefine: typeof g.define === 'function',
                        hasRequire: typeof g.require === 'function',
                        // Check if script is in DOM
                        scriptInDOM: !!document.querySelector(`script[src*="ffmpeg"]`),
                    };
                    console.log('[FFmpegLoader] Waiting for FFmpeg...', debugInfo);
                    
                    // Also check if script tag was actually added
                    const scripts = Array.from(document.querySelectorAll('script[src*="ffmpeg"]'));
                    console.log('[FFmpegLoader] FFmpeg script tags found:', scripts.map(s => (s as HTMLScriptElement).src));
                    
                    // Try to manually inspect the script content if possible
                    if (attempts === 5) {
                        console.log('[FFmpegLoader] Attempting to inspect window object more deeply...');
                        // Log first 100 keys of window to see if FFmpeg is there with different casing
                        const windowKeys = Object.keys(w).slice(0, 100);
                        const ffmpegLikeKeys = windowKeys.filter(k => {
                            const lower = k.toLowerCase();
                            return lower.includes('ff') || lower.includes('mp');
                        });
                        console.log('[FFmpegLoader] Window keys containing ff/mp:', ffmpegLikeKeys);
                    }
                }
            }
        }

        // Debug: log what we found
        console.log('[FFmpegLoader] Found in global scope:', {
            hasFFmpegModule: !!ffmpegModule,
            hasCreateFFmpeg: !!createFFmpegFn,
            ffmpegModuleType: typeof ffmpegModule,
            createFFmpegType: typeof createFFmpegFn,
        });

        // Handle both old (createFFmpeg) and new (FFmpeg class) API
        let ffmpeg: any;
        let isOldAPI = false;
        
        if (createFFmpegFn && typeof createFFmpegFn === 'function') {
            // Old API: use createFFmpeg function
            console.log('[FFmpegLoader] Using createFFmpeg function (old API)');
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

            console.log('[FFmpegLoader] Creating FFmpeg instance from class...');
            ffmpeg = new FFmpegClass();

            // Setup logging (only for new API)
            if (typeof ffmpeg.on === 'function') {
                ffmpeg.on('log', ({ message }: { message: string }) => {
                    console.log('[FFmpeg]', message);
                });

                ffmpeg.on('progress', ({ progress, time }: { progress: number; time: number }) => {
                    console.log(`[FFmpeg] Progress: ${(progress * 100).toFixed(2)}% (time: ${time})`);
                });
            }

            console.log('[FFmpeg] Loading core...');
            // Gunakan file lokal yang sudah ada di public/ffmpeg
            // Pre-load worker as blob to avoid CORS issues
            let workerBlobURL: string | null = null;
            
            try {
                console.log('[FFmpegLoader] Pre-loading worker file as blob to avoid CORS...');
                const workerUrl = getFFmpegResourceUrl('/ffmpeg/umd/814.ffmpeg.js');
                const workerResponse = await fetch(workerUrl);
                if (workerResponse.ok) {
                    const workerBlob = await workerResponse.blob();
                    workerBlobURL = URL.createObjectURL(workerBlob);
                    console.log('[FFmpegLoader] Worker file loaded as blob from:', workerUrl);
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
            // For FFmpeg 0.12.x, the worker is loaded automatically by the core
            // But we can configure it via mainScriptUrlOrBlob to use our blob URL
            if (workerBlobURL) {
                // For FFmpeg 0.12.x, mainScriptUrlOrBlob tells the core where to find the worker
                // This should be a blob URL or a local path
                loadOptions.mainScriptUrlOrBlob = workerBlobURL;
                console.log('[FFmpegLoader] Configured to use local worker blob URL');
            } else {
                // If no worker blob, try to use local path directly
                // Some versions might auto-detect from the same origin
                console.log('[FFmpegLoader] No worker blob, FFmpeg will try to auto-detect worker');
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
                    console.log('[FFmpegLoader] Worker CORS error still occurred, trying without worker...');
                    
                    // Some FFmpeg versions can work without worker (main thread mode)
                    // Try loading without worker configuration
                    try {
                        const noWorkerOptions: any = {
                            coreURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.js'),
                            wasmURL: getFFmpegResourceUrl('/ffmpeg/ffmpeg-core.wasm'),
                            // Try to disable worker or use main thread
                        };
                        
                        // For some versions, we might need to set a flag
                        console.log('[FFmpegLoader] Attempting load without worker configuration...');
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
            
            // Try one more thing - check if it's in a module system
            if (typeof (window as any).define === 'function' && (window as any).define.amd) {
                console.log('[FFmpegLoader] AMD module system detected, but FFmpeg not found');
            }
            
            throw new Error('FFmpeg UMD loaded but not found in global scope after multiple attempts. Check console for detailed debug info.');
        }

        console.log('[FFmpeg] Loaded successfully');

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
