-- Update default status to selesai
CREATE OR REPLACE FUNCTION public.submit_public_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID;
  v_order_id      UUID;
  v_customer_id   UUID;
  v_item          jsonb;
  v_total_qty     INT := 0;
  v_total_price   NUMERIC := 0;
  v_tier          TEXT;
  v_buy_price     NUMERIC := 0;
  v_margin        NUMERIC := 0;
  v_created_at    TIMESTAMPTZ;
  v_phone         TEXT;
  v_name          TEXT;
  v_type          TEXT;
  v_product_id    UUID;
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
    v_created_at := ((payload->>'order_date')::date)::timestamptz + INTERVAL '5 hours';
  ELSE
    v_created_at := now();
  END IF;

  -- 5. Normalisasi phone & name
  v_phone := NULLIF(NULLIF(TRIM(COALESCE(payload->>'customer_phone', '')), ''), '-');
  v_name  := NULLIF(TRIM(COALESCE(payload->>'customer_name', '')), '');
  v_type  := COALESCE(NULLIF(payload->>'customer_type', ''), 'konsumen');

  -- 6. UPSERT CUSTOMER → dapatkan customer_id
  BEGIN
    IF v_phone IS NOT NULL THEN
      SELECT id INTO v_customer_id
      FROM public.customers
      WHERE user_id = v_user_id AND phone = v_phone
      LIMIT 1;
    END IF;

    IF v_customer_id IS NULL AND v_name IS NOT NULL THEN
      SELECT id INTO v_customer_id
      FROM public.customers
      WHERE user_id = v_user_id AND LOWER(TRIM(name)) = LOWER(v_name)
      LIMIT 1;
    END IF;

    IF v_customer_id IS NOT NULL THEN
      UPDATE public.customers SET
        name         = COALESCE(v_name, name),
        phone        = CASE WHEN v_phone IS NOT NULL THEN v_phone ELSE phone END,
        tier         = v_tier,
        type         = v_type,
        total_orders = total_orders + 1,
        total_spent  = total_spent + v_total_price,
        updated_at   = now()
      WHERE id = v_customer_id;
    ELSE
      INSERT INTO public.customers (
        user_id, name, phone, tier, type, total_orders, total_spent
      ) VALUES (
        v_user_id,
        v_name,
        v_phone,
        v_tier,
        v_type,
        1,
        v_total_price
      )
      RETURNING id INTO v_customer_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_customer_id := NULL;
  END;

  -- 7. INSERT ORDER — dengan customer_id
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
    'selesai', -- Berubah di sini: langsung selesai
    v_created_at
  )
  RETURNING id INTO v_order_id;

  -- 8. INSERT ORDER ITEMS — dengan product_id
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
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

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
