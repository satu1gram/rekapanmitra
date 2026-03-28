-- ============================================================
-- Telegram Bot Integration Tables
-- ============================================================

-- Tabel untuk menyimpan registrasi mitra ke bot Telegram
CREATE TABLE IF NOT EXISTS public.telegram_bot_registrations (
  chat_id     TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  store_name  TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabel untuk menyimpan state session per chat (untuk konfirmasi order)
CREATE TABLE IF NOT EXISTS public.telegram_bot_sessions (
  chat_id       TEXT PRIMARY KEY,
  state         TEXT NOT NULL DEFAULT 'idle', -- 'idle' | 'confirm_order'
  pending_order JSONB,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS: hanya service role yang bisa akses (bot pakai service key)
ALTER TABLE public.telegram_bot_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;

-- Service role (Edge Function) bisa full access
CREATE POLICY "Service role full access registrations"
ON public.telegram_bot_registrations
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access sessions"
ON public.telegram_bot_sessions
USING (true)
WITH CHECK (true);

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_telegram_registrations_slug
ON public.telegram_bot_registrations(slug);

CREATE INDEX IF NOT EXISTS idx_telegram_registrations_user_id
ON public.telegram_bot_registrations(user_id);
