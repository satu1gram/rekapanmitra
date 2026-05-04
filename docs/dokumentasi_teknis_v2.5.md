# 📋 Dokumentasi Teknis — Rekapan Mitra BP

> **Sistem Manajemen Bisnis Digital untuk Mitra & Konsumen**  
> Versi 2.5 · Terakhir diperbarui: 4 Mei 2026

---

## Apa Itu Rekapan Mitra BP?

**Rekapan Mitra BP** adalah aplikasi web manajemen bisnis yang dirancang khusus untuk mitra dan pengelola usaha kecil. Sistem ini membantu mencatat pesanan, memantau stok produk, mengelola data pelanggan, dan menghitung keuntungan secara otomatis — semua dalam satu platform yang dapat diakses dari smartphone maupun komputer.

Aplikasi ini dapat dipasang di perangkat seperti aplikasi biasa (PWA), bekerja secara offline untuk fitur tertentu, dan terus tersinkronisasi secara *real-time* dengan server pusat.

---

## 🚀 Fitur Utama

### 1. 📊 Dashboard Bento Grid (Terbaru!)
- **Desain Modern High-Density** — Menampilkan ringkasan omzet, profit, dan jumlah order dalam satu layar tanpa scroll.
- **Ringkasan Pendapatan** — Menampilkan total penjualan harian, mingguan, dan bulanan secara otomatis.
- **Target Bulanan** — Atur target omzet dan pantau pencapaian secara real-time.
- **Format Mata Uang Standar** — Menggunakan angka penuh dengan pemisah titik (contoh: `Rp 27.800.000`) untuk konsistensi.
- **Pertumbuhan Pelanggan** — Grafik batang jumlah pelanggan baru per bulan dengan filter tahun dan segmen.

---

### 2. 🤖 Integrasi Bot Telegram V2 (Smart Parser)
- **AI Smart Parsing** — Bot mengerti input teks bebas dari WhatsApp/Telegram untuk membuat order otomatis.
- **Deteksi Otomatis** — Mengenali nama pelanggan, produk, kuantitas, tanggal, dan biaya tambahan (ongkir).
- **Konfirmasi Interaktif** — Pengguna mengonfirmasi data yang dideteksi sebelum disimpan ke database.
- **Sinkronisasi Real-time** — Order yang dibuat di bot langsung muncul di Dashboard web.

---

### 3. 🛒 Manajemen Order & Biaya Tambahan
- **Atomic Expense Tracking** — Tambahkan biaya tambahan (ongkir, packing) per pesanan untuk perhitungan profit bersih yang akurat.
- **Unlimited Order** — Input jumlah pesanan kini tidak lagi dibatasi oleh stok sistem di UI.
- **Harga Otomatis Berdasarkan Kuantitas** — Harga menyesuaikan secara otomatis sesuai total jumlah pesanan (tier pricing).
- **Inline Customer Management** — Tambah atau edit pelanggan langsung dari form order.

---

### 4. 👥 Manajemen Pelanggan
- **Data Pelanggan Lengkap** — Simpan nama, nomor WA, alamat, provinsi, dan kota pelanggan.
- **Segmentasi Pelanggan** — Bagi pelanggan menjadi **Mitra** (reseller) dan **Konsumen** (pengguna akhir).
- **Level Mitra Kustom** — Atur level mitra dengan harga modal yang berbeda-beda.

---

### 5. 📦 Manajemen Stok
- **Catat Stok Masuk** — Input stok baru dengan tanggal dan jumlah.
- **Pantau Sisa Stok** — Status stok produk secara real-time.
- **Riwayat Perubahan Stok** — Log lengkap setiap pergerakan stok.

---

### 6. 🏪 Halaman Toko Publik (`/toko/:slug`)
- **Tampilan Premium** — Katalog produk profesional dengan foto berkualitas tinggi.
- **Tanpa Login** — Pelanggan dapat memesan langsung melalui link toko.
- **Harga Dinamis** — Harga otomatis berubah sesuai total kuantitas yang dipilih.
- **Premium Toast Notification** — Notifikasi menggunakan sistem Sonner dengan desain glassmorphism.

---

### 7. ⚙️ Pengaturan Toko
- **Profil Toko** — Atur nama toko, deskripsi, dan logo.
- **Slug URL Toko** — Buat alamat toko publik yang unik (mitrabp.biz.id/toko/slug).
- **Informasi Pembayaran** — Simpan nomor rekening/e-wallet untuk ditampilkan ke pelanggan.

---

## 🛠️ Teknologi yang Digunakan

### Frontend (Tampilan & Logika Aplikasi)

| Teknologi | Versi | Fungsi |
|---|---|---|
| **React** | 18.3 | Library utama UI |
| **TypeScript** | 5.8 | Pengetikan statis untuk keamanan kode |
| **Vite** | 6.4 | Build tool & dev server |
| **Tailwind CSS** | 3.4 | Framework styling utility-first |
| **TanStack React Query** | 5.x | Manajemen data server & caching |
| **Lucide React** | 0.462 | Library ikon SVG |
| **Recharts** | 2.15 | Visualisasi data & grafik |
| **Sonner** | 1.7 | Notifikasi toast premium |

---

### Backend & Database

| Teknologi | Fungsi |
|---|---|
| **Supabase** | Platform Backend-as-a-Service |
| **PostgreSQL** | Database relasional dengan Row Level Security (RLS) |
| **Edge Functions** | Logika server-side untuk Bot Telegram |
| **Supabase Auth** | Autentikasi & Manajemen Sesi |

---

## 🗄️ Struktur Database (Tabel Utama)

| Tabel | Keterangan |
|---|---|
| `profiles` | Profil pengguna & level mitra |
| `products` | Data produk & tier harga |
| `customers` | Data pelanggan & wilayah |
| `orders` | Transaksi pesanan utama |
| `order_items` | Detail produk per pesanan |
| `order_expenses` | Biaya tambahan per pesanan (ongkir, dll) |
| `telegram_connections` | Mapping Chat ID Telegram ke User ID |
| `telegram_sessions` | Status sesi percakapan bot |
| `stock_entries` | Log penambahan/pengurangan stok |
| `store_settings` | Konfigurasi toko publik & slug |

---

## 🔒 Keamanan & Deployment

- **Row Level Security (RLS)**: Isolasi data antar pengguna di level database.
- **JWT Auth**: Sesi aman yang dikelola oleh Supabase Auth.
- **Netlify Hosting**: Deployment otomatis dari branch `main` dengan SSL/TLS.
- **PWA**: Aplikasi dapat diinstal dan berjalan secara *standalone*.

---

*Dibuat dengan ❤️ untuk kemajuan Mitra Indonesia.*
