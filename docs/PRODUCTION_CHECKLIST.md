# Production Readiness Checklist & Engineering Standards
**Project:** Rekapan Mitra BP  
**Status:** Pre-flight Checks

Dokumen ini berisi panduan komprehensif (best-practices software engineering) untuk memastikan aplikasi **100% siap untuk Production**, berjalan dengan performa maksimal, efisien, aman dari celah (security holes), dan mudah di-maintain (scalable).

---

## 1. Security & Data Integrity (Keamanan Data)
*Standar: Zero-Trust Architecture & Least Privilege*

- [ ] **Row Level Security (RLS) Audit:**
  - Pastikan **seluruh** tabel di Supabase (termasuk tabel pivot/relasi jika ada) memiliki RLS aktif.
  - Kebijakan (Policy) harus secara eksplisit mengunci akses dengan `auth.uid() = user_id`.
  - Nonaktifkan akses ke data secara bebas tanpa autentikasi (anonym) kecuali pada spesifik tabel publik yang benar-benar dibutuhkan (misalnya *Terms of Service*).
- [ ] **API Keys & Environment Variables (ENV):**
  - Pastikan `.env` tidak masuk ke dalam git (`.gitignore` harus mencakup `.env`).
  - Hapus anon key atau master key yang mungkin tertinggal di hardcode dalam file TypeScript/JavaScript.
  - Pastikan variabel yang diekspos ke frontend (Vite) hanya menggunakan `VITE_` untuk kunci publik (seperti `VITE_SUPABASE_PUBLISHABLE_KEY`), **bukan** service role key.
- [ ] **Input Validation & Sanitization:**
  - Validasi semua payload input dari end-user (formulir pemesanan, data pelanggan) meskipun sudah divalidasi di UI frontend.
  - Gunakan `zod` atau validasi native form untuk mencegah XSS (Cross Site Scripting) atau SQL Injection otomatis via RPC Supabase.

## 2. Performance & Efficiency (Kecepatan Aplikasi)
*Standar: Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)*

- [ ] **Code Splitting & Lazy Loading:**
  - Pastikan rute/komponen berat dimuat dengan `React.lazy()` dan dibungkus `Suspense` (sudah diimplementasikan pada file `App.tsx` versi terbaru).
- [ ] **Query Caching & Deduplication:**
  - Konfigurasi `React Query` (TanStack Query) secara optimal. Set `staleTime` yang sesuai (misal 5 menit untuk data yang jarang berubah seperti profil, katalog produk).
- [ ] **Asset Optimization:**
  - Semua file media (.png, .jpg) yang cukup besar harus di-compress (format WebP) agar mempercepat FCP (First Contentful Paint).
  - Pastikan SVG inline yang berlebihan dipisah menjadi komponen icons (seperti penggunaan `lucide-react`).
- [ ] **Tree Shaking & Bundle Size:**
  - Periksa ukuran build aplikasi (`npm run build`). Jika terlalu besar, cek dependensi berat (seperti moment.js, ganti dengan `date-fns` atau API native JS).

## 3. Reliability & Error Handling
*Standar: Graceful Degradation & User-centric Feedback*

- [ ] **Global Error Boundary:**
  - Setel Error Boundary pada level teratas aplikasi untuk menangkap error *React rendering* yang tidak terduga agar mencegah white-screen of death (Layar Putih).
- [ ] **Graceful API Fallbacks:**
  - Tangkap semua potensi error jaringan atau *timeout* saat koneksi ke Supabase terputus dan berikan umpan balik toast error yang sangat jelas bagi end-user (sudah ditingkatkan styling-nya).
- [ ] **Database Integrity / Constraints:**
  - Beri Constraints di layer Database (Supabase) seperti `NOT NULL` pada field penting dan `UNIQUE` pada field relasi agar data tidak kotor saat integrasi multi-device terjadi konflik sinkronisasi waktu.

## 4. Code Quality & Maintainability
*Standar: Clean Architecture, DRY (Don't Repeat Yourself), SOLID Principles*

- [ ] **Dead Code Elimination:**
  - Bersihkan *console.log*, kode ter-comment lama, fungsi yang tidak terpakai (orphan variables) menggunakan linters (`eslint`).
- [ ] **TypeScript Strictness:**
  - Nyalakan `strict: true` pada `tsconfig.json`. Pastikan semua tipe/types terdefinisi dengan jelas dari skema DB Supabase (`type Database`).
  - Kurangi penggunaan `any` agar autocompletion dan safety mapping data berjalan akurat.
- [ ] **Reusability UI Components:**
  - Komponen repetitif wajib diabstraksikan (Card, Input custom, Modal Dialog) agar jika ada perubahan desain cukup diubah di 1 sumber (Single Source of Truth).

## 5. Deployment & CI/CD pipeline
*Standar: Zero-Downtime Deployment*

- [ ] **CI/CD Checks:**
  - Setel GitHub Actions / platform cloud (Vercel/Netlify) agar setiap melakukan push ke cabang `main` akan me-*running* pengecekan otomatis (build step `tsc --noEmit && vite build`).
- [ ] **Database Migrations:**
  - Pastikan mengubah skema DB melalui file migrasi SQL agar memiliki *History* / Versioning jika tim lain ikut men-develop aplikasi. (Skema baru: `add_monthly_targets.sql`, `production_migration.sql`). 

---

### Cara Mengeksekusi Task di Atas
Jika Anda ingin saya (AI) mulai menuntaskan daftar di atas satu-per-satu, Anda cukup balas dengan:
> *"Tolong kerjakan bagian Security & Data Integrity dulu"*
atau
> *"Tolong optimasi build size dan jalankan linter"*

Saya akan otomatis mengeksekusi instruksi tersebut dengan level standar *world-class engineering*.
