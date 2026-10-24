# Cloudflare Pages: Git yang sama, environment berbeda

Repository: `satu1gram/rekapanmitra`. Branch produksi tetap `main`; perubahan mobile/asisten ditempatkan pada **`preview/mobile-ai`**. Gunakan environment Preview pada proyek Pages yang sudah terhubung ke repository ini.

## Pengaturan pada proyek Pages yang sudah ada

1. Pertahankan **Production branch** yang digunakan saat ini. Jangan menggantinya untuk demo.
2. Pada pengaturan branch deployment, izinkan **Preview deployments** untuk `preview/mobile-ai`. Jika semua branch nonproduksi sudah diizinkan, pengaturan ini tidak perlu diubah.
3. Build command: `npm run build` (atau `bun run build` bila itu command yang digunakan sekarang). Output directory: `dist`. Build preview dipilih otomatis melalui variabel bawaan Cloudflare `CF_PAGES_BRANCH`.
4. Pada environment **Preview**, gunakan Node 24.19.0 dan Bun 1.3.14 bila runtime perlu diatur dari dashboard. Node juga dipin melalui `.node-version`. Jangan mengubah konfigurasi environment Production untuk demo.
5. Deploy/retry branch preview. Buka URL dari deployment dengan environment **Preview**, bukan domain produksi.

URL harus diambil dari hasil deployment Cloudflare; adanya branch di Git belum membuktikan deployment berhasil. Tidak perlu mengubah DNS/custom domain, menambahkan key Supabase, atau menjalankan migrasi database.

## Pemisahan build

| Konteks | Hasil `npm run build` |
|---|---|
| `CF_PAGES_BRANCH=preview/mobile-ai` | Demo terisolasi di `dist/` |
| `main`, branch lain, atau variabel tidak tersedia | Aplikasi web normal di `dist/` |
| `npm run build:preview` | Demo lokal di `preview-dist/` |

Paket demo hanya memuat entry `preview/main.tsx` dan tampilan Asisten Mitra. Build menolak modul Auth/Supabase. Tidak ada login, backend produksi, API AI, atau service worker. CSP memblokir koneksi jaringan dan submit form. Data sintetis; tombol pencatatan transaksi dinonaktifkan. Pilihan periode, perhitungan restok, dan salin rekap dapat dicoba.

Ini preview tampilan dan perhitungan. Pengujian model AI/transaksi asli memerlukan backend staging dengan akun serta data uji terpisah.

## Verifikasi lokal

```bash
cd /workspace/rekapanmitra
CF_PAGES_BRANCH=preview/mobile-ai npm run build
```

Periksa `dist/index.html`, `_headers`, dan `_redirects`; tidak ada endpoint/key Supabase produksi atau service worker. Jalankan `npm run build` tanpa variabel tersebut untuk membentuk kembali aplikasi web biasa.

## Batas akses sesi ini

API Cloudflare belum dapat diakses dari lingkungan ini (CONNECT 403), sehingga konfigurasi branch Preview dan URL deployment perlu dilihat di dashboard Cloudflare. Jangan mengirim token akun melalui chat. Push branch tidak mengubah `main`, konfigurasi Cloudflare, DNS, atau database produksi.
