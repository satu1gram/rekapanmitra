-- Update Katalog Harga (berlaku mulai 1 September 2026)
-- -------------------------------------------------------------
-- BP Group / Reguler (BP, STEFFI, BRE, BRO, NORWAY):
--   satuan=265.000 | 3 botol=720.000 | 5 botol=1.125.000 |
--   10 botol=2.100.000 | 40 botol=7.800.000 | 200 botol=35.000.000
-- BP Blue (BLUE) & BP Green (KID):
--   satuan=285.000 | 3 botol=780.000 | 5 botol=1.225.000 |
--   10 botol=2.250.000 | 40 botol=8.400.000 | 200 botol=35.000.000
--
-- SATU STATEMENT (data-modifying CTE) — aman dieksekusi di SQL Editor
-- Supabase maupun via CLI. Tidak bergantung pada temp table/CTE antar-statement.
--
-- RLS: master_products hanya boleh di-update/insert oleh role admin.
-- Jalankan via SQL Editor dengan "Run as: postgres" (RLS OFF / service role)
-- atau via `supabase db push` (postgres selalu bypass RLS).
-- Order historis tidak diubah (invariant harga historis: snapshot transaksi tetap).

WITH new_prices (name, category, package_type, qty, price) AS (
  VALUES
    -- ================= BP Group / Reguler =================
    ('Paket BP 200 Botol',     'BP',      '200_botol', 200, 35000000),
    ('Paket BP 40 Botol',      'BP',      '40_botol',  40,  7800000),
    ('Paket BP 10 Botol',      'BP',      '10_botol',  10,  2100000),
    ('Paket BP 5 Botol',       'BP',      '5_botol',   5,   1125000),
    ('Paket BP 3 Botol',       'BP',      '3_botol',   3,   720000),
    ('BP Satuan',              'BP',      'satuan',    1,   265000),

    ('Paket Steffi 200 Botol', 'STEFFI',  '200_botol', 200, 35000000),
    ('Paket Steffi 40 Botol',  'STEFFI',  '40_botol',  40,  7800000),
    ('Paket Steffi 10 Botol',  'STEFFI',  '10_botol',  10,  2100000),
    ('Paket Steffi 5 Botol',   'STEFFI',  '5_botol',   5,   1125000),
    ('Paket Steffi 3 Botol',   'STEFFI',  '3_botol',   3,   720000),
    ('Steffi Satuan',          'STEFFI',  'satuan',    1,   265000),

    ('Paket Brassic Eye 200 Botol', 'BRE', '200_botol', 200, 35000000),
    ('Paket Brassic Eye 40 Botol',  'BRE', '40_botol',  40,  7800000),
    ('Paket Brassic Eye 10 Botol',  'BRE', '10_botol',  10,  2100000),
    ('Paket Brassic Eye 5 Botol',   'BRE', '5_botol',   5,   1125000),
    ('Paket Brassic Eye 3 Botol',   'BRE', '3_botol',   3,   720000),
    ('Brassic Eye Satuan',          'BRE', 'satuan',    1,   265000),

    ('Paket Brassic Pro 200 Botol', 'BRO', '200_botol', 200, 35000000),
    ('Paket Brassic Pro 40 Botol',  'BRO', '40_botol',  40,  7800000),
    ('Paket Brassic Pro 10 Botol',  'BRO', '10_botol',  10,  2100000),
    ('Paket Brassic Pro 5 Botol',   'BRO', '5_botol',   5,   1125000),
    ('Paket Brassic Pro 3 Botol',   'BRO', '3_botol',   3,   720000),
    ('Brassic Pro Satuan',          'BRO', 'satuan',    1,   265000),

    ('Paket Norway 200 Botol',  'NORWAY', '200_botol', 200, 35000000),
    ('Paket Norway 40 Botol',   'NORWAY', '40_botol',  40,  7800000),
    ('Paket Norway 10 Botol',   'NORWAY', '10_botol',  10,  2100000),
    ('Paket Norway 5 Botol',    'NORWAY', '5_botol',   5,   1125000),
    ('Paket Norway 3 Botol',    'NORWAY', '3_botol',   3,   720000),
    ('Norway Satuan',           'NORWAY', 'satuan',    1,   265000),

    -- ================= BP Blue & BP Green =================
    ('Paket Blue 200 Botol',    'BLUE',    '200_botol', 200, 35000000),
    ('Paket Blue 40 Botol',     'BLUE',    '40_botol',  40,  8400000),
    ('Paket Blue 10 Botol',     'BLUE',    '10_botol',  10,  2250000),
    ('Paket Blue 5 Botol',      'BLUE',    '5_botol',   5,   1225000),
    ('Paket Blue 3 Botol',      'BLUE',    '3_botol',   3,   780000),
    ('Blue Satuan',             'BLUE',    'satuan',    1,   285000),

    ('Paket Green 200 Botol',   'KID',     '200_botol', 200, 35000000),
    ('Paket Green 40 Botol',    'KID',     '40_botol',  40,  8400000),
    ('Paket Green 10 Botol',    'KID',     '10_botol',  10,  2250000),
    ('Paket Green 5 Botol',     'KID',     '5_botol',   5,   1225000),
    ('Paket Green 3 Botol',     'KID',     '3_botol',   3,   780000),
    ('Green Satuan',            'KID',     'satuan',    1,   285000)
),
updated AS (
  -- 1) Update harga baris yang sudah ada (kategori x package_type)
  UPDATE public.master_products m
  SET price = np.price,
      updated_at = now()
  FROM new_prices np
  WHERE m.category = np.category
    AND m.package_type = np.package_type
  RETURNING m.id
)
-- 2) Sisipkan baris katalog yang belum ada (idempotent)
INSERT INTO public.master_products (name, category, package_type, quantity_per_package, price, is_active)
SELECT np.name, np.category, np.package_type, np.qty, np.price, true
FROM new_prices np
WHERE NOT EXISTS (
  SELECT 1
  FROM public.master_products m
  WHERE m.category = np.category
    AND m.package_type = np.package_type
);