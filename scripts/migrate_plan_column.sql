-- Migration: tambah kolom plan & planExpiresAt ke tabel user
-- Jalankan sekali di database production

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "plan"          TEXT      DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP DEFAULT NULL;

-- Set semua user existing ke free plan
UPDATE "user" SET "plan" = 'free' WHERE "plan" IS NULL;

-- User dengan accountType 'business' → upgrade ke business_starter
UPDATE "user" SET "plan" = 'business_starter' WHERE "accountType" = 'business' AND "plan" = 'free';

SELECT 'Migration plan column selesai!' AS status;
