# 🎵 Master Pro - Professional Audio Mastering Plugin

Aplikasi web profesional untuk audio mastering dengan kontrol advanced dan visualisasi real-time. Dibangun dengan Next.js 16, React 19, dan Prisma.

![Next.js](https://img.shields.io/badge/Next.js-16.0.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.0.1-2D3748?style=flat-square&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)

---

## ✨ Fitur Utama

- 🎚️ **Audio Processing**: EQ, Compressor, Limiter dengan DSP berkualitas tinggi
- 📊 **Real-time Visualization**: Waveform, spectrum analyzer, dan metering
- 💾 **Preset Management**: Simpan dan load preset mastering favorit Anda
- 🔐 **User Authentication**: Login/Register dengan JWT + Google OAuth
- 🎨 **Modern UI**: Interface premium dengan dark mode dan animasi smooth
- 📱 **Responsive Design**: Optimal di desktop, tablet, dan mobile
- ⚡ **Performance**: Dioptimasi dengan React 19 dan Next.js 16 Turbopack

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ atau **Bun** 1.0+
- **PostgreSQL** database (lokal atau cloud)

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd master
   ```

2. **Install dependencies**
   ```bash
   bun install
   # atau
   npm install
   ```

3. **Setup environment variables**
   
   Buat file `.env` di root directory:
   ```env
   # Database - Prisma Accelerate URL (untuk aplikasi)
   DATABASE_URL="prisma+postgres://user:password@host:5432/database?schema=public"
   
   # Database - Direct PostgreSQL URL (untuk migration)
   # WAJIB di-set jika menggunakan Prisma Accelerate
   DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"
   
   # Application URL (untuk production: https://masteraudio.pro)
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   
   # JWT Authentication
   JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
   JWT_EXPIRES_IN="7d"
   
   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
   ```
   
   **Untuk Production:**
   ```env
   NEXT_PUBLIC_APP_URL="https://masteraudio.pro"
   NEXT_PUBLIC_SITE_URL="https://masteraudio.pro"
   GOOGLE_REDIRECT_URI="https://masteraudio.pro/api/auth/google/callback"
   ```
   
   **Catatan untuk Prisma Accelerate:**
   - `DATABASE_URL`: Gunakan Prisma Accelerate URL (format: `prisma+postgres://...`)
   - `DIRECT_URL`: **WAJIB** di-set dengan direct PostgreSQL connection string untuk migration
   - Migration tidak bisa menggunakan Accelerate URL, harus direct connection

4. **Setup database**
   ```bash
   # Generate Prisma Client
   bun run db:generate
   
   # Push schema ke database (recommended untuk development)
   bun run db:push
   
   # Atau gunakan migration (untuk production)
   bun run db:migrate
   ```

5. **Run development server**
   ```bash
   bun dev
   ```

6. **Open browser**
   
   Buka [http://localhost:3000](http://localhost:3000)

---

## 📦 Tech Stack

### Frontend
- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library dengan React Compiler
- **TypeScript 5** - Type safety
- **TailwindCSS 4** - Utility-first CSS
- **Framer Motion** - Animasi smooth
- **Lucide React** - Icon library
- **SWR** - Data fetching & caching

### Backend
- **Next.js API Routes** - Serverless API
- **Prisma 7** - ORM untuk database
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Audio Processing
- **Web Audio API** - Real-time audio processing
- **AudioBuffer** - Audio manipulation
- **Custom DSP** - EQ, Compressor, Limiter algorithms

---

## 🛠️ Available Scripts

```bash
# Development
bun dev              # Start dev server
bun build            # Build for production
bun start            # Start production server
bun lint             # Run ESLint

# Database
bun run db:generate      # Generate Prisma Client
bun run db:push          # Push schema ke database (development, recommended)
bun run db:migrate       # Run database migrations (development)
bun run db:migrate:deploy # Deploy migrations (production)
bun run db:studio        # Open Prisma Studio (database GUI)
```

---

## 📁 Project Structure

```
master/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── presets/      # Preset management
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── AudioProcessor/   # Audio processing components
│   ├── Visualizer/       # Audio visualization
│   └── UI/               # Reusable UI components
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Authentication hook
├── lib/                  # Utility libraries
│   ├── auth.ts           # JWT utilities
│   └── prisma.ts         # Prisma client
├── prisma/               # Database schema & migrations
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── types/                # TypeScript type definitions
├── .env                  # Environment variables (gitignored)
├── vercel.json           # Vercel deployment config
└── DEPLOYMENT.md         # Deployment guide
```

---

## 🔐 Authentication

Aplikasi ini mendukung 2 metode autentikasi:

1. **Email/Password**: Register dan login dengan email
2. **Google OAuth**: Login dengan akun Google (opsional)

Semua password di-hash menggunakan bcrypt, dan session menggunakan JWT token yang disimpan di HTTP-only cookies.

---

## 💾 Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String?
  presets   Preset[]
  createdAt DateTime @default(now())
}

model Preset {
  id          String   @id @default(cuid())
  name        String
  description String?
  settings    Json
  userId      String
  user        User     @relation(...)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🌐 Deployment

### Deploy ke Vercel (Recommended)

Lihat panduan lengkap di **[DEPLOYMENT.md](./DEPLOYMENT.md)**

**Quick Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/master)

1. Push ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Tambahkan environment variables
4. Deploy!

**Environment Variables yang Diperlukan:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key (min 32 chars)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `NEXT_PUBLIC_APP_URL` - Application URL (untuk OAuth redirects)
- `NEXT_PUBLIC_SITE_URL` - Site URL (untuk SEO dan metadata)
- `GOOGLE_REDIRECT_URI` - Google OAuth redirect URI (jika menggunakan OAuth)

---

## 🐛 Troubleshooting

### Build Error: "Prisma Client not generated"
```bash
bunx prisma generate
```

### Database Connection Error
Pastikan `DATABASE_URL` di `.env` sudah benar dan database sudah running.

### Folder Column Tidak Muncul di Prisma Studio
Jika column `folder` sudah di-push tapi tidak muncul di Prisma Studio:
1. **Restart Prisma Studio:**
   ```bash
   # Stop Prisma Studio (Ctrl+C)
   # Lalu jalankan lagi
   bun run db:studio
   ```
2. **Verify column sudah ada:**
   ```bash
   bun run db:verify
   ```
3. **Refresh browser** di Prisma Studio (F5 atau Cmd+R)

### Migration/DB Push Error dengan Prisma Accelerate
Jika menggunakan Prisma Accelerate, pastikan `DIRECT_URL` sudah di-set di `.env`:
```env
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"
```
Migration dan `db push` memerlukan direct connection, tidak bisa menggunakan Accelerate URL.

**Cara menggunakan:**
```bash
# Untuk development (recommended)
bun run db:push

# Untuk production dengan migration
bun run db:migrate:deploy
```

**Alternatif:** Jika db push/migration tidak bisa dijalankan, gunakan script manual:
```bash
# Apply migration secara manual
psql $DIRECT_URL -f scripts/apply-migration-folder.sql
```

### Port 3000 sudah digunakan
```bash
# Gunakan port lain
PORT=3001 bun dev
```

### TypeScript Errors
```bash
# Clear cache dan rebuild
rm -rf .next
bun run build
```

---

## 📝 Development Notes

### Audio Processing
- Semua audio processing dilakukan di client-side menggunakan Web Audio API
- DSP algorithms dioptimasi untuk real-time performance
- Support untuk file audio: WAV, MP3, FLAC, OGG

### Performance
- Next.js 16 dengan Turbopack untuk build yang lebih cepat
- React 19 dengan React Compiler untuk optimasi otomatis
- SWR untuk data caching dan revalidation
- Lazy loading untuk components besar

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Web Audio API required

---

## 🤝 Contributing

Contributions are welcome! Silakan buat issue atau pull request.

1. Fork repository
2. Buat branch baru (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Vercel](https://vercel.com/) - Deployment platform
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library

---

## 📧 Contact

Untuk pertanyaan atau feedback, silakan buat issue di repository ini.

**Built with ❤️ using Next.js & React**
