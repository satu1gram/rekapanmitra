# 🗺️ Rencana Eksekusi — Portal Admin, Pricing Chain & Monetisasi

> Status: **PLAN** (belum dieksekusi). Disusun 2026-06-17.
> Tujuan: backlog siap-eksekusi buat sesi berikutnya. Tiap task ada *apa / kenapa / di mana / cara / risiko / blocker*.

---

## 0. Konteks & Arsitektur (baca dulu)

**Dua repo, satu database** (sengaja dipisah — security isolation, lihat `admin_mvp_plan.md.resolved` di repo admin):

| Komponen | GitHub | Lokal | Branch |
|---|---|---|---|
| App Mitra (user) | `satu1gram/rekapanmitra` | `/Users/salinovakbar/Downloads/rekapanmitra` | main |
| Portal Admin | `salinovbadr/rekapanmitra-admin` (Lovable, **PUBLIC**) | `/Users/salinovakbar/Downloads/rekapanmitra-admin` | main |

- **Supabase project (SHARED): `kqoitztjohxjnjoxctoz`** — kedua app pakai DB yang sama. (config.toml repo admin nyebut `mplnfciugxojlpurxiwk` tapi itu STALE; `.env` aktifnya `kqoit…`.)
- Portal admin terakhir di-push **2026-03-15** (≈3 bulan stale vs app mitra yang jalan terus sampai v2.6 Juni).

**Yang SUDAH jalan di portal admin:**
- `ProdukPage.tsx` — CRUD `master_products` langsung (kategori, package_type, harga, rename kategori). ✅ Benar, tabel sama yang dibaca app mitra.
- Rute: `products`, `monitoring`, `users`, `settings` + `AdminProtectedRoute` (gate role `admin`).
- `MonitoringSalesPage.tsx` — agregasi omzet + pcs per mitra (bukan profit).
- `UsersPage.tsx` — manajemen user/mitra + reset password (Supabase Auth Admin API).

---

## 1. P0 — Security: `.env` bocor di repo PUBLIC 🔴

**Apa:** `.env` (berisi `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`) ke-commit di repo admin yang public.
**Kenapa:** `.gitignore` cuma ignore `.env.*`, kelupaan bare `.env`.
**Severity:** Moderat — anon/publishable key emang dirancang client-side (kebuka juga di bundle JS production), RLS yang lindungi data. Tapi tetap higiene buruk + bocorin struktur project. (Tidak ada `service_role` key yang bocor — itu bagus.)

**Sudah dikerjain (LOKAL, belum commit/push):**
- [x] `.gitignore` repo admin: tambah baris `.env`
- [x] `git rm --cached .env` (file lokal aman, di-untrack dari index)

**Sisa langkah:**
- [ ] Commit + push perubahan di atas ke repo admin *(user minta TAHAN dulu — jangan push tanpa konfirmasi)*
- [ ] **User action:** private-kan repo → `gh repo edit salinovbadr/rekapanmitra-admin --visibility private`
- [ ] **User action (opsional):** rotate anon key di Supabase dashboard → Settings → API
- [ ] **User action:** pastikan RLS aktif di SEMUA tabel (ini proteksi sebenarnya)
- [ ] (opsional) scrub `.env` dari git history (BFG / `git filter-repo`) — key tetap ada di commit lama walau di-untrack

**Risiko:** rendah. Untrack `.env` aman (file lokal tetap ada). Scrub history = rewrite history + force-push (hati-hati kalau ada kolaborator).

---

## 2. P1 — Bersihin dead code warisan fork (repo admin) 🟠

**Apa:** Portal admin di-fork dari app mitra, bawa kode lama yang masih nunjuk tabel **`products`** (per-user lama), bukan `master_products`.
**Kenapa:** Inkonsisten & bikin bingung — `ProdukPage` udah ke `master_products`, tapi sisa ini masih ke `products`.

**File terdampak (repo admin):**
- `src/hooks/useProducts.ts` — query `from('products').eq('user_id', ...)`, interface cuma `name` + `default_sell_price` (skema lama, tanpa category/package_type).
- `src/components/orders/OrderForm.tsx` — `import { useProducts }` (baris 4, 72).
- `src/components/orders/OrderItemRow.tsx` — `import { Product } from useProducts` (baris 13).

**Cara (pilih salah satu):**
- **Opsi A (bersih):** Hapus fitur order-creation dari portal admin (admin gak perlu bikin order). Hapus `OrderForm`, `OrderItemRow`, `useProducts.ts` lama + rute/komponen terkait yang gak dipakai.
- **Opsi B (repoint):** Kalau order-creation di admin emang dipakai, ubah `useProducts.ts` → query `master_products` (samain dgn `ProdukPage`).

**Risiko:** sedang — perlu jalanin app admin buat mastiin gak ada yang ke-break. Cek dulu `App.tsx` admin: apakah OrderForm masih ke-route? (rute aktif cuma products/monitoring/users/settings → kemungkinan OrderForm udah yatim → Opsi A aman).

**Blocker:** sebaiknya bisa `bun install` + `bun dev` di repo admin buat verifikasi.

---

## 3. P2 — Regen `types.ts` (repo admin) 🟠

**Apa:** `src/integrations/supabase/types.ts` admin stale — gak ada `order_expenses`, `store_settings`, `submit_public_order`, `telegram_*`. Dipaksa `as any` di query.
**Kenapa:** type-safety ilang, gampang bug diam-diam saat skema berubah.

**Cara:**
```bash
cd /Users/salinovakbar/Downloads/rekapanmitra-admin
supabase login                 # butuh access token (USER)
supabase link --project-ref kqoitztjohxjnjoxctoz
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```
**Blocker:** butuh `supabase login` (kredensial user). CLI udah keinstall (`/usr/local/bin/supabase`) tapi belum login.
**Catatan:** app mitra (`/Users/salinovakbar/Downloads/rekapanmitra`) `types.ts`-nya JUGA stale (gak ada `master_products`, makanya `from('master_products' as any)`). Sekalian regen dua-duanya.

---

## 4. P3 — 🔥 Rewire pricing chain (repo APP MITRA) — *blocker tujuan utama*

**Apa:** App mitra hitung harga order pakai **`src/lib/pricing.ts` `PRICE_TABLE` yang HARDCODED**. `master_products.price` (yang diatur admin) cuma dipakai display katalog, **diabaikan saat hitung total order**.
**Kenapa penting:** Tanpa ini, "admin atur harga produk" = **kosmetik**. Harga yang admin ubah gak pernah nyampe ke total order mitra. Ini inti dari kenapa portal admin "ada tapi berasa gak ngefek".

**File terdampak (app mitra):**
- `src/lib/pricing.ts` — `PRICE_TABLE` (bp/beauty per tier), `getTierByQty`, `recalcPricing`. **Sumber kebenaran hardcoded.**
- `src/types/index.ts` — `MITRA_LEVELS`, `TIER_PRICING` (hardcoded juga).
- Dipakai oleh: `TambahOrderFlow`, `OrderForm` (edit), `components/bot/ChatInterface`, edge function `supabase/functions/telegram-bot/index.ts`.
- `src/hooks/useProducts.ts` — udah baca `master_products` (tinggal jadikan sumber harga).

**Cara (high-level — desain dulu sebelum koding):**
1. Putuskan model harga: `master_products` simpan harga per (produk × package_type/tier). Tier ditentukan dari qty (`getTierByQty`).
2. Ganti `PRICE_TABLE` lookup → ambil dari `master_products` (via cache/React Query) berdasarkan produk + tier aktif.
3. Pertahankan logika bundle reseller (BP 3=650rb) — pindahkan jadi data, bukan hardcode.
4. **Edge function `telegram-bot`** juga harus baca harga dari DB (sekarang kemungkinan ikut hardcoded) — konsistenkan.
5. Hapus/tipiskan `PRICE_TABLE` jadi fallback aja.

**Risiko:** TINGGI — ini jantung kalkulasi uang. Wajib: test menyeluruh (unit test `pricing.ts`, regression order manual + bot), bandingin hasil sebelum/sesudah dengan data nyata.
**Catatan:** user milih fokus "update portal" dulu, P3 di-defer. Tapi ini yang bikin atur-harga beneran end-to-end.

---

## 5. P4 — Putusin kepemilikan migrasi/schema 🟡

**Apa:** Migrasi kebagi 2 repo — admin berhenti `20260306`, app mitra sampai `20260616`. `master_products` dibuat di migrasi app mitra (`20260307`).
**Cara:** Tetapkan SATU repo sebagai pemilik schema (rekomendasi: app mitra, karena paling aktif). Repo admin cukup `gen types`, gak usah punya migrasi sendiri. Dokumentasikan di README kedua repo.
**Risiko:** rendah (keputusan + dokumentasi).

---

## 6. 💰 Monetisasi / Billing (greenfield — belum ada infra sama sekali)

> Hasil brainstorm 2026-06-17. Belum ada tabel subscription/plan/payment, belum ada gateway. `payment_info` yang ada = rekening mitra buat pelanggannya, BUKAN billing app.

### 6a. Model (rekomendasi: Freemium + langganan bulanan)
Fitur ber-COGS tinggi (bot Telegram AI, AI advisor) = juga fitur value tertinggi → jadiin gerbang bayar.

| Tier | Harga anchor | Isi |
|---|---|---|
| Free | Rp0 | Manual order, dashboard profit, stok, ~30-50 order/bln |
| Pro | Rp39-59k/bln | Bot Telegram AI (kuota), toko publik, AI advisor, unlimited |
| Bisnis/Leader | Rp149k+/bln | Multi-mitra (upline pantau downline), monitoring, priority |

**Kapan berbayar:** Free-limited + paywall-on-premium-action (bukan hard trial). Bayar pas user butuh fitur premium.

### 6b. Mekanisme teknis
- **Gateway:** Midtrans atau Xendit (QRIS/VA/e-wallet/recurring Indonesia). Bukan Stripe.
- **Tabel baru:** `plans`, `subscriptions` (user_id, plan, status, current_period_end, gateway_ref).
- **Webhook:** Supabase Edge Function terima event bayar → update status. (Pola sama `telegram-bot` function.)
- **Gating:** hook `useSubscription()` + RLS. Gate fitur premium di **server** (RLS + edge function), jangan cuma sembunyiin tombol.
- **Rem COGS:** bot & AI cek kuota sebelum call LLM.

### 6c. Lokasi billing (BELUM DIPUTUSKAN)
- Opsi: gating fitur di app mitra + admin kelola langganan/aktivasi di portal admin.
- Unit economics perlu dihitung: COGS LLM/user (OpenAI `parse-order` + `ai-konsultasi`) vs harga tier.

### 6d. Timing launch
Jangan jual tool setengah jadi. Urutan: P3 (harga jalan) + billing infra → validasi retensi & testimoni (konten Threads udah disiapin di `docs/promosi-threads/`) → flip berbayar. Kasih grandfather (gratis/diskon selamanya) ke early user sbg bukti sosial.

---

## 7. Urutan eksekusi yang disarankan

1. **P0 security** (commit+push nunggu OK user; private-kan repo)
2. **P2 types regen** (cepat, unblock yang lain — butuh user login supabase)
3. **P1 bersihin dead code** admin
4. **P3 rewire pricing chain** ← paling bernilai, paling berisiko, butuh test ketat
5. **P4 doc kepemilikan schema**
6. **Billing** (6a-6d) — setelah P3 beres

---

## 8. Keputusan yang masih nunggu user

- [ ] Push security fix ke repo admin? (jawaban terakhir: **tahan**)
- [ ] P1: hapus total order-creation di admin (Opsi A) atau repoint ke master_products (Opsi B)?
- [ ] Lokasi billing: app mitra / portal admin / split?
- [ ] Harga tier final (perlu hitung unit economics dulu)
- [ ] Login supabase buat regen types (P2) — kapan?

---

## 9. Quick reference

```
App mitra : /Users/salinovakbar/Downloads/rekapanmitra        (satu1gram/rekapanmitra)
Portal    : /Users/salinovakbar/Downloads/rekapanmitra-admin  (salinovbadr/rekapanmitra-admin, PUBLIC)
Supabase  : kqoitztjohxjnjoxctoz  (SHARED)
Pricing   : app mitra src/lib/pricing.ts (PRICE_TABLE hardcoded) + src/types/index.ts
Master cat: tabel master_products (admin CRUD via ProdukPage; app mitra baca via useProducts)
Edge fns  : supabase/functions/{parse-order, ai-konsultasi, telegram-bot}
```

**State lokal repo admin saat ini (uncommitted):** `.gitignore` diedit (+`.env`), `.env` di-`git rm --cached`. Belum commit, belum push.
