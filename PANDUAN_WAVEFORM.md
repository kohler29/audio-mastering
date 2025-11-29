# Panduan Waveform DAW-Style 🎵

## Fitur Baru yang Ditambahkan

Waveform sekarang seperti DAW profesional dengan fitur-fitur canggih:

### 🎯 Fitur Utama

#### 1. **Stereo Channels Terpisah**
- **Channel Kiri (L)**: Warna biru di bagian atas
- **Channel Kanan (R)**: Warna pink di bagian bawah
- Visualisasi stereo yang lebih akurat

#### 2. **Zoom & Navigation**
```
Zoom In:  Ctrl + Scroll Up atau tombol +
Zoom Out: Ctrl + Scroll Down atau tombol -
Reset:    Tombol Maximize (⛶)
Scroll:   Mouse Scroll (saat zoom > 1x)
```

#### 3. **Region Selection**
```
Shift + Click & Drag = Pilih area tertentu
```
Berguna untuk:
- Menandai bagian yang ingin di-loop
- Export sebagian audio saja
- Fokus pada area tertentu

#### 4. **Time Ruler**
- Ruler di atas waveform menampilkan waktu
- Format: `Menit:Detik.Milidetik`
- Grid otomatis menyesuaikan dengan zoom

#### 5. **Interactive Controls**
- **Hover**: Lihat waktu di posisi cursor
- **Click**: Jump ke posisi tertentu
- **Playhead**: Garis kuning mengikuti playback

### 📱 Cara Menggunakan

1. **Upload Audio**
   - Klik tombol "Upload" di header
   - Pilih file audio (MP3, WAV, dll)
   - Waveform akan muncul otomatis

2. **Zoom untuk Detail**
   - Gunakan `Ctrl + Scroll` untuk zoom
   - Atau klik tombol +/- di atas waveform
   - Zoom hingga 50x untuk melihat detail sample

3. **Navigasi**
   - Scroll mouse untuk pan kiri/kanan (saat zoom)
   - Click di waveform untuk seek
   - Lihat scrollbar di bawah untuk posisi

4. **Pilih Region**
   - Tekan `Shift` + Click & Drag
   - Area terpilih akan highlight hijau
   - Lepas untuk selesai

### 🎨 Visual Guide

```
┌─────────────────────────────────────────────────┐
│  [−] [+] [⛶]  Zoom: 2.5x                       │
├─────────────────────────────────────────────────┤
│  0:00.00    0:05.00    0:10.00    0:15.00      │ ← Time Ruler
├─────────────────────────────────────────────────┤
│ L  ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲      │ ← Left (Blue)
│    ────────────────────────────────────────     │ ← Center Line
│ R  ╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱      │ ← Right (Pink)
│              ▼                                   │ ← Playhead (Yellow)
└─────────────────────────────────────────────────┘
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Scrollbar
└─────────────────────────────────────────────────┘
```

### 💡 Tips & Trik

**Untuk Mixing:**
- Zoom in untuk melihat transient dan attack
- Perhatikan perbedaan L/R untuk stereo imaging
- Gunakan ruler untuk timing yang presisi

**Untuk Mastering:**
- Zoom out untuk lihat dynamic range keseluruhan
- Cek konsistensi level di sepanjang track
- Gunakan region selection untuk A/B compare

**Untuk Editing:**
- Zoom 10x+ untuk edit presisi
- Gunakan grid untuk timing
- Select region untuk fokus pada area tertentu

### 🔧 Troubleshooting

**Waveform tidak muncul?**
- Pastikan audio sudah di-upload
- Tunggu beberapa detik untuk processing
- Refresh browser jika perlu

**Zoom terlalu sensitif?**
- Gunakan tombol +/- untuk kontrol lebih halus
- Reset zoom dengan tombol Maximize

**Scrolling tidak smooth?**
- Pastikan zoom > 1x
- Gunakan mouse scroll, bukan trackpad gesture

### 🎯 Keyboard Shortcuts

| Shortcut | Fungsi |
|----------|--------|
| `Ctrl + Scroll` | Zoom In/Out |
| `Shift + Click` | Start Region Selection |
| `Shift + Drag` | Extend Selection |
| `Click` | Seek to Position |
| `Scroll` | Pan Left/Right (when zoomed) |

### 📊 Informasi Teknis

**Rendering:**
- Canvas-based untuk performa optimal
- 60 FPS smooth animation
- Support high-DPI displays

**Data:**
- Stereo waveform dari audio buffer
- Downsampled untuk efisiensi
- Min/max peak rendering

**Compatibility:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Web Audio API support required
- Touch support untuk mobile (coming soon)

---

**Selamat Mencoba! 🎉**

Jika ada pertanyaan atau saran, silakan buat issue di repository.
