-- ============================================================
-- Migration: monthly_targets
-- Menyimpan target bulanan mitra di database (bukan localStorage)
-- ============================================================

CREATE TABLE public.monthly_targets (
  id            UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID                     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year          SMALLINT                 NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month         SMALLINT                 NOT NULL CHECK (month >= 0 AND month <= 11),
  target_profit BIGINT                   NOT NULL DEFAULT 0,
  target_qty    INTEGER                  NOT NULL DEFAULT 0,
  target_stock  INTEGER                  NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Satu user hanya boleh punya 1 target per bulan
  CONSTRAINT monthly_targets_user_year_month_key UNIQUE (user_id, year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;

-- Policies: user hanya bisa akses data miliknya sendiri
CREATE POLICY "Users can select their own targets"
  ON public.monthly_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own targets"
  ON public.monthly_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own targets"
  ON public.monthly_targets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own targets"
  ON public.monthly_targets FOR DELETE
  USING (auth.uid() = user_id);

-- Index untuk query umum: ambil semua target user, diurutkan terbaru
CREATE INDEX monthly_targets_user_id_idx ON public.monthly_targets (user_id, year DESC, month DESC);

-- Auto-update updated_at
CREATE TRIGGER update_monthly_targets_updated_at
  BEFORE UPDATE ON public.monthly_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.monthly_targets IS 'Target bulanan mitra: profit, qty terjual, dan stok restok.';
COMMENT ON COLUMN public.monthly_targets.month IS '0-indexed: 0=Januari, 11=Desember (sesuai JavaScript Date.getMonth())';
