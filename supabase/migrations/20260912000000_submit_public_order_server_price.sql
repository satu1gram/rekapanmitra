-- submit_public_order: validasi ulang harga di server berdasarkan katalog master_products.
-- Browser/bot tidak lagi dipercaya untuk total harga: tiap item dihitung ulang
-- dari baris katalog (tier → package_type, harga unit = price / quantity_per_package).
-- Fallback ke harga payload hanya jika baris katalog tidak ditemukan (mode migrasi).

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
  v_base_category TEXT;
  v_pkg_type      TEXT;
  v_unit_price    NUMERIC;
  v_item_qty      INT;
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

  -- 2. Hitung total qty (harga TIDAK diambil dari payload)
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_total_qty := v_total_qty + (v_item->>'quantity')::int;
  END LOOP;

  IF v_total_qty = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tidak ada produk yang dipesan');
  END IF;

  -- 3. Tier: dari payload, dinaikkan otomatis berdasarkan total kuantitas
  --    (aturan sama dengan resolver frontend dan telegram-bot)
  v_tier := COALESCE(NULLIF(payload->>'tier', ''), 'satuan');
  IF v_tier = 'satuan' THEN
    IF v_total_qty >= 200 THEN v_tier := 'se';
    ELSIF v_total_qty >= 40 THEN v_tier := 'sap';
    ELSIF v_total_qty >= 10 THEN v_tier := 'agen_plus';
    ELSIF v_total_qty >= 5 THEN v_tier := 'agen';
    ELSIF v_total_qty >= 3 THEN v_tier := 'reseller';
    END IF;
  END IF;

  v_pkg_type := CASE v_tier
    WHEN 'reseller' THEN '3_botol'
    WHEN 'agen' THEN '5_botol'
    WHEN 'agen_plus' THEN '10_botol'
    WHEN 'sap' THEN '40_botol'
    WHEN 'se' THEN '200_botol'
    ELSE 'satuan'
  END;

  v_buy_price := COALESCE((payload->>'buy_price')::numeric, 0);

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
  EXCEPTION WHEN OTHERS THEN
    v_customer_id := NULL;
  END;

  -- 7. INSERT ORDER — total dihitung ulang di bawah dari katalog
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
    0, -- diupdate setelah kalkulasi item
    0, -- diupdate setelah kalkulasi item
    v_buy_price,
    0, -- diupdate setelah kalkulasi item
    'selesai',
    v_created_at
  )
  RETURNING id INTO v_order_id;

  -- 8. INSERT ORDER ITEMS — harga dihitung ulang dari master_products
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_product_id := NULL;
    v_base_category := NULL;
    BEGIN
      IF v_item->>'product_id' IS NOT NULL
         AND v_item->>'product_id' != ''
         AND v_item->>'product_id' != 'null' THEN
        v_product_id := (v_item->>'product_id')::uuid;
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      v_product_id := NULL;
    END;

    v_item_qty := (v_item->>'quantity')::int;

    -- Kategori produk sebagai kunci pencarian tier katalog
    IF v_product_id IS NOT NULL THEN
      SELECT category INTO v_base_category
      FROM public.master_products
      WHERE id = v_product_id;

      -- Produk yang dirujuk harus aktif
      IF v_base_category IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.master_products
        WHERE id = v_product_id AND is_active = true
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Produk tidak aktif atau tidak ditemukan: ' || (v_item->>'product_name')
        );
      END IF;
    END IF;

    -- Cari baris katalog untuk kategori + package_type tier aktif
    v_unit_price := NULL;
    IF v_base_category IS NOT NULL THEN
      SELECT ROUND(p.price / GREATEST(p.quantity_per_package, 1))::numeric
      INTO v_unit_price
      FROM public.master_products p
      WHERE p.is_active = true
        AND p.category = v_base_category
        AND p.package_type = v_pkg_type
        AND p.quantity_per_package > 0
      LIMIT 1;
    END IF;

    IF v_unit_price IS NULL THEN
      -- Mode migrasi: katalog tidak mencakup produk/tier ini.
      -- Fallback ke harga payload agar order tidak gagal; terpantau lewat NOTICE.
      RAISE NOTICE 'submit_public_order: fallback harga payload untuk % (tier %)',
        v_item->>'product_name', v_tier;
      v_unit_price := COALESCE(NULLIF(v_item->>'price_per_bottle', '')::numeric, 0);
    END IF;

    v_total_price := v_total_price + (v_unit_price * v_item_qty);

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
      v_item_qty,
      v_unit_price,
      v_unit_price * v_item_qty
    );
  END LOOP;

  -- 9. Snapshot final pada order
  v_margin := v_total_price - v_buy_price;
  UPDATE public.orders
  SET price_per_bottle = ROUND(v_total_price / GREATEST(v_total_qty, 1)),
      total_price      = v_total_price,
      margin           = v_margin
  WHERE id = v_order_id;

  -- 10. Statistik pelanggan memakai total hasil kalkulasi server
  IF v_customer_id IS NOT NULL THEN
    BEGIN
      UPDATE public.customers SET
        name         = COALESCE(v_name, name),
        phone        = CASE WHEN v_phone IS NOT NULL THEN v_phone ELSE phone END,
        tier         = v_tier,
        type         = v_type,
        total_orders = total_orders + 1,
        total_spent  = total_spent + v_total_price,
        updated_at   = now()
      WHERE id = v_customer_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  ELSE
    BEGIN
      INSERT INTO public.customers (
        user_id, name, phone, tier, type, total_orders, total_spent
      ) VALUES (
        v_user_id, v_name, v_phone, v_tier, v_type, 1, v_total_price
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
