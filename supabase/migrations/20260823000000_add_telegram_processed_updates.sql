-- ============================================================
-- K2 / IO-13: Idempotensi webhook Telegram
-- Menyimpan update_id yang sudah diproses agar retry delivery
-- dari Telegram tidak memproses pesan yang sama dua kali
-- (mencegah order duplikat).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.telegram_processed_updates (
  update_id    BIGINT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_processed_updates ENABLE ROW LEVEL SECURITY;

-- Sengaja TANPA policy (IO-23): RLS aktif tanpa satu pun policy = deny-all
-- untuk semua role lain (anon/authenticated), sehingga anon key publik tidak
-- bisa INSERT/SELECT/UPDATE/DELETE di tabel ini. Edge function mengakses
-- tabel via service_role yang melewati RLS, jadi jalur idempotensi tetap jalan.
-- JANGAN tambahkan policy permisif di sini.

CREATE INDEX IF NOT EXISTS idx_telegram_updates_processed_at
ON public.telegram_processed_updates(processed_at);

-- Opsional (disarankan): bersihkan entri > 7 hari via pg_cron:
-- SELECT cron.schedule('cleanup-telegram-updates', '0 3 * * *',
--   $$DELETE FROM public.telegram_processed_updates WHERE processed_at < now() - interval '7 days'$$);
