-- ============================================================
-- KasAI — Add Goals & Budgets tables
-- Safe to run on existing database (no DROP)
-- ============================================================

-- Goals: target keuangan yang ingin dicapai user
CREATE TABLE IF NOT EXISTS "goal" (
  "id"          TEXT        PRIMARY KEY,
  "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "businessId"  TEXT        REFERENCES "business"("id") ON DELETE CASCADE,
  "title"       TEXT        NOT NULL,
  "description" TEXT,
  "targetAmount" DECIMAL(12, 2) NOT NULL,
  "currentAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "deadline"    TIMESTAMP,
  "completed"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Budgets: batas pengeluaran per kategori per bulan
CREATE TABLE IF NOT EXISTS "budget" (
  "id"          TEXT        PRIMARY KEY,
  "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "businessId"  TEXT        REFERENCES "business"("id") ON DELETE CASCADE,
  "category"    TEXT        NOT NULL,
  "amount"      DECIMAL(12, 2) NOT NULL,
  "period"      TEXT        NOT NULL DEFAULT 'monthly', -- 'monthly' | 'weekly'
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_goal_user"     ON "goal"("userId");
CREATE INDEX IF NOT EXISTS "idx_goal_business" ON "goal"("businessId");
CREATE INDEX IF NOT EXISTS "idx_budget_user"   ON "budget"("userId");
CREATE INDEX IF NOT EXISTS "idx_budget_biz"    ON "budget"("businessId");

SELECT 'Goals & Budgets tables created!' AS status;
