-- ============================================================
-- COMPREHENSIVE DATA INTEGRITY FIX
--
-- Fix 1: order_items.product_id FK → products (tabel lama)
--        Drop FK lama, tambah FK ke master_products
-- Fix 2: customers tidak tersimpan (UNIQUE constraint)
-- Fix 3: orders.customer_id selalu NULL → RPC harus link
-- Fix 4: order_date support
-- ============================================================

-- ─── 1. Fix FK order_items.product_id ──────────────────────────────────────
-- Drop FK lama yang reference ke products (tabel lama user-level)
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Null-kan product_id yang tidak ada di master_products
-- (data lama dari tabel products atau UUID invalid)
UPDATE public.order_items oi
  SET product_id = NULL
  WHERE product_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.master_products mp WHERE mp.id = oi.product_id
    );

-- Tambah FK baru ke master_products (tabel global admin-managed)
-- SET NULL jika master_product dihapus (soft-delete via is_active=false lebih umum)
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.master_products(id) ON DELETE SET NULL;

-- ─── 2. Fix customers unique constraint ────────────────────────────────────
-- Bersihkan phone = '-' atau '' → NULL
UPDATE public.customers
  SET phone = NULL
  WHERE phone = '-' OR phone = '';

-- Partial unique index: (user_id, phone) WHERE phone IS NOT NULL
-- Jika constraint sudah ada dari migration sebelumnya, skip
CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_phone_unique
  ON public.customers (user_id, phone)
  WHERE phone IS NOT NULL;

-- ─── 3. Update submit_public_order: link customer_id + order_date ──────────
DROP FUNCTION IF EXISTS public.submit_public_order(jsonb);

CREATE OR REPLACE FUNCTION public.submit_public_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID;
  v_order_id     UUID;
  v_customer_id  UUID;
  v_item         jsonb;
  v_total_qty    INT := 0;
  v_total_price  NUMERIC := 0;
  v_tier         TEXT;
  v_buy_price    NUMERIC := 0;
  v_margin       NUMERIC := 0;
  v_created_at   TIMESTAMPTZ;
  v_phone        TEXT;
  v_product_id   UUID;
BEGIN
  -- 1. Ambil user_id dari slug
  SELECT user_id INTO v_user_id
  FROM public.store_settings
  WHERE slug = (payload->>'slug')
    AND is_active = true
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Toko tidak ditemukan atau tidak aktif');
  END IF;

  -- 2. Hitung total qty dan total price
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_total_qty   := v_total_qty   + (v_item->>'quantity')::int;
    v_total_price := v_total_price + (v_item->>'subtotal')::numeric;
  END LOOP;

  IF v_total_qty = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tidak ada produk yang dipesan');
  END IF;

  -- 3. Tier, buy_price, margin
  v_tier      := COALESCE(NULLIF(payload->>'tier', ''), 'satuan');
  v_buy_price := COALESCE((payload->>'buy_price')::numeric, 0);
  v_margin    := v_total_price - v_buy_price;

  -- 4. Tentukan created_at dari order_date (jika ada)
  IF payload->>'order_date' IS NOT NULL AND payload->>'order_date' != '' THEN
    -- Simpan sebagai tengah hari WIB (UTC+7) agar tidak jatuh ke hari sebelum
    v_created_at := ((payload->>'order_date')::date)::timestamptz + INTERVAL '5 hours';
  ELSE
    v_created_at := now();
  END IF;

  -- 5. Normalisasi phone
  v_phone := NULLIF(NULLIF(TRIM(COALESCE(payload->>'customer_phone', '')), ''), '-');

  -- ═══════════════════════════════════════════════════════════
  -- 6. UPSERT CUSTOMER → dapatkan customer_id
  -- ═══════════════════════════════════════════════════════════
  BEGIN
    IF v_phone IS NOT NULL THEN
      -- Cari existing customer berdasarkan phone + user_id
      SELECT id INTO v_customer_id
      FROM public.customers
      WHERE user_id = v_user_id AND phone = v_phone
      LIMIT 1;

      IF v_customer_id IS NOT NULL THEN
        -- Update existing customer
        UPDATE public.customers SET
          name         = COALESCE(NULLIF(payload->>'customer_name', ''), name),
          total_orders = total_orders + 1,
          total_spent  = total_spent + v_total_price,
          updated_at   = now()
        WHERE id = v_customer_id;
      ELSE
        -- Insert baru → dapatkan id
        INSERT INTO public.customers (
          user_id, name, phone, tier, type, total_orders, total_spent
        ) VALUES (
          v_user_id,
          payload->>'customer_name',
          v_phone,
          v_tier,
          COALESCE(NULLIF(payload->>'customer_type', ''), 'konsumen'),
          1,
          v_total_price
        )
        RETURNING id INTO v_customer_id;
      END IF;
    ELSE
      -- Tanpa phone: insert customer baru (tidak bisa deduplicate)
      INSERT INTO public.customers (
        user_id, name, phone, tier, type, total_orders, total_spent
      ) VALUES (
        v_user_id,
        payload->>'customer_name',
        NULL,
        v_tier,
        COALESCE(NULLIF(payload->>'customer_type', ''), 'konsumen'),
        1,
        v_total_price
      )
      RETURNING id INTO v_customer_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error tapi jangan gagalkan order
    RAISE WARNING 'Customer upsert failed: %', SQLERRM;
    v_customer_id := NULL;
  END;

  -- ═══════════════════════════════════════════════════════════
  -- 7. INSERT ORDER — sekarang DENGAN customer_id
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.orders (
    user_id,
    customer_id,
    customer_name,
    customer_phone,
    tier,
    quantity,
    price_per_bottle,
    total_price,
    buy_price,
    margin,
    status,
    created_at
  ) VALUES (
    v_user_id,
    v_customer_id,
    payload->>'customer_name',
    COALESCE(v_phone, ''),
    v_tier,
    v_total_qty,
    ROUND(v_total_price / GREATEST(v_total_qty, 1)),
    v_total_price,
    v_buy_price,
    v_margin,
    'menunggu_bayar',
    v_created_at
  )
  RETURNING id INTO v_order_id;

  -- ═══════════════════════════════════════════════════════════
  -- 8. INSERT ORDER ITEMS — sekarang DENGAN product_id asli
  -- ═══════════════════════════════════════════════════════════
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    -- Resolve product_id: dari payload (UUID), atau NULL
    v_product_id := NULL;
    BEGIN
      IF v_item->>'product_id' IS NOT NULL
         AND v_item->>'product_id' != ''
         AND v_item->>'product_id' != 'null' THEN
        v_product_id := (v_item->>'product_id')::uuid;
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      v_product_id := NULL;
    END;

    INSERT INTO public.order_items (
      order_id,
      user_id,
      product_name,
      product_id,
      quantity,
      price_per_bottle,
      subtotal
    ) VALUES (
      v_order_id,
      v_user_id,
      v_item->>'product_name',
      v_product_id,
      (v_item->>'quantity')::int,
      (v_item->>'price_per_bottle')::numeric,
      (v_item->>'subtotal')::numeric
    );
  END LOOP;

  -- ═══════════════════════════════════════════════════════════
  -- 9. STOCK DEDUCTION — kurangi stok saat order dibuat
  --    Sama seperti reduceStock() di frontend useStockDb.ts
  -- ═══════════════════════════════════════════════════════════
  BEGIN
    -- Insert stock_entries type='out'
    INSERT INTO public.stock_entries (
      user_id, type, quantity, order_id, created_at
    ) VALUES (
      v_user_id, 'out', v_total_qty, v_order_id, v_created_at
    );

    -- Update user_stock.current_stock
    UPDATE public.user_stock
      SET current_stock = GREATEST(current_stock - v_total_qty, 0)
      WHERE user_id = v_user_id;

    -- Jika user_stock belum ada, buat baru (seharusnya sudah ada dari onboarding)
    IF NOT FOUND THEN
      INSERT INTO public.user_stock (user_id, current_stock)
        VALUES (v_user_id, 0)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Stock deduction failed: %', SQLERRM;
  END;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Re-grant akses
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO authenticated;
