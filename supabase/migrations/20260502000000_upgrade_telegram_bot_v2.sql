-- ============================================================
-- UPGRADE TELEGRAM BOT V2: INTERACTIVE FLOW & MULTI-TENANT
-- ============================================================

-- 1. Tabel untuk pemetaan Chat ID ke Toko (Tenant)
-- Menggantikan telegram_bot_registrations dengan struktur yang lebih scalable
CREATE TABLE IF NOT EXISTS public.telegram_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id      TEXT NOT NULL,
  username     TEXT,
  connected_by UUID REFERENCES auth.users(id), -- profile yang melakukan koneksi
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(chat_id)
);

-- 2. Tabel untuk Session State (Keranjang Belanja & Step Percakapan)
-- Menggantikan telegram_bot_sessions
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  chat_id       TEXT PRIMARY KEY,
  tenant_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step  TEXT NOT NULL DEFAULT 'idle', 
  -- Steps: idle, selecting_product, inputting_qty, adding_more, confirming
  session_data  JSONB DEFAULT '{}'::jsonb, 
  -- session_data: { items: [], last_product_id: "", customer_info: {} }
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Migrasi data lama (Opsional, jika ingin mempertahankan user lama)
INSERT INTO public.telegram_connections (tenant_id, chat_id, created_at)
SELECT user_id, chat_id, created_at FROM public.telegram_bot_registrations
ON CONFLICT (chat_id) DO NOTHING;

-- 4. RLS & Permissions
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access connections" ON public.telegram_connections USING (true) WITH CHECK (true);
CREATE POLICY "Service role access sessions" ON public.telegram_sessions USING (true) WITH CHECK (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_telegram_conn_tenant ON public.telegram_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sess_updated ON public.telegram_sessions(updated_at);
