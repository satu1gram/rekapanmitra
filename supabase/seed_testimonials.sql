-- Seed Testimoni Data untuk Testing
-- Insert beberapa testimoni sample jika tabel kosong

INSERT INTO public.telegram_messages (
  id, 
  content, 
  sender, 
  created_at, 
  is_testimoni, 
  status, 
  foto_url, 
  nama_pengirim, 
  kota, 
  produk, 
  bintang, 
  is_featured
) VALUES 
-- Testimoni 1 - British Propolis
(
  'test_001', 
  'British Propolis benar-benar membantu imun tubuh saya. Setelah rutin konsumsi selama 1 bulan, badan terasa lebih fit dan jarang sakit. Terima kasih BP Group!', 
  'Siti Nurhaliza', 
  '2024-01-15 10:30:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_100.jpg', 
  'Siti Nurhaliza', 
  'Jakarta', 
  'British Propolis', 
  5, 
  true
),
-- Testimoni 2 - Brassic Pro
(
  'test_002', 
  'Susah tidur saya sudah berbulan-bulan, setelah pakai Brassic Pro sekarang bisa tidur nyenyak. Bangun pagi terasa lebih segar dan bertenaga.', 
  'Ahmad Fadli', 
  '2024-01-20 14:15:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_101.jpg', 
  'Ahmad Fadli', 
  'Surabaya', 
  'Brassic Pro', 
  5, 
  true
),
-- Testimoni 3 - Nyeri Sendi
(
  'test_003', 
  'Nyeri sendi saya berkurang drastis setelah konsumsi produk BP Group. Sebelumnya lutut saya sering sakit apalagi kalau hujan, sekarang sudah jauh lebih baik.', 
  'Dewi Lestari', 
  '2024-01-25 09:45:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1011.jpg', 
  'Dewi Lestari', 
  'Bandung', 
  'British Propolis', 
  5, 
  true
),
-- Testimoni 4 - Belgie Serum
(
  'test_004', 
  'Kulit saya lebih cerah dan flek hitam memudar setelah pakai Belgie Serum. Hasilnya terlihat dalam 2 minggu! Wajah jadi lebih percaya diri.', 
  'Rina Permata', 
  '2024-02-01 16:20:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1012.jpg', 
  'Rina Permata', 
  'Yogyakarta', 
  'Belgie Serum', 
  5, 
  true
),
-- Testimoni 5 - Steffi
(
  'test_005', 
  'Gula darah saya lebih stabil setelah rutin minum Steffi. Dokter juga kaget dengan perubahannya. Produk yang luar biasa untuk kesehatan!', 
  'Budi Santoso', 
  '2024-02-05 11:30:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1000.jpg', 
  'Budi Santoso', 
  'Medan', 
  'Steffi', 
  5, 
  true
),
-- Testimoni 6 - Brassic Eye
(
  'test_006', 
  'Mata saya tidak cepat lelah lagi setelah pakai Brassic Eye. Sebagai pekerja kantoran yang sering di depan laptop, ini sangat membantu produktivitas saya.', 
  'Andi Wijaya', 
  '2024-02-10 13:45:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1001.jpg', 
  'Andi Wijaya', 
  'Semarang', 
  'Brassic Eye', 
  5, 
  false
),
-- Testimoni 7 - Nafsu Makan Anak
(
  'test_007', 
  'Anak saya jadi lahap makan setelah diberi produk BP Group. Nutrisinya bagus dan anak suka rasanya. Badannya juga jadi lebih kuat.', 
  'Maya Sari', 
  '2024-02-15 10:00:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1003.jpg', 
  'Maya Sari', 
  'Palembang', 
  'British Propolis', 
  5, 
  false
),
-- Testimoni 8 - Stamina
(
  'test_008', 
  'Stamina saya meningkat drastis. Seharian kerja keras masih tetap fit. British Propolis memang juara untuk kesehatan tubuh!', 
  'Rudi Hermawan', 
  '2024-02-20 15:30:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1005.jpg', 
  'Rudi Hermawan', 
  'Makassar', 
  'British Propolis', 
  5, 
  false
),
-- Testimoni 9 - Fokus dan Konsentrasi
(
  'test_009', 
  'Fokus dan konsentrasi saya lebih tajam. Sangat cocok untuk yang sering kerja dengan otak seperti saya. Tidak mudah lupa lagi.', 
  'Intan Permata', 
  '2024-02-25 12:15:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1007.jpg', 
  'Intan Permata', 
  'Denpasar', 
  'Brassic Pro', 
  5, 
  false
),
-- Testimoni 10 - Rambut Rontok
(
  'test_010', 
  'Rambut rontok saya berkurang signifikan. Sekarang rambut terasa lebih kuat dan sehat. Sudah 3 bulan pakai produk ini.', 
  'Fitri Handayani', 
  '2024-03-01 09:00:00+00', 
  true, 
  'approved', 
  '/downloads/testimoni/testi_1009.jpg', 
  'Fitri Handayani', 
  'Balikpapan', 
  'British Propolis', 
  5, 
  false
)
ON CONFLICT (id) DO NOTHING;
