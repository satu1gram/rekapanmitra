# Copy mobile Rekapan Mitra

Prototype v5, branch `preview/mobile-ai`. Menyesuaikan permintaan pengguna agar istilah tetap familiar dan layar ponsel lebih ringkas. Warna Bold Fintech dipertahankan.

## Acuan dari aplikasi saat ini

| Konteks | Copy yang dipakai | Sumber aplikasi |
|---|---|---|
| Navigasi | Beranda, Riwayat, Stok, Akun | `src/components/navigation/NavItems.ts` |
| Input | Tambah Order, Input Manual | `src/components/bot/ChoiceSheet.tsx` |
| Order | Nama Pelanggan, Tanggal Transaksi, Cek Pesanan | `src/components/orders/OrderForm.tsx` |
| Hasil order | Order Berhasil Disimpan! | `src/components/orders/OrderResultPage.tsx` |
| Restok | Restok Barang, Restok dari Distributor, Tanggal Restok, Harga Beli, Tambah ke Stok | `src/components/stock/StockPage.tsx` |
| Rekap | Rekap Bulanan, Omset, Keuntungan Bersih, Pengeluaran, Pemasukan Lain | `src/components/dashboard/MonthlySummary.tsx` |
| Modal | Harga Modal | `src/components/settings/SettingsPage.tsx` |
| Pengeluaran | Pengeluaran Tambahan | `src/components/orders/OrderForm.tsx` |
| Masuk/daftar | Selamat Datang Kembali, Masuk ke Akun, Daftar Sekarang | `src/components/auth/AuthPage.tsx` |

Istilah baru yang masih diperlukan: Dibayar, Belum Lunas, Pembayaran Baru, Sisa Tagihan, Alokasi, dan Ekuivalen. Fitur pembayaran dan reservasi pada prototipe memerlukan pembedaan yang belum seluruhnya tersedia di aplikasi lama. Istilah singkat tidak mengubah arti atau perhitungannya.

## Aturan penulisan

- Judul menyebut tugas atau menu; tombol utama umumnya dua atau tiga kata.
- Label tetap terlihat saat diisi. Placeholder hanya contoh, bukan pengganti label.
- Utamakan angka dan tindakan. Hindari tagline atau paragraf berulang di halaman operasional.
- Info perhitungan, sumber harga, dan cakupan demo ditutup secara default dan bisa dibuka. Jangan menyembunyikan kesalahan atau alasan tombol tidak aktif.
- Modal pada rekap hanya untuk produk terjual, memakai harga saat order dicatat. Keuntungan adalah estimasi setelah pengeluaran dan pemasukan lain. Definisi ada di Info Perhitungan.
- Pembayaran mengikuti bulan order, bukan tanggal transfer. Informasi ini tetap tersedia di rekap; laporan tidak disebut saldo rekening.
- Simpan Pembayaran selalu dapat dijangkau di bagian bawah. Nominal adalah pembayaran baru, bukan total kumulatif. Sisa Tagihan dan Sisa Setelah Bayar tetap terlihat.
- Bukti Pembayaran opsional dibuka saat diperlukan. Nominal yang belum diketahui tetap kosong dan memblokir konfirmasi.
- Satu penanda “PROTOTIPE · DATA CONTOH” selalu terlihat. Koneksi, OCR, autentikasi, dan keamanan yang masih simulasi tetap dijelaskan pada layar terkait.

## Perubahan layar

- Beranda: empat kartu Dibayar/Belum Lunas/Modal/Keuntungan, tombol Tambah Order/Pembayaran, Tempel Chat/Restok Barang, tugas Draf/Belum Lunas. Keterangan berulang pada kartu dihapus.
- Riwayat: pencarian dan filter tetap ada; label status singkat.
- Order: Pelanggan → Produk → Konfirmasi; kontak opsional dan Chat Asli dapat dibuka. Sumber dengan peringatan tetap terbuka agar diperiksa.
- Restok: distributor, tanggal, produk, jumlah dan Harga Beli; satu Simpan Restok untuk semua produk. Rencana dan penerimaan barang tetap terpisah.
- Pembayaran: Total Pembayaran/Dibayar/Sisa Tagihan, nominal baru, Sisa Setelah Bayar, metode, bukti opsional, pemeriksaan uang diterima.
- Akun: menu satu baris; Rekap Bulanan, Pelanggan, Pengeluaran, Pemasukan, dan Asisten AI tetap dapat ditemukan. Peta prototipe di Bantuan.

## Pemeriksaan

Gunakan `npm run build:cloudflare-preview`, `npm run test:prototype`, `npm run test:prototype:multi`, dan `npm run test:prototype:finance` untuk memeriksa build terisolasi dan alur interaktif. Skenario yang sudah ada diperbarui pada selector label; angka, status, kuantitas, dan invariant bisnis tetap diperiksa.

Hasil: 93 tes unit/integrasi, 4 guard build, dan perjalanan browser 54 rute/67 tampilan lulus. Alur multiproduk dan finansial lulus; build preview dan sinkronisasi aset Capacitor berhasil. ESLint pada file yang berubah bersih. Typecheck proyek keseluruhan masih memiliki error di kode lama di luar prototipe.

Pemeriksaan visual mencakup lebar 360, 390, dan 430 px, serta 54 rute layar. Screenshot review ada di `/workspace/artifacts/rekapan-mobile-copy/`. Artefak sebelum/sesudah hanya membandingkan tampilan prototipe sintetis, bukan hasil uji peserta manusia.

Board review: `/workspace/artifacts/Rekapan-Mitra-Mobile.png`; PDF dua halaman: `/workspace/artifacts/Rekapan-Mitra-Mobile.pdf`.

Perubahan terbatas pada prototipe, dokumentasi, dan selector pengujian. Tidak ada perubahan backend, pricebook produksi, migrasi, atau data pelanggan asli.
