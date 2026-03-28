-- ============================================================
-- Fix 1: Tambah UNIQUE constraint (user_id, phone) di customers
--        agar ON CONFLICT di submit_public_order bisa bekerja
-- Fix 2: submit_public_order terima order_date dari payload
-- ============================================================

-- 1. Bersihkan data phone yang '-' atau kosong → jadi NULL
UPDATE public.customers
  SET phone = NULL
  WHERE phone = '-' OR phone = '';

-- 2. Tambah UNIQUE INDEX untuk (user_id, phone) — partial: hanya jika phone tidak NULL
--    Partial index karena banyak customer boleh tidak punya phone
CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_phone_unique
  ON public.customers (user_id, phone)
  WHERE phone IS NOT NULL;

-- 3. Update submit_public_order: terima order_date + fix customer upsert
DROP FUNCTION IF EXISTS public.submit_public_order(jsonb);

CREATE OR REPLACE FUNCTION public.submit_public_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     UUID;
  v_order_id    UUID;
  v_item        jsonb;
  v_total_qty   INT := 0;
  v_total_price NUMERIC := 0;
  v_tier        TEXT;
  v_buy_price   NUMERIC := 0;
  v_margin      NUMERIC := 0;
  v_created_at  TIMESTAMPTZ;
  v_phone       TEXT;
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

  -- 2. Hitung total qty dan total price dari items
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_total_qty   := v_total_qty   + (v_item->>'quantity')::int;
    v_total_price := v_total_price + (v_item->>'subtotal')::numeric;
  END LOOP;

  IF v_total_qty = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tidak ada produk yang dipesan');
  END IF;

  -- 3. Tentukan tier
  v_tier := COALESCE(NULLIF(payload->>'tier', ''), 'satuan');

  -- 4. buy_price dan margin
  v_buy_price := COALESCE((payload->>'buy_price')::numeric, 0);
  v_margin    := v_total_price - v_buy_price;

  -- 5. Tentukan created_at dari order_date jika ada
  IF payload->>'order_date' IS NOT NULL AND payload->>'order_date' != '' THEN
    v_created_at := ((payload->>'order_date')::date)::timestamptz + INTERVAL '5 hours';
  ELSE
    v_created_at := now();
  END IF;

  -- 6. Normalisasi phone: '-', '' atau null → NULL
  v_phone := NULLIF(NULLIF(TRIM(COALESCE(payload->>'customer_phone', '')), ''), '-');

  -- 7. Insert order
  INSERT INTO public.orders (
    user_id,
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
    payload->>'customer_name',
    v_phone,
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

  -- 8. Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    BEGIN
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
        CASE WHEN v_item->>'product_id' = '' OR v_item->>'product_id' IS NULL
             THEN NULL
             ELSE (v_item->>'product_id')::uuid END,
        (v_item->>'quantity')::int,
        (v_item->>'price_per_bottle')::numeric,
        (v_item->>'subtotal')::numeric
      );
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END LOOP;

  -- 9. Upsert customer
  --    Jika ada phone: upsert by (user_id, phone)
  --    Jika tidak ada phone: selalu insert baru
  BEGIN
    IF v_phone IS NOT NULL THEN
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
      ON CONFLICT (user_id, phone) WHERE phone IS NOT NULL DO UPDATE SET
        name         = EXCLUDED.name,
        total_orders = customers.total_orders + 1,
        total_spent  = customers.total_spent + v_total_price,
        updated_at   = now();
    ELSE
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
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Re-grant akses
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO authenticated;
