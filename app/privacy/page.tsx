"use client";

import { Shield } from 'lucide-react';

/**
 * PrivacyPage
 * Halaman Privacy Policy dengan konten statis (hardcode) yang jelas dan ringkas.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl text-white">Privacy Policy</h1>
        </div>

        <div className="space-y-6 text-zinc-300">
          <p>
            Kebijakan Privasi ini menjelaskan bagaimana kami menangani data Anda saat menggunakan
            aplikasi. Kami berkomitmen untuk menjaga privasi dan keamanan informasi Anda.
          </p>

          <section>
            <h2 className="text-white text-lg mb-2">1. Data yang Dikumpulkan</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kami tidak menyimpan file audio yang Anda unggah.</li>
              <li>Data teknis anonim dapat dikumpulkan untuk analitik performa.</li>
              <li>Informasi akun (jika login) digunakan untuk pengalaman yang dipersonalisasi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">2. Penggunaan Data</h2>
            <p>
              Data digunakan untuk peningkatan layanan, keamanan, dan pengalaman pengguna. Kami tidak
              menjual atau membagikan data pribadi Anda ke pihak ketiga tanpa izin.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">3. Penyimpanan & Keamanan</h2>
            <p>
              Kami menerapkan praktik keamanan yang wajar untuk melindungi informasi. File audio
              tidak disimpan di server setelah proses berlangsung.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">4. Hak Anda</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Meminta akses atau penghapusan data yang terkait akun.</li>
              <li>Mengubah preferensi privasi kapan saja melalui pengaturan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">5. Perubahan Kebijakan</h2>
            <p>
              Kebijakan ini dapat diperbarui secara berkala. Perubahan material akan diinformasikan
              melalui aplikasi.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">6. Kontak</h2>
            <p>
              Untuk pertanyaan terkait privasi, silakan hubungi tim dukungan melalui halaman Support.
            </p>
          </section>

          <div className="text-zinc-500 text-sm">Terakhir diperbarui: Desember 2025</div>
        </div>
      </div>
    </div>
  );
}
