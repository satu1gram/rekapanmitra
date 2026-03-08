# README — Landing Page Rekapan Mitra

## Analisis Codebase

**Sistem**: Rekapan Mitra BP — PWA manajemen bisnis mitra/reseller produk herbal botol.

**Pengguna**: Mitra dari level Reseller (Rp217rb/btl) hingga Special Entrepreneur/SE (Rp150rb/btl).

**Fitur Inti**:
| Fitur | Sumber Kode |
|---|---|
| Dashboard Keuntungan | `Dashboard.tsx` — profit, omset, terjual, stok |
| Manajemen Order | `OrderForm.tsx`, `OrdersPage.tsx` — tier pricing otomatis |
| Tracking Stok | `StockPage.tsx`, `useStockDb.ts` — in/out, low-stock alert |
| Database Pelanggan | `CustomersPage.tsx`, `EditCustomerPage.tsx` — segmentasi tier |
| Toko Online Publik | `PublicOrderPage.tsx`, `StoreSettingsCard.tsx` — link unik |
| Target Bulanan | `TargetForm.tsx`, `TargetList.tsx` — progress tracking |
| Onboarding Wizard | `OnboardingWizard.tsx` — 4 step setup awal |

**Tech Stack**: React 18 + Vite + TypeScript, Supabase (Auth + DB), Tailwind CSS, shadcn/ui, PWA.

---

## Fitur yang Ditonjolkan & Alasan

1. **Dashboard Keuntungan** — Ini value proposition utama: tahu untung tanpa hitung manual.
2. **Manajemen Order** — Pain point terbesar mitra: catatan berantakan.
3. **Toko Online Publik** — Diferensiator kunci vs catatan manual/Excel.
4. **Tracking Stok** — Problem nyata: kehabisan stok tanpa sadar.
5. **Target Bulanan** — Motivasi & gamification untuk mitra.
6. **Database Pelanggan** — Membangun bisnis yang lebih profesional.

---

## Asumsi

- Landing diarahkan ke `/login` (halaman auth existing) untuk CTA.
- File ditulis sebagai single-file HTML agar mudah di-deploy terpisah.
- Testimoni menggunakan placeholder (ditandai `[PLACEHOLDER]`).
- Harga & level mitra diambil langsung dari `types/index.ts`.
- Design system mengikuti CSS variables di `index.css`.

---

## Cara Kustomisasi

### Warna
Ubah CSS variables di bagian `:root` pada `landing.html`:
```css
--green: #059669;    /* Hijau Utama */
--navy: #1E293B;     /* Navy Gelap */
--bg: #F8FAFC;       /* Background */
```

### Copy / Teks
Semua teks dalam Bahasa Indonesia. Cari dan replace langsung di HTML. Section penting:
- **Hero**: headline, subheadline, badge text
- **Pain Points**: 3 masalah (baris 200+)
- **FAQ**: 5 pertanyaan (baris 300+)
- **CTA**: closing headline

### Testimoni
Cari `[PLACEHOLDER]` dan ganti dengan testimoni asli dari mitra.

### Link CTA
Ubah `href="/login"` di CTA button ke URL pendaftaran yang sesuai.
