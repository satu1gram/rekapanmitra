# Screenshot store

Dibuat otomatis dari versi web aplikasi (data contoh fiktif) dengan:

```bash
npx expo export --platform web --output-dir /tmp/rekapan-web
STORE_TAG=ios69 STORE_W=440 STORE_H=956 STORE_DPR=3 node e2e/release.cjs /tmp/rekapan-web store/screenshots/ios-6.9 store
STORE_TAG=android STORE_W=360 STORE_H=800 STORE_DPR=3 node e2e/release.cjs /tmp/rekapan-web store/screenshots/android store
```

- `ios-6.9/`: 1320 × 2868 px (iPhone 6.9", ukuran wajib App Store)
- `android/`: 1080 × 2400 px (ponsel Play Store)

Urutan unggah: Beranda, Riwayat, Catat order, Stok, Keuangan, Pelanggan, Target, Akun.

Catatan: ini render web, bukan simulator, jadi tidak ada status bar dan font sedikit berbeda dari aplikasi native. Apple dan Google menyarankan screenshot dari aplikasi asli; bila ingin hasil final, ambil ulang dari iOS Simulator (Cmd+S) atau emulator Android dengan data dari akun demo.
