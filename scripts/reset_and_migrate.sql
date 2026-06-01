-- ============================================================
-- KasAI — Reset & Recreate Database Schema
-- ⚠️  PERINGATAN: Script ini akan MENGHAPUS SEMUA DATA!
-- ============================================================

-- ─── STEP 1: Drop semua tabel ────────────────────────────────────────────────

DROP TABLE IF EXISTS "onboarding_progress"  CASCADE;
DROP TABLE IF EXISTS "ai_chat"              CASCADE;
DROP TABLE IF EXISTS "report"               CASCADE;
DROP TABLE IF EXISTS "transaction_comment"  CASCADE;
DROP TABLE IF EXISTS "transaction"          CASCADE;
DROP TABLE IF EXISTS "category"             CASCADE;
DROP TABLE IF EXISTS "business_products"    CASCADE;
DROP TABLE IF EXISTS "business_member"      CASCADE;
DROP TABLE IF EXISTS "business"             CASCADE;
DROP TABLE IF EXISTS "verification"         CASCADE;
DROP TABLE IF EXISTS "session"              CASCADE;
DROP TABLE IF EXISTS "account"              CASCADE;
DROP TABLE IF EXISTS "user"                 CASCADE;
DROP TABLE IF EXISTS "goal"                 CASCADE;
DROP TABLE IF EXISTS "budget"               CASCADE;

-- ─── STEP 2: Drop semua enum type ────────────────────────────────────────────

DROP TYPE IF EXISTS "category_type"    CASCADE;
DROP TYPE IF EXISTS "expense_source"   CASCADE;
DROP TYPE IF EXISTS "transaction_type" CASCADE;
DROP TYPE IF EXISTS "business_type"    CASCADE;
DROP TYPE IF EXISTS "member_role"      CASCADE;
DROP TYPE IF EXISTS "member_status"    CASCADE;

-- ─── STEP 3: Recreate enum types ─────────────────────────────────────────────

CREATE TYPE "category_type" AS ENUM (
  'groceries', 'transportation', 'utilities', 'entertainment',
  'dining', 'shopping', 'healthcare', 'education', 'office_supplies', 'other'
);

CREATE TYPE "expense_source" AS ENUM (
  'manual', 'telegram', 'voice_note', 'receipt_image', 'api'
);

CREATE TYPE "transaction_type" AS ENUM (
  'expense', 'income'
);

CREATE TYPE "business_type" AS ENUM (
  'florist', 'laundry', 'cafe', 'retail', 'other'
);

CREATE TYPE "member_role" AS ENUM (
  'owner', 'admin', 'viewer'
);

CREATE TYPE "member_status" AS ENUM (
  'pending', 'active', 'removed'
);

-- ─── STEP 4: Better Auth tables ──────────────────────────────────────────────
-- PENTING: Semua kolom Better Auth harus nullable atau punya DEFAULT
-- karena Better Auth tidak selalu mengisi semua kolom saat insert.

CREATE TABLE "user" (
  "id"            TEXT        PRIMARY KEY,
  "name"          TEXT,
  "email"         TEXT        NOT NULL UNIQUE,
  "emailVerified" BOOLEAN     NOT NULL DEFAULT FALSE,
  "image"         TEXT,
  "phoneNumber"   TEXT        UNIQUE,
  "telegramId"    TEXT,
  "currency"      TEXT        DEFAULT 'IDR',
  "timezone"      TEXT        DEFAULT 'Asia/Jakarta',
  "accountType"   TEXT        DEFAULT 'personal',
  "plan"          TEXT        DEFAULT 'free',
  "planExpiresAt" TIMESTAMP,
  "aiPersona"     TEXT        DEFAULT 'professional',
  "createdAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE "session" (
  "id"          TEXT        PRIMARY KEY,
  "expiresAt"   TIMESTAMP   NOT NULL,
  "token"       TEXT        NOT NULL UNIQUE,
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- account: SEMUA kolom selain id & userId harus nullable atau punya DEFAULT
-- Better Auth mengisi kolom berbeda tergantung provider (email, oauth, dll)
CREATE TABLE "account" (
  "id"                     TEXT        PRIMARY KEY,
  "userId"                 TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type"                   TEXT        DEFAULT 'email',        -- nullable-safe default
  "provider"               TEXT        DEFAULT 'credential',   -- nullable-safe default
  "providerAccountId"      TEXT        DEFAULT '',
  "refreshToken"           TEXT,
  "accessToken"            TEXT,
  "expiresAt"              TEXT,
  "token_type"             TEXT,
  "scope"                  TEXT,
  "id_token"               TEXT,
  "session_state"          TEXT,
  "accountId"              TEXT,
  "providerId"             TEXT,
  "idToken"                TEXT,
  "accessTokenExpiresAt"   TIMESTAMP,
  "refreshTokenExpiresAt"  TIMESTAMP,
  "password"               TEXT,
  "createdAt"              TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE "verification" (
  "id"          TEXT        PRIMARY KEY,
  "identifier"  TEXT        NOT NULL,
  "value"       TEXT        NOT NULL,
  "expiresAt"   TIMESTAMP   NOT NULL,
  "createdAt"   TIMESTAMP   DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   DEFAULT NOW()
);

-- ─── STEP 5: App tables ──────────────────────────────────────────────────────

CREATE TABLE "business" (
  "id"          TEXT            PRIMARY KEY,
  "userId"      TEXT            NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name"        TEXT            NOT NULL,
  "type"        "business_type" NOT NULL,
  "description" TEXT,
  "logo_url"    TEXT,
  "createdAt"   TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Tabel member bisnis: owner invite admin/viewer ke bisnis mereka
CREATE TABLE "business_member" (
  "id"               TEXT            PRIMARY KEY,
  "businessId"       TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"           TEXT            REFERENCES "user"("id") ON DELETE CASCADE, -- null sampai invite diterima
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

CREATE TABLE "category" (
  "id"          TEXT            PRIMARY KEY,
  "businessId"  TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "name"        TEXT            NOT NULL,
  "type"        "category_type" NOT NULL,
  "description" TEXT,
  "icon"        TEXT,
  "createdAt"   TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE "transaction" (
  "id"               TEXT               PRIMARY KEY,
  "businessId"       TEXT               NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"           TEXT               NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "inputByUserId"    TEXT               REFERENCES "user"("id") ON DELETE SET NULL,
  "amount"           DECIMAL(12, 2)     NOT NULL,
  "transaction_type" "transaction_type" NOT NULL DEFAULT 'expense',
  "description"      TEXT               NOT NULL,
  "categoryId"       TEXT               REFERENCES "category"("id") ON DELETE SET NULL,
  "source"           "expense_source"   NOT NULL DEFAULT 'manual',
  "receipt_url"      TEXT,
  "tags"             TEXT[],
  "notes"            TEXT,
  "createdAt"        TIMESTAMP          NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP          NOT NULL DEFAULT NOW()
);

CREATE TABLE "report" (
  "id"               TEXT        PRIMARY KEY,
  "businessId"       TEXT        NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"           TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title"            TEXT        NOT NULL,
  "report_type"      TEXT        NOT NULL,
  "date_range_start" TIMESTAMP   NOT NULL,
  "date_range_end"   TIMESTAMP   NOT NULL,
  "data"             JSONB,
  "generated_at"     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE "ai_chat" (
  "id"          TEXT        PRIMARY KEY,
  "businessId"  TEXT        NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "messages"    JSONB       NOT NULL DEFAULT '[]',
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE "business_products" (
  "id"          TEXT            PRIMARY KEY,
  "businessId"  TEXT            NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "name"        TEXT            NOT NULL,
  "description" TEXT,
  "price"       DECIMAL(12, 2),
  "unit"        TEXT            DEFAULT 'pcs',
  "createdAt"   TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE "onboarding_progress" (
  "id"          TEXT        PRIMARY KEY,
  "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "step"        TEXT        NOT NULL DEFAULT 'welcome',
  "completed"   BOOLEAN     DEFAULT FALSE,
  "data"        JSONB,
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Tabel komentar transaksi: owner/admin bisa saling berkomentar
CREATE TABLE "transaction_comment" (
  "id"            TEXT        PRIMARY KEY,
  "businessId"    TEXT        NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "transactionId" TEXT        REFERENCES "transaction"("id") ON DELETE CASCADE,
  "userId"        TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content"       TEXT        NOT NULL,
  "createdAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── STEP 6: Indexes ─────────────────────────────────────────────────────────

CREATE INDEX "idx_user_phone"      ON "user"("phoneNumber");
CREATE INDEX "idx_user_telegram"   ON "user"("telegramId");
CREATE INDEX "idx_business_user"   ON "business"("userId");
CREATE INDEX "idx_member_business" ON "business_member"("businessId");
CREATE INDEX "idx_member_user"     ON "business_member"("userId");
CREATE INDEX "idx_member_email"    ON "business_member"("email");
CREATE INDEX "idx_member_token"    ON "business_member"("inviteToken");
CREATE INDEX "idx_txn_business"    ON "transaction"("businessId");
CREATE INDEX "idx_txn_user"        ON "transaction"("userId");
CREATE INDEX "idx_txn_input_by"    ON "transaction"("inputByUserId");
CREATE INDEX "idx_txn_created"     ON "transaction"("createdAt" DESC);
CREATE INDEX "idx_txn_type"        ON "transaction"("transaction_type");
CREATE INDEX "idx_txn_source"      ON "transaction"("source");
CREATE INDEX "idx_category_biz"    ON "category"("businessId");
CREATE INDEX "idx_aichat_biz"      ON "ai_chat"("businessId");
CREATE INDEX "idx_aichat_user"     ON "ai_chat"("userId");
CREATE INDEX "idx_onboarding_user" ON "onboarding_progress"("userId");
CREATE INDEX "idx_session_user"    ON "session"("userId");
CREATE INDEX "idx_account_user"    ON "account"("userId");
CREATE INDEX "idx_comment_business"    ON "transaction_comment"("businessId");
CREATE INDEX "idx_comment_transaction" ON "transaction_comment"("transactionId");
CREATE INDEX "idx_comment_user"        ON "transaction_comment"("userId");
CREATE INDEX "idx_comment_created"     ON "transaction_comment"("createdAt" DESC);

-- ─── DONE ─────────────────────────────────────────────────────────────────────

SELECT 'Schema berhasil dibuat!' AS status;
