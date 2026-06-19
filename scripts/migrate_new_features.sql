-- ============================================================
-- KasAI — Migration: New Features
-- Jalankan HANYA SEKALI pada database yang sudah ada.
-- Aman untuk data yang sudah ada (ALTER TABLE, CREATE TABLE).
-- ============================================================

-- ─── 0. Tambah kolom baru ke user ────────────────────────────────────────────
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "activeTelegramBusinessId" TEXT;

-- ─── 1. Custom Category (kategori bebas, bukan enum) ─────────────────────────
-- Ganti FK categoryId di transaction agar bisa menyimpan nama custom kategori langsung
-- Kita tambah kolom categoryName sebagai fallback human-readable

ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "categoryName" TEXT;

-- ─── 2. Goals: tambah kolom autoTrack ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "goal" (
  "id"            TEXT            PRIMARY KEY,
  "userId"        TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "businessId"    TEXT            REFERENCES "business"("id") ON DELETE CASCADE,
  "title"         TEXT            NOT NULL,
  "description"   TEXT,
  "targetAmount"  DECIMAL(12, 2)  NOT NULL,
  "currentAmount" DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "deadline"      TIMESTAMP,
  "completed"     BOOLEAN         NOT NULL DEFAULT FALSE,
  "createdAt"     TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── 3. Budget ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "budget" (
  "id"          TEXT            PRIMARY KEY,
  "userId"      TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "businessId"  TEXT            REFERENCES "business"("id") ON DELETE CASCADE,
  "category"    TEXT            NOT NULL,
  "amount"      DECIMAL(12, 2)  NOT NULL,
  "period"      TEXT            NOT NULL DEFAULT 'monthly',
  "createdAt"   TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── 4. Hutang & Piutang ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "payable" (
  "id"            TEXT            PRIMARY KEY,
  "businessId"    TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"        TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "contactName"   TEXT            NOT NULL,
  "contactPhone"  TEXT,
  "amount"        DECIMAL(12, 2)  NOT NULL,
  "paidAmount"    DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "description"   TEXT            NOT NULL,
  "dueDate"       TIMESTAMP,
  "status"        TEXT            NOT NULL DEFAULT 'unpaid', -- unpaid | partial | paid
  "notes"         TEXT,
  "createdAt"     TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "receivable" (
  "id"            TEXT            PRIMARY KEY,
  "businessId"    TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"        TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "contactName"   TEXT            NOT NULL,
  "contactPhone"  TEXT,
  "amount"        DECIMAL(12, 2)  NOT NULL,
  "paidAmount"    DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "description"   TEXT            NOT NULL,
  "dueDate"       TIMESTAMP,
  "status"        TEXT            NOT NULL DEFAULT 'unpaid', -- unpaid | partial | paid
  "notes"         TEXT,
  "createdAt"     TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── 5. Inventaris Sederhana ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "inventory_item" (
  "id"            TEXT            PRIMARY KEY,
  "businessId"    TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"        TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name"          TEXT            NOT NULL,
  "sku"           TEXT,
  "unit"          TEXT            NOT NULL DEFAULT 'pcs',
  "currentStock"  DECIMAL(12, 2)  NOT NULL DEFAULT 0,
  "minStock"      DECIMAL(12, 2)  DEFAULT 0, -- alert jika di bawah ini
  "buyPrice"      DECIMAL(12, 2),
  "sellPrice"     DECIMAL(12, 2),
  "description"   TEXT,
  "createdAt"     TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "inventory_log" (
  "id"            TEXT            PRIMARY KEY,
  "businessId"    TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "itemId"        TEXT            NOT NULL REFERENCES "inventory_item"("id") ON DELETE CASCADE,
  "userId"        TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type"          TEXT            NOT NULL, -- 'in' | 'out' | 'adjustment'
  "quantity"      DECIMAL(12, 2)  NOT NULL,
  "note"          TEXT,
  "transactionId" TEXT            REFERENCES "transaction"("id") ON DELETE SET NULL,
  "createdAt"     TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── 6. User Feature Config (fitur yang diaktifkan per bisnis) ───────────────
CREATE TABLE IF NOT EXISTS "user_feature_config" (
  "id"              TEXT      PRIMARY KEY,
  "businessId"      TEXT      NOT NULL UNIQUE REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"          TEXT      NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "enableInventory" BOOLEAN   NOT NULL DEFAULT FALSE,
  "enablePayables"  BOOLEAN   NOT NULL DEFAULT FALSE,
  "enableReceivables" BOOLEAN NOT NULL DEFAULT FALSE,
  "enableBudget"    BOOLEAN   NOT NULL DEFAULT TRUE,
  "enableGoals"     BOOLEAN   NOT NULL DEFAULT TRUE,
  "enableTelegram"  BOOLEAN   NOT NULL DEFAULT TRUE,
  "enableTeam"      BOOLEAN   NOT NULL DEFAULT FALSE,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── 7. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_goal_user_biz"       ON "goal"("userId", "businessId");
CREATE INDEX IF NOT EXISTS "idx_budget_user_biz"     ON "budget"("userId", "businessId");
CREATE INDEX IF NOT EXISTS "idx_payable_biz"         ON "payable"("businessId");
CREATE INDEX IF NOT EXISTS "idx_receivable_biz"      ON "receivable"("businessId");
CREATE INDEX IF NOT EXISTS "idx_inventory_biz"       ON "inventory_item"("businessId");
CREATE INDEX IF NOT EXISTS "idx_inventory_log_item"  ON "inventory_log"("itemId");
CREATE INDEX IF NOT EXISTS "idx_feature_config_biz"  ON "user_feature_config"("businessId");

SELECT 'Migration selesai!' AS status;

-- ─── 8. AI Action Log (audit trail untuk semua AI actions) ──────────────────
CREATE TABLE IF NOT EXISTS "ai_action_log" (
  "id"          TEXT      PRIMARY KEY,
  "userId"      TEXT      NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "businessId"  TEXT      NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "actionType"  TEXT      NOT NULL,
  "params"      JSONB     NOT NULL DEFAULT '{}',
  "result"      JSONB     NOT NULL DEFAULT '{}',
  "success"     BOOLEAN   NOT NULL DEFAULT TRUE,
  "source"      TEXT      NOT NULL DEFAULT 'ai_chat', -- 'telegram' | 'ai_chat'
  "executedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_ai_action_log_user"     ON "ai_action_log"("userId");
CREATE INDEX IF NOT EXISTS "idx_ai_action_log_business" ON "ai_action_log"("businessId");
CREATE INDEX IF NOT EXISTS "idx_ai_action_log_type"     ON "ai_action_log"("actionType");
CREATE INDEX IF NOT EXISTS "idx_ai_action_log_executed" ON "ai_action_log"("executedAt");

SELECT 'Migration 2 (AI action log) selesai!' AS status;

-- ─── 9. goalContributionAsExpense di user_feature_config ────────────────────
ALTER TABLE "user_feature_config"
  ADD COLUMN IF NOT EXISTS "goalContributionAsExpense" BOOLEAN NOT NULL DEFAULT FALSE;

SELECT 'Migration 3 (goalContributionAsExpense) selesai!' AS status;
