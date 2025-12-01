-- Script untuk apply migration folder secara manual
-- Gunakan script ini jika migration tidak bisa dijalankan melalui Prisma CLI
-- Pastikan DIRECT_URL sudah di-set di .env

-- Tambahkan column folder jika belum ada
ALTER TABLE "presets" ADD COLUMN IF NOT EXISTS "folder" TEXT;

-- Tambahkan index jika belum ada
CREATE INDEX IF NOT EXISTS "presets_userId_folder_idx" ON "presets"("userId", "folder");

