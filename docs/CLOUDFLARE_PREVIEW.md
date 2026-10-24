# Cloudflare Pages: Git yang sama, environment berbeda

Repository: `satu1gram/rekapanmitra`. Branch produksi tetap `main`; perubahan mobile/asisten ditempatkan pada **`preview/mobile-ai`**. Gunakan environment Preview pada proyek Pages yang sudah terhubung ke repository ini.

## Pengaturan pada proyek Pages yang sudah ada

1. Pertahankan **Production branch** yang digunakan saat ini. Jangan menggantinya untuk demo.
2. Pada pengaturan branch deployment, izinkan **Preview deployments** untuk `preview/mobile-ai`. Jika semua branch nonproduksi sudah diizinkan, pengaturan ini tidak perlu diubah.
3. Untuk proyek demo `rekapanmitra-mobile-demo`, gunakan build command **`npm run build:cloudflare-preview`**, output directory **`dist`**, dan root directory **kosong** (root repository). Perintah ini selalu membuat demo, tanpa bergantung pada deteksi nama branch. `wrangler.jsonc` juga menetapkan output Pages ke `./dist`.
4. Pada environment **Preview**, gunakan Node 24.19.0 dan Bun 1.3.14 bila runtime perlu diatur dari dashboard. Node juga dipin melalui `.node-version`. Jangan mengubah konfigurasi environment Production untuk demo.
5. Deploy/retry branch preview. Buka URL dari deployment dengan environment **Preview**, bukan domain produksi.

URL harus diambil dari hasil deployment Cloudflare; adanya branch di Git belum membuktikan deployment berhasil. Tidak perlu mengubah DNS/custom domain, menambahkan key Supabase, atau menjalankan migrasi database.

## Pemisahan build

| Konteks | Hasil `npm run build` |
|---|---|
| `CF_PAGES_BRANCH=preview/mobile-ai` | Demo terisolasi di `dist/` |
| `main`, branch lain, atau variabel tidak tersedia | Aplikasi web normal di `dist/` |
| `npm run build:preview` | Demo lokal di `preview-dist/` |

Paket demo hanya memuat entry `preview/main.tsx` dan prototipe MULA × Rekapan Mitra. Build menolak modul Auth/Supabase. Tidak ada login, backend produksi, API AI, atau service worker. CSP memblokir koneksi jaringan dan submit form. Data sintetis; tombol draf/konfirmasi/pembatalan/penerimaan hanya mengubah state memori sesi browser dan hilang saat reload. Lihat [rancangan gabungan dan cakupan prototipe](MULA_BP_PRODUCT_PLAN.md).

Ini preview tampilan dan perhitungan. Pengujian model AI/transaksi asli memerlukan backend staging dengan akun serta data uji terpisah.

## Verifikasi lokal

```bash
cd /workspace/rekapanmitra
CF_PAGES_BRANCH=preview/mobile-ai npm run build
```

Periksa `dist/index.html`, `_headers`, dan `_redirects`; tidak ada endpoint/key Supabase produksi atau service worker. Jalankan `npm run build` tanpa variabel tersebut untuk membentuk kembali aplikasi web biasa.

## Perbaikan white screen / MIME `main.tsx`

`preview/index.html` adalah input Vite, bukan file yang boleh dipublikasikan langsung. Jika browser meminta `main.tsx` dan mendapat MIME `application/octet-stream`, folder source sedang disajikan tanpa kompilasi.

Deploy **hasil build `dist/`**, bukan folder `preview/` atau root repository. HTML hasil build harus meminta `/assets/index-....js`, bukan `main.tsx`. Jangan mengubah MIME `.tsx` menjadi JavaScript: JSX dan import source tetap memerlukan kompilasi Vite.

Sesudah menyimpan pengaturan di atas, retry deployment branch `preview/mobile-ai` menggunakan commit perbaikan terbaru. Log harus memuat `Standalone preview ready in dist/`. Konfigurasi `wrangler.jsonc` bernama `rekapanmitra-mobile-demo` khusus proyek demo yang diberikan pengguna; sesuaikan/hapus konfigurasi proyek ini sebelum kelak menggabungkan branch ke konfigurasi proyek produksi lain.

Build memiliki pemeriksaan yang menolak referensi TSX mentah, aset JavaScript yang hilang, source files yang terpublikasi, atau alamat backend produksi. Jalankan regression test dengan `node --test scripts/verify-preview-output.test.mjs`.

## Batas akses sesi ini

API Cloudflare belum dapat diakses dari lingkungan ini (CONNECT 403), sehingga konfigurasi branch Preview dan URL deployment perlu dilihat di dashboard Cloudflare. Jangan mengirim token akun melalui chat. Push branch tidak mengubah `main`, konfigurasi Cloudflare, DNS, atau database produksi.
