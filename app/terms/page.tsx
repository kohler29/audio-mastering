"use client";

import { BookOpen, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * TermsPage
 * Halaman Terms of Service dengan konten statis (hardcode) yang mudah dibaca.
 */
export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            aria-label="Back"
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl text-white">Terms of Service</h1>
          </div>
          <div className="w-9" />
        </div>

        <div className="space-y-6 text-zinc-300">
          <p>
            Dengan menggunakan aplikasi ini, Anda menyetujui ketentuan layanan berikut. Harap baca
            dengan saksama karena ketentuan ini mengatur penggunaan Anda terhadap layanan kami.
          </p>

          <section>
            <h2 className="text-white text-lg mb-2">1. Penggunaan Layanan</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Layanan digunakan sesuai hukum yang berlaku di yurisdiksi Anda.</li>
              <li>Anda bertanggung jawab atas konten audio yang diunggah dan diproses.</li>
              <li>Dilarang menggunakan layanan untuk tujuan ilegal atau merugikan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">2. Kepemilikan Konten</h2>
            <p>
              Hak cipta atas konten audio sepenuhnya milik Anda. Kami tidak mengklaim kepemilikan
              atas materi yang Anda unggah dan proses melalui aplikasi ini.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">3. Privasi & Keamanan</h2>
            <p>
              Kami tidak menyimpan file audio Anda di server. Informasi teknis yang terbatas dapat
              dikumpulkan untuk peningkatan performa dan keamanan. Lihat kebijakan privasi untuk
              detail lebih lanjut.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">4. Perubahan Layanan</h2>
            <p>
              Layanan dapat berubah atau dihentikan sewaktu-waktu tanpa pemberitahuan sebelumnya.
              Kami berupaya memberi pengalaman terbaik, namun tidak menjamin ketersediaan tanpa
              gangguan.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">5. Batasan Tanggung Jawab</h2>
            <p>
              Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian langsung maupun
              tidak langsung yang timbul dari penggunaan layanan, termasuk kehilangan data,
              pendapatan, atau gangguan usaha.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">6. Hukum yang Berlaku</h2>
            <p>
              Ketentuan ini diatur oleh hukum yang berlaku di wilayah operasional kami. Sengketa
              akan diselesaikan sesuai prosedur hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg mb-2">7. Kontak</h2>
            <p>
              Untuk pertanyaan terkait Terms of Service, silakan hubungi tim dukungan melalui
              halaman Support.
            </p>
          </section>

          <div className="text-zinc-500 text-sm">Terakhir diperbarui: Desember 2025</div>
        </div>
      </div>
    </div>
  );
}
