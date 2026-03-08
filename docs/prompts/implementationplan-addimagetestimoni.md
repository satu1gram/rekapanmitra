# 🤖 PROMPT UNTUK GEMINI FLASH — ANTIGRAVITY
## Fitur: Testimoni dengan Foto dari Tabel `telegram_messages`
## Project: rekapanmitra.lovable.app (React + Tailwind + Supabase)

---

## 📋 INSTRUKSI UNTUK AI (Baca sebelum mulai)

Kamu adalah senior full-stack engineer yang akan mengimplementasikan fitur testimoni
dengan foto pada landing page BP Group. Ikuti setiap langkah secara BERURUTAN.
Jangan skip langkah. Jangan improvisasi kecuali ada error yang perlu diselesaikan.

Setiap langkah punya:
- **APA** yang harus dilakukan
- **DI MANA** file atau lokasi yang tepat
- **KODE LENGKAP** yang harus ditulis
- **VERIFIKASI** cara memastikan langkah berhasil

---

## 🗂️ KONTEKS PROJECT

```
Framework : React + TypeScript + Vite
Styling   : Tailwind CSS
Backend   : Supabase (PostgreSQL + Storage)
Tabel     : telegram_messages (sudah ada ~690 baris)

Schema tabel saat ini:
  id          TEXT (primary key)
  content     TEXT (teks pesan dari Telegram)
  sender      TEXT (nama pengirim)
  created_at  TIMESTAMPTZ
  embedding   VECTOR (sudah ada, jangan diubah)

Yang akan kita tambahkan:
  foto_url      TEXT      (URL foto dari Supabase Storage)
  is_testimoni  BOOLEAN   (penanda apakah pesan ini testimoni)
  is_featured   BOOLEAN   (tampil di halaman utama)
  nama_pengirim TEXT      (nama display yang lebih bersih)
  kota          TEXT      (kota asal)
  produk        TEXT      (nama produk yang direview)
  bintang       SMALLINT  (rating 1-5)
  status        TEXT      (pending/approved/rejected)
```

---

## ═══════════════════════════════════════════
## LANGKAH 1 — DATABASE: ALTER TABLE
## ═══════════════════════════════════════════

### 1.1 Buka Supabase SQL Editor

Buka: `https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new`

### 1.2 Jalankan SQL ini (copy-paste seluruhnya, jalankan sekaligus)

```sql
-- ============================================
-- STEP 1: Tambah kolom baru ke tabel yang ada
-- ============================================
ALTER TABLE telegram_messages
  ADD COLUMN IF NOT EXISTS foto_url        TEXT,
  ADD COLUMN IF NOT EXISTS is_testimoni    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_featured     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nama_pengirim   TEXT,
  ADD COLUMN IF NOT EXISTS kota            TEXT,
  ADD COLUMN IF NOT EXISTS produk          TEXT,
  ADD COLUMN IF NOT EXISTS bintang         SMALLINT DEFAULT 5 
                                           CHECK (bintang BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'pending'
                                           CHECK (status IN ('pending','approved','rejected'));

-- ============================================
-- STEP 2: Index untuk performa query
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tm_testimoni_featured
  ON telegram_messages (is_featured, created_at DESC)
  WHERE is_testimoni = TRUE AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_tm_produk
  ON telegram_messages (produk)
  WHERE is_testimoni = TRUE AND status = 'approved';

-- ============================================
-- STEP 3: Row Level Security
-- ============================================
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada konflik
DROP POLICY IF EXISTS "public_read_testimoni" ON telegram_messages;
DROP POLICY IF EXISTS "service_role_all"      ON telegram_messages;

-- Publik hanya bisa baca testimoni yang approved
CREATE POLICY "public_read_testimoni" ON telegram_messages
  FOR SELECT
  USING (is_testimoni = TRUE AND status = 'approved');

-- Service role bisa semua operasi
CREATE POLICY "service_role_all" ON telegram_messages
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- STEP 4: Bucket Storage untuk foto
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimoni-photos',
  'testimoni-photos',
  true,
  5242880,  -- 5MB max per file
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy storage: publik baca
DROP POLICY IF EXISTS "public_read_testimoni_photos" ON storage.objects;
CREATE POLICY "public_read_testimoni_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'testimoni-photos');

-- Policy storage: service role upload
DROP POLICY IF EXISTS "service_upload_testimoni" ON storage.objects;
CREATE POLICY "service_upload_testimoni" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'testimoni-photos'
    AND auth.role() = 'service_role'
  );

-- ============================================
-- VERIFIKASI: Lihat struktur tabel setelah alter
-- ============================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'telegram_messages'
ORDER BY ordinal_position;
```

### 1.3 Verifikasi Berhasil

Output query verifikasi harus menampilkan kolom-kolom ini:
```
id, content, sender, created_at, embedding,
foto_url, is_testimoni, is_featured, nama_pengirim,
kota, produk, bintang, status
```

---

## ═══════════════════════════════════════════
## LANGKAH 2 — IDENTIFIKASI DATA TESTIMONI
## ═══════════════════════════════════════════

### 2.1 Jalankan query diagnostic dulu

```sql
-- Lihat 10 sample data untuk pahami format content
SELECT
  id,
  LEFT(content, 200) AS preview,
  sender,
  created_at
FROM telegram_messages
ORDER BY created_at DESC
LIMIT 10;
```

### 2.2 Tandai testimoni secara otomatis berdasarkan keyword produk

```sql
-- Update: tandai baris yang menyebut produk BP Group sebagai testimoni
UPDATE telegram_messages
SET
  is_testimoni = TRUE,
  status = 'approved',
  produk = CASE
    WHEN content ILIKE '%british propolis green%'  THEN 'British Propolis Green'
    WHEN content ILIKE '%british propolis%'         THEN 'British Propolis'
    WHEN content ILIKE '%brassic eye%'              THEN 'Brassic Eye'
    WHEN content ILIKE '%brassic pro%'              THEN 'Brassic Pro'
    WHEN content ILIKE '%brassic%'                  THEN 'Brassic Pro'
    WHEN content ILIKE '%belgie hair%'              THEN 'Belgie Hair Tonic'
    WHEN content ILIKE '%hair tonic%'               THEN 'Belgie Hair Tonic'
    WHEN content ILIKE '%belgie serum%'             THEN 'Belgie Anti Aging Serum'
    WHEN content ILIKE '%anti aging%'               THEN 'Belgie Anti Aging Serum'
    WHEN content ILIKE '%day cream%'                THEN 'Belgie Day Cream'
    WHEN content ILIKE '%night cream%'              THEN 'Belgie Night Cream'
    WHEN content ILIKE '%facial wash%'              THEN 'Belgie Facial Wash'
    WHEN content ILIKE '%belgie%'                   THEN 'Belgie (produk)'
    WHEN content ILIKE '%bp norway%'                THEN 'BP Norway'
    WHEN content ILIKE '%norway%'                   THEN 'BP Norway'
    WHEN content ILIKE '%steffi pro%'               THEN 'Steffi Pro'
    WHEN content ILIKE '%steffi%'                   THEN 'Steffi Pro'
    ELSE NULL
  END
WHERE
  content ILIKE '%british propolis%' OR
  content ILIKE '%brassic%'          OR
  content ILIKE '%belgie%'           OR
  content ILIKE '%bp norway%'        OR
  content ILIKE '%norway%'           OR
  content ILIKE '%steffi%'           OR
  content ILIKE '%propolis%';

-- Cek hasilnya
SELECT
  produk,
  COUNT(*) AS jumlah
FROM telegram_messages
WHERE is_testimoni = TRUE
GROUP BY produk
ORDER BY jumlah DESC;
```

### 2.3 Pilih 6 testimoni terbaik sebagai featured

```sql
-- Jalankan ini untuk melihat kandidat featured (teks paling panjang = biasanya paling detail)
SELECT
  id,
  LEFT(content, 300) AS preview,
  sender,
  produk,
  LENGTH(content) AS panjang_teks
FROM telegram_messages
WHERE is_testimoni = TRUE AND status = 'approved'
ORDER BY panjang_teks DESC
LIMIT 20;

-- Setelah review manual, set featured untuk 6 terbaik
-- GANTI id-1 sampai id-6 dengan ID aktual dari query di atas
UPDATE telegram_messages
SET is_featured = TRUE
WHERE id IN (
  'GANTI_DENGAN_ID_1',
  'GANTI_DENGAN_ID_2',
  'GANTI_DENGAN_ID_3',
  'GANTI_DENGAN_ID_4',
  'GANTI_DENGAN_ID_5',
  'GANTI_DENGAN_ID_6'
);
```

---

## ═══════════════════════════════════════════
## LANGKAH 3 — BUAT FILE TYPESCRIPT TYPES
## ═══════════════════════════════════════════

### 3.1 Lokasi file

```
src/types/testimoni.ts   ← BUAT FILE BARU INI
```

### 3.2 Isi file lengkap

```typescript
// src/types/testimoni.ts

export interface Testimoni {
  id: string;
  content: string;
  sender: string;
  created_at: string;
  foto_url: string | null;
  is_testimoni: boolean;
  is_featured: boolean;
  nama_pengirim: string | null;
  kota: string | null;
  produk: string | null;
  bintang: number;
  status: string;
}

// Helper: tampilkan nama yang paling representatif
export function getDisplayName(t: Testimoni): string {
  return t.nama_pengirim || t.sender || 'Pelanggan BP Group';
}

// Helper: generate inisial untuk avatar fallback
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('');
}
```

---

## ═══════════════════════════════════════════
## LANGKAH 4 — BUAT SUPABASE CLIENT (jika belum ada)
## ═══════════════════════════════════════════

### 4.1 Cek apakah sudah ada

Cari file `src/lib/supabase.ts` atau `src/integrations/supabase/client.ts`.
Jika sudah ada, skip ke Langkah 5.

### 4.2 Jika belum ada, buat file ini

```
src/lib/supabase.ts   ← BUAT FILE BARU INI
```

```typescript
// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    'Missing Supabase env vars. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
```

### 4.3 Pastikan .env punya variabel ini

```
# .env (di root project)
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

---

## ═══════════════════════════════════════════
## LANGKAH 5 — BUAT CUSTOM HOOK
## ═══════════════════════════════════════════

### 5.1 Lokasi file

```
src/hooks/useTestimonials.ts   ← BUAT FILE BARU INI
```

### 5.2 Isi file lengkap

```typescript
// src/hooks/useTestimonials.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
// CATATAN: Sesuaikan path import supabase dengan project kamu.
// Jika menggunakan path dari Lovable, mungkin:
// import { supabase } from '@/integrations/supabase/client';

import type { Testimoni } from '@/types/testimoni';

const COLUMNS = [
  'id',
  'content',
  'sender',
  'created_at',
  'foto_url',
  'is_featured',
  'nama_pengirim',
  'kota',
  'produk',
  'bintang',
].join(', ');

interface UseTestimonialsOptions {
  featured?: boolean;
  produk?: string;
  limit?: number;
}

interface UseTestimonialsReturn {
  data: Testimoni[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTestimonials(
  opts: UseTestimonialsOptions = {}
): UseTestimonialsReturn {
  const [data, setData]     = useState<Testimoni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('telegram_messages')
        .select(COLUMNS)
        .eq('is_testimoni', true)
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (opts.featured) query = query.eq('is_featured', true);
      if (opts.produk)   query = query.ilike('produk', `%${opts.produk}%`);
      if (opts.limit)    query = query.limit(opts.limit);

      const { data: rows, error: qError } = await query;

      if (qError) throw qError;
      setData((rows as Testimoni[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat testimoni';
      setError(msg);
      console.error('[useTestimonials]', err);
    } finally {
      setLoading(false);
    }
  }, [opts.featured, opts.produk, opts.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

---

## ═══════════════════════════════════════════
## LANGKAH 6 — BUAT KOMPONEN TestimoniCard
## ═══════════════════════════════════════════

### 6.1 Lokasi file

```
src/components/TestimoniCard.tsx   ← BUAT FILE BARU INI
```

### 6.2 Isi file lengkap

```tsx
// src/components/TestimoniCard.tsx

import { useState } from 'react';
import type { Testimoni } from '@/types/testimoni';
import { getDisplayName, getInitials } from '@/types/testimoni';

interface Props {
  testimoni: Testimoni;
}

// ─── Komponen Avatar ─────────────────────────────────────────────
function Avatar({ nama, fotoUrl }: { nama: string; fotoUrl: string | null }) {
  const [err, setErr] = useState(false);
  const initials = getInitials(nama);

  if (fotoUrl && !err) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-green-100"
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 border-2 border-green-200">
      <span className="text-green-700 text-sm font-bold select-none">
        {initials || '👤'}
      </span>
    </div>
  );
}

// ─── Komponen Foto Bukti ─────────────────────────────────────────
function FotoBukti({
  url,
  nama,
  onExpand,
}: {
  url: string;
  nama: string;
  onExpand: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [err,    setErr   ] = useState(false);

  if (err) return null;

  return (
    <div className="mt-4">
      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
        <span>📸</span>
        <span>Foto bukti</span>
      </p>
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group"
        onClick={onExpand}
        role="button"
        aria-label="Perbesar foto bukti"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onExpand()}
      >
        {/* Skeleton saat loading */}
        {!loaded && (
          <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />
        )}

        <img
          src={url}
          alt={`Bukti testimoni ${nama}`}
          loading="lazy"
          className={[
            'w-full h-32 object-cover rounded-xl transition-all duration-300',
            'group-hover:brightness-90 group-hover:scale-[1.02]',
            loaded ? 'opacity-100' : 'opacity-0 absolute inset-0 h-0',
          ].join(' ')}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
        />

        {loaded && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded-full">
              🔍 Perbesar
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Komponen Lightbox ────────────────────────────────────────────
function Lightbox({
  url,
  testimoni,
  onClose,
}: {
  url: string;
  testimoni: Testimoni;
  onClose: () => void;
}) {
  const nama = getDisplayName(testimoni);

  // Tutup dengan Escape key
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Foto testimoni"
    >
      <div
        className="relative max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Tombol tutup */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          aria-label="Tutup"
        >
          ✕
        </button>

        {/* Foto fullsize */}
        <img
          src={url}
          alt={`Bukti testimoni ${nama}`}
          className="w-full rounded-2xl shadow-2xl"
        />

        {/* Caption */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-white text-sm font-semibold">{nama}</p>
          {testimoni.kota && (
            <p className="text-gray-400 text-xs">{testimoni.kota}</p>
          )}
          {testimoni.produk && (
            <span className="inline-block bg-green-800/60 text-green-200 text-xs px-3 py-1 rounded-full">
              {testimoni.produk}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Komponen Utama TestimoniCard ─────────────────────────────────
export function TestimoniCard({ testimoni }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const nama = getDisplayName(testimoni);

  return (
    <>
      <article className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(45,106,79,0.08)] flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(45,106,79,0.15)]">

        {/* Bintang */}
        <div className="flex gap-0.5 mb-4" aria-label={`Rating ${testimoni.bintang} bintang`}>
          {Array.from({ length: testimoni.bintang || 5 }).map((_, i) => (
            <span key={i} className="text-amber-400 text-sm">⭐</span>
          ))}
        </div>

        {/* Tanda kutip dekoratif + teks */}
        <div className="relative flex-1">
          <span
            className="absolute -top-3 -left-1 text-7xl text-green-100 font-serif leading-none select-none pointer-events-none"
            aria-hidden
          >
            "
          </span>
          <p className="text-gray-700 text-sm leading-relaxed italic pl-5 line-clamp-4">
            {testimoni.content}
          </p>
        </div>

        {/* Foto bukti */}
        {testimoni.foto_url && (
          <FotoBukti
            url={testimoni.foto_url}
            nama={nama}
            onExpand={() => setLightboxOpen(true)}
          />
        )}

        {/* Divider */}
        <hr className="my-4 border-green-50" />

        {/* Profil pengirim */}
        <footer className="flex items-center gap-3">
          <Avatar nama={nama} fotoUrl={null} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{nama}</p>
            <p className="text-xs text-gray-400 truncate">
              {[testimoni.kota, testimoni.produk]
                .filter(Boolean)
                .join(' · ') || 'Pelanggan BP Group'}
            </p>
          </div>
        </footer>
      </article>

      {/* Lightbox */}
      {lightboxOpen && testimoni.foto_url && (
        <Lightbox
          url={testimoni.foto_url}
          testimoni={testimoni}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
```

---

## ═══════════════════════════════════════════
## LANGKAH 7 — BUAT KOMPONEN TestimoniSection
## ═══════════════════════════════════════════

### 7.1 Lokasi file

```
src/components/TestimoniSection.tsx   ← BUAT FILE BARU INI
```

### 7.2 Isi file lengkap

```tsx
// src/components/TestimoniSection.tsx

import { useRef } from 'react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { TestimoniCard } from '@/components/TestimoniCard';

// ─── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse">
      <div className="flex gap-0.5 mb-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-4 h-4 bg-gray-100 rounded" />
        ))}
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
        <div className="h-3 bg-gray-100 rounded w-full" />
      </div>
      <div className="h-32 bg-gray-100 rounded-xl mb-4" />
      <hr className="border-gray-100 mb-4" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-2.5 bg-gray-100 rounded w-36" />
        </div>
      </div>
    </div>
  );
}

// ─── Komponen Utama ───────────────────────────────────────────
export function TestimoniSection() {
  const { data, loading, error, refetch } = useTestimonials({ limit: 6 });
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="testimoni"
      className="py-16 bg-[#FAFCFA]"
      aria-labelledby="testimoni-heading"
    >
      <div className="max-w-6xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest text-[#3D7A4F] uppercase mb-3">
            TESTIMONI
          </p>
          <h2
            id="testimoni-heading"
            className="font-serif text-[clamp(1.8rem,5vw,2.8rem)] text-gray-800 leading-tight"
          >
            Kisah Nyata{' '}
            <em className="text-[#3D7A4F] not-italic italic">
              Keluarga Sehat
            </em>
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm md:text-base">
            Cerita nyata dari pengguna setia BP Group — bukan klaim kami 🌿
          </p>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <>
            {/* Desktop grid skeleton */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
            {/* Mobile skeleton */}
            <div className="md:hidden">
              <SkeletonCard />
            </div>
          </>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-gray-500 text-sm mb-4">
              Testimoni tidak dapat dimuat saat ini.
            </p>
            <button
              onClick={refetch}
              className="text-[#3D7A4F] text-sm underline hover:no-underline transition"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🌱</p>
            <p className="text-gray-400 text-sm">Testimoni segera hadir</p>
          </div>
        )}

        {/* ── Data tersedia ── */}
        {!loading && !error && data.length > 0 && (
          <>
            {/* DESKTOP: Grid 3 kolom */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map(t => (
                <TestimoniCard key={t.id} testimoni={t} />
              ))}
            </div>

            {/* MOBILE: Horizontal swipe carousel */}
            <div className="md:hidden">
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 px-1
                           snap-x snap-mandatory
                           [-webkit-overflow-scrolling:touch]
                           [scrollbar-width:none]
                           [&::-webkit-scrollbar]:hidden"
              >
                {data.map(t => (
                  <div
                    key={t.id}
                    className="flex-shrink-0 w-[85vw] snap-start"
                  >
                    <TestimoniCard testimoni={t} />
                  </div>
                ))}
              </div>

              {/* Pagination dots */}
              <div className="flex justify-center gap-2 mt-4" aria-hidden>
                {data.map((_, i) => (
                  <div
                    key={i}
                    className={[
                      'rounded-full bg-green-200 transition-all duration-300',
                      i === 0
                        ? 'w-4 h-2 bg-[#3D7A4F]'
                        : 'w-2 h-2',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
```

---

## ═══════════════════════════════════════════
## LANGKAH 8 — BUAT KOMPONEN TestimoniRelated
## (untuk ditampilkan di hasil konsultasi AI)
## ═══════════════════════════════════════════

### 8.1 Lokasi file

```
src/components/TestimoniRelated.tsx   ← BUAT FILE BARU INI
```

### 8.2 Isi file lengkap

```tsx
// src/components/TestimoniRelated.tsx
// Menampilkan 1 testimoni relevan di hasil konsultasi AI

import { useState } from 'react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { getDisplayName } from '@/types/testimoni';

interface Props {
  namaProduk: string; // nama produk yang direkomendasikan AI
}

export function TestimoniRelated({ namaProduk }: Props) {
  const { data, loading } = useTestimonials({ produk: namaProduk, limit: 1 });
  const [fotoOpen, setFotoOpen] = useState(false);

  // Jangan render apapun saat loading atau tidak ada data
  if (loading || data.length === 0) return null;

  const t = data[0];
  const nama = getDisplayName(t);

  return (
    <>
      <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
        {/* Label */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-amber-500 text-sm">💬</span>
          <p className="text-xs font-semibold text-amber-700">
            Dari pengguna {namaProduk}:
          </p>
        </div>

        {/* Kutipan */}
        <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-3">
          "{t.content}"
        </p>

        {/* Foto bukti kecil (jika ada) */}
        {t.foto_url && (
          <button
            onClick={() => setFotoOpen(true)}
            className="mt-3 w-full overflow-hidden rounded-lg group relative"
            aria-label="Lihat foto bukti"
          >
            <img
              src={t.foto_url}
              alt="Bukti testimoni"
              loading="lazy"
              className="w-full h-20 object-cover rounded-lg group-hover:brightness-90 transition"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg flex items-center justify-center">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition bg-black/50 px-2 py-0.5 rounded-full">
                🔍 Lihat foto
              </span>
            </div>
          </button>
        )}

        {/* Nama + kota */}
        <p className="text-xs text-gray-400 mt-2">
          — {nama}
          {t.kota ? `, ${t.kota}` : ''}
        </p>
      </div>

      {/* Lightbox foto */}
      {fotoOpen && t.foto_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFotoOpen(false)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setFotoOpen(false)}
              className="absolute -top-10 right-0 text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition"
            >
              ✕
            </button>
            <img
              src={t.foto_url}
              alt="Bukti testimoni"
              className="w-full rounded-2xl shadow-2xl"
            />
            <p className="mt-3 text-center text-white text-sm">
              {nama}{t.kota ? ` — ${t.kota}` : ''}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## ═══════════════════════════════════════════
## LANGKAH 9 — INTEGRASI KE HALAMAN KATALOG
## ═══════════════════════════════════════════

### 9.1 Cari file halaman katalog

Cari salah satu dari:
- `src/pages/Katalog.tsx`
- `src/pages/katalog.tsx`
- `src/pages/Index.tsx`
- `src/App.tsx`

### 9.2 Tambahkan import

```tsx
// Tambahkan di bagian atas file halaman katalog
import { TestimoniSection } from '@/components/TestimoniSection';
```

### 9.3 Tambahkan komponen di JSX

Tempatkan `<TestimoniSection />` setelah section katalog produk dan sebelum section mitra/CTA:

```tsx
{/* ... section katalog produk ... */}

{/* Testimoni Pelanggan */}
<TestimoniSection />

{/* ... section mitra / CTA ... */}
```

### 9.4 Integrasi TestimoniRelated di hasil konsultasi AI

Cari file komponen hasil konsultasi AI (nama file mungkin `KonsultasiSection.tsx`, `AIResult.tsx`, atau sejenisnya).

Tambahkan import:
```tsx
import { TestimoniRelated } from '@/components/TestimoniRelated';
```

Di dalam render loop produk rekomendasi, tambahkan setelah setiap produk:
```tsx
{/* Dalam loop rekomendasi produk dari AI */}
{rekomendasi.map((produk) => (
  <div key={produk.name}>
    {/* ... card produk rekomendasi yang sudah ada ... */}

    {/* Tambahkan ini: */}
    <TestimoniRelated namaProduk={produk.name} />
  </div>
))}
```

---

## ═══════════════════════════════════════════
## LANGKAH 10 — UPLOAD FOTO TESTIMONI MANUAL
## ═══════════════════════════════════════════

### 10.1 Cara upload foto ke Supabase Storage

```
1. Buka Supabase Dashboard
2. Klik "Storage" di sidebar kiri
3. Klik bucket "testimoni-photos"
4. Klik tombol "Upload files"
5. Pilih foto testimoni (JPEG/PNG, max 5MB per file)
6. Setelah upload, klik nama file
7. Copy "Public URL" yang muncul
```

### 10.2 Update foto_url ke baris di database

```sql
-- Jalankan di Supabase SQL Editor
-- Ganti nilai sesuai data aktual

UPDATE telegram_messages
SET foto_url = 'https://XXXX.supabase.co/storage/v1/object/public/testimoni-photos/NAMA_FILE.jpg'
WHERE id = 'ID_BARIS_YANG_DITUJU';
```

### 10.3 Cek hasil akhir

```sql
-- Verifikasi semua featured sudah punya foto dan data lengkap
SELECT
  id,
  LEFT(content, 100)  AS preview,
  nama_pengirim,
  kota,
  produk,
  bintang,
  foto_url IS NOT NULL AS ada_foto,
  is_featured,
  status
FROM telegram_messages
WHERE is_featured = TRUE
ORDER BY created_at DESC;
```

---

## ═══════════════════════════════════════════
## LANGKAH 11 — CSS TAMBAHAN (Tailwind config)
## ═══════════════════════════════════════════

### 11.1 Cek apakah `snap-x` sudah tersedia

Jika project menggunakan Tailwind CSS v3+, semua class yang dipakai sudah tersedia.
Tidak perlu konfigurasi tambahan.

### 11.2 Jika ada class yang tidak dikenali

Tambahkan ke `tailwind.config.ts` atau `tailwind.config.js`:

```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## ═══════════════════════════════════════════
## LANGKAH 12 — VERIFIKASI AKHIR
## ═══════════════════════════════════════════

### 12.1 Checklist teknis — jalankan satu per satu

```bash
# 1. Tidak ada TypeScript error
npx tsc --noEmit

# 2. Tidak ada error saat dev server jalan
npm run dev

# 3. Build berhasil
npm run build
```

### 12.2 Checklist fungsional — test manual di browser

```
[ ] Buka halaman katalog di browser
[ ] Scroll ke section Testimoni
[ ] Minimal 1 card testimoni muncul (tidak error/blank)
[ ] Teks konten terbaca dengan benar
[ ] Foto bukti tampil (jika sudah diupload)
[ ] Klik foto → lightbox terbuka dengan foto besar
[ ] Klik di luar foto / tombol ✕ → lightbox tertutup
[ ] Tekan Escape → lightbox tertutup
[ ] Di mobile (atau DevTools 390px): kartu swipeable horizontal
[ ] Pagination dots muncul di bawah carousel mobile
[ ] Buka konsultasi AI → isi keluhan → lihat hasil
[ ] Produk rekomendasi muncul dengan TestimoniRelated di bawahnya
[ ] TestimoniRelated hanya muncul jika ada testimoni yang match produk
```

### 12.3 Query verifikasi database final

```sql
-- Summary status semua fitur
SELECT
  COUNT(*)                                              AS total_pesan,
  COUNT(*) FILTER (WHERE is_testimoni = TRUE)           AS total_testimoni,
  COUNT(*) FILTER (WHERE is_featured = TRUE)            AS featured,
  COUNT(*) FILTER (WHERE foto_url IS NOT NULL
                     AND is_testimoni = TRUE)            AS punya_foto,
  COUNT(*) FILTER (WHERE status = 'approved'
                     AND is_testimoni = TRUE)            AS approved,
  ROUND(AVG(bintang) FILTER (
    WHERE is_testimoni = TRUE AND status = 'approved'
  ), 1)                                                 AS avg_bintang
FROM telegram_messages;
```

Output yang diharapkan (contoh):
```
total_pesan | total_testimoni | featured | punya_foto | approved | avg_bintang
690         | 45              | 6        | 6          | 45       | 4.8
```

---

## ═══════════════════════════════════════════
## TROUBLESHOOTING — MASALAH UMUM
## ═══════════════════════════════════════════

### ❌ Error: "relation telegram_messages does not exist"
```
Penyebab: RLS aktif tapi policy belum dibuat dengan benar
Solusi:   Jalankan ulang bagian STEP 3 di Langkah 1
          Pastikan pakai Supabase ANON key (bukan service key) di frontend
```

### ❌ Error: "new row violates row-level security policy"
```
Penyebab: Query dari frontend pakai anon key tapi RLS tidak allow SELECT
Solusi:   Cek policy "public_read_testimoni" sudah ada
          Jalankan: SELECT * FROM pg_policies WHERE tablename = 'telegram_messages';
```

### ❌ Foto tidak tampil (gambar broken)
```
Penyebab 1: foto_url berisi URL yang salah
  Solusi: SELECT id, foto_url FROM telegram_messages WHERE foto_url IS NOT NULL LIMIT 5;
          Buka URL tersebut di browser — apakah bisa diakses?

Penyebab 2: Bucket tidak public
  Solusi: Supabase Dashboard → Storage → testimoni-photos
          Pastikan "Public bucket" = ON
```

### ❌ Carousel mobile tidak swipeable
```
Penyebab: Class Tailwind snap-x tidak dikenali
Solusi:   Pastikan Tailwind v3.x
          Cek versi: cat node_modules/tailwindcss/package.json | grep '"version"'
          Jika v2.x, upgrade ke v3: npm install tailwindcss@latest
```

### ❌ useTestimonials selalu return data kosong
```
Penyebab: Tidak ada baris dengan is_testimoni=TRUE dan status='approved'
Solusi:   Jalankan query di Langkah 2.2 untuk tandai testimoni
          Cek: SELECT COUNT(*) FROM telegram_messages WHERE is_testimoni=TRUE AND status='approved';
```

### ❌ Import path error (@/hooks/... tidak ditemukan)
```
Penyebab: Alias @ belum dikonfigurasi di vite.config.ts
Solusi:   Tambahkan ke vite.config.ts:

import path from 'path';
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
});

Dan di tsconfig.json:
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## 📁 RINGKASAN FILE YANG DIBUAT/DIUBAH

```
BARU:
  src/types/testimoni.ts              ← TypeScript types + helpers
  src/hooks/useTestimonials.ts        ← Custom hook fetch dari Supabase
  src/components/TestimoniCard.tsx    ← Kartu testimoni dengan foto + lightbox
  src/components/TestimoniSection.tsx ← Section lengkap (grid + carousel mobile)
  src/components/TestimoniRelated.tsx ← Testimoni relevan di hasil AI

DIUBAH:
  src/pages/[halaman katalog].tsx     ← Tambahkan <TestimoniSection />
  src/components/[hasil AI].tsx       ← Tambahkan <TestimoniRelated />

DATABASE (via Supabase SQL Editor):
  ALTER TABLE telegram_messages       ← Tambah 8 kolom baru
  CREATE POLICY ...                   ← RLS policies
  Storage bucket "testimoni-photos"   ← Untuk simpan foto
```

---

*Prompt ini dibuat khusus untuk eksekusi oleh Gemini Flash di Antigravity.*
*Stack: React + TypeScript + Tailwind CSS + Supabase.*
*Tabel yang digunakan: telegram_messages (sudah ada ~690 baris).*
*Estimasi waktu eksekusi penuh: 60–90 menit.*