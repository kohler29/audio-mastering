-- AlterTable: Add folder column to presets table
ALTER TABLE "presets" ADD COLUMN IF NOT EXISTS "folder" TEXT;

-- CreateIndex: Add composite index for userId and folder
CREATE INDEX IF NOT EXISTS "presets_userId_folder_idx" ON "presets"("userId", "folder");
