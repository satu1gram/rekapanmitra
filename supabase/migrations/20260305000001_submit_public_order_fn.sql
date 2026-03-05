-- ============================================================
-- SECURITY DEFINER function untuk submit public order
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Drop jika sudah ada dari percobaan sebelumnya
DROP FUNCTION IF EXISTS public.submit_public_order(jsonb);

CREATE OR REPLACE FUNCTION public.submit_public_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     UUID;
  v_store_name  TEXT;
  v_order_id    UUID;
  v_item        jsonb;
  v_total_qty   INT := 0;
  v_total_price NUMERIC := 0;
BEGIN
  -- 1. Ambil user_id dari slug yang dikirim
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

  -- 3. Insert order
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
    status
  ) VALUES (
    v_user_id,
    payload->>'customer_name',
    payload->>'customer_phone',
    'satuan',
    v_total_qty,
    ROUND(v_total_price / GREATEST(v_total_qty, 1)),
    v_total_price,
    0,
    0,
    'menunggu_bayar'
  )
  RETURNING id INTO v_order_id;

  -- 4. Insert order items (jika tabel order_items ada)
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
      -- Tabel order_items tidak ada, skip
      NULL;
    END;
  END LOOP;

  -- 5. Insert customer (opsional, boleh gagal jika duplikat)
  BEGIN
    INSERT INTO public.customers (
      user_id, name, phone, tier, total_orders, total_spent
    ) VALUES (
      v_user_id,
      payload->>'customer_name',
      payload->>'customer_phone',
      'satuan',
      1,
      v_total_price
    );
  EXCEPTION WHEN unique_violation THEN
    -- Pelanggan sudah ada, tidak masalah
    NULL;
  END;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Izinkan anon dan authenticated user memanggil function ini
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO authenticated;

-- Verifikasi
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'submit_public_order';
