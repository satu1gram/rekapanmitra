-- ============================================================
-- Test K3 — Server-side pricing (IO-14)
-- Jalankan lokal terhadap Postgres kosong ATAU Supabase staging:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f supabase/tests/k3_server_side_pricing_test.sql
--
-- Skrip ini:
--   1. Menerapkan migrasi K3 (autocommit — fungsi tetap ada setelah test).
--   2. Membuat tabel minimal (IF NOT EXISTS) bila skema belum ada.
--   3. Menjalankan kasus emas paritas + uji negatif dalam transaksi
--      yang di-ROLLBACK sehingga tidak meninggalkan data.
-- ============================================================

\set ON_ERROR_STOP on
\echo '== 0. Role ala Supabase (hanya bila belum ada) =='
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN NOINHERIT', r);
    END IF;
  END LOOP;
END $$;

\echo '== 1. Terapkan migrasi K3 =='
\ir ../migrations/20260823000000_k3_server_side_pricing.sql

\echo '== 2. Tabel minimal (hanya bila belum ada) =='

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  mitra_level text NOT NULL DEFAULT 'reseller',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_mitra_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_code text NOT NULL,
  label text NOT NULL,
  buy_price_per_bottle integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE (user_id, level_code)
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  store_name text NOT NULL DEFAULT '',
  welcome_message text,
  is_active boolean NOT NULL DEFAULT true,
  payment_info jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  tier text NOT NULL DEFAULT 'satuan'
    CHECK (tier IN ('satuan','reseller','agen','agen_plus','sap','se','nl')),
  type text DEFAULT 'konsumen',
  total_orders integer NOT NULL DEFAULT 0,
  total_spent bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  tier text NOT NULL
    CHECK (tier IN ('satuan','reseller','agen','agen_plus','sap','se','nl')),
  quantity integer NOT NULL,
  price_per_bottle bigint NOT NULL,
  total_price bigint NOT NULL,
  buy_price bigint NOT NULL,
  margin bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('menunggu_bayar','pending','terkirim','selesai')),
  transfer_proof_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL,
  product_name text,
  product_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  price_per_bottle bigint NOT NULL DEFAULT 0,
  subtotal bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

BEGIN;

\echo '== 3. Fixture =='

INSERT INTO auth.users (id) VALUES ('11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (user_id, name, mitra_level)
VALUES ('11111111-1111-1111-1111-111111111111', 'Tenant Satu', 'reseller')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO auth.users (id) VALUES ('22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (user_id, name, mitra_level)
VALUES ('22222222-2222-2222-2222-222222222222', 'Tenant Dua', 'gold')
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.user_mitra_levels (user_id, level_code, label, buy_price_per_bottle)
VALUES ('22222222-2222-2222-2222-222222222222', 'gold', 'Gold', 200000)
ON CONFLICT (user_id, level_code) DO NOTHING;

INSERT INTO public.store_settings (user_id, slug, store_name, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'toko-uji', 'Toko Uji', true)
ON CONFLICT (slug) DO NOTHING;

\echo '== 4. Kasus emas: get_buy_price =='
DO $test$
DECLARE
  t1 uuid := '11111111-1111-1111-1111-111111111111';
  t2 uuid := '22222222-2222-2222-2222-222222222222';
  t3 uuid := '33333333-3333-3333-3333-333333333333'; -- tanpa profil
  got numeric;
BEGIN
  got := public.get_buy_price(t1, 'BP Satuan');
  IF got <> 217000 THEN RAISE EXCEPTION 'F1 gagal: BP/reseller = % (harap 217000)', got; END IF;

  got := public.get_buy_price(t1, 'Belgie Satuan');
  IF got <> 195000 THEN RAISE EXCEPTION 'F2 gagal: Belgie/reseller = % (harap 195000)', got; END IF;

  got := public.get_buy_price(t1, 'Paket Steffi 10 Botol', 'sap');
  IF got <> 170000 THEN RAISE EXCEPTION 'F3 gagal: Steffi/sap eksplisit = % (harap 170000)', got; END IF;

  got := public.get_buy_price(t2, 'BP Satuan');
  IF got <> 200000 THEN RAISE EXCEPTION 'F4 gagal: level kustom gold BP = % (harap 200000)', got; END IF;

  got := public.get_buy_price(t2, 'Steffi Satuan');
  IF got <> 200000 THEN RAISE EXCEPTION 'F5 gagal: level kustom gold beauty = % (harap 200000)', got; END IF;

  got := public.get_buy_price(t1, 'Produk Misterius', 'level_ngaco');
  IF got <> 250000 THEN RAISE EXCEPTION 'F6 gagal: level tak dikenal fallback satuan = % (harap 250000)', got; END IF;

  got := public.get_buy_price(t3, 'BP Satuan'); -- profil tidak ada -> satuan
  IF got <> 250000 THEN RAISE EXCEPTION 'F7 gagal: tanpa profil fallback satuan = % (harap 250000)', got; END IF;

  RAISE NOTICE 'get_buy_price: 7/7 kasus emas LULUS';
END
$test$;

\echo '== 5. Kasus emas: apply_server_pricing =='
DO $test$
DECLARE
  t1 uuid := '11111111-1111-1111-1111-111111111111';
  t2 uuid := '22222222-2222-2222-2222-222222222222';
  res jsonb;
  it  jsonb;
  s1 numeric; s2 numeric; s3 numeric;
BEGIN
  -- A. Threshold qty 3 -> reseller, bundle BP 3 = Rp650rb
  res := public.apply_server_pricing(
    '[{"product_name":"BP Satuan","quantity":3}]'::jsonb, 'satuan', t1);
  IF res->>'tier' <> 'reseller' THEN RAISE EXCEPTION 'A gagal tier: %', res->>'tier'; END IF;
  IF (res->>'total_price')::numeric <> 650000 THEN RAISE EXCEPTION 'A gagal total: %', res->>'total_price'; END IF;
  IF (res->>'buy_price')::numeric <> 651000 THEN RAISE EXCEPTION 'A gagal modal: %', res->>'buy_price'; END IF;
  it := res->'items'->0;
  IF (it->>'price_per_bottle')::numeric <> 216667 THEN RAISE EXCEPTION 'A gagal harga/item: %', it->>'price_per_bottle'; END IF;

  -- B. Pembulatan bundle dialokasikan ke item BP TERAKHIR (split 1+1+1)
  res := public.apply_server_pricing(
    '[{"product_name":"BP","quantity":1},{"product_name":"BP","quantity":1},{"product_name":"BP","quantity":1}]'::jsonb,
    'satuan', t1);
  s1 := (res->'items'->0->>'subtotal')::numeric;
  s2 := (res->'items'->1->>'subtotal')::numeric;
  s3 := (res->'items'->2->>'subtotal')::numeric;
  IF s1 <> 216667 OR s2 <> 216667 OR s3 <> 216666 THEN
    RAISE EXCEPTION 'B gagal alokasi pembulatan: % % % (harap 216667 216667 216666)', s1, s2, s3;
  END IF;
  IF (res->>'total_price')::numeric <> 650000 THEN RAISE EXCEPTION 'B gagal total: %', res->>'total_price'; END IF;

  -- C. Threshold qty 5 -> agen (modal tetap level tenant = reseller)
  res := public.apply_server_pricing(
    '[{"product_name":"BP Satuan","quantity":5}]'::jsonb, 'satuan', t1);
  IF res->>'tier' <> 'agen' THEN RAISE EXCEPTION 'C gagal tier: %', res->>'tier'; END IF;
  IF (res->>'total_price')::numeric <> 990000 THEN RAISE EXCEPTION 'C gagal total: %', res->>'total_price'; END IF;
  IF (res->>'buy_price')::numeric <> 1085000 THEN RAISE EXCEPTION 'C gagal modal: %', res->>'buy_price'; END IF;

  -- D. Threshold qty 10 -> agen_plus
  res := public.apply_server_pricing(
    '[{"product_name":"BP Satuan","quantity":10}]'::jsonb, '', t1);
  IF res->>'tier' <> 'agen_plus' THEN RAISE EXCEPTION 'D gagal tier: %', res->>'tier'; END IF;
  IF (res->>'total_price')::numeric <> 1800000 THEN RAISE EXCEPTION 'D gagal total: %', res->>'total_price'; END IF;

  -- E. Threshold qty 40 -> sap
  res := public.apply_server_pricing(
    '[{"product_name":"BP Satuan","quantity":40}]'::jsonb, NULL, t1);
  IF res->>'tier' <> 'sap' THEN RAISE EXCEPTION 'E gagal tier: %', res->>'tier'; END IF;
  IF (res->>'total_price')::numeric <> 6800000 THEN RAISE EXCEPTION 'E gagal total: %', res->>'total_price'; END IF;

  -- F. Threshold qty 200 -> se
  res := public.apply_server_pricing(
    '[{"product_name":"BP Satuan","quantity":200}]'::jsonb, 'satuan', t1);
  IF res->>'tier' <> 'se' THEN RAISE EXCEPTION 'F gagal tier: %', res->>'tier'; END IF;
  IF (res->>'total_price')::numeric <> 30000000 THEN RAISE EXCEPTION 'F gagal total: %', res->>'total_price'; END IF;

  -- G. Beauty tanpa bundle + BP berbundle (total qty 4 -> tier reseller)
  res := public.apply_server_pricing(
    '[{"product_name":"Belgie Satuan","quantity":1},{"product_name":"BP Satuan","quantity":3}]'::jsonb,
    'satuan', t1);
  IF res->>'tier' <> 'reseller' THEN RAISE EXCEPTION 'G gagal tier: %', res->>'tier'; END IF;
  IF (res->>'total_price')::numeric <> 845000 THEN RAISE EXCEPTION 'G gagal total: %', res->>'total_price'; END IF;
  IF (res->'items'->0->>'subtotal')::numeric <> 195000 THEN RAISE EXCEPTION 'G gagal subtotal Belgie: %', res->'items'->0->>'subtotal'; END IF;
  IF (res->'items'->1->>'subtotal')::numeric <> 650000 THEN RAISE EXCEPTION 'G gagal subtotal BP: %', res->'items'->1->>'subtotal'; END IF;
  IF (res->>'buy_price')::numeric <> 846000 THEN RAISE EXCEPTION 'G gagal modal: %', res->>'buy_price'; END IF;

  -- H. Tier eksplisit non-satuan TIDAK naik via threshold (paritas bot)
  res := public.apply_server_pricing(
    '[{"product_name":"BP","quantity":12}]'::jsonb, 'reseller', t1);
  IF res->>'tier' <> 'reseller' THEN RAISE EXCEPTION 'H gagal tier: %', res->>'tier'; END IF;
  IF (res->>'total_price')::numeric <> 2600000 THEN RAISE EXCEPTION 'H gagal total: %', res->>'total_price'; END IF;

  -- I. Semua beauty di tier reseller -> harga tier, tanpa bundle
  res := public.apply_server_pricing(
    '[{"product_name":"Steffi","quantity":4}]'::jsonb, 'satuan', t1);
  IF (res->>'total_price')::numeric <> 780000 THEN RAISE EXCEPTION 'I gagal total: %', res->>'total_price'; END IF;

  -- J. Modal memakai level kustom tenant (bukan tier pelanggan)
  res := public.apply_server_pricing(
    '[{"product_name":"BP","quantity":3}]'::jsonb, 'satuan', t2);
  IF (res->>'buy_price')::numeric <> 600000 THEN RAISE EXCEPTION 'J gagal modal kustom: %', res->>'buy_price'; END IF;
  IF (res->>'total_price')::numeric <> 650000 THEN RAISE EXCEPTION 'J gagal total: %', res->>'total_price'; END IF;

  RAISE NOTICE 'apply_server_pricing: 10/10 kasus emas LULUS';
END
$test$;

\echo '== 6. Uji negatif: submit_public_order abaikan angka dari payload =='
DO $test$
DECLARE
  forged jsonb;
  res jsonb;
  ord record;
  v_oid text;
BEGIN
  forged := '{
    "slug": "toko-uji",
    "customer_name": "Pelanggan Uji",
    "customer_phone": "081234567890",
    "tier": "satuan",
    "buy_price": 999999999,
    "margin": -12345,
    "items": [
      {"product_name": "BP Satuan", "quantity": 3,
       "price_per_bottle": 1, "subtotal": 123}
    ]
  }'::jsonb;

  res := public.submit_public_order(forged);
  IF res->>'success' <> 'true' THEN RAISE EXCEPTION 'K gagal: RPC menolak: %', res->>'error'; END IF;
  v_oid := res->>'order_id';

  SELECT * INTO ord FROM public.orders WHERE id = v_oid::uuid;
  IF ord.total_price <> 650000 THEN RAISE EXCEPTION 'K gagal total_price dipalsukan: %', ord.total_price; END IF;
  IF ord.buy_price   <> 651000 THEN RAISE EXCEPTION 'K gagal buy_price dipalsukan: %', ord.buy_price; END IF;
  IF ord.margin      <> -1000  THEN RAISE EXCEPTION 'K gagal margin: %', ord.margin; END IF;
  IF ord.tier        <> 'reseller' THEN RAISE EXCEPTION 'K gagal tier tersimpan: %', ord.tier; END IF;
  IF ord.status      <> 'selesai' THEN RAISE EXCEPTION 'K gagal status: %', ord.status; END IF;

  IF (SELECT count(*) FROM public.order_items WHERE order_id = v_oid::uuid) <> 1 THEN
    RAISE EXCEPTION 'K gagal: jumlah order_item salah';
  END IF;
  SELECT * INTO ord FROM public.order_items WHERE order_id = v_oid::uuid LIMIT 1;
  IF ord.subtotal <> 650000 OR ord.price_per_bottle <> 216667 THEN
    RAISE EXCEPTION 'K gagal item tersimpan: % / %', ord.price_per_bottle, ord.subtotal;
  END IF;

  -- L. Palsukan beda nilai lagi -> hasil uang identik (independen dari payload)
  forged := jsonb_set(forged, '{buy_price}', '42');
  res := public.submit_public_order(forged);
  SELECT * INTO ord FROM public.orders WHERE id = (res->>'order_id')::uuid;
  IF ord.total_price <> 650000 OR ord.buy_price <> 651000 OR ord.margin <> -1000 THEN
    RAISE EXCEPTION 'L gagal: hasil berubah mengikuti payload palsu';
  END IF;

  -- M. Quantity tidak valid ditolak
  res := public.submit_public_order(
    '{"slug":"toko-uji","customer_name":"X","customer_phone":"","items":[{"product_name":"BP","quantity":0,"price_per_bottle":1,"subtotal":1}]}'::jsonb);
  IF res->>'success' = 'true' THEN RAISE EXCEPTION 'M gagal: qty 0 diterima'; END IF;

  res := public.submit_public_order('{"slug":"toko-uji","items":[{"product_name":"BP","quantity":"abc"}]}'::jsonb);
  IF res->>'success' = 'true' THEN RAISE EXCEPTION 'M gagal: qty non-angka diterima'; END IF;

  -- N. Slug tak dikenal ditolak
  res := public.submit_public_order(
    '{"slug":"ngasal","items":[{"product_name":"BP","quantity":1,"price_per_bottle":1,"subtotal":1}]}'::jsonb);
  IF res->>'success' <> 'false' THEN RAISE EXCEPTION 'N gagal: slug ngasal diterima'; END IF;

  RAISE NOTICE 'submit_public_order: uji negatif payload palsu LULUS (4/4)';
END
$test$;

ROLLBACK;
\echo '== SELESAI: semua kasus K3 LULUS (transaksi di-rollback) =='

