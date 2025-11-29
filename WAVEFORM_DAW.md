# Waveform DAW-Style

Waveform telah diupgrade menjadi seperti Digital Audio Workstation (DAW) profesional dengan fitur-fitur berikut:

## ✨ Fitur Utama

### 1. **Stereo Waveform Terpisah**
- Channel kiri (L) ditampilkan di bagian atas dengan warna **biru**
- Channel kanan (R) ditampilkan di bagian bawah dengan warna **pink/magenta**
- Visualisasi yang lebih akurat untuk audio stereo

### 2. **Zoom Controls**
- **Zoom In/Out**: Tombol +/- untuk zoom
- **Keyboard Shortcut**: `Ctrl + Scroll` untuk zoom in/out
- **Reset Zoom**: Tombol maximize untuk kembali ke zoom 1x
- Zoom hingga **50x** untuk melihat detail waveform

### 3. **Horizontal Scrolling**
- **Mouse Scroll**: Scroll horizontal untuk navigasi saat di-zoom
- **Scrollbar Visual**: Indikator posisi saat zoom > 1x
- Smooth scrolling untuk navigasi yang mudah

### 4. **Region Selection**
- **Shift + Click & Drag**: Pilih region/area tertentu
- Highlight dengan warna **hijau transparan**
- Berguna untuk loop atau export sebagian audio

### 5. **Time Ruler**
- Ruler di bagian atas menampilkan waktu
- Format: `MM:SS.MS` (menit:detik.milidetik)
- Marker waktu yang dinamis sesuai zoom level
- Grid vertikal yang sinkron dengan ruler

### 6. **Playhead Profesional**
- Playhead dengan warna **kuning/amber**
- Triangle indicator di bagian atas
- Auto-scroll mengikuti playhead saat playing

### 7. **Interactive Features**
- **Hover Tooltip**: Menampilkan waktu saat hover
- **Click to Seek**: Klik untuk jump ke posisi tertentu
- **Cursor Crosshair**: Cursor berubah saat di atas waveform
- **Dashed Line**: Garis putus-putus saat hover

### 8. **Visual Enhancements**
- Background gelap dengan grid subtle
- Warna berbeda untuk L/R channels
- Min/max peak rendering untuk detail optimal
- Smooth gradients dan shadows

## 🎮 Kontrol

| Aksi | Cara |
|------|------|
| Zoom In | Tombol + atau Ctrl + Scroll Up |
| Zoom Out | Tombol - atau Ctrl + Scroll Down |
| Reset Zoom | Tombol Maximize |
| Pan/Scroll | Scroll Mouse (saat zoom > 1x) |
| Seek | Click pada waveform |
| Select Region | Shift + Click & Drag |
| View Time | Hover pada waveform |

## 🎨 Color Scheme

- **Left Channel**: `rgba(59, 130, 246)` - Blue
- **Right Channel**: `rgba(236, 72, 153)` - Pink/Magenta
- **Playhead**: `rgba(251, 191, 36)` - Amber/Yellow
- **Selection**: `rgba(34, 197, 94)` - Green
- **Grid**: `rgba(82, 82, 91)` - Zinc Gray

## 📊 Technical Details

### Performance Optimizations
- **Min/Max Peak Rendering**: Menampilkan min dan max value per pixel untuk detail optimal
- **Downsampling**: Audio buffer di-downsample untuk performa rendering
- **RequestAnimationFrame**: Smooth 60fps animation
- **Canvas Scaling**: Support untuk high-DPI displays

### Data Flow
1. Audio file di-load ke AudioEngine
2. `getStereoWaveformData()` mengekstrak L/R channels
3. Data di-downsample ke ~2000 samples
4. Canvas rendering dengan zoom dan scroll support
5. Real-time playhead tracking

## 🚀 Future Enhancements

Fitur yang bisa ditambahkan di masa depan:
- [ ] Minimap untuk navigasi cepat
- [ ] Waveform caching untuk performa
- [ ] Multiple region selection
- [ ] Waveform color customization
- [ ] Spectral view toggle
- [ ] Vertical zoom (amplitude)
- [ ] Markers dan labels
- [ ] Export selected region
- [ ] Undo/Redo untuk selections

## 💡 Tips Penggunaan

1. **Untuk Editing Presisi**: Zoom in hingga 10x atau lebih untuk melihat detail sample
2. **Untuk Overview**: Gunakan zoom 1x untuk melihat keseluruhan audio
3. **Region Selection**: Gunakan untuk menandai bagian yang perlu di-edit
4. **Time Navigation**: Gunakan ruler untuk jump ke waktu spesifik

---

**Dibuat dengan**: React, TypeScript, Canvas API, Web Audio API
**Terinspirasi dari**: Pro Tools, Logic Pro, Ableton Live, FL Studio
