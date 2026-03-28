-- ============================================================
-- Update submit_public_order: terima order_date dari payload
-- Agar order bisa dicatat dengan tanggal yang disebut di pesan
-- (bukan selalu tanggal hari ini)
-- ============================================================

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

  -- 3. Tentukan tier: gunakan dari payload jika ada, fallback ke 'satuan'
  v_tier := COALESCE(NULLIF(payload->>'tier', ''), 'satuan');

  -- 4. Hitung buy_price dan margin jika dikirim dari payload
  v_buy_price := COALESCE((payload->>'buy_price')::numeric, 0);
  v_margin    := v_total_price - v_buy_price;

  -- 5. Tentukan created_at: dari order_date payload (jika ada) atau now()
  IF payload->>'order_date' IS NOT NULL AND payload->>'order_date' != '' THEN
    -- Asumsikan tanggal WIB (UTC+7), simpan sebagai UTC
    v_created_at := (payload->>'order_date')::date + TIME '17:00:00' - INTERVAL '7 hours';
    -- Gunakan tengah hari WIB agar tidak jatuh ke hari sebelumnya di UTC
    v_created_at := ((payload->>'order_date')::date)::timestamptz + INTERVAL '5 hours';
  ELSE
    v_created_at := now();
  END IF;

  -- 6. Insert order
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
    payload->>'customer_phone',
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

  -- 7. Insert order items
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

  -- 8. Upsert customer (update jika sudah ada berdasarkan phone)
  BEGIN
    INSERT INTO public.customers (
      user_id, name, phone, tier, type, total_orders, total_spent
    ) VALUES (
      v_user_id,
      payload->>'customer_name',
      payload->>'customer_phone',
      v_tier,
      COALESCE(NULLIF(payload->>'customer_type', ''), 'konsumen'),
      1,
      v_total_price
    )
    ON CONFLICT (user_id, phone) DO UPDATE SET
      total_orders = customers.total_orders + 1,
      total_spent  = customers.total_spent + v_total_price,
      updated_at   = now();
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Jika constraint belum ada, skip
  END;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Re-grant akses
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO authenticated;
