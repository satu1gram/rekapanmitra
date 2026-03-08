# 🧠 PROMPT UNTUK GEMINI FLASH — ANTIGRAVITY
## Redesign: Panel Kanan AI Konsultasi → Engagement & Trust Builder
## Project: rekapanmitra / QM Millionaire — React + Tailwind

---

## 📋 INSTRUKSI UNTUK AI

Kamu adalah senior UI/UX engineer dan conversion rate optimizer.
Tugas: redesign panel kanan dari section konsultasi AI agar mendorong
user untuk benar-benar menggunakan fitur AI, bukan hanya melihat lalu pergi.

Ikuti setiap langkah secara berurutan.

---

## 🔍 AUDIT KONDISI SAAT INI

```
Panel kanan saat ini menampilkan:
  - Ilustrasi tanaman kecil di tengah
  - Teks "Mulai dari Sini"
  - Deskripsi singkat cara pakai

MASALAH KONVERSI:
  ❌ Panel kanan KOSONG dan PASIF — tidak ada motivasi untuk action
  ❌ "Mulai dari Sini" terlalu generik, tidak menciptakan urgensi
  ❌ Tidak ada social proof — user tidak tahu apakah AI ini terpercaya
  ❌ Tidak ada preview hasil — user tidak tahu APA yang akan mereka dapatkan
  ❌ Ilustrasi tanaman terlalu abstrak, tidak relevan dengan kesehatan
  ❌ Tombol "Analisis Kesehatanku" terlihat muted (warna abu-abu gelap)
     dan tidak assosiatif dengan aksi positif
  ❌ Ruang putih besar di kanan atas — wasted space yang bisa dipakai trust signal
```

---

## 🎯 STRATEGI REDESIGN

```
Prinsip: Panel kanan harus aktif "menjual" manfaat AI sebelum user klik.

3 State yang harus didesain:

STATE 1 — DEFAULT (sebelum user pilih chip apapun):
  Tampilkan: preview hasil AI + social proof + micro-copy persuasif
  Tujuan: tunjukkan VALUE sebelum user commit

STATE 2 — CHIP DIPILIH (user sudah pilih ≥1 chip):
  Tampilkan: animated indicator "siap dianalisis" + preview personal
  Tujuan: beri feedback visual bahwa AI sudah "memperhatikan" pilihan mereka

STATE 3 — LOADING (setelah klik Analisis):
  Tampilkan: loading yang engaging, bukan spinner biasa
  Tujuan: kurangi rasa tunggu dengan storytelling visual
```

---

## ══════════════════════════════════════════
## LANGKAH 1 — TEMUKAN FILE YANG PERLU DIUBAH
## ══════════════════════════════════════════

Cari komponen yang mengelola state konsultasi AI.
Kemungkinan nama file:

```
src/pages/KatalogProdukPage.tsx      ← kemungkinan utama
src/components/KonsultasiSection.tsx
src/components/AIConsultation.tsx
src/components/HeroSection.tsx
```

Buka file tersebut. Perhatikan:
- Nama state untuk chips yang dipilih (contoh: `selectedChips`)
- Nama state untuk loading (contoh: `isLoading`)
- Nama state untuk hasil AI (contoh: `aiResult`)
- Bagian JSX yang render panel kanan (yang berisi "Mulai dari Sini")

---

## ══════════════════════════════════════════
## LANGKAH 2 — BUAT KOMPONEN AIPreviewPanel
## (Panel kanan yang baru — STATE 1: Default)
## ══════════════════════════════════════════

### Lokasi file
```
src/components/AIPreviewPanel.tsx   ← BUAT FILE BARU INI
```

### Isi file lengkap

```tsx
// src/components/AIPreviewPanel.tsx
// Panel kanan konsultasi AI dengan 3 state: default, chip selected, loading

import { useEffect, useState } from 'react';

// ── Tipe ─────────────────────────────────────────────────────────
interface Props {
  selectedChips: string[];   // chip keluhan yang sudah dipilih user
  isLoading:     boolean;    // sedang loading API call
  hasResult:     boolean;    // sudah ada hasil AI
}

// ── Data contoh hasil AI (untuk preview di state default) ────────
const PREVIEW_EXAMPLE = {
  keluhan: 'Susah Tidur & Kurang Stamina',
  tips: [
    { icon: '🌙', text: 'Hindari layar HP 1 jam sebelum tidur' },
    { icon: '🍵', text: 'Minum teh chamomile hangat sebelum tidur' },
    { icon: '🚶', text: 'Jalan kaki 15 menit setiap pagi hari' },
  ],
  produk: 'British Propolis + Brassic Pro',
};

// ── Counter statistik ────────────────────────────────────────────
const STATS = [
  { value: '690+', label: 'Konsultasi selesai' },
  { value: '98%',  label: 'Puas dengan saran' },
  { value: '<10s', label: 'Rata-rata respons' },
];

// ── Rotating headline untuk state default ────────────────────────
const ROTATING_HEADLINES = [
  'Dapatkan panduan gaya hidup personal dalam 10 detik 🌿',
  'Ribuan keluarga sudah merasakan manfaatnya ✨',
  'Gratis. Tanpa daftar. Tanpa data pribadi. 🔒',
  'AI kami baca keluhanmu, bukan sekadar jual produk 💚',
];

// ═══════════════════════════════════════════
// Sub-komponen: Default State
// ═══════════════════════════════════════════
function DefaultState() {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [fade,        setFade       ] = useState(true);

  // Rotasi headline setiap 3 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setHeadlineIdx(i => (i + 1) % ROTATING_HEADLINES.length);
        setFade(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* ── Rotating headline persuasif ── */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
        <p
          className="text-sm font-medium text-[#2A5936] text-center leading-snug
                     transition-opacity duration-300"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {ROTATING_HEADLINES[headlineIdx]}
        </p>
      </div>

      {/* ── Preview "Begini contoh hasilnya" ── */}
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          👀 Contoh hasil untuk:
          <span className="text-[#3D7A4F] normal-case font-semibold ml-1">
            "{PREVIEW_EXAMPLE.keluhan}"
          </span>
        </p>

        {/* Preview tips gaya hidup */}
        <div className="space-y-2 mb-4">
          {PREVIEW_EXAMPLE.tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 bg-white border border-green-100
                         rounded-xl p-3"
            >
              <span className="text-base flex-shrink-0">{tip.icon}</span>
              <p className="text-xs text-gray-600 leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>

        {/* Blur overlay — "ini cuma preview, hasilmu bisa berbeda" */}
        <div className="relative">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3
                          filter blur-[2px] select-none pointer-events-none">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              🛍️ Rekomendasi Produk
            </p>
            <p className="text-xs text-gray-600">
              {PREVIEW_EXAMPLE.produk}
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white/90 text-xs font-semibold text-[#3D7A4F]
                             px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
              🔍 Analisis dulu untuk lihat rekomendasimu
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats social proof ── */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
        {STATS.map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-lg font-bold text-[#3D7A4F]">{s.value}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Trust badges ── */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {['🔒 Privasi terjaga', '✅ Gratis', '⚡ < 10 detik'].map((badge, i) => (
          <span
            key={i}
            className="text-[10px] font-medium text-gray-500
                       bg-gray-50 border border-gray-200
                       px-2.5 py-1 rounded-full"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Sub-komponen: Chip Selected State
// ═══════════════════════════════════════════
function ChipSelectedState({ chips }: { chips: string[] }) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center">

      {/* Animated "AI memperhatikan" indicator */}
      <div className="relative">
        {/* Outer pulse ring */}
        <div
          className={`absolute inset-0 rounded-full bg-green-200
                      transition-all duration-700 ease-in-out
                      ${pulse ? 'scale-125 opacity-30' : 'scale-100 opacity-0'}`}
        />
        {/* Inner circle */}
        <div className="relative w-20 h-20 rounded-full bg-green-100
                        flex items-center justify-center">
          <span className="text-3xl">🧬</span>
        </div>
      </div>

      <div>
        <p className="text-base font-bold text-[#2A5936] mb-1">
          AI siap menganalisis
        </p>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
          Kamu memilih{' '}
          <span className="font-semibold text-[#3D7A4F]">
            {chips.length} keluhan
          </span>
          . Klik tombol untuk dapatkan panduan personalmu.
        </p>
      </div>

      {/* Chips yang dipilih — tampilkan ulang sebagai konfirmasi */}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
        {chips.map((chip, i) => (
          <span
            key={i}
            className="text-xs bg-green-100 text-[#2A5936] font-medium
                       px-3 py-1.5 rounded-full border border-green-200"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Arrow down hint menuju tombol */}
      <div className="flex flex-col items-center gap-1 text-gray-400">
        <p className="text-xs">Klik tombol di bawah</p>
        <div className="flex flex-col gap-0.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1 h-1 bg-green-300 rounded-full mx-auto
                         animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Sub-komponen: Loading State
// ═══════════════════════════════════════════
const LOADING_STEPS = [
  { icon: '🔍', text: 'Membaca kondisimu...',           duration: 2500 },
  { icon: '🧠', text: 'Menganalisis pola kesehatan...', duration: 2500 },
  { icon: '🌿', text: 'Menyiapkan panduan hidup sehat...', duration: 2000 },
  { icon: '💊', text: 'Mencocokkan produk yang tepat...', duration: 2000 },
  { icon: '✨', text: 'Hampir selesai...',               duration: 99999 },
];

function LoadingState() {
  const [stepIdx,   setStepIdx  ] = useState(0);
  const [progress,  setProgress ] = useState(0);

  // Step progression
  useEffect(() => {
    let elapsed = 0;
    let currentStep = 0;

    const advance = () => {
      if (currentStep >= LOADING_STEPS.length - 1) return;
      elapsed += LOADING_STEPS[currentStep].duration;
      currentStep += 1;
      setStepIdx(currentStep);
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    let acc = 0;
    LOADING_STEPS.forEach((step, i) => {
      if (i === LOADING_STEPS.length - 1) return;
      acc += step.duration;
      timers.push(setTimeout(() => setStepIdx(i + 1), acc));
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Progress bar
  useEffect(() => {
    const totalDuration = LOADING_STEPS.slice(0, -1)
      .reduce((sum, s) => sum + s.duration, 0);

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / totalDuration) * 90, 90);
      setProgress(pct);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const currentStep = LOADING_STEPS[stepIdx];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-4">

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Menganalisis</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3D7A4F] to-[#52B788]
                       rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step icon — animated */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-green-50 border-2 border-green-100
                        flex items-center justify-center">
          <span
            key={stepIdx}
            className="text-4xl animate-bounce"
            style={{ animationDuration: '1s' }}
          >
            {currentStep.icon}
          </span>
        </div>
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent
                        border-t-[#3D7A4F] animate-spin" />
      </div>

      {/* Step text */}
      <div>
        <p
          key={stepIdx}
          className="text-base font-semibold text-[#2A5936] mb-1
                     transition-all duration-300"
        >
          {currentStep.text}
        </p>
        <p className="text-xs text-gray-400">
          Biasanya selesai dalam 5–10 detik
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i < stepIdx
                ? 'w-2 h-2 bg-[#3D7A4F]'
                : i === stepIdx
                  ? 'w-4 h-2 bg-[#3D7A4F]'
                  : 'w-2 h-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Fun fact saat loading */}
      <div className="bg-green-50 rounded-xl p-3 max-w-xs">
        <p className="text-xs text-gray-500 italic">
          💡 Tahukah kamu? Propolis lebah mengandung lebih dari 300 senyawa
          aktif yang mendukung sistem imun tubuh secara alami.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════
export function AIPreviewPanel({ selectedChips, isLoading, hasResult }: Props) {
  // Jika sudah ada hasil, panel ini tidak perlu dirender
  // (hasil ditangani oleh komponen hasil AI yang sudah ada)
  if (hasResult) return null;

  return (
    <div className="h-full min-h-[500px] flex flex-col">
      {isLoading ? (
        <LoadingState />
      ) : selectedChips.length > 0 ? (
        <ChipSelectedState chips={selectedChips} />
      ) : (
        <DefaultState />
      )}
    </div>
  );
}
```

---

## ══════════════════════════════════════════
## LANGKAH 3 — REDESIGN TOMBOL ANALISIS
## ══════════════════════════════════════════

Tombol "Analisis Kesehatanku" saat ini terlihat muted (warna gelap, tidak menarik).
Ganti dengan versi yang lebih engaging.

Cari tombol submit di file halaman utama.
**Ganti** elemen tombol tersebut dengan kode berikut:

```tsx
{/* Ganti tombol lama dengan ini */}
<button
  onClick={handleAnalyze}
  disabled={isLoading || (selectedChips.length === 0 && !inputKeluhan?.trim())}
  className={[
    'w-full py-4 rounded-2xl font-bold text-base',
    'transition-all duration-300 relative overflow-hidden',
    'flex items-center justify-center gap-2',
    // State: disabled (belum ada input)
    selectedChips.length === 0 && !inputKeluhan?.trim()
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      // State: loading
      : isLoading
        ? 'bg-[#3D7A4F] text-white cursor-wait'
        // State: siap diklik
        : [
            'bg-gradient-to-r from-[#3D7A4F] to-[#52B788]',
            'text-white shadow-lg shadow-green-200/50',
            'hover:shadow-xl hover:shadow-green-200/60',
            'hover:-translate-y-0.5 active:translate-y-0',
          ].join(' '),
  ].join(' ')}
  aria-label="Analisis kondisi kesehatanku"
>
  {/* Shimmer effect saat hover */}
  {!isLoading && selectedChips.length > 0 && (
    <div className="absolute inset-0 -skew-x-12 translate-x-[-200%]
                    bg-white/20 w-1/3
                    group-hover:translate-x-[400%] transition-transform duration-700" />
  )}

  {isLoading ? (
    <>
      <div className="w-4 h-4 border-2 border-white/30 border-t-white
                      rounded-full animate-spin" />
      <span>Menganalisis...</span>
    </>
  ) : selectedChips.length === 0 && !inputKeluhan?.trim() ? (
    <>
      <span>⬆️</span>
      <span>Pilih keluhan dulu di atas</span>
    </>
  ) : (
    <>
      <span className="text-xl">🔍</span>
      <span>Analisis Kondisiku — Gratis!</span>
    </>
  )}
</button>

{/* Micro-copy di bawah tombol */}
{!isLoading && (
  <p className="text-center text-xs text-gray-400 mt-2">
    {selectedChips.length > 0
      ? `${selectedChips.length} keluhan dipilih · Klik untuk dapatkan panduan personal`
      : 'Pilih minimal 1 keluhan atau ceritakan kondisimu'}
  </p>
)}
```

---

## ══════════════════════════════════════════
## LANGKAH 4 — INTEGRASI AIPreviewPanel
## ══════════════════════════════════════════

Buka file halaman utama (yang berisi JSX panel kanan).

### 4A. Tambahkan import

```tsx
import { AIPreviewPanel } from '@/components/AIPreviewPanel';
```

### 4B. Temukan panel kanan

Cari bagian JSX yang berisi teks "Mulai dari Sini" atau ilustrasi tanaman.
Ini adalah panel kanan yang perlu diganti.

Biasanya strukturnya seperti:
```tsx
{/* Panel kanan */}
<div className="...">
  {aiResult ? (
    {/* Tampilan hasil AI */}
  ) : (
    {/* INI YANG DIGANTI — "Mulai dari Sini" */}
    <div>
      <img ... />
      <p>Mulai dari Sini</p>
      ...
    </div>
  )}
</div>
```

### 4C. Ganti bagian "Mulai dari Sini" dengan AIPreviewPanel

```tsx
{/* Panel kanan */}
<div className="...">
  {aiResult ? (
    {/* Tampilan hasil AI — JANGAN UBAH BAGIAN INI */}
    ...
  ) : (
    {/* GANTI yang lama dengan ini: */}
    <AIPreviewPanel
      selectedChips={selectedChips}
      isLoading={isLoading}
      hasResult={!!aiResult}
    />
  )}
</div>
```

**PENTING:** Sesuaikan nama props dengan nama state yang ada di file:
- `selectedChips` → nama state array chip yang dipilih
- `isLoading` → nama state boolean loading
- `aiResult` → nama state hasil AI (untuk cek `hasResult`)

---

## ══════════════════════════════════════════
## LANGKAH 5 — TAMBAHKAN ANIMASI CHIP SELECTION
## ══════════════════════════════════════════

Saat user klik chip, beri feedback visual lebih kuat.

Cari handler klik chip di file halaman (biasanya `handleChipClick` atau `toggleChip`).

Tambahkan class animasi pada chip yang sudah dipilih:

```tsx
{/* Chip item — ganti style className yang ada */}
<button
  key={chip}
  onClick={() => toggleChip(chip)}
  className={[
    'px-4 py-2 rounded-full text-sm font-medium',
    'border transition-all duration-200',
    'select-none',
    selectedChips.includes(chip)
      ? [
          'bg-[#3D7A4F] text-white border-[#3D7A4F]',
          'shadow-md shadow-green-200/50',
          'scale-105',           // ← sedikit membesar saat dipilih
        ].join(' ')
      : [
          'bg-white text-gray-700 border-gray-200',
          'hover:border-[#3D7A4F] hover:text-[#3D7A4F]',
          'hover:shadow-sm',
        ].join(' '),
  ].join(' ')}
  aria-pressed={selectedChips.includes(chip)}
>
  {chip}
</button>
```

---

## ══════════════════════════════════════════
## LANGKAH 6 — TAMBAHKAN HEADER SECTION
## yang lebih persuasif
## ══════════════════════════════════════════

Cari bagian header section konsultasi AI (biasanya di atas form).
Tambahkan atau modifikasi elemen-elemen ini:

```tsx
{/* Badge "AI Health Advisor" — buat lebih menarik */}
<div className="inline-flex items-center gap-2 bg-green-50 border border-green-200
                rounded-full px-4 py-1.5 mb-4">
  {/* Dot hijau berkedip */}
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full
                     rounded-full bg-[#3D7A4F] opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3D7A4F]" />
  </span>
  <span className="text-xs font-bold text-[#3D7A4F] tracking-widest uppercase">
    AI Health Advisor
  </span>
  <span className="text-xs text-gray-400">·</span>
  <span className="text-xs text-gray-500">Gratis</span>
</div>

{/* Headline — sudah bagus, pertahankan */}
{/* Sub-headline — tambahkan micro-copy yang lebih persuasif */}
<p className="text-gray-600 text-sm leading-relaxed mt-3">
  Ceritakan kondisimu. AI kami baca keluhanmu dengan empati,
  beri panduan hidup sehat dulu — baru rekomendasikan produk yang benar-benar cocok.
  <span className="block mt-1 text-[#3D7A4F] font-medium">
    Sudah 690+ keluarga terbantu. 🌿
  </span>
</p>
```

---

## ══════════════════════════════════════════
## LANGKAH 7 — TAMBAHKAN ANIMASI SAAT HASIL MUNCUL
## ══════════════════════════════════════════

Saat hasil AI pertama kali muncul, tambahkan animasi masuk.

Cari div yang menampilkan hasil AI dan tambahkan class animasi:

```tsx
{/* Wrapper hasil AI — tambahkan animasi fade-in dari bawah */}
<div
  className="animate-[fadeInUp_0.5s_ease-out_forwards]"
  key={JSON.stringify(aiResult)} // re-trigger animasi setiap hasil baru
>
  {/* ... konten hasil AI yang sudah ada ... */}
</div>
```

Tambahkan keyframe di CSS global (src/index.css):

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## ══════════════════════════════════════════
## LANGKAH 8 — VERIFIKASI
## ══════════════════════════════════════════

### Checklist STATE 1 — Default (sebelum klik chip apapun)

```
[ ] Panel kanan menampilkan rotating headline (berganti tiap 3.5 detik)
[ ] Preview contoh hasil dengan 3 tips gaya hidup terlihat
[ ] Bagian "Rekomendasi Produk" terlihat blur dengan overlay teks
[ ] Tiga stat angka tampil di bawah: "690+", "98%", "<10s"
[ ] Trust badges tampil: "🔒 Privasi terjaga", "✅ Gratis", "⚡ < 10 detik"
[ ] Tombol submit menampilkan "⬆️ Pilih keluhan dulu di atas"
[ ] Tombol dalam kondisi disabled (tidak bisa diklik)
```

### Checklist STATE 2 — Setelah pilih chip

```
[ ] Panel kanan berubah ke tampilan "AI siap menganalisis"
[ ] Ada animasi pulse ring di sekitar icon 🧬
[ ] Chip yang dipilih ditampilkan ulang di panel kanan
[ ] Ada arrow hint mengarah ke bawah
[ ] Tombol submit berubah menjadi "🔍 Analisis Kondisiku — Gratis!"
[ ] Tombol berwarna gradient hijau dan aktif (bisa diklik)
[ ] Chip yang dipilih membesar sedikit (scale-105) dengan shadow
[ ] Micro-copy di bawah tombol: "X keluhan dipilih · Klik untuk dapatkan panduan"
```

### Checklist STATE 3 — Loading

```
[ ] Panel kanan menampilkan loading multi-step
[ ] Progress bar dari 0% naik perlahan sampai ~90%
[ ] Icon berubah sesuai step: 🔍 → 🧠 → 🌿 → 💊 → ✨
[ ] Teks berubah sesuai step yang sedang berjalan
[ ] Step indicator dots berubah (aktif = lebih lebar, selesai = filled)
[ ] Fun fact tentang propolis tampil di bawah
[ ] Tombol submit menampilkan spinner + "Menganalisis..."
[ ] Tombol tidak bisa diklik saat loading
```

### Checklist Mobile (test di 390px)

```
[ ] Panel preview tetap readable di layar kecil
[ ] Di mobile, panel kanan muncul DI BAWAH form (bukan di samping)
[ ] Semua tap target minimal 44px
[ ] Animasi tetap smooth di mobile
```

---

## ══════════════════════════════════════════
## TROUBLESHOOTING
## ══════════════════════════════════════════

### ❌ AIPreviewPanel tidak muncul

```
Kemungkinan: kondisi render terbalik
Cek: aiResult di saat pertama load harus null/undefined
     AIPreviewPanel hanya muncul saat !aiResult
```

### ❌ Panel kanan masih tampil "Mulai dari Sini" yang lama

```
Kemungkinan: JSX lama belum dihapus, hanya ditambah
Solusi: Hapus seluruh blok JSX lama (div yang berisi ilustrasi + "Mulai dari Sini")
        Ganti HANYA dengan <AIPreviewPanel ... />
```

### ❌ Props tidak terkirim dengan benar

```
Solusi: tambahkan console.log sementara untuk debug
  console.log('selectedChips:', selectedChips);
  console.log('isLoading:', isLoading);
  console.log('aiResult:', aiResult);
Hapus setelah masalah terselesaikan.
```

### ❌ Animasi rotate headline tidak berjalan

```
Kemungkinan: useEffect tidak berjalan
Cek: komponen AIPreviewPanel sudah di-import dengan benar
     Tidak ada SSR/hydration issue
```

### ❌ Tombol tetap disabled meski sudah pilih chip

```
Kemungkinan: kondisi disabled tidak cocok dengan nama state
Sesuaikan: ganti 'selectedChips' dengan nama state array chip yang ada
           ganti 'inputKeluhan' dengan nama state textarea yang ada
```

---

## ══════════════════════════════════════════
## RINGKASAN FILE YANG DIBUAT/DIUBAH
## ══════════════════════════════════════════

```
BARU:
  src/components/AIPreviewPanel.tsx   ← panel kanan dengan 3 state

DIUBAH:
  src/pages/KatalogProdukPage.tsx (atau file halaman utama):
    - Integrasi <AIPreviewPanel> menggantikan "Mulai dari Sini"
    - Redesign tombol submit dengan 3 state visual
    - Animasi chip selection (scale + shadow saat dipilih)
    - Header badge dengan pulse dot
    - Sub-headline lebih persuasif
    - Wrapper hasil AI dengan animasi fadeInUp

  src/index.css (atau file CSS global):
    - @keyframes fadeInUp
```

---

*Prompt ini untuk Gemini Flash di Antigravity.*
*Stack: React + TypeScript + Tailwind CSS*
*Estimasi waktu implementasi: 30–60 menit*