-- ============================================================
-- KasAI — Migration: Add missing columns
-- Aman dijalankan berkali-kali (IF NOT EXISTS)
-- ============================================================

-- Tambah aiPersona ke user
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "aiPersona" TEXT DEFAULT 'professional';

-- Tambah goal & budget tables jika belum ada
CREATE TABLE IF NOT EXISTS "goal" (
  "id"            TEXT        PRIMARY KEY,
  "businessId"    TEXT        NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"        TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title"         TEXT        NOT NULL,
  "targetAmount"  DECIMAL(12,2) NOT NULL,
  "currentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "deadline"      TIMESTAMP,
  "completed"     BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "budget" (
  "id"          TEXT        PRIMARY KEY,
  "businessId"  TEXT        NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "category"    TEXT        NOT NULL,
  "amount"      DECIMAL(12,2) NOT NULL,
  "period"      TEXT        NOT NULL DEFAULT 'monthly',
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Indexes untuk goal & budget
CREATE INDEX IF NOT EXISTS "idx_goal_business" ON "goal"("businessId");
CREATE INDEX IF NOT EXISTS "idx_goal_user"     ON "goal"("userId");
CREATE INDEX IF NOT EXISTS "idx_budget_business" ON "budget"("businessId");
CREATE INDEX IF NOT EXISTS "idx_budget_user"     ON "budget"("userId");

SELECT 'Migration berhasil!' AS status;
