# Aplikasi Android & iOS

Aplikasi mobile adalah aplikasi web Rekapan Mitra yang sama, dibungkus dengan Capacitor. Satu kode untuk web, Android, dan iPhone; data tetap di Supabase yang sama.

## Prasyarat

- Node 20+ dan Bun (atau npm).
- Android: Android Studio terbaru, Android SDK 36, JDK 21.
- iOS: macOS dengan Xcode 16+ (Swift Package Manager, tanpa CocoaPods).

## Build dan buka proyek native

```bash
bun install
npm run mobile:sync      # build mode mobile ke dist-mobile/ lalu salin ke android/ dan ios/
npm run mobile:android   # buka di Android Studio → Run / Build > Generate Signed Bundle
npm run mobile:ios       # buka di Xcode → pilih Team → Run / Archive
```

Jalankan `npm run mobile:sync` setiap kali kode web berubah sebelum build native. Folder `dist-mobile/`, `android/app/src/main/assets/public` dan `ios/App/App/public` dibentuk ulang otomatis dan tidak di-commit.

Build mobile tidak memakai service worker PWA, sehingga pembaruan aplikasi mengikuti versi yang dirilis di Play Store / App Store.

## Yang sudah disesuaikan untuk native

| Hal | Perilaku |
|---|---|
| Link email (konfirmasi daftar, reset sandi) dan link toko | Memakai `https://mitrabp.biz.id` (atau `VITE_PUBLIC_WEB_URL`), bukan alamat internal WebView. Reset sandi diselesaikan di browser, lalu login kembali di aplikasi. |
| Tombol back Android | Tutup dialog → kembali satu halaman → keluar aplikasi dari Beranda/Login. |
| Status bar / notch | Hanya build mobile: `viewport-fit=cover` + class `native-app` pada `<html>` (plugin di `vite.config.ts`). CSS di `src/index.css` memberi jarak `env(safe-area-inset-*)`, menggeser header `sticky top-0` dan layar penuh `fixed inset-0` ke bawah status bar. iOS `contentInset: 'never'`. Build web tidak berubah. |
| Kamera / galeri iOS | `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` sudah diisi. |
| Export compliance iOS | `ITSAppUsesNonExemptEncryption = false` (hanya HTTPS standar). |

## Konfigurasi Supabase yang perlu dicek

Di Supabase → Authentication → URL Configuration, pastikan `https://mitrabp.biz.id/dashboard` dan `https://mitrabp.biz.id/reset-password` ada di daftar Redirect URLs. Jika domain aplikasi berbeda, set `VITE_PUBLIC_WEB_URL` saat build mobile.

## Sebelum rilis ke store

1. Uji di HP Android dan iPhone nyata: login, tambah order, upload bukti (kamera & galeri), salin link toko, back button, rotasi, keyboard menutupi input.
2. Android: buat keystore upload (simpan di luar repo), naikkan `versionCode` di `android/app/build.gradle` setiap rilis, upload AAB ke Play Console *internal testing*.
3. iOS: atur Team/signing di Xcode, naikkan `CURRENT_PROJECT_VERSION`, upload ke TestFlight.
4. Siapkan privacy policy dan formulir Data Safety / App Privacy (data akun, order, pelanggan, foto bukti, teks yang dikirim ke AI).
5. Apple dapat menolak aplikasi yang hanya berupa website (Guideline 4.2); fitur seperti kamera bukti transfer dan rencana share/notifikasi membantu.

## Belum termasuk

Deep link kembali ke aplikasi setelah klik email, penyimpanan sesi di secure storage, notifikasi push, share dari WhatsApp, dan mode offline. Lihat `docs/VALIDASI_RENCANA_MOBILE.md` di branch `preview/mobile-ai` untuk risiko backend yang juga berlaku bagi aplikasi mobile.
