-- ============================================================
-- Migration: Fix tier constraints + tambah performance indexes
-- ============================================================

-- ── 1. FIX TIER CONSTRAINT ───────────────────────────────────
-- Tambahkan 'se' dan 'nl' ke CHECK constraint pada customers
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_tier_check;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_tier_check
  CHECK (tier IN ('satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se', 'nl'));

-- Tambahkan 'se' dan 'nl' ke CHECK constraint pada orders
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_tier_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_tier_check
  CHECK (tier IN ('satuan', 'reseller', 'agen', 'agen_plus', 'sap', 'se', 'nl'));

-- Tambahkan constraint mitra_level pada profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_mitra_level_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_mitra_level_check
  CHECK (mitra_level IN ('reseller', 'agen', 'agen_plus', 'sap', 'se'));


-- ── 2. PERFORMANCE INDEXES ────────────────────────────────────
-- Orders: query paling sering adalah filter by user_id + created_at
CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx
  ON public.orders (user_id, created_at DESC);

-- Orders: filter by status per user
CREATE INDEX IF NOT EXISTS orders_user_id_status_idx
  ON public.orders (user_id, status);

-- Stock entries: timeline per user
CREATE INDEX IF NOT EXISTS stock_entries_user_id_created_at_idx
  ON public.stock_entries (user_id, created_at DESC);

-- General expenses: filter by user + date range
CREATE INDEX IF NOT EXISTS general_expenses_user_id_date_idx
  ON public.general_expenses (user_id, expense_date DESC);

-- General income: filter by user + date range
CREATE INDEX IF NOT EXISTS general_income_user_id_date_idx
  ON public.general_income (user_id, income_date DESC);

-- Customers: search by user
CREATE INDEX IF NOT EXISTS customers_user_id_idx
  ON public.customers (user_id);

-- Order items & Order expenses: dibungkus blok DO dengan EXECUTE (Dynamic SQL) agar tidak error saat parsing query
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS order_items_user_id_idx ON public.order_items (user_id);';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_expenses') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS order_expenses_user_id_idx ON public.order_expenses (user_id);';
  END IF;
END $$;
