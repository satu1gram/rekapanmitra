-- ============================================================
-- FIX MIGRATION: jalankan ini jika migration sebelumnya gagal
-- ============================================================

-- STEP 1: Buat tabel store_settings (aman, tidak error jika sudah ada)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    store_name TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    payment_info JSONB NOT NULL DEFAULT '[]'::jsonb,
    welcome_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- STEP 2: Index (aman jika sudah ada)
CREATE UNIQUE INDEX IF NOT EXISTS store_settings_slug_idx ON public.store_settings(slug);
CREATE INDEX IF NOT EXISTS store_settings_user_id_idx ON public.store_settings(user_id);

-- STEP 3: Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_store_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_store_settings_updated_at
      BEFORE UPDATE ON public.store_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

-- STEP 4: Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- STEP 5: RLS Policies untuk authenticated user
DROP POLICY IF EXISTS "Users can view their own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can insert their own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can update their own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can delete their own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can view active store settings" ON public.store_settings;

CREATE POLICY "Users can view their own store settings"
    ON public.store_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store settings"
    ON public.store_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store settings"
    ON public.store_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store settings"
    ON public.store_settings FOR DELETE
    USING (auth.uid() = user_id);

-- STEP 6: RLS untuk public (anon) bisa baca toko yang aktif
CREATE POLICY "Public can view active store settings"
    ON public.store_settings FOR SELECT
    TO anon
    USING (is_active = true);

-- STEP 7: Izinkan public baca products untuk toko yang aktif
DROP POLICY IF EXISTS "Public can view products for active stores" ON public.products;
CREATE POLICY "Public can view products for active stores"
    ON public.products FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.store_settings ss
            WHERE ss.user_id = products.user_id
              AND ss.is_active = true
        )
    );

-- STEP 8: Update orders status constraint
-- Cek nama constraint yang sebenarnya dulu dengan query ini (opsional):
-- SELECT conname FROM pg_constraint WHERE conrelid = 'orders'::regclass AND contype = 'c';

-- Drop semua constraint CHECK yang mungkin ada pada kolom status
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.orders'::regclass 
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

-- Tambah constraint baru yang include 'menunggu_bayar'
ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('menunggu_bayar', 'pending', 'terkirim', 'selesai'));

-- STEP 9: Izinkan anon INSERT order (hanya status menunggu_bayar)
DROP POLICY IF EXISTS "Public can insert orders for active stores" ON public.orders;
CREATE POLICY "Public can insert orders for active stores"
    ON public.orders FOR INSERT
    TO anon
    WITH CHECK (
        status = 'menunggu_bayar'
        AND EXISTS (
            SELECT 1 FROM public.store_settings ss
            WHERE ss.user_id = orders.user_id
              AND ss.is_active = true
        )
    );

-- STEP 10: Izinkan anon INSERT order_items
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items"
    ON public.order_items FOR INSERT
    TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND o.status = 'menunggu_bayar'
        )
    );

-- STEP 11: Izinkan anon INSERT customers untuk toko aktif
DROP POLICY IF EXISTS "Public can insert customers for active stores" ON public.customers;
CREATE POLICY "Public can insert customers for active stores"
    ON public.customers FOR INSERT
    TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.store_settings ss
            WHERE ss.user_id = customers.user_id
              AND ss.is_active = true
        )
    );

-- STEP 12: Reload PostgREST schema cache agar tabel store_settings langsung terdeteksi
NOTIFY pgrst, 'reload schema';

-- Verifikasi: cek tabel sudah ada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'store_settings';
