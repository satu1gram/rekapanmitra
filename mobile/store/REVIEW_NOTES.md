# Catatan untuk peninjau (App Review / Play Console → App access)

Aplikasi wajib login, jadi isi akun demo di dua tempat:
- **App Store Connect → App Review Information → Sign-in required**: isi email dan kata sandi akun demo.
- **Play Console → App content → App access → "All or some functionality is restricted"**: tambahkan instruksi dan kredensial yang sama.

## Menyiapkan akun demo
Jalankan di laptopmu (butuh service role key dari Supabase → Project Settings → API; jangan di-commit):

```bash
cd mobile
SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs
```

Skrip mencetak email dan kata sandi acak. Akun sudah terverifikasi, profil dan pengaturan awal selesai, dan berisi 5 pelanggan, 14 order, stok, biaya, target, dan toko contoh. Aman dijalankan ulang: data demo direset, akun lain tidak disentuh. Skrip menolak akun admin.

## Teks untuk kolom catatan peninjau
> Masuk dengan akun demo yang tertera. Aplikasi untuk mitra penjual: Beranda menampilkan omset dan order yang perlu dikerjakan; tab Riwayat berisi daftar order; tombol "+" membuat order baru (pilih produk, harga menyesuaikan jumlah dan level). Tab Stok untuk restok, tab Akun untuk profil dan level. Fitur "Isi dari chat" memakai AI dan butuh internet. Hapus akun: Akun → Hapus akun (jangan dicoba pada akun demo, atau jalankan ulang skrip untuk memulihkannya). Tidak ada pembelian dalam aplikasi dan tidak ada iklan.

## Sebelum submit
- [ ] Skrip demo sudah dijalankan, dan login dicoba di HP asli
- [ ] `https://mitrabp.biz.id/kebijakan-privasi` terbuka tanpa login (deploy web terbaru dulu)
- [ ] Edge function `delete-account` sudah di-deploy (`supabase functions deploy delete-account`)
- [ ] Kunci AI yang pernah bocor sudah diganti
