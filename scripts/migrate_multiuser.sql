-- ============================================================
-- KasAI — Migration: Multi-User Collaboration
-- Jalankan script ini jika database sudah ada (tidak mau reset)
-- ============================================================

-- ─── 1. Tambah kolom plan & planExpiresAt ke user (jika belum ada) ──────────
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "plan"          TEXT      DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP;

-- ─── 2. Tambah enum baru ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "member_role" AS ENUM ('owner', 'admin', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "member_status" AS ENUM ('pending', 'active', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. Buat tabel business_member ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "business_member" (
  "id"               TEXT            PRIMARY KEY,
  "businessId"       TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"           TEXT            REFERENCES "user"("id") ON DELETE CASCADE,
  "invitedByUserId"  TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email"            TEXT            NOT NULL,
  "role"             "member_role"   NOT NULL DEFAULT 'admin',
  "status"           "member_status" NOT NULL DEFAULT 'pending',
  "inviteToken"      TEXT            UNIQUE,
  "invitedAt"        TIMESTAMP       NOT NULL DEFAULT NOW(),
  "joinedAt"         TIMESTAMP,
  "createdAt"        TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── 4. Tambah kolom inputByUserId ke transaction ────────────────────────────
ALTER TABLE "transaction"
  ADD COLUMN IF NOT EXISTS "inputByUserId" TEXT REFERENCES "user"("id") ON DELETE SET NULL;

-- ─── 5. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_member_business" ON "business_member"("businessId");
CREATE INDEX IF NOT EXISTS "idx_member_user"     ON "business_member"("userId");
CREATE INDEX IF NOT EXISTS "idx_member_email"    ON "business_member"("email");
CREATE INDEX IF NOT EXISTS "idx_member_token"    ON "business_member"("inviteToken");
CREATE INDEX IF NOT EXISTS "idx_txn_input_by"    ON "transaction"("inputByUserId");

SELECT 'Migration multi-user berhasil!' AS status;
