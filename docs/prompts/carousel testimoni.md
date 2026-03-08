# 🎠 PROMPT UNTUK GEMINI FLASH — ANTIGRAVITY
## Redesign: Testimoni Section → Carousel + Read More + Mobile Responsive
## Project: rekapanmitra / QM Millionaire — React + Tailwind

---

## 📋 INSTRUKSI UNTUK AI

Kamu adalah senior UI/UX engineer dan React developer.
Tugas: redesign komponen testimoni yang sudah ada menjadi:
1. Carousel dengan navigasi panah + swipe
2. Teks dipotong dengan tombol "Baca Selengkapnya"
3. Foto bukti dalam grid compact
4. Tampil sempurna di desktop dan mobile

Ikuti setiap langkah secara berurutan.

---

## 🔍 MASALAH UI YANG ADA SEKARANG

```
❌ Card tingginya tidak seragam — card pertama jauh lebih tinggi dari yang lain
❌ Teks sangat panjang ditampilkan penuh — buang banyak ruang vertikal
❌ Layout statis 3 kolom — tidak bisa navigate ke testimoni lain
❌ Foto bukti section tidak konsisten antar card
❌ Mobile: 3 kolom terlalu sempit, teks tidak terbaca
❌ Bottom card hanya muncul "QM - Testimoni BP..." — tidak informatif
```

---

## 🎯 TARGET HASIL AKHIR

```
✅ Semua card SAMA TINGGI (fixed height)
✅ Teks dipotong 4 baris, ada tombol "Baca selengkapnya ↓"
✅ Modal/expand saat teks dibuka penuh
✅ Carousel: tampil 3 card sekaligus di desktop, 1 di mobile
✅ Navigasi: tombol ← → di sisi, dots di bawah
✅ Swipe gesture di mobile
✅ Foto bukti: thumbnail grid 2 kolom, klik → lightbox
✅ Infinite loop (dari card terakhir kembali ke pertama)
✅ Auto-play opsional (pause saat hover)
```

---

## ══════════════════════════════════════════
## LANGKAH 1 — CARI FILE YANG PERLU DIUBAH
## ══════════════════════════════════════════

Cari file komponen testimoni yang sudah ada di project.
Kemungkinan nama file:

```
src/components/TestimoniSection.tsx   ← kemungkinan ini
src/components/TestimoniCard.tsx      ← atau ini
src/components/Testimonials.tsx
src/pages/KatalogProdukPage.tsx       ← mungkin inline di sini
```

Buka file tersebut dan BACA isinya sebelum mulai.
Perhatikan:
- Nama props yang dipakai
- Interface/type Testimoni yang digunakan
- Nama field dari Supabase (content, foto_url, sender, dll)

---

## ══════════════════════════════════════════
## LANGKAH 2 — BUAT HOOK useCarousel
## ══════════════════════════════════════════

### Lokasi file
```
src/hooks/useCarousel.ts   ← BUAT FILE BARU INI
```

### Isi file lengkap

```typescript
// src/hooks/useCarousel.ts

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCarouselOptions {
  total: number;          // jumlah total item
  visible: number;        // berapa yang tampil sekaligus
  autoPlay?: boolean;     // auto-slide otomatis
  autoPlayDelay?: number; // interval ms (default 5000)
  loop?: boolean;         // infinite loop
}

interface UseCarouselReturn {
  currentIndex: number;   // index item paling kiri yang sedang tampil
  canPrev: boolean;
  canNext: boolean;
  goTo: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  totalPages: number;     // total halaman (dots)
  currentPage: number;    // halaman aktif (0-based)
}

export function useCarousel({
  total,
  visible,
  autoPlay = false,
  autoPlayDelay = 5000,
  loop = true,
}: UseCarouselOptions): UseCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused]         = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = Math.ceil(total / visible);
  const currentPage = Math.floor(currentIndex / visible);
  const maxIndex = loop ? total - 1 : Math.max(0, total - visible);

  const goTo = useCallback((index: number) => {
    if (loop) {
      setCurrentIndex(((index % total) + total) % total);
    } else {
      setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    }
  }, [total, maxIndex, loop]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (loop) return (prev + 1) % total;
      return Math.min(prev + visible, maxIndex);
    });
  }, [total, visible, maxIndex, loop]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => {
      if (loop) return ((prev - 1) + total) % total;
      return Math.max(prev - visible, 0);
    });
  }, [total, visible, maxIndex, loop]);

  const canPrev = loop ? true : currentIndex > 0;
  const canNext = loop ? true : currentIndex < maxIndex;

  const pause  = useCallback(() => setIsPaused(true),  []);
  const resume = useCallback(() => setIsPaused(false), []);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused || total <= visible) return;

    timerRef.current = setInterval(goNext, autoPlayDelay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, isPaused, autoPlayDelay, goNext, total, visible]);

  return {
    currentIndex,
    canPrev,
    canNext,
    goTo,
    goNext,
    goPrev,
    isPaused,
    pause,
    resume,
    totalPages,
    currentPage,
  };
}
```

---

## ══════════════════════════════════════════
## LANGKAH 3 — BUAT HOOK useSwipe
## ══════════════════════════════════════════

### Lokasi file
```
src/hooks/useSwipe.ts   ← BUAT FILE BARU INI
```

### Isi file lengkap

```typescript
// src/hooks/useSwipe.ts
// Hook untuk deteksi swipe gesture di mobile

import { useRef, useCallback } from 'react';

interface UseSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number; // px minimum untuk dianggap swipe (default 50)
}

interface UseSwipeReturn {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd:   (e: React.TouchEvent) => void;
  onMouseDown:  (e: React.MouseEvent) => void;
  onMouseUp:    (e: React.MouseEvent) => void;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseSwipeOptions): UseSwipeReturn {
  const startX = useRef<number | null>(null);

  const handleStart = useCallback((x: number) => {
    startX.current = x;
  }, []);

  const handleEnd = useCallback((x: number) => {
    if (startX.current === null) return;

    const diff = startX.current - x;

    if (Math.abs(diff) >= threshold) {
      if (diff > 0) onSwipeLeft();
      else          onSwipeRight();
    }

    startX.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart: (e) => handleStart(e.touches[0].clientX),
    onTouchEnd:   (e) => handleEnd(e.changedTouches[0].clientX),
    onMouseDown:  (e) => handleStart(e.clientX),
    onMouseUp:    (e) => handleEnd(e.clientX),
  };
}
```

---

## ══════════════════════════════════════════
## LANGKAH 4 — BUAT KOMPONEN ExpandableText
## (Fitur "Baca Selengkapnya")
## ══════════════════════════════════════════

### Lokasi file
```
src/components/ExpandableText.tsx   ← BUAT FILE BARU INI
```

### Isi file lengkap

```tsx
// src/components/ExpandableText.tsx

import { useState, useRef, useEffect } from 'react';

interface Props {
  text: string;
  maxLines?: number;    // default 4
  className?: string;
}

export function ExpandableText({ text, maxLines = 4, className = '' }: Props) {
  const [expanded,    setExpanded   ] = useState(false);
  const [isClamped,   setIsClamped  ] = useState(false);
  const [modalOpen,   setModalOpen  ] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Deteksi apakah teks benar-benar terpotong
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkClamp = () => {
      setIsClamped(el.scrollHeight > el.clientHeight + 2);
    };

    checkClamp();

    const observer = new ResizeObserver(checkClamp);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const lineClampClass = !expanded
    ? {
        1: 'line-clamp-1',
        2: 'line-clamp-2',
        3: 'line-clamp-3',
        4: 'line-clamp-4',
        5: 'line-clamp-5',
        6: 'line-clamp-6',
      }[maxLines] || 'line-clamp-4'
    : '';

  return (
    <>
      {/* Teks dengan clamp */}
      <div className="relative">
        <p
          ref={textRef}
          className={[
            'text-gray-700 text-sm leading-relaxed italic',
            lineClampClass,
            className,
          ].join(' ')}
        >
          {text}
        </p>

        {/* Gradient fade di bawah teks saat terpotong */}
        {isClamped && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8
                          bg-gradient-to-t from-white to-transparent
                          pointer-events-none" />
        )}
      </div>

      {/* Tombol "Baca selengkapnya" */}
      {isClamped && (
        <button
          onClick={() => setModalOpen(true)}
          className="mt-2 text-xs font-semibold text-[#3D7A4F]
                     hover:text-[#2A5936] transition-colors
                     flex items-center gap-1 group"
          aria-label="Baca testimoni selengkapnya"
        >
          <span>Baca selengkapnya</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      )}

      {/* Modal untuk teks penuh */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm
                     flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh]
                       flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-amber-400 text-sm">⭐</span>
                ))}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center
                           justify-center text-gray-500 hover:bg-gray-200
                           transition text-sm"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Isi teks penuh */}
            <div className="overflow-y-auto p-5">
              <p className="text-gray-700 text-sm leading-relaxed italic">
                {text}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## ══════════════════════════════════════════
## LANGKAH 5 — BUAT KOMPONEN FotoBuktiGrid
## (Foto thumbnail + lightbox)
## ══════════════════════════════════════════

### Lokasi file
```
src/components/FotoBuktiGrid.tsx   ← BUAT FILE BARU INI
```

### Isi file lengkap

```tsx
// src/components/FotoBuktiGrid.tsx
// Menampilkan 1-4 foto dalam grid compact dengan lightbox

import { useState } from 'react';

interface Props {
  urls: string[];  // array URL foto (dari foto_url dan/atau foto tambahan)
}

export function FotoBuktiGrid({ urls }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [errSet,      setErrSet      ] = useState<Set<number>>(new Set());
  const [loadedSet,   setLoadedSet   ] = useState<Set<number>>(new Set());

  // Filter URL yang valid (tidak error)
  const validUrls = urls.filter((_, i) => !errSet.has(i));

  if (!validUrls.length) return null;

  const handleErr = (i: number) =>
    setErrSet(prev => new Set([...prev, i]));

  const handleLoad = (i: number) =>
    setLoadedSet(prev => new Set([...prev, i]));

  // Layout berbeda tergantung jumlah foto
  const getGridClass = () => {
    switch (validUrls.length) {
      case 1:  return 'grid-cols-1';
      case 2:  return 'grid-cols-2';
      default: return 'grid-cols-2';
    }
  };

  // Foto ke-4 tampilkan sebagai "+N lagi"
  const displayUrls = validUrls.slice(0, 4);
  const extraCount  = validUrls.length - 4;

  return (
    <>
      {/* Label */}
      <div className="flex items-center gap-1.5 mt-4 mb-2">
        <span className="text-gray-400 text-xs">📷</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Foto Bukti
        </span>
      </div>

      {/* Grid foto */}
      <div className={`grid ${getGridClass()} gap-1.5`}>
        {displayUrls.map((url, i) => {
          const isLast    = i === 3;
          const showExtra = isLast && extraCount > 0;

          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg cursor-pointer group"
              style={{ aspectRatio: '1' }}
              onClick={() => setLightboxIdx(i)}
              role="button"
              aria-label={`Lihat foto bukti ${i + 1}`}
            >
              {/* Skeleton */}
              {!loadedSet.has(i) && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              )}

              <img
                src={url}
                alt={`Foto bukti ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover
                           transition-transform duration-300
                           group-hover:scale-110"
                onLoad={() => handleLoad(i)}
                onError={() => handleErr(i)}
              />

              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30
                              transition-all duration-300" />

              {/* Badge "+N lagi" */}
              {showExtra && (
                <div className="absolute inset-0 bg-black/60
                               flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    +{extraCount + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[300] bg-black/95
                     flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Tombol navigasi antar foto */}
          {validUrls.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2
                           w-10 h-10 rounded-full bg-white/20 text-white
                           flex items-center justify-center
                           hover:bg-white/30 transition z-10"
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIdx(i =>
                    i === null ? 0 : ((i - 1) + validUrls.length) % validUrls.length
                  );
                }}
                aria-label="Foto sebelumnya"
              >
                ‹
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2
                           w-10 h-10 rounded-full bg-white/20 text-white
                           flex items-center justify-center
                           hover:bg-white/30 transition z-10"
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIdx(i =>
                    i === null ? 0 : (i + 1) % validUrls.length
                  );
                }}
                aria-label="Foto berikutnya"
              >
                ›
              </button>
            </>
          )}

          {/* Foto aktif */}
          <div
            className="relative max-w-2xl w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={validUrls[lightboxIdx]}
              alt={`Foto bukti ${lightboxIdx + 1}`}
              className="w-full rounded-2xl max-h-[80vh] object-contain"
            />

            {/* Counter */}
            <p className="text-center text-white/60 text-sm mt-3">
              {lightboxIdx + 1} / {validUrls.length}
            </p>
          </div>

          {/* Tombol tutup */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full
                       bg-white/20 text-white flex items-center justify-center
                       hover:bg-white/30 transition"
            onClick={() => setLightboxIdx(null)}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
```

---

## ══════════════════════════════════════════
## LANGKAH 6 — BUAT KOMPONEN TestimoniCard BARU
## ══════════════════════════════════════════

### Lokasi file

Jika sudah ada `TestimoniCard.tsx`, **GANTI seluruh isinya** dengan kode berikut.
Jika belum ada, buat file baru di:
```
src/components/TestimoniCard.tsx
```

### PENTING sebelum menulis kode

Baca interface Testimoni yang sudah ada di project.
Field yang dipakai di bawah:
- `content` → teks testimoni
- `sender` → nama pengirim (fallback)
- `nama_pengirim` → nama display (prioritas utama)
- `kota` → kota asal
- `produk` → produk yang dipakai
- `bintang` → rating 1–5
- `foto_url` → URL foto bukti (single)

Jika nama field berbeda di project kamu, sesuaikan.

### Isi file lengkap

```tsx
// src/components/TestimoniCard.tsx

import { ExpandableText } from './ExpandableText';
import { FotoBuktiGrid  } from './FotoBuktiGrid';

// Sesuaikan interface ini dengan type Testimoni di project
interface Testimoni {
  id: string;
  content: string;
  sender?: string;
  nama_pengirim?: string | null;
  kota?: string | null;
  produk?: string | null;
  bintang?: number;
  foto_url?: string | null;
  [key: string]: unknown;
}

interface Props {
  testimoni: Testimoni;
}

function getDisplayName(t: Testimoni): string {
  return t.nama_pengirim || t.sender || 'Pelanggan BP Group';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function TestimoniCard({ testimoni }: Props) {
  const nama    = getDisplayName(testimoni);
  const inisial = getInitials(nama);
  const bintang = testimoni.bintang ?? 5;
  const fotos   = testimoni.foto_url ? [testimoni.foto_url] : [];

  return (
    <article
      className="bg-white rounded-2xl p-5 h-full flex flex-col
                 border border-gray-100
                 shadow-[0_2px_12px_rgba(45,106,79,0.07)]"
    >
      {/* ── Rating bintang ── */}
      <div className="flex gap-0.5 mb-3" aria-label={`Rating ${bintang} bintang`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-base ${i < bintang ? 'text-amber-400' : 'text-gray-200'}`}
          >
            ★
          </span>
        ))}
      </div>

      {/* ── Teks dengan "Baca Selengkapnya" ── */}
      <div className="flex-1 relative pl-3 border-l-2 border-green-100">
        {/* Tanda kutip dekoratif */}
        <span
          className="absolute -top-1 -left-1 text-4xl text-green-100
                     font-serif leading-none select-none"
          aria-hidden
        >
          "
        </span>
        <ExpandableText
          text={testimoni.content}
          maxLines={4}
          className="pl-2"
        />
      </div>

      {/* ── Foto bukti (jika ada) ── */}
      {fotos.length > 0 && (
        <FotoBuktiGrid urls={fotos} />
      )}

      {/* ── Profil pengirim ── */}
      <footer className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3">
        {/* Avatar inisial */}
        <div
          className="w-9 h-9 rounded-full bg-green-100 flex-shrink-0
                     flex items-center justify-center
                     border-2 border-green-200"
        >
          <span className="text-green-700 text-xs font-bold select-none">
            {inisial || '👤'}
          </span>
        </div>

        {/* Info */}
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
  );
}
```

---

## ══════════════════════════════════════════
## LANGKAH 7 — BUAT KOMPONEN TestimoniCarousel BARU
## (Gantikan TestimoniSection yang lama)
## ══════════════════════════════════════════

### Lokasi file

Jika sudah ada `TestimoniSection.tsx`, **GANTI seluruh isinya**.
Jika belum, buat file baru:
```
src/components/TestimoniSection.tsx
```

### Isi file lengkap

```tsx
// src/components/TestimoniSection.tsx

import { useRef } from 'react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useCarousel      } from '@/hooks/useCarousel';
import { useSwipe         } from '@/hooks/useSwipe';
import { TestimoniCard    } from '@/components/TestimoniCard';

// ── Skeleton ───────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 h-full border border-gray-100 animate-pulse">
      <div className="flex gap-1 mb-3">
        {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-4 bg-gray-100 rounded" />)}
      </div>
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
        <div className="h-3 bg-gray-100 rounded w-full" />
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-4">
        <div className="aspect-square bg-gray-100 rounded-lg" />
        <div className="aspect-square bg-gray-100 rounded-lg" />
      </div>
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
        <div className="w-9 h-9 rounded-full bg-gray-100" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-2 bg-gray-100 rounded w-28" />
        </div>
      </div>
    </div>
  );
}

// ── Tombol navigasi ─────────────────────────────────────────────
interface NavButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}

function NavButton({ direction, onClick, disabled }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Testimoni sebelumnya' : 'Testimoni berikutnya'}
      className={[
        'w-10 h-10 rounded-full border-2 flex items-center justify-center',
        'text-lg font-bold transition-all duration-200',
        'select-none flex-shrink-0',
        disabled
          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
          : 'border-[#3D7A4F] text-[#3D7A4F] hover:bg-[#3D7A4F] hover:text-white',
      ].join(' ')}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

// ── Pagination dots ──────────────────────────────────────────────
function PaginationDots({
  total,
  current,
  onDotClick,
}: {
  total: number;
  current: number;
  onDotClick: (i: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-6" role="tablist">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === current}
          aria-label={`Halaman testimoni ${i + 1}`}
          onClick={() => onDotClick(i)}
          className={[
            'rounded-full transition-all duration-300',
            i === current
              ? 'w-6 h-2.5 bg-[#3D7A4F]'
              : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── Komponen Utama ───────────────────────────────────────────────
export function TestimoniSection() {
  const { data, loading, error, refetch } = useTestimonials({ limit: 12 });

  // Responsive visible count:
  // Desktop: 3, Tablet: 2, Mobile: 1
  // Kita handle dengan CSS, carousel track di 1
  const VISIBLE_DESKTOP = 3;

  const carousel = useCarousel({
    total:    data.length,
    visible:  1,          // step 1 card per klik
    autoPlay: false,
    loop:     true,
  });

  const swipe = useSwipe({
    onSwipeLeft:  carousel.goNext,
    onSwipeRight: carousel.goPrev,
  });

  const trackRef = useRef<HTMLDivElement>(null);

  // Hitung offset untuk slide
  // Desktop: geser per card (1/3 dari container)
  // Mobile:  geser per card (100% dari container)
  const getTranslate = () => {
    return `translateX(calc(-${carousel.currentIndex} * (100% / 3)))`;
  };

  const getMobileTranslate = () => {
    return `translateX(-${carousel.currentIndex * 100}%)`;
  };

  return (
    <section
      id="testimoni"
      className="py-16 bg-[#F8FBF9]"
      aria-labelledby="testimoni-heading"
      onMouseEnter={carousel.pause}
      onMouseLeave={carousel.resume}
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
            <em className="italic text-[#3D7A4F]">Keluarga Sehat</em>
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm md:text-base">
            Cerita nyata dari pengguna setia BP Group — bukan klaim kami 🌿
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">
              Testimoni tidak dapat dimuat saat ini.
            </p>
            <button
              onClick={refetch}
              className="text-[#3D7A4F] text-sm underline hover:no-underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Carousel ── */}
        {!loading && !error && data.length > 0 && (
          <>
            {/* Container navigasi */}
            <div className="flex items-center gap-3 md:gap-4">

              {/* Tombol Prev */}
              <NavButton
                direction="prev"
                onClick={carousel.goPrev}
                disabled={!carousel.canPrev}
              />

              {/* Track container */}
              <div
                className="flex-1 overflow-hidden"
                {...swipe}
                style={{ cursor: 'grab' }}
              >
                {/* ─────────────────────────────────────────────
                    DESKTOP TRACK (3 card visible)
                    Masing-masing card lebar 1/3 dari container
                ───────────────────────────────────────────── */}
                <div
                  ref={trackRef}
                  className="hidden md:flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                  style={{ transform: getTranslate() }}
                  aria-live="polite"
                >
                  {data.map((t, i) => (
                    <div
                      key={t.id}
                      className="w-1/3 flex-shrink-0 px-3"
                      aria-hidden={
                        i < carousel.currentIndex ||
                        i >= carousel.currentIndex + VISIBLE_DESKTOP
                      }
                    >
                      <TestimoniCard testimoni={t} />
                    </div>
                  ))}
                </div>

                {/* ─────────────────────────────────────────────
                    MOBILE TRACK (1 card per layar)
                    Lebar 100% per card
                ───────────────────────────────────────────── */}
                <div
                  className="flex md:hidden transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                  style={{ transform: getMobileTranslate() }}
                  aria-live="polite"
                >
                  {data.map((t, i) => (
                    <div
                      key={t.id}
                      className="w-full flex-shrink-0 px-1"
                      aria-hidden={i !== carousel.currentIndex}
                    >
                      <TestimoniCard testimoni={t} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Next */}
              <NavButton
                direction="next"
                onClick={carousel.goNext}
                disabled={!carousel.canNext}
              />
            </div>

            {/* ── Dots ── */}
            <PaginationDots
              total={Math.ceil(data.length / VISIBLE_DESKTOP)}
              current={Math.floor(carousel.currentIndex / VISIBLE_DESKTOP)}
              onDotClick={i => carousel.goTo(i * VISIBLE_DESKTOP)}
            />

            {/* ── Counter teks ── */}
            <p className="text-center text-xs text-gray-400 mt-3">
              {carousel.currentIndex + 1} – {Math.min(carousel.currentIndex + VISIBLE_DESKTOP, data.length)} dari {data.length} testimoni
            </p>
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🌱</p>
            <p className="text-gray-400 text-sm">Testimoni segera hadir</p>
          </div>
        )}
      </div>
    </section>
  );
}
```

---

## ══════════════════════════════════════════
## LANGKAH 8 — CSS TAMBAHAN
## ══════════════════════════════════════════

### Tambahkan ke file CSS global (src/index.css atau src/App.css)

```css
/* ── Carousel grab cursor ── */
.carousel-track {
  cursor: grab;
  user-select: none;
}
.carousel-track:active {
  cursor: grabbing;
}

/* ── line-clamp utilities (jika Tailwind belum include) ── */
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Smooth card height — semua card di satu row sama tinggi ── */
.testimoni-track > div {
  display: flex;
  align-items: stretch;
}

/* ── Transisi modal masuk ── */
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);   }
}
.modal-content {
  animation: modal-in 250ms ease-out;
}
```

---

## ══════════════════════════════════════════
## LANGKAH 9 — INTEGRASI KE HALAMAN
## ══════════════════════════════════════════

### Cari file halaman katalog

Buka file halaman utama (KatalogProdukPage.tsx atau index).

### Pastikan import sudah benar

```tsx
// Hapus import komponen testimoni lama jika ada
// Tambahkan:
import { TestimoniSection } from '@/components/TestimoniSection';
```

### Tempatkan di JSX

```tsx
{/* Letakkan setelah section produk, sebelum CTA */}
<TestimoniSection />
```

---

## ══════════════════════════════════════════
## LANGKAH 10 — VERIFIKASI
## ══════════════════════════════════════════

### Checklist Desktop

```
[ ] Buka halaman di browser desktop (min 1024px lebar)
[ ] Section testimoni tampil dengan 3 card sejajar
[ ] Semua card SAMA TINGGI meski isinya berbeda panjang
[ ] Teks terpotong 4 baris dengan gradient fade di bawah
[ ] Tombol "Baca selengkapnya →" muncul di teks yang panjang
[ ] Klik "Baca selengkapnya" → modal terbuka dengan teks penuh
[ ] Klik di luar modal atau ✕ → modal tertutup
[ ] Tombol ‹ dan › di sisi carousel berfungsi
[ ] Klik ‹ → slide ke kiri (testimoni sebelumnya)
[ ] Klik › → slide ke kanan (testimoni berikutnya)
[ ] Dari card terakhir klik › → kembali ke card pertama (loop)
[ ] Pagination dots di bawah menunjukkan halaman aktif
[ ] Klik dot langsung → pindah ke halaman tersebut
[ ] Foto bukti tampil dalam grid 2 kolom
[ ] Klik foto → lightbox fullscreen terbuka
[ ] Lightbox: klik ✕ atau area gelap → tertutup
[ ] Counter "X dari Y testimoni" terupdate saat slide
```

### Checklist Mobile (test di 390px atau DevTools)

```
[ ] Hanya 1 card yang tampil di layar
[ ] Swipe kiri → card berikutnya (smooth animation)
[ ] Swipe kanan → card sebelumnya
[ ] Tombol ‹ dan › tetap ada dan bisa diklik
[ ] Teks 4 baris clamp berfungsi
[ ] Modal teks penuh tampil fullscreen friendly
[ ] Foto lightbox bisa di-scroll jika panjang
[ ] Dots pagination tampil di bawah
```

### Checklist Aksesibilitas

```
[ ] Tombol navigasi punya aria-label
[ ] Carousel punya aria-live="polite"
[ ] Dots punya role="tablist" dan aria-selected
[ ] Modal bisa ditutup dengan tombol Escape
[ ] Foto punya alt text yang deskriptif
```

---

## ══════════════════════════════════════════
## TROUBLESHOOTING
## ══════════════════════════════════════════

### ❌ Semua card tampil vertikal, bukan carousel

```
Penyebab: class w-1/3 tidak bekerja karena parent tidak flex
Solusi: pastikan track div punya class "flex" dan tidak ada "flex-wrap"
```

### ❌ Teks tidak terpotong (selalu tampil penuh)

```
Penyebab: line-clamp tidak support, atau CSS tidak load
Solusi: tambahkan ke CSS global:
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
```

### ❌ Tombol "Baca selengkapnya" tidak muncul di teks pendek

```
Ini normal dan benar — tombol hanya muncul jika teks benar-benar terpotong.
Untuk teks pendek (< 4 baris), tombol tidak perlu ditampilkan.
```

### ❌ Carousel tidak slide, hanya jump

```
Penyebab: CSS transition tidak aktif
Solusi: pastikan ada class "transition-transform duration-500" di track div
        Dan tidak ada "transition-none" yang override
```

### ❌ Swipe tidak berfungsi di mobile

```
Penyebab: event handler tidak terpasang
Solusi: pastikan {...swipe} di-spread ke div yang wrap track
        Cek console — tidak boleh ada error "Cannot read ... of undefined"
```

### ❌ Import '@/hooks/useCarousel' tidak ditemukan

```
Solusi: gunakan path relatif
  import { useCarousel } from '../../hooks/useCarousel';
  Sesuaikan jumlah ../ dengan lokasi file komponen
```

---

## ══════════════════════════════════════════
## RINGKASAN FILE YANG DIBUAT/DIUBAH
## ══════════════════════════════════════════

```
BARU:
  src/hooks/useCarousel.ts            ← logic carousel (index, prev, next, dots)
  src/hooks/useSwipe.ts               ← deteksi touch/mouse swipe gesture
  src/components/ExpandableText.tsx   ← teks 4 baris + "Baca selengkapnya" + modal
  src/components/FotoBuktiGrid.tsx    ← grid foto + lightbox multi-foto

DIUBAH (ganti seluruh isi):
  src/components/TestimoniCard.tsx    ← card redesign: fixed height, clamp, foto grid
  src/components/TestimoniSection.tsx ← carousel wrapper + navigasi + dots + mobile

DIUBAH (tambah di bagian bawah):
  src/index.css atau src/App.css      ← CSS tambahan untuk carousel + modal
```

---

*Prompt ini untuk Gemini Flash di Antigravity.*
*Stack: React + TypeScript + Tailwind CSS + Supabase*
*Estimasi waktu implementasi: 45–90 menit*