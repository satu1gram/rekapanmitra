# Rekapan Mitra — aplikasi mobile (React Native)

Aplikasi native iOS dan Android untuk mitra, dibangun dengan **Expo SDK 58 (React Native 0.88) + Expo Router + TypeScript**. Aplikasi ini memakai akun dan database Supabase yang sama dengan aplikasi web, jadi data di HP dan di web selalu sama.

## Menjalankan di Mac

Prasyarat: Node 20+. Lalu:

```bash
cd mobile
npm install
```

### Cara 1 — Expo Go (paling cepat, iPhone atau Android asli)

```bash
npx expo start
```

Install **Expo Go** dari App Store / Play Store, lalu scan QR di terminal (iPhone: pakai Kamera; Android: dari dalam Expo Go). HP dan Mac harus di Wi‑Fi yang sama. Semua library aplikasi ini tersedia di Expo Go.

### Cara 2 — iPhone dengan Xcode

Xcode hanya untuk iOS (iPhone/iPad), tidak bisa menjalankan Android.

```bash
npm run ios:native
```

Perintah ini membuat folder `ios/`, meng-compile dengan Xcode, dan membuka iOS Simulator. Untuk iPhone asli: buka `ios/RekapanMitra.xcworkspace` di Xcode, pilih Team (Signing & Capabilities), pilih iPhone yang tersambung, lalu ▶. Folder `ios/` dibuat ulang otomatis dan tidak di-commit.

### Cara 3 — Android dengan Android Studio (di Mac yang sama)

Install Android Studio, buka **SDK Manager** (pasang Android SDK terbaru), lalu buat emulator di **Device Manager** atau sambungkan HP Android dengan **USB debugging** aktif.

```bash
npm run android:native
```

Perintah ini membuat folder `android/`, meng-compile, dan memasang aplikasi ke emulator/HP. Folder `android/` juga dibuat ulang otomatis.

### Cara 4 — file APK Android untuk dibagikan

```bash
npx eas-cli@latest build --platform android --profile preview
```

Hasilnya link unduhan APK yang bisa dipasang langsung di HP Android (perlu akun Expo gratis).

## Pemeriksaan

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (eslint-config-expo)
npm test            # tes logika harga, order, dashboard, tanggal
```

## Struktur

| Folder | Isi |
|---|---|
| `src/app/` | Layar (Expo Router). `(auth)` masuk/daftar/lupa sandi, `onboarding`, `(tabs)` Beranda/Riwayat/Stok/Akun, `order/new`, `order/[id]`, `restok/new`. |
| `src/data/` | Baca/tulis Supabase (order, stok, pelanggan, katalog, profil, keuangan). |
| `src/lib/` | Logika murni: rumus order dan dashboard, tanggal, format rupiah, klien Supabase, penyimpanan sesi terenkripsi. |
| `src/ui/` | Komponen tampilan dan tema. |
| `../src/lib`, `../src/types` | **Dipakai bersama dengan web**: resolver harga katalog, level mitra, pencocokan pelanggan. Diimpor dengan alias `@/…`; kode mobile sendiri memakai `~/…`. |

Metro hanya mengawasi `../src` dan selalu mengambil paket dari `mobile/node_modules` (`metro.config.js`), jadi dependensi web dan mobile tidak tercampur.

## Desain

Gaya super app (pola dari aplikasi ride/kirim, dengan identitas Rekapan Mitra sendiri):
- **Beranda:** kolom cari, kartu omset dengan aksi cepat, grid fitur, dan "Perlu ditindaklanjuti" (order pending/terkirim, stok menipis).
- **Tambah/Ubah order:** satu lembar dengan kartu Pelanggan → Tanggal, produk berfoto (`assets/products`), **Pilih harga** berisi total per level harga pelanggan (`src/lib/priceOptions.ts`), biaya order, bukti transfer, dan tombol kapsul berisi total.
- **Detail order:** layar status (Dicatat → Terkirim → Selesai) dengan satu tombol untuk maju ke tahap berikutnya.
- **Restok:** pola kirim (dari upline → stok kamu) dengan pilihan cepat 5/10/20/40 botol.

Rancangan visualnya ada di kanvas desain (baris "Alternatif: pola UX super app").

## Fitur dan kesetaraan dengan web

| Fitur | Status di aplikasi |
|---|---|
| Masuk, daftar, lupa kata sandi | Ada. Link email dibuka di `https://mitrabp.biz.id` (ganti lewat `EXPO_PUBLIC_WEB_URL`). |
| Pengaturan awal (nama, level, stok awal) | Ada. |
| Beranda: omset, untung kotor/setelah biaya, stok, target, order bulan ini | Ada, rumus sama dengan dashboard web. |
| Tambah dan **ubah** order (pelanggan → produk → periksa, biaya, bukti transfer) | Ada. Saat mengubah, harga tersimpan dipakai sampai produk atau harga pelanggan diganti. |
| Riwayat per hari, cari, detail, status, hapus, bagikan nota, bukti transfer | Ada. Foto dari kamera atau galeri, disimpan di bucket `transfer-proofs` yang sama dengan web. |
| Stok: saldo, catat/ubah/hapus restok dengan bukti/nota | Ada. |
| Pengeluaran & pemasukan (kategori sama dengan web) | Ada. |
| Target bulanan | Ada, tersimpan di `monthly_targets` yang sama. |
| Pelanggan: daftar, cari, urutkan, detail, riwayat order, ubah data, WhatsApp | Ada. |
| Toko online: nama, alamat link, aktif/nonaktif, cara pembayaran, bagikan link | Ada. |
| Asisten AI: tempel chat → draf order/restok untuk diperiksa | Ada. Memakai Edge Function `parse-order`; aplikasi **tidak** mengirim contoh koreksi lama (berisi data pelanggan lain) dan membatasi teks 2.000 karakter. |
| Hapus akun (Akun → Hapus akun) | Ada. Minta ulang kata sandi dan ketik `HAPUS AKUN`, lalu memanggil Edge Function `delete-account`. |
| Panel admin, konsultasi produk AI | Tetap di web (bukan fitur harian mitra). |
| Notifikasi, offline | Belum. |

Perbedaan yang disengaja dibanding web:
- Simpan order memeriksa setiap langkah. Jika rincian produk atau biaya gagal tersimpan, header order dihapus lagi agar tidak ada order setengah jadi.
- Restok membaca saldo stok terbaru dari server sebelum menambah, bukan angka yang sedang tampil di layar.
- Sesi login disimpan terenkripsi: kunci di Keychain/Keystore (`expo-secure-store`), data di AsyncStorage.
- Data dibaca per halaman (1.000 baris) sehingga total tidak terpotong diam-diam.

Yang **sama** dengan web dan belum diperbaiki (butuh RPC di server, lihat `docs/MOBILE_AI_BLUEPRINT.md` Tahap B): order dan stok belum satu transaksi database; penjualan belum mengurangi stok otomatis.

## Build untuk TestFlight / Play Store

Gunakan EAS Build (tidak perlu Xcode untuk build, tapi perlu akun Apple Developer dan Google Play Console):

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios
npx eas-cli@latest submit --platform ios
```

Bundle ID / package: `id.biz.mitrabp.rekapan` (sama dengan rencana Capacitor sebelumnya; hanya satu yang boleh dipakai di store).

### Wajib sebelum rilis ke store

1. **Deploy fungsi hapus akun** (sudah dibuat di `supabase/functions/delete-account`):
   ```bash
   supabase functions deploy delete-account
   ```
   Fungsi ini memakai `verify_jwt = true`, mengambil ID pengguna dari token (bukan dari isi permintaan), menolak akun admin, menghapus foto di bucket `transfer-proofs`, menghapus data di semua tabel milik pengguna (termasuk tabel yang belum `ON DELETE CASCADE`: `order_items`, `order_expenses`, `general_income`, `products`), lalu menghapus akun login.
2. Kebijakan privasi dan formulir App Privacy / Data Safety.
3. Pastikan `https://mitrabp.biz.id/dashboard` dan `/reset-password` ada di Supabase → Authentication → Redirect URLs.
4. Ganti kunci API AI yang pernah bocor di riwayat git, dan amankan RPC `submit_public_order` serta webhook Telegram (lihat `docs/VALIDASI_RENCANA_MOBILE.md` di branch `preview/mobile-ai`). Backend yang sama dipakai aplikasi ini.
5. Uji di iPhone dan HP Android nyata.
