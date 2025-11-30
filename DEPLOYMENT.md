# Panduan Deployment ke Vercel

## Persiapan

### 1. Install Vercel CLI (Opsional)
```bash
npm i -g vercel
```

### 2. Environment Variables yang Diperlukan

Sebelum deploy, pastikan Anda sudah menyiapkan environment variables berikut di Vercel Dashboard:

#### **Database** (Wajib)
- `DATABASE_URL`: Connection string untuk PostgreSQL
  - Contoh: `postgresql://user:password@host:5432/database?schema=public`
  - Rekomendasi: Gunakan [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) atau [Supabase](https://supabase.com/)

#### **Authentication** (Wajib)
- `JWT_SECRET`: Secret key untuk JWT token (minimal 32 karakter random)
  - Contoh: `your-super-secret-jwt-key-change-this-in-production-min-32-chars`
  - Generate dengan: `openssl rand -base64 32`

- `JWT_EXPIRES_IN`: Durasi token (default: `7d`)
  - Contoh: `7d`, `24h`, `30d`

#### **Google OAuth** (Opsional - jika menggunakan Google Login)
- `GOOGLE_CLIENT_ID`: Client ID dari Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: Client Secret dari Google Cloud Console
- `GOOGLE_REDIRECT_URI`: Redirect URI (contoh: `https://yourdomain.vercel.app/api/auth/google/callback`)

---

## Cara Deploy

### Opsi 1: Deploy via Vercel Dashboard (Recommended)

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import Project di Vercel**
   - Buka [vercel.com/new](https://vercel.com/new)
   - Pilih repository GitHub Anda
   - Klik "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `bun run fetch:ffmpeg && prisma generate && next build` (sudah dikonfigurasi di vercel.json)
   - Install Command: `bun install` (sudah dikonfigurasi di vercel.json)
   - Root Directory: `./`

4. **Add Environment Variables**
   - Klik "Environment Variables"
   - Tambahkan semua environment variables yang diperlukan (lihat daftar di atas)
   - Pastikan pilih environment: **Production**, **Preview**, dan **Development**

5. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build selesai (~2-3 menit)

### Opsi 2: Deploy via CLI

1. **Login ke Vercel**
   ```bash
   vercel login
   ```

2. **Deploy ke Production**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables via CLI**
   ```bash
   # Database
   vercel env add DATABASE_URL production
   
   # JWT
   vercel env add JWT_SECRET production
   vercel env add JWT_EXPIRES_IN production
   
   # Google OAuth (jika diperlukan)
   vercel env add GOOGLE_CLIENT_ID production
   vercel env add GOOGLE_CLIENT_SECRET production
   vercel env add GOOGLE_REDIRECT_URI production
   ```

---

## Setup Database di Production

### Menggunakan Vercel Postgres

1. **Buat Database**
   - Buka Vercel Dashboard → Storage → Create Database
   - Pilih "Postgres"
   - Pilih region (Singapore: `sin1`)

2. **Connect ke Project**
   - Vercel akan otomatis menambahkan `DATABASE_URL` ke environment variables

3. **Run Migrations**
   ```bash
   # Set DATABASE_URL dari Vercel
   export DATABASE_URL="postgresql://..."
   
   # Run migrations
   bunx prisma migrate deploy
   ```

### Menggunakan Supabase

1. **Buat Project di Supabase**
   - Buka [supabase.com](https://supabase.com)
   - Create new project

2. **Get Connection String**
   - Settings → Database → Connection String
   - Copy "Connection pooling" URL (recommended untuk serverless)

3. **Add ke Vercel**
   - Paste connection string ke environment variable `DATABASE_URL`

---

## Post-Deployment Checklist

- [ ] Database migrations sudah dijalankan
- [ ] Semua environment variables sudah diset
- [ ] Website bisa diakses dan tidak ada error
- [ ] Login/Register berfungsi dengan baik
- [ ] Google OAuth berfungsi (jika diaktifkan)
- [ ] Favicon muncul dengan benar
- [ ] Custom domain sudah dikonfigurasi (opsional)

---

## Troubleshooting

### Build Error: "Prisma Client not generated"
**Solusi**: Pastikan build command adalah `prisma generate && next build`

### Runtime Error: "DATABASE_URL is not defined"
**Solusi**: Periksa environment variables di Vercel Dashboard

### Error 500 saat Login
**Solusi**: 
1. Periksa `JWT_SECRET` sudah diset
2. Periksa database connection
3. Lihat logs di Vercel Dashboard → Deployments → [Your Deployment] → Runtime Logs

### Google OAuth tidak berfungsi
**Solusi**:
1. Pastikan `GOOGLE_REDIRECT_URI` sesuai dengan domain production
2. Update Authorized redirect URIs di Google Cloud Console
3. Tambahkan: `https://yourdomain.vercel.app/api/auth/google/callback`

---

## Monitoring & Logs

- **Deployment Logs**: Vercel Dashboard → Deployments → [Deployment] → Build Logs
- **Runtime Logs**: Vercel Dashboard → Deployments → [Deployment] → Runtime Logs
- **Analytics**: Vercel Dashboard → Analytics

---

## Auto-Deploy

Setelah setup awal, setiap push ke branch `main` akan otomatis trigger deployment baru.

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel akan otomatis deploy
```

---

## Custom Domain (Opsional)

1. Buka Vercel Dashboard → Settings → Domains
2. Tambahkan domain Anda
3. Update DNS records sesuai instruksi Vercel
4. Update `GOOGLE_REDIRECT_URI` jika menggunakan Google OAuth

---

## Rollback

Jika ada masalah dengan deployment terbaru:

1. Buka Vercel Dashboard → Deployments
2. Pilih deployment sebelumnya yang stabil
3. Klik "Promote to Production"

---

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
