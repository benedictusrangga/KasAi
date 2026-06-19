-- ============================================================
-- KasAI — Performance Index Migration
-- Jalankan sekali di database production/staging.
-- Semua index dibuat dengan CONCURRENTLY agar tidak lock tabel.
-- ============================================================

-- session
CREATE INDEX CONCURRENTLY IF NOT EXISTS session_userId_idx      ON session ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS session_expiresAt_idx   ON session ("expiresAt");

-- account
CREATE INDEX CONCURRENTLY IF NOT EXISTS account_userId_idx      ON account ("userId");

-- business
CREATE INDEX CONCURRENTLY IF NOT EXISTS business_userId_idx     ON business ("userId");

-- business_member
CREATE INDEX CONCURRENTLY IF NOT EXISTS bm_businessId_idx                ON business_member ("businessId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS bm_userId_idx                    ON business_member ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS bm_businessId_userId_status_idx  ON business_member ("businessId", "userId", status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS bm_email_businessId_idx          ON business_member (email, "businessId");

-- category
CREATE INDEX CONCURRENTLY IF NOT EXISTS category_businessId_idx ON category ("businessId");

-- transaction  (index paling penting — query paling sering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS tx_businessId_idx             ON transaction ("businessId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS tx_businessId_createdAt_idx   ON transaction ("businessId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS tx_businessId_type_idx        ON transaction ("businessId", transaction_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS tx_businessId_categoryId_idx  ON transaction ("businessId", "categoryId");

-- goal
CREATE INDEX CONCURRENTLY IF NOT EXISTS goal_businessId_idx ON goal ("businessId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS goal_userId_idx     ON goal ("userId");

-- budget
CREATE INDEX CONCURRENTLY IF NOT EXISTS budget_businessId_userId_idx ON budget ("businessId", "userId");

-- payable
CREATE INDEX CONCURRENTLY IF NOT EXISTS payable_businessId_idx        ON payable ("businessId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS payable_businessId_status_idx ON payable ("businessId", status);

-- receivable
CREATE INDEX CONCURRENTLY IF NOT EXISTS receivable_businessId_idx        ON receivable ("businessId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS receivable_businessId_status_idx ON receivable ("businessId", status);

-- inventory_item
CREATE INDEX CONCURRENTLY IF NOT EXISTS inv_item_businessId_idx ON inventory_item ("businessId");

-- inventory_log
CREATE INDEX CONCURRENTLY IF NOT EXISTS inv_log_itemId_idx     ON inventory_log ("itemId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS inv_log_businessId_idx ON inventory_log ("businessId");

-- transaction_comment
CREATE INDEX CONCURRENTLY IF NOT EXISTS txcomment_transactionId_idx ON transaction_comment ("transactionId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS txcomment_businessId_idx    ON transaction_comment ("businessId");
