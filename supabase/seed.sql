-- ============================================================
-- SEED DATA — Rekapan Mitra
-- Data contoh untuk development & demo
--
-- CARA PAKAI:
--   Jalankan di Supabase SQL Editor SETELAH membuat user test.
--   Ganti USER_ID_PLACEHOLDER dengan UUID user yang ingin di-seed.
--
-- Contoh:
--   SELECT id FROM auth.users WHERE email = 'test@rekapan.id';
--   Lalu replace semua 'USER_ID_PLACEHOLDER' dengan UUID tersebut.
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_product_id_a UUID;
  v_product_id_b UUID;
BEGIN
  -- ── Ambil user pertama yang ada (atau ganti dengan UUID spesifik) ──
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Tidak ada user di database. Buat akun dulu melalui aplikasi, lalu jalankan seed ini.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding data untuk user: %', v_user_id;

  -- ── UPDATE PROFILE ────────────────────────────────────────────
  UPDATE public.profiles
  SET
    name        = 'Siti Rahayu',
    phone       = '081234567890',
    location    = 'Malang',
    mitra_level = 'agen'
  WHERE user_id = v_user_id;


  -- ── PRODUCTS ──────────────────────────────────────────────────
  INSERT INTO public.products (id, user_id, name, default_sell_price, is_active, created_at)
  VALUES
    (gen_random_uuid(), v_user_id, 'Produk BP 30 ml', 250000, true, now() - interval '90 days'),
    (gen_random_uuid(), v_user_id, 'Produk BP 60 ml', 450000, true, now() - interval '90 days'),
    (gen_random_uuid(), v_user_id, 'Paket Hemat 3x30ml', 700000, true, now() - interval '60 days')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_product_id_a FROM public.products WHERE user_id = v_user_id AND name = 'Produk BP 30 ml';
  SELECT id INTO v_product_id_b FROM public.products WHERE user_id = v_user_id AND name = 'Produk BP 60 ml';


  -- ── CUSTOMERS ─────────────────────────────────────────────────
  INSERT INTO public.customers (user_id, name, phone, tier, total_orders, total_spent, created_at)
  VALUES
    (v_user_id, 'Budi Santoso',   '081111111111', 'reseller', 5,  1250000, now() - interval '80 days'),
    (v_user_id, 'Dewi Puspita',   '082222222222', 'agen',     8,  2000000, now() - interval '70 days'),
    (v_user_id, 'Ahmad Fauzi',    '083333333333', 'satuan',   12, 3000000, now() - interval '65 days'),
    (v_user_id, 'Rina Wulandari', '084444444444', 'reseller', 3,  750000,  now() - interval '45 days'),
    (v_user_id, 'Hendra Wijaya',  '085555555555', 'agen',     6,  1500000, now() - interval '30 days')
  ON CONFLICT DO NOTHING;


  -- ── STOK AWAL ─────────────────────────────────────────────────
  -- User stock
  INSERT INTO public.user_stock (user_id, current_stock, updated_at)
  VALUES (v_user_id, 85, now())
  ON CONFLICT (user_id) DO UPDATE SET current_stock = 85, updated_at = now();

  -- Stock entries historis
  INSERT INTO public.stock_entries (user_id, type, quantity, buy_price_per_bottle, total_buy_price, notes, created_at)
  VALUES
    (v_user_id, 'initial', 200, 175000, 35000000, 'Stok awal', now() - interval '90 days'),
    (v_user_id, 'in',      100, 175000, 17500000, 'Restok Desember', now() - interval '60 days'),
    (v_user_id, 'in',      50,  175000, 8750000,  'Restok Januari',  now() - interval '30 days');


  -- ── ORDERS (3 bulan terakhir) ─────────────────────────────────

  -- Desember 2025 — 4 order
  INSERT INTO public.orders (user_id, customer_name, customer_phone, tier, quantity, price_per_bottle, total_price, buy_price, margin, status, created_at)
  VALUES
    (v_user_id, 'Budi Santoso',   '081111111111', 'reseller', 10, 220000, 2200000, 1750000,  450000, 'selesai', now() - interval '85 days'),
    (v_user_id, 'Dewi Puspita',   '082222222222', 'agen',     20, 210000, 4200000, 3500000,  700000, 'selesai', now() - interval '80 days'),
    (v_user_id, 'Ahmad Fauzi',    '083333333333', 'satuan',    5, 250000, 1250000,  875000,  375000, 'selesai', now() - interval '75 days'),
    (v_user_id, 'Umum',           '000000000000', 'satuan',    3, 250000,  750000,  525000,  225000, 'selesai', now() - interval '70 days');

  -- Januari 2026 — 5 order
  INSERT INTO public.orders (user_id, customer_name, customer_phone, tier, quantity, price_per_bottle, total_price, buy_price, margin, status, created_at)
  VALUES
    (v_user_id, 'Rina Wulandari', '084444444444', 'reseller', 15, 220000, 3300000, 2625000,  675000, 'selesai', now() - interval '55 days'),
    (v_user_id, 'Hendra Wijaya',  '085555555555', 'agen',     25, 210000, 5250000, 4375000,  875000, 'selesai', now() - interval '50 days'),
    (v_user_id, 'Budi Santoso',   '081111111111', 'reseller', 10, 220000, 2200000, 1750000,  450000, 'selesai', now() - interval '45 days'),
    (v_user_id, 'Dewi Puspita',   '082222222222', 'agen',     30, 210000, 6300000, 5250000, 1050000, 'selesai', now() - interval '40 days'),
    (v_user_id, 'Umum',           '000000000000', 'satuan',    8, 250000, 2000000, 1400000,  600000, 'selesai', now() - interval '35 days');

  -- Februari 2026 — 6 order (bulan berjalan)
  INSERT INTO public.orders (user_id, customer_name, customer_phone, tier, quantity, price_per_bottle, total_price, buy_price, margin, status, created_at)
  VALUES
    (v_user_id, 'Ahmad Fauzi',    '083333333333', 'satuan',   12, 250000, 3000000, 2100000,  900000, 'selesai', now() - interval '25 days'),
    (v_user_id, 'Rina Wulandari', '084444444444', 'reseller', 18, 220000, 3960000, 3150000,  810000, 'selesai', now() - interval '20 days'),
    (v_user_id, 'Hendra Wijaya',  '085555555555', 'agen',     22, 210000, 4620000, 3850000,  770000, 'selesai', now() - interval '14 days'),
    (v_user_id, 'Budi Santoso',   '081111111111', 'reseller', 15, 220000, 3300000, 2625000,  675000, 'terkirim',now() - interval '7 days'),
    (v_user_id, 'Dewi Puspita',   '082222222222', 'agen',     28, 210000, 5880000, 4900000,  980000, 'pending', now() - interval '3 days'),
    (v_user_id, 'Umum',           '000000000000', 'satuan',    5, 250000, 1250000,  875000,  375000, 'pending', now() - interval '1 day');


  -- ── GENERAL EXPENSES ──────────────────────────────────────────
  INSERT INTO public.general_expenses (user_id, name, amount, category, notes, expense_date, created_at)
  VALUES
    (v_user_id, 'Ongkos kirim Desember', 150000, 'transport', NULL, (now() - interval '80 days')::date, now() - interval '80 days'),
    (v_user_id, 'Pulsa & Internet',       100000, 'other',     NULL, (now() - interval '60 days')::date, now() - interval '60 days'),
    (v_user_id, 'Ongkos kirim Januari',  200000, 'transport', NULL, (now() - interval '45 days')::date, now() - interval '45 days'),
    (v_user_id, 'Cetak brosur',           75000, 'marketing', NULL, (now() - interval '30 days')::date, now() - interval '30 days'),
    (v_user_id, 'Ongkos kirim Februari', 180000, 'transport', NULL, (now() - interval '10 days')::date, now() - interval '10 days');


  -- ── GENERAL INCOME ────────────────────────────────────────────
  INSERT INTO public.general_income (user_id, name, amount, category, notes, income_date, created_at)
  VALUES
    (v_user_id, 'Bonus referral Januari', 75000,  'bonus', NULL, (now() - interval '35 days')::date, now() - interval '35 days'),
    (v_user_id, 'Komisi event Februari',  50000,  'bonus', NULL, (now() - interval '5 days')::date,  now() - interval '5 days');


  -- ── MONTHLY TARGETS ───────────────────────────────────────────
  INSERT INTO public.monthly_targets (user_id, year, month, target_profit, target_qty, target_stock, created_at)
  VALUES
    -- Desember 2025 (month=11)
    (v_user_id, 2025, 11, 2000000, 40,  50, now() - interval '90 days'),
    -- Januari 2026 (month=0)
    (v_user_id, 2026, 0,  9500000, 100, 90, now() - interval '60 days'),
    -- Februari 2026 (month=1) — bulan berjalan
    (v_user_id, 2026, 1,  10000000, 120, 100, now() - interval '30 days')
  ON CONFLICT (user_id, year, month) DO UPDATE
    SET target_profit = EXCLUDED.target_profit,
        target_qty    = EXCLUDED.target_qty,
        target_stock  = EXCLUDED.target_stock;

  RAISE NOTICE 'Seed data berhasil dimasukkan untuk user: %', v_user_id;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error saat seed: %', SQLERRM;
  RAISE;
END $$;
