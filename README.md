# 🚀 Rekapan Mitra: Solusi Pintar Kelola Pesanan & Stok

**Rekapan Mitra** adalah platform manajemen pesanan dan stok yang dirancang khusus untuk mitra bisnis BP Group. Aplikasi ini membantu Anda mengotomatiskan rekapitulasi harian, memantau profit secara akurat, dan mempercepat input pesanan melalui integrasi Bot Telegram yang cerdas.

---

## Pengembangan Android/iOS & Asisten Mitra

Prototipe mobile lengkap tersedia mulai splash hingga operasional usaha, dengan **54 layar** yang saling terhubung. Order dan restok mendukung **beberapa produk dalam satu aktivitas**, dengan jumlah/modal per SKU, satu total, dan satu nomor transaksi. Lihat [peta fitur, panduan mencoba, dan artefak desain](docs/FULL_MOBILE_PROTOTYPE.md). Entry preview saat ini memakai prototipe ini; data dan koneksinya tetap simulasi.

Desain aktif memakai **Bold Fintech** berdasarkan referensi mobile pilihan pengguna: foto produk, katalog dua kolom, keranjang multiproduk, panel total/CTA, timeline aktivitas, dan navigasi empat tujuan. Lihat [panduan desain preview](https://rekapanmitra-mobile-demo.pages.dev/#/designs) serta [analisis referensi, spesifikasi, dan validasi](docs/BOLD_FINTECH_REFERENCE.md).

Rancangan gabungan MULA Smart Order dan Rekapan Mitra tersedia di [MULA × BP Product Plan](docs/MULA_BP_PRODUCT_PLAN.md). Preview branch menampilkan simulasi order → review → konfirmasi → laporan, pembelian pemasok, stok SKU, dan progres level bulanan. Aturan usulan ini belum diaktifkan pada backend produksi.

Fondasi mobile menggunakan **React + Capacitor** dengan kode bisnis dan backend yang sama. Asisten tersedia di `/asisten` setelah login; contoh tanpa transaksi asli tersedia di `/demo/asisten`.

Lihat [analisis proses bisnis, implementasi awal, dan langkah rilis mobile](docs/MOBILE_AI_BLUEPRINT.md). Jalankan `npm run mobile:sync` untuk membangun aset mobile dan menyinkronkan proyek Android/iOS. Kompilasi native memerlukan Android SDK atau macOS/Xcode; APK/IPA belum dibuat.

Untuk melihat demo pada environment Preview dari repository yang sama, gunakan branch `preview/mobile-ai` dan ikuti [panduan Cloudflare Pages](docs/CLOUDFLARE_PREVIEW.md). Build Cloudflare branch ini menghasilkan demo terisolasi di `dist/`; `npm run build:preview` menghasilkan paket demo lokal di `preview-dist/`.

## 🛠️ Langkah Memulai (Panduan Pengguna)

Ikuti langkah-langkah di bawah ini untuk mulai mengoptimalkan bisnis Anda:

### 1. Pendaftaran & Akses
*   Akses dashboard melalui [mitrabp.biz.id](https://mitrabp.biz.id).
*   Lakukan pendaftaran akun baru menggunakan email aktif.
*   Setelah login, Anda akan langsung diarahkan ke **Dashboard Utama** yang menampilkan ringkasan performa bulanan Anda.

### 2. Setup Produk & Stok
Sebelum memulai transaksi, pastikan data produk Anda sudah siap:
*   Buka menu **Produk**.
*   Tambahkan stok awal untuk setiap produk yang Anda miliki.
*   Sistem secara otomatis akan menghitung sisa stok setiap kali ada pesanan masuk.

### 3. Aktivasi Bot Telegram (Fitur Unggulan)
Input pesanan kini bisa secepat mengetik chat!
*   Cari bot di Telegram: `@RekapanMitraBot` (atau sesuai username bot Anda).
*   Ketik perintah `/daftar [slug-toko-anda]` untuk menghubungkan bot dengan akun dashboard Anda.
*   **Cara Pakai**: Anda cukup mem-forward pesan order dari pelanggan (Nama, No HP, Produk) ke bot, dan bot akan otomatis mendeteksi data tersebut.
*   Konfirmasi pesanan di bot, dan data akan langsung muncul di Dashboard secara *real-time*.

### 4. Manajemen Pesanan & Biaya Tambahan
Di Dashboard, Anda bisa mengelola pesanan lebih lanjut:
*   **Update Status**: Tandai pesanan sebagai *Lunas* atau *Dikirim*.
*   **Biaya Tambahan**: Tambahkan biaya pengiriman (ongkir) atau pengemasan saat membuat/mengedit pesanan untuk mendapatkan perhitungan profit bersih yang akurat.
*   **Tambah Pelanggan Baru**: Anda bisa menambah data pelanggan baru langsung saat membuat pesanan tanpa harus pindah menu.

### 5. Pantau Profit & Rekapitulasi
Tujuan utama aplikasi ini adalah memberi Anda gambaran bisnis yang jernih:
*   Gunakan **Dashboard Bento Grid** untuk melihat total omzet, total profit, dan jumlah pelanggan aktif dalam satu layar.
*   Filter data berdasarkan bulan untuk melihat perkembangan bisnis Anda dari waktu ke waktu.

---

## ✨ Fitur Utama
*   **AI Smart Parsing**: Bot Telegram yang mengerti format chat pesanan Anda.
*   **Atomic Expense Tracking**: Pantau pengeluaran tambahan per pesanan agar profit tetap presisi.
*   **Bento Grid Dashboard**: Tampilan modern, compact, dan responsive (nyaman di HP & Desktop).
*   **Manajemen Mitra & Konsumen**: Pembedaan harga otomatis berdasarkan level (Mitra, Agen, Reseller, atau Konsumen Satuan).

---

## 🆘 Butuh Bantuan?
Jika Anda mengalami kendala teknis atau memiliki pertanyaan seputar penggunaan aplikasi, silakan hubungi tim pengembang atau cek menu **Bantuan** di dalam aplikasi.

---
*Dibuat dengan ❤️ untuk kemajuan Mitra Indonesia.*
