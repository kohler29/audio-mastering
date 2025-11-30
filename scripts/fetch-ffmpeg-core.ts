/**
 * Mengunduh berkas inti ffmpeg.wasm ke folder public/ffmpeg agar di-host dari domain sendiri.
 * File yang diunduh:
 * - ffmpeg-core.js
 * - ffmpeg-core.wasm
 * - ffmpeg-core.worker.js
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Jalur tujuan tempat file akan disimpan di dalam aplikasi (served oleh Next sebagai static).
 */
function getTargetDir(): string {
  return join(process.cwd(), 'public', 'ffmpeg');
}

/**
 * Mengunduh satu file dari URL dan menyimpannya ke jalur target.
 */
async function downloadWithFallback(urls: string[], outPath: string): Promise<void> {
  let lastErr: Error | null = null;
  for (const u of urls) {
    try {
      const res = await fetch(u);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      writeFileSync(outPath, buf);
      return;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      console.warn(`Gagal unduh ${u}: ${lastErr.message}`);
    }
  }
  throw new Error(`Gagal mengunduh setelah mencoba semua sumber: ${lastErr ? lastErr.message : 'unknown error'}`);
}

/**
 * Menjalankan proses unduh semua file ffmpeg core dari CDN default.
 */
async function main(): Promise<void> {
  const targetDir = getTargetDir();
  try {
    mkdirSync(targetDir, { recursive: true });
  } catch {
    // abaikan jika sudah ada
  }

  const localDistUmd = join(process.cwd(), 'node_modules', '@ffmpeg', 'core', 'dist', 'umd');
  const sources = [
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist',
    'https://unpkg.com/@ffmpeg/core@0.12.10/dist',
  ];
  const files: Array<{ name: string; urls: string[]; local?: string }> = [
    { name: 'ffmpeg-core.js', urls: sources.map((s) => `${s}/ffmpeg-core.js`), local: join(localDistUmd, 'ffmpeg-core.js') },
    { name: 'ffmpeg-core.wasm', urls: sources.map((s) => `${s}/ffmpeg-core.wasm`), local: join(localDistUmd, 'ffmpeg-core.wasm') },
  ];

  for (const f of files) {
    const out = join(targetDir, f.name);
    // Coba copy dari node_modules dulu agar bebas dari 404 CDN
    if (f.local && existsSync(f.local)) {
      const buf = readFileSync(f.local);
      writeFileSync(out, buf);
      console.log(`Menyalin lokal ${f.local} -> ${out}`);
      continue;
    }
    console.log(`Mengunduh ${f.urls[0]} -> ${out}`);
    await downloadWithFallback(f.urls, out);
  }

  // Copy juga file UMD FFmpeg untuk browser
  const umdSource = join(process.cwd(), 'node_modules', '@ffmpeg', 'ffmpeg', 'dist', 'umd');
  const umdTarget = join(targetDir, 'umd');
  if (existsSync(umdSource)) {
    try {
      mkdirSync(umdTarget, { recursive: true });
      const umdFiles = ['ffmpeg.js', '814.ffmpeg.js'];
      for (const file of umdFiles) {
        const src = join(umdSource, file);
        const dst = join(umdTarget, file);
        if (existsSync(src)) {
          const buf = readFileSync(src);
          writeFileSync(dst, buf);
          console.log(`Menyalin UMD ${src} -> ${dst}`);
        }
      }
    } catch (err) {
      console.warn('Gagal menyalin UMD files:', err);
    }
  }

  console.log('Selesai mengunduh ffmpeg core ke public/ffmpeg');
}

main().catch((err) => {
  console.error('Gagal menyiapkan ffmpeg core:', err);
  process.exit(1);
});
