# 🛠️ PROMPT UNTUK GEMINI FLASH — ANTIGRAVITY
## Fix: Syntax Error JSX + Gemini 429 Rate Limit + Cache System
## Project: rekapanmitra (React + Vite + TypeScript + Tailwind)

---

## 📋 INSTRUKSI UNTUK AI

Kamu adalah senior React engineer. Ada 2 bug kritis yang harus diperbaiki
secara berurutan. Ikuti setiap langkah dengan teliti.
Jangan ubah logika bisnis yang sudah berjalan — hanya perbaiki yang diminta.

---

## 🔴 BUG YANG HARUS DIPERBAIKI

```
BUG 1: Syntax Error di KatalogProdukPage.tsx baris ~552
        "Unterminated regexp literal" karena spasi di dalam JSX tag

BUG 2: Gemini API 429 Rate Limit
        Model "gemini-3-flash" free tier hanya 20 request/hari
        Perlu ganti model + tambah cache + retry + fallback
```

---

## ══════════════════════════════════════════
## FIX 1 — SYNTAX ERROR di KatalogProdukPage.tsx
## ══════════════════════════════════════════

### Lokasi file
```
src/pages/KatalogProdukPage.tsx
```

### Yang harus dilakukan

Buka file `KatalogProdukPage.tsx`.
Cari semua JSX tag yang memiliki **spasi di dalam tag pembuka atau penutup**.
Ini adalah pola yang salah dan harus diperbaiki.

### Pola yang salah (cari semua yang seperti ini)

```tsx
// ❌ SALAH — ada spasi sebelum tanda >
</section >
</div >
</button >

// ❌ SALAH — ada spasi di sekitar = dan di dalam tag pembuka
< section className = "cta-section" >
< div className = "container" >
< button onClick = {handler} >
```

### Perbaikan yang benar

```tsx
// ✅ BENAR — tidak ada spasi di dalam tag
</section>
</div>
</button>

// ✅ BENAR
<section className="cta-section">
<div className="container">
<button onClick={handler}>
```

### Cara mencari semua instance

Di dalam file `KatalogProdukPage.tsx`, lakukan find & replace dengan regex:
- Cari pola: `</ ` → ganti dengan `</`
- Cari pola: ` >` di dalam JSX → ganti dengan `>`
- Cari pola: `className = "` → ganti dengan `className="`
- Cari pola: `onClick = {` → ganti dengan `onClick={`

### Verifikasi Fix 1 berhasil

Setelah menyimpan file, error Vite di browser harus hilang:
```
✅ TIDAK ADA LAGI: "Unterminated regexp literal"
✅ TIDAK ADA LAGI: "[vite] Failed to reload KatalogProdukPage.tsx"
✅ Halaman katalog bisa diakses tanpa error
```

---

## ══════════════════════════════════════════
## FIX 2 — GEMINI RATE LIMIT
## File yang harus diubah: geminiRAG.ts
## ══════════════════════════════════════════

### Lokasi file
```
src/geminiRAG.ts
  ATAU
src/lib/geminiRAG.ts
  ATAU
src/utils/geminiRAG.ts
```

Cari file dengan nama `geminiRAG.ts` di seluruh folder `src/`.

---

### LANGKAH 2A — Ganti nama model

Di dalam `geminiRAG.ts`, cari baris yang berisi nama model:

```typescript
// ❌ CARI BARIS SEPERTI INI (berbagai kemungkinan):
const model = 'gemini-3-flash'
const GEMINI_MODEL = 'gemini-3-flash'
model: 'gemini-3-flash'
models/gemini-3-flash
```

Ganti semua instance `gemini-3-flash` dengan `gemini-1.5-flash`:

```typescript
// ✅ GANTI MENJADI:
const GEMINI_MODEL = 'gemini-1.5-flash'
// atau di URL string:
// https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

---

### LANGKAH 2B — Ganti seluruh isi file geminiRAG.ts

**PENTING:** Sebelum mengganti, baca dulu isi file yang ada.
Perhatikan:
1. Nama variabel API key yang dipakai (contoh: `VITE_GEMINI_API_KEY`)
2. Nama fungsi yang diekspor (contoh: `generateAIAdvice`)
3. Format prompt yang sudah ada

Setelah membaca, **ganti seluruh isi file** dengan kode berikut.
Pastikan nama fungsi export dan nama env variable SAMA dengan yang asli.

```typescript
// ============================================================
// geminiRAG.ts — versi dengan cache + retry + fallback
// Model: gemini-1.5-flash (1.500 request/hari — gratis)
// ============================================================

// ── Konstanta ────────────────────────────────────────────────────
const GEMINI_MODEL   = 'gemini-1.5-flash';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL     = [
  'https://generativelanguage.googleapis.com/v1beta/models/',
  GEMINI_MODEL,
  ':generateContent?key=',
  GEMINI_API_KEY,
].join('');

const CACHE_TTL_HOURS = 24;  // Cache berlaku 24 jam
const CACHE_PREFIX    = 'bp_gemini_v1_';

// ── Tipe data ─────────────────────────────────────────────────────
interface CacheEntry {
  value: string;
  expiry: number;
}

// ── Cache helpers ─────────────────────────────────────────────────
function buildCacheKey(input: string): string {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 200); // batasi panjang key
  return CACHE_PREFIX + btoa(encodeURIComponent(normalized)).replace(/=/g, '');
}

function readCache(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: string): void {
  try {
    const entry: CacheEntry = {
      value,
      expiry: Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage penuh — cache opsional, tidak perlu throw
    console.warn('[Gemini] Cache write failed — storage mungkin penuh');
  }
}

// ── Bersihkan cache lama (panggil sesekali) ───────────────────────
export function clearExpiredCache(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() > entry.expiry) localStorage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  }
}

// ── Delay helper ───────────────────────────────────────────────────
const wait = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

// ── Fallback statis jika API tidak tersedia ────────────────────────
function buildFallbackResponse(): string {
  return JSON.stringify({
    empati: "Terima kasih sudah berbagi kondisimu. Kami memahami yang kamu rasakan 🌿",
    edukasi: "Banyak kondisi kesehatan umum bisa diperbaiki dengan perubahan gaya hidup yang konsisten dan produk alami yang tepat.",
    tips_gaya_hidup: [
      {
        icon: "💧",
        title: "Perbanyak minum air putih",
        description: "Minimal 8 gelas sehari untuk mendukung semua fungsi tubuh secara optimal.",
      },
      {
        icon: "😴",
        title: "Tidur cukup dan teratur",
        description: "Tidur 7–8 jam di jam yang sama setiap hari membantu pemulihan tubuh secara alami.",
      },
      {
        icon: "🥗",
        title: "Perbanyak sayur dan buah segar",
        description: "Nutrisi alami dari makanan nyata jauh lebih efektif dari suplemen tunggal.",
      },
      {
        icon: "🚶",
        title: "Gerak aktif minimal 30 menit/hari",
        description: "Jalan kaki santai sudah cukup untuk meningkatkan sirkulasi dan energi harian.",
      },
    ],
    rekomendasi: [
      {
        name: "British Propolis",
        emoji: "🍯",
        reason: "Mendukung sistem imun tubuh secara alami dari propolis lebah pilihan",
        price: "Rp 250.000",
      },
      {
        name: "Brassic Pro",
        emoji: "💪",
        reason: "Moringa dan Echinacea untuk stamina dan pemulihan energi harian",
        price: "Rp 250.000",
      },
    ],
    cta: "Untuk panduan yang lebih personal sesuai kondisimu, konsultasikan langsung via WhatsApp kami — gratis dan tanpa tekanan 💬",
  });
}

// ── System prompt ──────────────────────────────────────────────────
function buildPrompt(userInput: string): string {
  return `Kamu adalah konsultan kesehatan yang ramah dan empatik dari BP Group Indonesia.

KELUHAN PENGGUNA: "${userInput}"

INSTRUKSI WAJIB — ikuti urutan ini:
1. Empati: 2 kalimat hangat yang mengakui kondisi mereka
2. Edukasi: 1 paragraf singkat penjelasan penyebab umum
3. Tips gaya hidup: 3-4 tips KONKRET yang bisa dilakukan TANPA membeli produk apapun
4. Rekomendasi produk: 2-3 produk BP Group yang paling relevan + alasan spesifik
5. CTA: ajakan konsultasi WhatsApp yang personal

PRODUK BP GROUP YANG TERSEDIA:
- British Propolis 6ml (Rp 250.000) → imunitas, antibakteri alami, semua usia
- British Propolis Green 6ml (Rp 250.000) → khusus anak 1-12 tahun
- Brassic Pro 40 kapsul (Rp 250.000) → Moringa+Echinacea, stamina, pemulihan
- Brassic Eye 40 kapsul (Rp 250.000) → Bilberry+Gynura, kesehatan mata
- Belgie Facial Wash 100ml (Rp 195.000) → membersihkan dan mencerahkan wajah
- Belgie Anti Aging Serum 10ml (Rp 195.000) → anti penuaan, kolagen
- Belgie Day Cream SPF30+ 10g (Rp 195.000) → proteksi UV siang hari
- Belgie Night Cream 10g (Rp 195.000) → regenerasi kulit malam
- Belgie Hair Tonic 100ml (Rp 195.000) → Anagain Swiss, atasi rambut rontok
- BP Norway 40 softcaps (Rp 250.000) → Salmon Oil Omega-3, otak dan jantung
- Steffi Pro 30ml (Rp 195.000, PROMO dari Rp 250.000) → Stevia, jaga gula darah

ATURAN:
- Jangan sebut produk di bagian tips gaya hidup
- Gunakan bahasa Indonesia yang hangat, tidak kaku
- Jangan buat klaim medis absolut (hindari "menyembuhkan", "mengobati")
- Rekomendasikan hanya produk yang relevan dengan keluhan

FORMAT RESPONS — WAJIB JSON VALID SAJA, tidak ada teks di luar JSON:
{
  "empati": "teks empati 2 kalimat",
  "edukasi": "1 paragraf penjelasan",
  "tips_gaya_hidup": [
    { "icon": "emoji", "title": "judul singkat", "description": "penjelasan 1-2 kalimat" }
  ],
  "rekomendasi": [
    { "name": "nama produk", "emoji": "emoji", "reason": "alasan spesifik 1 kalimat", "price": "Rp xxx.xxx" }
  ],
  "cta": "kalimat ajakan konsultasi WA"
}`;
}

// ── Fungsi utama (SAMA seperti sebelumnya, nama tidak berubah) ─────
export async function generateAIAdvice(userInput: string): Promise<string> {
  // Validasi input
  if (!userInput?.trim()) {
    return buildFallbackResponse();
  }

  // 1. Cek cache — jika ada, langsung return (hemat quota API)
  const cacheKey = buildCacheKey(userInput);
  const cached   = readCache(cacheKey);
  if (cached) {
    console.info('[Gemini] ✅ Cache hit — tidak konsumsi quota');
    return cached;
  }

  // 2. Coba panggil API dengan 2x retry
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.info(`[Gemini] 🔄 API call attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildPrompt(userInput) }],
            },
          ],
          generationConfig: {
            temperature:     0.7,
            maxOutputTokens: 1024,
            topP:            0.9,
          },
        }),
      });

      // Handle 429 Rate Limit
      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const delaySec = (attempt + 1) * 30; // 30s lalu 60s
          console.warn(`[Gemini] ⚠️ Rate limited. Tunggu ${delaySec} detik lalu retry...`);
          await wait(delaySec * 1000);
          continue; // retry
        }
        // Habis semua retry — pakai fallback
        console.error('[Gemini] ❌ Rate limit exhausted setelah semua retry. Pakai fallback.');
        return buildFallbackResponse();
      }

      // Handle error lain
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`Gemini API ${response.status}: ${errorBody}`);
      }

      // Parse response
      const data   = await response.json();
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!result) {
        throw new Error('Gemini returned empty response');
      }

      // 3. Simpan ke cache sebelum return
      writeCache(cacheKey, result);
      console.info('[Gemini] ✅ API call berhasil, disimpan ke cache');

      return result;

    } catch (err: unknown) {
      const isLastAttempt = attempt === MAX_RETRIES;

      if (isLastAttempt) {
        console.error('[Gemini] ❌ Semua retry gagal:', err);
        return buildFallbackResponse();
      }

      // Retry untuk error non-429
      console.warn(`[Gemini] ⚠️ Error pada attempt ${attempt + 1}, retry...`, err);
      await wait(2000);
    }
  }

  // Seharusnya tidak pernah sampai sini, tapi sebagai safety net:
  return buildFallbackResponse();
}
```

---

### LANGKAH 2C — Perbaiki handleAnalyze di KatalogProdukPage.tsx

Buka `src/pages/KatalogProdukPage.tsx`.
Cari fungsi `handleAnalyze` (kemungkinan sekitar baris 60–80).

**Ganti seluruh fungsi handleAnalyze** dengan versi berikut:

```typescript
const handleAnalyze = async () => {
  // Validasi: pastikan ada input sebelum proses
  const hasChips = selectedChips && selectedChips.length > 0;
  const hasText  = inputKeluhan && inputKeluhan.trim().length > 0;

  if (!hasChips && !hasText) return;

  // Gabungkan chips + teks bebas menjadi satu input string
  const inputParts = [
    ...(selectedChips || []),
    hasText ? inputKeluhan.trim() : '',
  ].filter(Boolean);
  const userInput = inputParts.join(', ');

  // Set loading state
  setIsLoading(true);
  setAiResult(null);

  try {
    // Panggil generateAIAdvice — sudah ada retry + cache di dalamnya
    const rawResponse = await generateAIAdvice(userInput);

    // Bersihkan response jika ada markdown fence
    const cleaned = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Jika gagal parse, coba extract JSON dari dalam teks
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Response bukan JSON valid');
      }
    }

    setAiResult(parsed);

  } catch (err) {
    // Error yang tidak terduga — tampilkan pesan ramah, bukan error teknis
    console.error('[handleAnalyze] Unexpected error:', err);

    setAiResult({
      empati: "Maaf, ada kendala teknis saat memproses permintaanmu 😔",
      edukasi: "Tim kami tetap siap membantu secara langsung via WhatsApp.",
      tips_gaya_hidup: [
        {
          icon: "💬",
          title: "Hubungi kami langsung",
          description: "Tim kesehatan BP Group siap konsultasi personal — gratis dan respon cepat.",
        },
      ],
      rekomendasi: [],
      cta: "Ceritakan kondisimu via WhatsApp dan kami bantu pilihkan yang terbaik 🌿",
    });

  } finally {
    setIsLoading(false);
  }
};
```

---

### LANGKAH 2D — Perbaiki Supabase Client Duplikat

Error log menunjukkan:
```
Multiple GoTrueClient instances detected in the same browser context
```

Ini terjadi karena `createClient` dipanggil lebih dari sekali. Perbaiki dengan memastikan
ada **satu file client Supabase** yang di-import ke mana-mana.

**Cek apakah ada file client Supabase yang sudah ada:**

```
src/integrations/supabase/client.ts   ← kemungkinan sudah ada (dari Lovable)
src/lib/supabase.ts                   ← mungkin juga ada
```

**Cari semua file yang memanggil `createClient` dari supabase-js:**

Jalankan pencarian di seluruh `src/` untuk string `createClient`.

Jika ditemukan di lebih dari satu file (misalnya di `geminiRAG.ts` DAN di `client.ts`),
**hapus** semua `createClient` dari `geminiRAG.ts` dan **ganti dengan import** dari file client yang sudah ada.

```typescript
// ❌ HAPUS dari geminiRAG.ts jika ada:
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ✅ GANTI dengan import dari client yang sudah ada:
// Sesuaikan path dengan struktur project aktual
import { supabase } from '@/integrations/supabase/client';
// ATAU
import { supabase } from '@/lib/supabase';
```

**Jika belum ada file client Supabase sama sekali**, buat satu file baru:

```typescript
// src/lib/supabase.ts — BUAT FILE INI jika belum ada

import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  as string;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// createClient dipanggil SEKALI di sini, di-export untuk dipakai di mana saja
export const supabase = createClient(url, key);
```

Lalu di setiap file lain yang butuh supabase:
```typescript
import { supabase } from '@/lib/supabase';
// Tidak boleh ada createClient() lain di luar file ini
```

---

## ══════════════════════════════════════════
## VERIFIKASI AKHIR — SEMUA FIX
## ══════════════════════════════════════════

### Cek 1 — Console browser bersih

Buka halaman katalog, buka DevTools Console (F12).
Yang TIDAK BOLEH muncul lagi:

```
❌ "Unterminated regexp literal"
❌ "Failed to reload KatalogProdukPage.tsx"
❌ "Multiple GoTrueClient instances detected"
❌ "429 Too Many Requests"
❌ "quota exceeded"
```

Yang boleh muncul (normal):
```
✅ "[Gemini] 🔄 API call attempt 1/3"
✅ "[Gemini] ✅ API call berhasil, disimpan ke cache"
✅ "[Gemini] ✅ Cache hit — tidak konsumsi quota"  ← muncul saat input sama
```

---

### Cek 2 — Test fungsional konsultasi AI

```
Langkah 1: Buka halaman katalog
Langkah 2: Klik beberapa chip keluhan (contoh: "Susah Tidur", "Kurang Stamina")
Langkah 3: Klik tombol "Analisis Kondisiku"
Langkah 4: Tunggu loading selesai

Hasil yang diharapkan:
✅ Loading indicator muncul saat proses
✅ Hasil konsultasi tampil (empati + tips + produk)
✅ TIDAK ada pesan error di UI

Langkah 5: Klik chip yang SAMA dan analisis lagi

Hasil yang diharapkan:
✅ Respons muncul LEBIH CEPAT (dari cache)
✅ Di console muncul: "[Gemini] ✅ Cache hit"
✅ Quota API TIDAK berkurang untuk request ke-2
```

---

### Cek 3 — Test fallback (opsional, untuk memastikan UI tidak rusak)

```
Cara test fallback tanpa matikan internet:
1. Buka DevTools → Network tab
2. Klik "Throttle" → pilih "Offline"
3. Buka halaman fresh (Ctrl+Shift+R untuk clear cache)
4. Coba analisis keluhan

Hasil yang diharapkan:
✅ UI TIDAK crash atau blank
✅ Muncul pesan fallback yang ramah (bukan error teknis)
✅ Tetap ada CTA WhatsApp yang bisa diklik user
```

---

## ══════════════════════════════════════════
## RINGKASAN PERUBAHAN
## ══════════════════════════════════════════

```
FILE 1: src/pages/KatalogProdukPage.tsx
  - Fix: hapus semua spasi di dalam JSX tags (</section >, className = "...")
  - Update: fungsi handleAnalyze dengan error handling yang lebih baik

FILE 2: src/geminiRAG.ts (atau path sesuai project)
  - Update: model dari "gemini-3-flash" → "gemini-1.5-flash"
  - Tambah: cache localStorage 24 jam
  - Tambah: retry logic (max 2x, delay 30s & 60s)
  - Tambah: fallback response saat API tidak tersedia
  - Tambah: fungsi clearExpiredCache()
  - Fix: hapus createClient duplikat (jika ada)

FILE 3: src/lib/supabase.ts (buat baru jika belum ada)
  - Satu-satunya tempat createClient dipanggil
  - Di-import ke semua file yang butuh supabase
```

---

## ══════════════════════════════════════════
## TROUBLESHOOTING — JIKA MASIH ERROR
## ══════════════════════════════════════════

### ❌ Masih muncul syntax error setelah fix JSX

```
Kemungkinan: masih ada tag JSX bermasalah di file yang sama
Solusi: Jalankan TypeScript compiler untuk cek semua error
  npx tsc --noEmit
  Lihat semua error yang muncul dan fix satu per satu
```

### ❌ Masih muncul 429 setelah ganti model

```
Kemungkinan: model name belum berubah (ada di lebih dari satu tempat)
Solusi: Cari di seluruh project string "gemini-3-flash"
  Ganti semua instance yang ditemukan dengan "gemini-1.5-flash"
```

### ❌ Cache tidak berfungsi (selalu hit API)

```
Kemungkinan: localStorage tidak tersedia (mode incognito)
Solusi: ini normal — fallback ke API call biasa, tidak perlu fix
```

### ❌ "Cannot find module '@/lib/supabase'"

```
Kemungkinan: alias @ belum dikonfigurasi
Solusi: gunakan path relatif sebagai gantinya
  import { supabase } from '../../lib/supabase';
  Sesuaikan jumlah ../ dengan lokasi file
```

### ❌ Multiple GoTrueClient masih muncul setelah fix

```
Kemungkinan: ada file lain yang belum ditemukan yang masih createClient
Solusi: cari di seluruh src/ dengan grep:
  Cari string: "createClient("
  Pastikan hanya ada di SATU file (src/lib/supabase.ts)
  Semua file lain harus import dari sana
```

---

*Prompt ini untuk Gemini Flash di Antigravity.*
*Project: rekapanmitra — React + Vite + TypeScript + Tailwind + Supabase + Gemini API*
*Setelah semua fix diterapkan, estimasi quota habis: ~1.500 request/hari (gemini-1.5-flash free)*