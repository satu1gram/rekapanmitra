# MULA — full mobile prototype

25 Oktober 2026 · UI prototype v4 · React + Capacitor · branch `preview/mobile-ai`.

## Membuka dan mencoba

Proyek demo yang sama: https://rekapanmitra-mobile-demo.pages.dev/ (menunggu deployment commit terbaru). Buka root untuk mulai dari splash. Tautan langsung `/#/home` membuka Beranda dan `/#/screens` membuka peta layar.

Desain aktif **Bold Fintech** mengacu referensi visual pengguna dan diterapkan pada seluruh layar. Halaman `/#/designs` menjelaskan arah yang dipilih. Lihat [analisis referensi, sistem visual, dan bukti pemeriksaan](BOLD_FINTECH_REFERENCE.md). Navigasi bawah terbaru: Beranda, Pesanan, Stok, Uang. Profil ada di avatar; katalog dapat dibuka dari Stok atau beranda. Tab Uang memisahkan pembayaran, tagihan, modal terjual dan laba. Lihat [evidence redesign keuangan](research/MITRA_REDESIGN_EVIDENCE.md).

- Desktop: gunakan daftar layar di kiri bingkai ponsel.
- Ponsel: masuk melalui onboarding/login contoh, lalu **Akun & usaha → Jelajahi seluruh layar**.
- Setiap layar bisa digulir. Navigasi kembali, menu bawah, link detail, form, dan tindakan contoh saling terhubung.
- Muat **Data contoh** atau **Data kosong**, nyalakan **Offline** atau **Gagal baca** dari peta layar. Pergantian data me-reset skenario; bukan mengubah data produksi.
- Data hanya berada di memori sesi browser dan hilang saat reload. Gunakan identitas/gambar sintetis, bukan data pelanggan asli.

## Perjalanan lengkap

**Mulai:** splash otomatis → tiga manfaat utama → login atau daftar → profil usaha dan level → stok awal (sama untuk semua atau per SKU) → toko → beranda. Daftar akun membuat ruang usaha contoh kosong. Login demo membuka data contoh. Kata sandi tidak disimpan; email pemulihan tidak dikirim.

**Pesanan:** pilih tempel/manual/screenshot/share → sumber dan izin contoh → pembeli/tanggal → produk, jumlah, cara jual, biaya dan penanggung → review angka dan kepemilikan pesanan → draf atau konfirmasi → detail. Harga/modal yang belum diketahui memblokir konfirmasi. Pertanyaan dan klaim transfer tidak diubah menjadi order.

**Setelah konfirmasi:** pembayaran sebagian/lunas dicatat setelah diperiksa pengguna; persiapan/pengiriman/selesai dicatat terpisah. Nota pelanggan menampilkan nilai jual serta pembayaran, tanpa modal atau laba. Pembatalan sebelum pengiriman melepas alokasi; retur penuh memerlukan pemeriksaan barang dan pengembalian dana sebelum mengoreksi stok/laporan. Aplikasi tidak mengirim uang atau pesan.

**Restok:** rencana beli → pembelian disepakati → perjalanan → penerimaan barang. Rencana tidak memengaruhi level maupun stok; pembelian dikonfirmasi memengaruhi ekuivalen pada bulan pembelian; stok baru bertambah pada tanggal penerimaan. Koreksi stok fisik memerlukan alasan dan tidak dianggap pembelian.

**Multiproduk:** order dan restok memiliki pemilih beberapa SKU sekaligus. Satu pembeli/pemasok, tanggal, dan aktivitas menyimpan banyak baris produk. Atur jumlah tiap SKU serta modal tiap produk restok; lihat subtotal dan total sebelum satu konfirmasi. Restok menerima seluruh kiriman sekaligus dengan pemeriksaan pengguna; penerimaan sebagian belum tersedia. Contoh langsung: `/#/compose?example=multi` dan `/#/purchase/new?example=multi`.

**Usaha:** laporan penjualan, pembayaran, produk; biaya umum dan pendapatan lain; target omzet; pelanggan; katalog harga; level bulanan; pengaturan toko dan tampilan pelanggan; koneksi WhatsApp/Telegram; profil, privasi, keamanan, anggota, paket, bantuan dan logout.

## Fitur yang benar-benar bisa dicoba

| Modul | Interaksi dalam prototipe |
|---|---|
| Onboarding dan akun | Slide, validasi form, daftar/login contoh, reset kata sandi contoh, setup usaha/stok/toko |
| Beranda | Angka dari transaksi contoh, draf/stock/tagihan, target omzet, pintasan dan pesanan terbaru |
| Order | Cari/filter, sumber, draf, review, konfirmasi, revisi sebelum pengiriman, jejak perubahan |
| Keuangan order | Harga sesuai cara jual, modal snapshot, multi-biaya, payer, estimasi laba, blokir harga/modal belum lengkap |
| Pembayaran | Parsial/lunas, unggah bukti lokal, pemeriksaan pengguna; klaim chat tidak membuat lunas |
| Pemenuhan | Persiapan, kurir/resi contoh, dikirim/selesai; stok fisik dan reservasi berbeda |
| Batal/retur | Konfirmasi terpisah, koreksi satu kali, audit, retur penuh, sisa tagihan batal nol |
| Nota | Tampilan pelanggan tanpa modal/laba, salin dan unduh teks contoh |
| Pelanggan | Cari, tambah, ubah, detail dan riwayat; pilih pelanggan pada order |
| Katalog | Dua belas SKU, cari/filter kelompok, detail harga satuan/paket dan modal per level |
| Stok | Fisik, alokasi, tersedia, perjalanan, detail per SKU, stok awal, koreksi dan alasannya |
| Pembelian | Satu aktivitas multiproduk, modal per SKU, rencana/konfirmasi, tanggal beli/terima, penerimaan seluruh baris satu kali, batal bersama sebelum diterima |
| Level | Bulan WIB, ekuivalen BP/Belgie, proyeksi naik/bertahan/reset bulan berikutnya |
| Laporan | Bulan, confirmed-only, biaya umum/pendapatan lain, pembayaran dan sisa tagihan, produk, rekap unduhan |
| Target penjualan | Ubah target omzet; terpisah dari target pembelian level |
| Toko | Nama/slug/deskripsi/rekening contoh, aktif/nonaktif, katalog pelanggan, keranjang, checkout menjadi draf pemilik |
| Koneksi | Aktif/putus simulasi, cakupan resmi Business 1:1, contoh inbound; tidak mengirim WhatsApp/Telegram |
| Asisten | Pertanyaan dan jawaban skenario usaha/produk; tidak memberikan diagnosis atau klaim medis baru |
| Privasi | Izin contoh, notifikasi, ekspor JSON tanpa gambar bukti, hapus/reset data contoh |
| Keamanan | Preferensi biometrik/kunci contoh, ubah kata sandi contoh, sesi/logout |
| Tim/paket | Tambah/hapus anggota contoh, ilustrasi peran, pilih rencana paket tanpa harga/tagihan |
| Bantuan | FAQ, masukan lokal, peta layar, skenario kosong/offline/gagal baca |

## Peta 54 layar

| No | Kelompok | Layar | Rute hash |
|---|---|---|---|
| 1 | Mulai | Splash screen | `#/` |
| 2 | Mulai | Onboarding manfaat | `#/welcome` |
| 3 | Mulai | Masuk | `#/login` |
| 4 | Mulai | Daftar akun | `#/register` |
| 5 | Mulai | Lupa kata sandi | `#/forgot` |
| 6 | Mulai | Profil & level usaha | `#/setup` |
| 7 | Mulai | Stok awal | `#/setup-stock` |
| 8 | Mulai | Siapkan toko | `#/setup-store` |
| 9 | Mulai | Setup selesai | `#/setup-done` |
| 10 | Harian | Beranda usaha | `#/home` |
| 11 | Harian | Pusat perhatian | `#/notifications` |
| 12 | Harian | Target penjualan | `#/target` |
| 13 | Pesanan | Daftar & pencarian | `#/orders` |
| 14 | Pesanan | Detail pesanan | `#/orders/ORD-1031` |
| 15 | Pesanan | Catat pembayaran | `#/orders/ORD-1031/payment` |
| 16 | Pesanan | Nota pesanan | `#/orders/ORD-1031/receipt` |
| 17 | Pesanan | Retur penuh | `#/orders/ORD-1029/return` |
| 18 | Pesanan | Order tersimpan | `#/order-success/ORD-1031` |
| 19 | Pesanan | Pilih cara mencatat | `#/add` |
| 20 | Pesanan | Tempel chat | `#/capture/paste` |
| 21 | Pesanan | Baca screenshot | `#/capture/image` |
| 22 | Pesanan | Terima dari Share | `#/capture/share` |
| 23 | Pesanan | Form & review order | `#/compose` |
| 24 | Usaha | Uang, tagihan & laba | `#/reports` |
| 25 | Usaha | Biaya umum | `#/expenses` |
| 26 | Usaha | Pendapatan lain | `#/income` |
| 27 | Usaha | Stok per produk | `#/stock` |
| 28 | Usaha | Detail stok | `#/stock/GREEN` |
| 29 | Usaha | Koreksi stok | `#/stock/GREEN/adjust` |
| 30 | Usaha | Pembelian pemasok | `#/purchases` |
| 31 | Usaha | Buat restok | `#/purchase/new` |
| 32 | Usaha | Progres level bulanan | `#/level` |
| 33 | Usaha | Penerimaan pembelian | `#/purchases/PO-203` |
| 34 | Pelanggan & produk | Pelanggan | `#/customers` |
| 35 | Pelanggan & produk | Profil pelanggan | `#/customer/customer-3` |
| 36 | Pelanggan & produk | Tambah pelanggan | `#/customer/new` |
| 37 | Pelanggan & produk | Katalog 12 produk | `#/catalog` |
| 38 | Pelanggan & produk | Produk & harga | `#/catalog/GREEN` |
| 39 | Pelanggan & produk | Asisten informasi | `#/advisor` |
| 40 | Akun & toko | Pengaturan | `#/settings` |
| 41 | Akun & toko | Profil usaha | `#/profile` |
| 42 | Akun & toko | Pengaturan toko | `#/shop` |
| 43 | Akun & toko | Tampilan toko pelanggan | `#/storefront` |
| 44 | Akun & toko | Sumber & koneksi | `#/connections` |
| 45 | Akun & toko | WhatsApp Business | `#/connections/whatsapp` |
| 46 | Akun & toko | Bot Telegram | `#/connections/telegram` |
| 47 | Akun & toko | Keamanan akun | `#/security` |
| 48 | Akun & toko | Privasi & izin AI | `#/privacy` |
| 49 | Akun & toko | Anggota & peran | `#/team` |
| 50 | Akun & toko | Paket penggunaan | `#/plan` |
| 51 | Akun & toko | Bantuan | `#/help` |
| 52 | Akun & toko | Peta seluruh layar | `#/screens` |
| 53 | Akun & toko | Keluar akun | `#/logout` |
| 54 | Arah desain | Panduan Bold Fintech | `#/designs` |

## Status dan batas implementasi

Prototipe ini memperagakan antarmuka pengguna mitra, bukan panel admin platform. Harga menggunakan aturan usulan MULA PRD v3.0; katalog/transaksi server produksi tidak diubah. Kenaikan level masih proyeksi; harga SE dan modal Belgie SAP/SE tetap belum tersedia.

Belum merupakan autentikasi nyata, role enforcement server, AI/OCR live, konektor WhatsApp/Telegram, Share Extension, biometrik perangkat, push notification, rekonsiliasi bank, transfer dana, atau offline storage yang tahan restart. Retur sebagian, akuntansi formal, SaaS billing, dan pengiriman email tidak diaktifkan. Tiap layar terkait menyebut bahwa kemampuannya masih simulasi.

Semua form dan transaksi contoh mengubah state lokal yang dipakai lintas layar. Build menolak modul Supabase/Auth dan referensi endpoint produksi. CSP tetap melarang koneksi eksternal, sehingga melihat mockup tidak menggunakan kredensial atau database produksi.

## Menjalankan ulang

```bash
npm run build:cloudflare-preview
npm run test:prototype
npm run test:prototype:multi
npm test
node --test scripts/verify-preview-output.test.mjs
```

`test:prototype` membuat server lokal sementara sendiri, menjalankan Chromium, memeriksa layar dan perjalanan pengguna, lalu menyimpan screenshot serta manifest ke `/workspace/artifacts/mula-mobile/`. Set `PROTOTYPE_CHROMIUM` bila executable Chromium berada di lokasi lain; di mesin ini `/usr/bin/chromium` tersedia. `PROTOTYPE_ARTIFACTS` mengubah folder output.

Untuk menyalin mockup ke proyek native yang sudah ada:

```bash
npm run mobile:prototype:sync
npm run mobile:android  # membutuhkan Android Studio/SDK
npm run mobile:ios     # membutuhkan macOS/Xcode
```

Ini menyiapkan aset prototipe dalam native shell; bukan bukti APK/IPA sudah dikompilasi, ditandatangani, atau diuji pada perangkat nyata. `mobile:sync` tetap digunakan untuk build aplikasi web utama, bukan mockup baru ini.

## Artefak review

- Prototipe interaktif di branch preview; deployment menggunakan `npm run build:cloudflare-preview`, output `dist`, root repository.
- PDF kumpulan layar: `/workspace/artifacts/MULA-Mobile-Prototype.pdf`.
- Hasil redesign keuangan terbaru, board sebelum/sesudah dan evidence: `/workspace/artifacts/MULA-Finance-Redesign.pdf` dan `.png`; tangkapan terfokus di `/workspace/artifacts/mula-finance-usability/`.
- Board/PDF desain terpilih: `/workspace/artifacts/MULA-Bold-Fintech-Reference.png` dan `.pdf`. Perbandingan A/B/C sebelumnya merupakan arsip eksplorasi.
- Gambar per layar dan manifest: `/workspace/artifacts/mula-mobile/`.
- PDF menangkap viewport ponsel; form panjang dan bagian di bawah lipatan dapat ditelusuri penuh pada prototipe interaktif.
- Rencana produk/aturan konflik tetap ada di `docs/MULA_BP_PRODUCT_PLAN.md`.

## Bukti pemeriksaan

- **93 tes aplikasi lulus** pada 11 file, termasuk konsistensi stok fisik/alokasi, pembelian multiproduk, barang dalam perjalanan, stok awal per SKU, pembatalan/retur, serta snapshot historis.
- **4 tes guard output build lulus**; preview tidak memuat source TSX mentah, module Auth/Supabase, atau endpoint produksi.
- Browser Chromium berhasil membuka **54 layar terpetakan** pada viewport 390 × 844 dan merekam **67 tampilan**, termasuk variasi onboarding, review biaya, checkout, recovery, offline, serta modal belum lengkap.
- Uji browser tambahan berhasil mencatat satu restok tiga SKU hingga diterima, pembatalan seluruh pembelian, satu order campuran beserta biaya satu kali/nota/alokasi, favorit, pencarian, checkout, transfer jumlah dari katalog serta desain Bold sebagai default; merekam 14 tampilan terfokus dan memeriksa layout serta panel aksi pada 360/390/430 piksel.
- Alur registrasi/setup, capture/review/konfirmasi, pembayaran sebagian, pengiriman/retur penuh, rencana beli/penerimaan, koreksi stok, pelanggan, biaya/pendapatan lain, toko pelanggan, anggota, keamanan, gambar lokal, ekspor, dan reset sandi contoh berhasil dieksekusi.
- Tidak ada page error atau request eksternal. Pemeriksaan layout tambahan pada katalog 360 dan 430 piksel lulus.
- ESLint kode prototipe lulus tanpa error/warning. Type-check seluruh aplikasi masih gagal pada kode lama yang sudah ada; tidak ada error baru pada direktori prototipe.
- `npm run mobile:prototype:sync` berhasil menyalin build ke Android dan iOS. Aset keduanya tidak memakai service worker PWA. Belum dikompilasi menjadi APK/IPA atau diuji di perangkat native.
