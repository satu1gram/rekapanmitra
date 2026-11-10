# Validasi rencana aplikasi mobile — branch `preview/mobile-ai`

10 November 2026 · HEAD `4e4246f`, baseline `8071e3b` · validasi oleh empat pemeriksaan paralel (build/tes, aturan bisnis, kode produksi, native/preview). Tidak ada kode yang diubah.

## Kesimpulan

Rencana (React + Capacitor, AI hanya membuat draf, server menentukan angka, gate integritas transaksi sebelum offline/auto-confirm) **arahnya benar dan diagnosisnya akurat**. Klaim pengujian di dokumen terbukti. Namun ada **risiko keamanan backend yang tidak tercatat di rencana** dan harus masuk Tahap B sebelum aplikasi mobile dirilis.

## 1. Klaim pengujian vs hasil nyata

| Klaim | Hasil |
|---|---|
| `npm test` 93 tes / 11 file | Lulus 93/93 |
| `verify-preview-output.test.mjs` 4 tes | Lulus 4/4 |
| `build:cloudflare-preview`, `npm run build` | Lulus (peringatan circular chunk lama) |
| Type-check: tidak ada error baru | Benar — 19 error, identik dengan baseline |
| Lint penuh 139 error / 31 warning lama | Benar, identik dengan baseline |
| `test:prototype` 54 layar / 67 tampilan, tanpa request eksternal | Lulus (setelah build preview) |
| `test:prototype:multi`, `test:prototype:finance` | Lulus |
| Contoh angka MULA (1.165.000; 1.365.000; 23.000; 25.000; 3 BP + 4 Belgie = 5 ekuivalen) | Semua benar |

## 2. Temuan rencana tentang kode produksi

Terkonfirmasi: order/stok tidak atomik (`useOrdersDb.ts:236-252` error insert item/biaya tidak dicek), saldo stok dihitung di client (`useStockDb.ts:114-133`), stok satu angka total, fallback 250k di `pricing.ts`, Steffi dihitung beauty, Edge Function tanpa JWT/limit/timeout (`verify_jwt=false`), key `rm_bot_learning_patterns` global, redirect auth memakai `window.location.origin`, mode build mobile mematikan service worker.

Koreksi: pembulatan 650.001 hanya terjadi pada nilai uji; seluruh harga katalog September habis dibagi. Modal juga berbeda per kanal — bot Telegram membaca `user_mitra_levels`, web memakai `MITRA_LEVELS`.

## 3. Risiko yang belum ada di rencana (prioritas)

| # | Tingkat | Temuan | Lokasi |
|---|---|---|---|
| 1 | Kritis | RPC publik `submit_public_order` (SECURITY DEFINER, anonim) memakai `buy_price`, `tier`, harga fallback dan qty dari payload; order langsung `selesai` → order palsu bisa menggelembungkan omzet & estimasi restok. `RETURN` di tengah loop meninggalkan header tanpa rollback | `supabase/migrations/20260912000000_submit_public_order_server_price.sql:74,131,163,190` |
| 2 | Kritis | Webhook Telegram tidak memeriksa secret token Telegram padahal memakai service-role key | `supabase/functions/telegram-bot/index.ts` |
| 3 | Tinggi | API key AI (Gemini, Groq, ZAI) pernah ter-commit di `.env` dan masih ada di riwayat git → **rotasi key**, pertimbangkan purge history | commit `c78477f` |
| 4 | Tinggi | Contoh koreksi berisi nama/HP pelanggan dikirim ke gateway AI pihak ketiga dan disisipkan ke system prompt (jalur prompt injection) | `src/lib/orderParser.ts:53`, `supabase/functions/parse-order/index.ts:88-97` |
| 5 | Tinggi | `mobile:prototype:sync` menyalin prototipe data contoh ke app native dengan appId produksi; `webDir: dist` dipakai empat build berbeda | `package.json`, `capacitor.config.ts:6` |
| 6 | Tinggi | iOS tanpa `NSCameraUsageDescription`; input `accept=image/*` menawarkan kamera → crash | `ios/App/App/Info.plist` |
| 7 | Tinggi | CI versioning akan gagal: 4 commit tidak memakai Conventional Commit (`4e4246f`, `54ce9a5`, `f2f8319`, `fb0a1fd`) | `.github/workflows/versioning.yml:34-39` |
| 8 | Sedang | `wrangler.jsonc` (nama proyek demo), `build` bergantung `CF_PAGES_BRANCH`, `.node-version` 24 vs CI Node 20 — jangan ikut ter-merge ke main apa adanya | `wrangler.jsonc`, `scripts/build-cloudflare.mjs` |
| 9 | Sedang | Regresi branch: `parseResultValidation` menolak `null` untuk hp/tanggal dan angka string dari model; label item di `OrdersPage.tsx:385` mengambil nama baris paket; tab TAMBAH hilang dan ASISTEN selalu tampak aktif di `BottomNav` | `src/lib/parseResultValidation.ts`, `src/components/...` |
| 10 | Sedang | Guard isolasi preview berbasis blocklist; `VITE_*` tetap bisa ter-inline. CSP `connect-src 'none'` menjadi pengaman runtime | `vite.preview.config.ts:12`, `scripts/lib/verify-preview-output.mjs:21` |
| 11 | Sedang | Link toko publik memakai `window.location.origin` → salah di native | `src/hooks/useStoreSettings.ts:210` |

## 4. Bug prototipe MULA

- Parser contoh menganggap teks pembelian pemasok sebagai penjualan: "Kulakan 10 green", "Beli 10 green dari distributor", "Restock 10 green", "po 5 green ke upline" (`src/lib/mulaBusiness.ts:125`).
- Pertanyaan tanpa "?" ("Ready 2 green kak") dan klaim bayar "udah tf"/"sdh tf" tidak dikenali (`mulaBusiness.ts:123,126`).
- `businessSummary` mengubah nilai tidak diketahui menjadi 0 (`src/prototype/model.ts:116-117`) — kode mati, hapus atau perbaiki.
- Draf dikonfirmasi memakai level saat disimpan; order mundur tanggal memakai level profil saat ini (`src/prototype/OrderPages.tsx:52`).
- Stok tersedia bisa negatif (keputusan backorder masih terbuka).

## 5. Kesiapan native — yang sudah benar

appId/namespace/bundle id konsisten (`id.biz.mitrabp.rekapan`), minSdk 24 / target 36, JDK 21, Capacitor 8.5.3 konsisten di semua lockfile, tidak ada `server.url`/cleartext, hanya izin INTERNET, `allowBackup=false`. Perbaikan kecil: test template Android masih paket `com.getcapacitor.myapp`, `UIRequiredDeviceCapabilities` = `armv7`, `ITSAppUsesNonExemptEncryption` belum ada.

## 6. Kebersihan dokumen dan skrip

Jumlah tes di `MOBILE_AI_BLUEPRINT.md` (37) dan `MULA_BP_PRODUCT_PLAN.md` (56) sudah usang (sekarang 93). Daftar "Belum dibuat" di plan masih menyebut kas/pembayaran/retur dan biaya umum, padahal sudah ada di prototipe. Skrip uji browser memakai default `/workspace/artifacts` dan `/usr/bin/chromium`, tidak membangun preview terlebih dahulu, dan memakai tiga nama env berbeda (`PROTOTYPE_ARTIFACTS`, `DESIGN_ARTIFACTS`, `FINANCE_ARTIFACTS`).

## Rekomendasi urutan

1. Segera: rotasi API key bocor; amankan `submit_public_order` dan webhook Telegram.
2. Tahap B (sudah di rencana) + butir 1–4 di atas: RPC atomik idempoten, satu resolver harga/modal di server, auth/limit Edge Function, isolasi data koreksi AI.
3. Sebelum build store: pisahkan output prototipe dari `dist` atau beri appId demo, tambah izin kamera iOS, callback auth native.
4. Sebelum merge ke main: rapikan commit, keluarkan `wrangler.jsonc`/build bercabang, perbaiki regresi butir 9.
