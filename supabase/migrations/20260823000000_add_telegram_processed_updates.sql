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

-- Hanya service role (edge function) yang mengakses tabel ini.
CREATE POLICY "Service role full access processed updates"
ON public.telegram_processed_updates
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_telegram_updates_processed_at
ON public.telegram_processed_updates(processed_at);

-- Opsional (disarankan): bersihkan entri > 7 hari via pg_cron:
-- SELECT cron.schedule('cleanup-telegram-updates', '0 3 * * *',
--   $$DELETE FROM public.telegram_processed_updates WHERE processed_at < now() - interval '7 days'$$);
