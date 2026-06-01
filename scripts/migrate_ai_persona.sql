-- ============================================================
-- KasAI — Migration: AI Persona
-- Jalankan script ini jika database sudah ada
-- ============================================================

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "aiPersona" TEXT DEFAULT 'professional';

SELECT 'Migration AI persona berhasil!' AS status;
