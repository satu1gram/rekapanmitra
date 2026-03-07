-- Seeder Data Awal Master Produk
-- Sesuai dengan harga yang diberikan pengguna

INSERT INTO public.master_products (name, category, package_type, quantity_per_package, price, is_active)
VALUES
-- Kategori: STEFFI
('Paket Steffi 200 Botol', 'STEFFI', '200_botol', 200, 30000000, true),
('Paket Steffi 40 Botol', 'STEFFI', '40_botol', 40, 6800000, true),
('Paket Steffi 10 Botol', 'STEFFI', '10_botol', 10, 1800000, true),
('Paket Steffi 5 Botol', 'STEFFI', '5_botol', 5, 975000, true),
('Paket Steffi 3 Botol', 'STEFFI', '3_botol', 3, 585000, true),
('Steffi Satuan', 'STEFFI', 'satuan', 1, 195000, true),

-- Kategori: BELGIE
('Paket Belgie 200 Botol', 'BELGIE', '200_botol', 200, 30000000, true),
('Paket Belgie 40 Botol', 'BELGIE', '40_botol', 40, 6800000, true),
('Paket Belgie 10 Botol', 'BELGIE', '10_botol', 10, 1800000, true),
('Paket Belgie 5 Botol', 'BELGIE', '5_botol', 5, 975000, true),
('Paket Belgie 3 Botol', 'BELGIE', '3_botol', 3, 585000, true),
('Belgie Satuan', 'BELGIE', 'satuan', 1, 195000, true),

-- Kategori: BP
('Paket BP 200 Botol', 'BP', '200_botol', 200, 30000000, true),
('Paket BP 40 Botol', 'BP', '40_botol', 40, 6800000, true),
('Paket BP 10 Botol', 'BP', '10_botol', 10, 1800000, true),
('Paket BP 5 Botol', 'BP', '5_botol', 5, 990000, true),
('Paket BP 3 Botol', 'BP', '3_botol', 3, 651000, true),
('BP Satuan', 'BP', 'satuan', 1, 250000, true),

-- Kategori: BRO
('Paket BRO 200 Botol', 'BRO', '200_botol', 200, 30000000, true),
('Paket BRO 40 Botol', 'BRO', '40_botol', 40, 6800000, true),
('Paket BRO 10 Botol', 'BRO', '10_botol', 10, 1800000, true),
('Paket BRO 5 Botol', 'BRO', '5_botol', 5, 990000, true),
('Paket BRO 3 Botol', 'BRO', '3_botol', 3, 651000, true),
('BRO Satuan', 'BRO', 'satuan', 1, 250000, true),

-- Kategori: BRE
('Paket BRE 200 Botol', 'BRE', '200_botol', 200, 30000000, true),
('Paket BRE 40 Botol', 'BRE', '40_botol', 40, 6800000, true),
('Paket BRE 10 Botol', 'BRE', '10_botol', 10, 1800000, true),
('Paket BRE 5 Botol', 'BRE', '5_botol', 5, 990000, true),
('Paket BRE 3 Botol', 'BRE', '3_botol', 3, 651000, true),
('BRE Satuan', 'BRE', 'satuan', 1, 250000, true),

-- Kategori: NORWAY
('Paket NORWAY 200 Botol', 'NORWAY', '200_botol', 200, 30000000, true),
('Paket NORWAY 40 Botol', 'NORWAY', '40_botol', 40, 6800000, true),
('Paket NORWAY 10 Botol', 'NORWAY', '10_botol', 10, 1800000, true),
('Paket NORWAY 5 Botol', 'NORWAY', '5_botol', 5, 990000, true),
('Paket NORWAY 3 Botol', 'NORWAY', '3_botol', 3, 651000, true),
('NORWAY Satuan', 'NORWAY', 'satuan', 1, 250000, true);
