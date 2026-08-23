-- ============================================================
-- K3 — Server-side pricing: tutup celah `buy_price` dari client (IO-14)
--
-- Masalah (temuan IO-2):
--   RPC publik submit_public_order (SECURITY DEFINER, GRANT ke anon)
--   menerima `buy_price` dan `subtotal` dari payload client. Siapa pun
--   yang tahu slug toko aktif dapat memalsukan harga modal sehingga
--   margin/profit mitra dipalsukan.
--
-- Perubahan:
--   1. get_tier_by_qty(qty)          — threshold tier dari kuantitas (3/5/10/40/200).
--   2. is_beauty_product(name)       — aturan kategori beauty (Belgie/Steffi), paritas bot.
--   3. get_buy_price(tenant,product,tier) — SATU SUMBER KEBENARAN harga modal:
--        a. level kustom tenant (user_mitra_levels.level_code = level) menang;
--        b. fallback profiles.mitra_level tenant (default 'satuan');
--        c. tabel harga standar BP vs beauty sesuai semantik telegram-bot saat ini.
--   4. apply_server_pricing(items,tier,tenant) — hitung harga jual + modal
--      sepenuhnya server-side: threshold tier, bundle reseller BP 3=Rp650rb
--      dengan pembulatan dialokasikan ke item BP terakhir, beauty selalu
--      harga tier (tanpa bundle).
--   5. submit_public_order — MENGABAIKAN buy_price/subtotal/price_per_bottle
--      dari payload; semua angka uang dihitung via fungsi di atas.
--
-- Sumber semantik (baseline "lama" untuk paritas):
--   supabase/functions/telegram-bot/index.ts — getPricingForTier/getActiveTier/
--   applyTierPricing (bundle reseller: proporsional + koreksi item BP terakhir).
--
-- Catatan rewire berikutnya (duplikasi lama, JANGAN ditambah duplikat baru):
--   - src/lib/pricing.ts            (UI: TambahOrderFlow, OrderForm, ChatInterface)
--   - supabase/functions/telegram-bot/index.ts (logika harga inline)
--   Duplikat ini sengaja TIDAK diubah di migrasi ini agar perilaku berjalan
--   tidak bergeser; rewire menyusul setelah uji emas (issue terpisah).
--
-- ROLLBACK:
--   -- kembalikan definisi RPC lama:
--   \i supabase/migrations/20260616000000_update_order_status_default.sql
--   DROP FUNCTION IF EXISTS public.apply_server_pricing(jsonb, text, uuid);
--   DROP FUNCTION IF EXISTS public.get_buy_price(uuid, text, text);
--   DROP FUNCTION IF EXISTS public.is_beauty_product(text);
--   DROP FUNCTION IF EXISTS public.get_tier_by_qty(integer);
--   Catatan: order yang sudah tersimpan memakai harga hasil hitungan server
--   dan TIDAK ikut ter-roll back (data transaksional).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Threshold tier dari total kuantitas (paritas getTierByQty bot/UI)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_tier_by_qty(p_total_qty integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_total_qty >= 200 THEN 'se'
    WHEN p_total_qty >= 40  THEN 'sap'
    WHEN p_total_qty >= 10  THEN 'agen_plus'
    WHEN p_total_qty >= 5   THEN 'agen'
    WHEN p_total_qty >= 3   THEN 'reseller'
    ELSE 'satuan'
  END;
$$;

-- ------------------------------------------------------------
-- 2. Aturan kategori beauty (paritas isBeautyProduct: BELGIE / STEFFI)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_beauty_product(p_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT position('BELGIE' IN upper(COALESCE(p_name, ''))) > 0
      OR position('STEFFI' IN upper(COALESCE(p_name, ''))) > 0;
$$;

-- ------------------------------------------------------------
-- 3. SUMBER KEBENARAN harga modal
--    Prioritas (paritas getPricingForTier bot):
--      a. level kustom tenant : user_mitra_levels(level_code = level_aktif)
--      b. level aktif         : param tier eksplisit, jika kosong
--                               profiles.mitra_level tenant, jika kosong 'satuan'
--      c. tabel standar       : BP vs beauty per level (fallback level tak
--                               dikenal -> baris 'satuan')
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_buy_price(
  p_tenant  uuid,
  p_product text,
  p_tier    text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_level      text;
  v_level_key  text;
  v_custom     integer;
BEGIN
  -- Level aktif: tier eksplisit > profil tenant > 'satuan'
  IF p_tier IS NOT NULL AND btrim(p_tier) <> '' THEN
    v_level := btrim(p_tier);
  ELSE
    SELECT mitra_level INTO v_level
    FROM public.profiles
    WHERE user_id = p_tenant
    LIMIT 1;
  END IF;
  v_level     := COALESCE(v_level, 'satuan');
  v_level_key := lower(v_level);

  -- a. Level kustom milik tenant menang (pencocokan persis seperti bot)
  SELECT buy_price_per_bottle INTO v_custom
  FROM public.user_mitra_levels
  WHERE user_id = p_tenant
    AND level_code = v_level
  LIMIT 1;
  IF v_custom IS NOT NULL THEN
    RETURN v_custom::numeric;
  END IF;

  -- c. Tabel harga standar; level tak dikenal jatuh ke 'satuan'
  v_level_key := COALESCE(NULLIF(v_level_key, ''), 'satuan');
  IF public.is_beauty_product(p_product) THEN
    RETURN CASE v_level_key
      WHEN 'reseller'  THEN 195000
      WHEN 'agen'      THEN 195000
      WHEN 'agen_plus' THEN 180000
      WHEN 'sap'       THEN 170000
      WHEN 'se'        THEN 150000
      ELSE 195000            -- satuan & level tak dikenal
    END;
  ELSE
    RETURN CASE v_level_key
      WHEN 'reseller'  THEN 217000
      WHEN 'agen'      THEN 198000
      WHEN 'agen_plus' THEN 180000
      WHEN 'sap'       THEN 170000
      WHEN 'se'        THEN 150000
      ELSE 250000            -- satuan & level tak dikenal
    END;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 4a. Harga jual satuan per tier (paritas PRICE_TABLE / pricingMap)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_sell_price_per_bottle(
  p_tier   text,
  p_product text
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.is_beauty_product(p_product) THEN
      CASE lower(COALESCE(NULLIF(btrim(p_tier), ''), 'satuan'))
        WHEN 'agen_plus' THEN 180000
        WHEN 'sap'       THEN 170000
        WHEN 'se'        THEN 150000
        ELSE 195000            -- satuan / reseller / agen / tak dikenal
      END
    ELSE
      CASE lower(COALESCE(NULLIF(btrim(p_tier), ''), 'satuan'))
        WHEN 'reseller'  THEN 217000
        WHEN 'agen'      THEN 198000
        WHEN 'agen_plus' THEN 180000
        WHEN 'sap'       THEN 170000
        WHEN 'se'        THEN 150000
        ELSE 250000            -- satuan & tak dikenal
      END
  END;
$$;

-- ------------------------------------------------------------
-- 4b. Kalkulasi harga server-side untuk satu order publik
--     (paritas applyTierPricing bot, termasuk koreksi pembulatan
--      bundle reseller ke item BP terakhir)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_server_pricing(
  p_items     jsonb,
  p_base_tier text,
  p_tenant    uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  r            jsonb;
  v_out        jsonb      := '[]'::jsonb;
  v_err        text;
  v_idx        integer    := 0;
  v_total_qty  integer    := 0;
  v_bp_qty     integer    := 0;
  v_active     text;
  v_bundle     numeric    := 0;
  v_qty        integer;
  v_beauty     boolean;
  v_unit_sell  numeric;
  v_sub        numeric;
  v_assigned   numeric    := 0;
  v_last_bp    integer    := -1;
  v_diff       numeric;
  v_item       jsonb;
  v_sell_total numeric;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('error', 'Payload items tidak valid');
  END IF;

  -- Pass 1: validasi & agregat kuantitas
  FOR r IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_qty := (r ->> 'quantity')::integer;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('error', 'Quantity harus bilangan bulat');
    END;
    IF v_qty IS NULL OR v_qty < 1 THEN
      RETURN jsonb_build_object('error', 'Quantity harus minimal 1');
    END IF;
    v_total_qty := v_total_qty + v_qty;
    IF NOT public.is_beauty_product(r ->> 'product_name') THEN
      v_bp_qty := v_bp_qty + v_qty;
    END IF;
  END LOOP;

  -- Tier aktif: hanya 'satuan'/kosong yang naik via threshold (paritas bot)
  v_active := lower(COALESCE(NULLIF(btrim(COALESCE(p_base_tier, '')), ''), 'satuan'));
  IF v_active = 'satuan' THEN
    v_active := public.get_tier_by_qty(v_total_qty);
  END IF;

  -- Total bundle reseller BP: 3 botol = Rp650.000
  IF v_active = 'reseller' AND v_bp_qty > 0 THEN
    v_bundle := (floor(v_bp_qty / 3.0) * 650000) + ((v_bp_qty % 3) * 217000);
  END IF;

  -- Pass 2: harga per item (modal dari level tenant, jual dari tier aktif)
  FOR r IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty      := (r ->> 'quantity')::integer;
    v_beauty   := public.is_beauty_product(r ->> 'product_name');

    IF (NOT v_beauty) AND v_active = 'reseller' AND v_bp_qty > 0 THEN
      -- Distribusi proporsional bundle ke tiap item BP
      v_sub := round((v_qty::numeric / v_bp_qty) * v_bundle);
      v_item := jsonb_build_object(
        'product_id',      r -> 'product_id',
        'product_name',    r ->> 'product_name',
        'quantity',        v_qty,
        'price_per_bottle', round(v_sub / v_qty),
        'subtotal',        v_sub
      );
      v_assigned := v_assigned + v_sub;
      v_last_bp  := v_idx;
    ELSE
      v_unit_sell := public.get_sell_price_per_bottle(v_active, r ->> 'product_name');
      v_sub       := v_unit_sell * v_qty;
      v_item := jsonb_build_object(
        'product_id',      r -> 'product_id',
        'product_name',    r ->> 'product_name',
        'quantity',        v_qty,
        'price_per_bottle', v_unit_sell,
        'subtotal',        v_sub
      );
    END IF;

    v_out := v_out || jsonb_build_array(v_item);
    v_idx := v_idx + 1;
  END LOOP;

  -- Koreksi residu pembulatan dialokasikan ke item BP TERAKHIR (paritas bot)
  IF v_active = 'reseller' AND v_bp_qty > 0 AND v_last_bp >= 0 THEN
    v_diff := v_bundle - v_assigned;
    IF v_diff <> 0 THEN
      v_item := v_out -> v_last_bp;
      v_sub  := (v_item ->> 'subtotal')::numeric + v_diff;
      v_item := jsonb_set(v_item, '{subtotal}', to_jsonb(v_sub));
      v_item := jsonb_set(v_item, '{price_per_bottle}',
                          to_jsonb(round(v_sub / (v_item ->> 'quantity')::numeric)));
      v_out  := jsonb_set(v_out, ARRAY[v_last_bp::text], v_item);
    END IF;
  END IF;

  SELECT COALESCE(sum((x ->> 'subtotal')::numeric), 0) INTO v_sell_total
  FROM jsonb_array_elements(v_out) AS x;

  RETURN jsonb_build_object(
    'tier',        v_active,
    'total_qty',   v_total_qty,
    'total_price', v_sell_total,
    'buy_price', (
      SELECT COALESCE(sum((x ->> 'quantity')::numeric
                       * public.get_buy_price(p_tenant, x ->> 'product_name')), 0)
      FROM jsonb_array_elements(v_out) AS x
    ),
    'items', v_out
  );
END;
$$;

-- ------------------------------------------------------------
-- 5. submit_public_order — versi server-side pricing
--    Struktur mengikuti 20260616000000_update_order_status_default.sql;
--    satu-satunya perubahan perilaku: angka uang TIDAK dibaca dari payload.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_public_order(jsonb);

CREATE OR REPLACE FUNCTION public.submit_public_order(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     UUID;
  v_customer_id UUID;
  v_order_id    UUID;
  v_pricing     JSONB;
  v_item        JSONB;
  v_total_qty   INT := 0;
  v_total_price NUMERIC := 0;
  v_tier        TEXT;
  v_buy_price   NUMERIC := 0;
  v_margin      NUMERIC := 0;
  v_created_at  TIMESTAMPTZ;
  v_phone       TEXT;
  v_name        TEXT;
  v_type        TEXT;
  v_product_id  UUID;
BEGIN
  -- 1. Ambil user_id dari slug
  SELECT user_id INTO v_user_id
  FROM public.store_settings
  WHERE slug = (payload ->> 'slug')
    AND is_active = true
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Toko tidak ditemukan atau tidak aktif');
  END IF;

  -- 2. Hitung SELURUH harga di server (abaikan angka apa pun dari payload)
  v_pricing := public.apply_server_pricing(
                 payload -> 'items',
                 payload ->> 'tier',
                 v_user_id
               );

  IF v_pricing ? 'error' THEN
    RETURN jsonb_build_object('success', false, 'error', v_pricing ->> 'error');
  END IF;

  v_total_qty   := (v_pricing ->> 'total_qty')::int;
  v_total_price := (v_pricing ->> 'total_price')::numeric;
  v_buy_price   := (v_pricing ->> 'buy_price')::numeric;
  v_tier        := v_pricing ->> 'tier';
  v_margin      := v_total_price - v_buy_price;

  IF v_total_qty = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tidak ada produk yang dipesan');
  END IF;

  -- 3. Tentukan created_at dari order_date (jika ada) — perilaku lama dipertahankan
  IF payload ->> 'order_date' IS NOT NULL AND payload ->> 'order_date' != '' THEN
    v_created_at := ((payload ->> 'order_date')::date)::timestamptz + INTERVAL '5 hours';
  ELSE
    v_created_at := now();
  END IF;

  -- 4. Normalisasi phone & name
  v_phone := NULLIF(NULLIF(TRIM(COALESCE(payload ->> 'customer_phone', '')), ''), '-');
  v_name  := NULLIF(TRIM(COALESCE(payload ->> 'customer_name', '')), '');
  v_type  := COALESCE(NULLIF(payload ->> 'customer_type', ''), 'konsumen');

  -- 5. UPSERT CUSTOMER → dapatkan customer_id (perilaku lama dipertahankan)
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
        total_spent  = total_spent + v_total_price::bigint,
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
        v_total_price::bigint
      )
      RETURNING id INTO v_customer_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_customer_id := NULL;
  END;

  -- 6. INSERT ORDER — semua angka dari apply_server_pricing
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
    payload ->> 'customer_name',
    COALESCE(v_phone, ''),
    v_tier,
    v_total_qty,
    ROUND(v_total_price / GREATEST(v_total_qty, 1))::bigint,
    v_total_price::bigint,
    v_buy_price::bigint,
    v_margin::bigint,
    'selesai',
    v_created_at
  )
  RETURNING id INTO v_order_id;

  -- 7. INSERT ORDER ITEMS — harga server-side, product_id tetap divalidasi
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_pricing -> 'items')
  LOOP
    v_product_id := NULL;
    BEGIN
      IF v_item ->> 'product_id' IS NOT NULL
         AND v_item ->> 'product_id' != ''
         AND v_item ->> 'product_id' != 'null' THEN
        v_product_id := (v_item ->> 'product_id')::uuid;
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
      v_item ->> 'product_name',
      v_product_id,
      (v_item ->> 'quantity')::int,
      (v_item ->> 'price_per_bottle')::numeric,
      (v_item ->> 'subtotal')::numeric
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success',     true,
    'order_id',    v_order_id::text,
    'tier',        v_tier,
    'total_qty',   v_total_qty,
    'total_price', v_total_price,
    'buy_price',   v_buy_price,
    'margin',      v_margin
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ------------------------------------------------------------
-- Hak akses (least privilege)
-- ------------------------------------------------------------
-- RPC publik tetap bisa dipanggil halaman order publik
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_order(jsonb) TO authenticated;

-- Fungsi bantu: bukan untuk anon/PUBLIC; disiapkan untuk rewire app/bot berikutnya
REVOKE EXECUTE ON FUNCTION public.get_tier_by_qty(integer)              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_beauty_product(text)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_buy_price(uuid, text, text)       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sell_price_per_bottle(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_server_pricing(jsonb, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_buy_price(uuid, text, text)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_server_pricing(jsonb, text, uuid) TO authenticated;
