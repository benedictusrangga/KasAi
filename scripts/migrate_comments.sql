-- ============================================================
-- KasAI — Migration: Fitur Komentar Transaksi
-- Jalankan script ini jika database sudah ada (tidak mau reset)
-- ============================================================

-- ─── 1. Buat tabel transaction_comment ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "transaction_comment" (
  "id"            TEXT        PRIMARY KEY,
  "businessId"    TEXT        NOT NULL REFERENCES "business"("id") ON DELETE CASCADE,
  "transactionId" TEXT        REFERENCES "transaction"("id") ON DELETE CASCADE,
  "userId"        TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content"       TEXT        NOT NULL,
  "createdAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── 2. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_comment_business"     ON "transaction_comment"("businessId");
CREATE INDEX IF NOT EXISTS "idx_comment_transaction"  ON "transaction_comment"("transactionId");
CREATE INDEX IF NOT EXISTS "idx_comment_user"         ON "transaction_comment"("userId");
CREATE INDEX IF NOT EXISTS "idx_comment_created"      ON "transaction_comment"("createdAt" DESC);

SELECT 'Migration komentar berhasil!' AS status;
