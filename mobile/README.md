# Rekapan Mitra — aplikasi mobile (React Native)

Aplikasi native iOS dan Android untuk mitra, dibangun dengan **Expo SDK 58 (React Native 0.88) + Expo Router + TypeScript**. Aplikasi ini memakai akun dan database Supabase yang sama dengan aplikasi web, jadi data di HP dan di web selalu sama.

## Menjalankan di Mac

Prasyarat: Node 20+, dan untuk simulator: Xcode (iOS) atau Android Studio (Android).

```bash
cd mobile
npm install
npx expo start
```

Lalu pilih salah satu:

- **iPhone asli, paling cepat:** install **Expo Go** dari App Store, lalu scan QR di terminal dengan kamera iPhone. Mac dan iPhone harus di Wi‑Fi yang sama.
- **iOS Simulator:** tekan `i` di terminal (Xcode harus sudah terpasang).
- **Android:** tekan `a` (emulator Android Studio), atau scan QR dengan aplikasi Expo Go di HP Android.

Semua library yang dipakai sudah tersedia di Expo Go, jadi belum perlu build native untuk mencoba.

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

1. **Hapus akun dari dalam aplikasi.** Apple mewajibkan ini untuk aplikasi yang bisa membuat akun. Perlu endpoint/Edge Function penghapusan akun di backend; belum ada.
2. Kebijakan privasi dan formulir App Privacy / Data Safety.
3. Pastikan `https://mitrabp.biz.id/dashboard` dan `/reset-password` ada di Supabase → Authentication → Redirect URLs.
4. Ganti kunci API AI yang pernah bocor di riwayat git, dan amankan RPC `submit_public_order` serta webhook Telegram (lihat `docs/VALIDASI_RENCANA_MOBILE.md` di branch `preview/mobile-ai`). Backend yang sama dipakai aplikasi ini.
5. Uji di iPhone dan HP Android nyata.
