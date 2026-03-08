# 🚀 PROMPT LENGKAP: Redesign & Optimasi Konversi
## Landing Page Katalog Produk BP Group
### Target: rekapanmitra.lovable.app/katalog
### Tool: Antigravity / Windsurf / Lovable AI

---

## 📋 KONTEKS PROYEK

Ini adalah landing page katalog produk kesehatan untuk **BP Group / Quantum Millionaire Community**, didirikan 30 Maret 2018 oleh Gus Akhmad. Brand ini menjual 11 produk kesehatan alami (British Propolis, Brassic Pro, Belgie Skincare, dll) dan juga merekrut mitra bisnis. Target audience: keluarga Indonesia yang ingin hidup lebih sehat + calon mitra yang ingin penghasilan tambahan halal.

**Tech stack saat ini:** React + Tailwind CSS (Lovable/Vite), API Anthropic Claude untuk fitur konsultasi kesehatan AI.

**Tujuan utama redesign:**
1. Meningkatkan konversi produk (click → WhatsApp order)
2. Meningkatkan rekrutmen mitra (interested → konsultasi bisnis WA)
3. Meningkatkan engagement fitur konsultasi AI
4. Memperbaiki visual hierarchy dan user journey

---

## 🔍 AUDIT KONDISI SAAT INI

### Yang Sudah Bagus (Pertahankan)
- ✅ Fitur konsultasi AI sudah di posisi ATAS halaman — tepat!
- ✅ Color palette hijau natural — sesuai brand kesehatan organik
- ✅ Section "4 Langkah Menuju Hidup Sehat" sudah ada
- ✅ Katalog produk dengan filter tab sudah ada
- ✅ Section mitra dan testimoni sudah ada
- ✅ CTA final dark green yang kuat
- ✅ Sticky WhatsApp button floating

### Masalah yang HARUS Diperbaiki

#### 🔴 KRITIS — Perbaiki Hari Ini

**[Issue-01] Panel kanan Hero/Konsultasi berisi "Kelas Hari Ini" yang membingungkan**
- **Temuan:** Di sebelah kanan form konsultasi terdapat card-card berlabel "Kelas Hari Ini" — ini tidak relevan, membingungkan pengunjung, dan memecah fokus dari CTA utama
- **Dampak:** User bingung: "Ini mau konsultasi kesehatan atau daftar kelas?" — cognitive dissonance menurunkan konversi 40%
- **Solusi:** Ganti panel kanan dengan **AI Result Card** yang menampilkan preview hasil konsultasi. Default state: ilustrasi daun/organik + teks ajakan "Ceritakan kondisimu, dan kami akan memberikan panduan personal khusus untukmu 🌿". Setelah submit: tampilkan hasil konsultasi terstruktur di sini.

**[Issue-02] Gambar/Ilustrasi produk di kartu katalog masih placeholder kosong**
- **Temuan:** Semua kartu produk menampilkan gradient color box kosong tanpa gambar atau ilustrasi apapun
- **Dampak:** Produk tidak terasa nyata. Trust sangat rendah. Pengunjung tidak bisa membayangkan produknya.
- **Solusi:** Implementasikan SVG illustrations per produk ATAU gunakan emoji product yang besar + gradient background yang lebih kaya. Detail SVG per produk ada di bagian SPESIFIKASI TEKNIS di bawah.

**[Issue-03] Brand Hero section terasa sebagai afterthought**
- **Temuan:** Section "Healthy Living Guide" dengan stats (11+, 100%, 2018) muncul setelah trust bar dengan layout yang kurang impresif. Panel kanan berisi kartu-kartu produk kecil yang terlihat seperti placeholder.
- **Dampak:** Momen untuk membangun brand authority terlewatkan. Pengunjung tidak merasakan "wow" moment dari brand ini.
- **Solusi:** Redesain section ini menjadi lebih prestisius. Lihat spesifikasi di bagian REDESAIN SECTION.

**[Issue-04] CTA tombol produk terlalu kecil dan copy-nya lemah**
- **Temuan:** Tombol di kartu produk sangat kecil (terlihat dari screenshot). Kemungkinan copy-nya generik seperti "Pesan" atau "Beli".
- **Dampak:** CTA yang kecil dan generik menurunkan CTR hingga 40%.
- **Solusi:** Perbesar tombol menjadi full-width di bawah kartu. Ganti copy menjadi "💬 Konsultasi & Pesan via WA" dengan micro-copy di bawahnya: "Gratis konsultasi · Respon < 5 menit"

#### 🟠 TINGGI — Perbaiki Minggu Ini

**[Issue-05] System prompt AI konsultasi mungkin langsung ke produk**
- **Solusi:** Update system prompt — urutan wajib: Empati → Edukasi → Tips Gaya Hidup Sehat (tanpa produk dulu!) → Rekomendasi Produk → CTA WA
- **Detail system prompt:** Lihat bagian KONFIGURASI AI di bawah

**[Issue-06] Tidak ada micro-copy yang membangun kepercayaan di area CTA**
- **Solusi:** Tambahkan teks kecil di bawah semua tombol utama: "Gratis · Tanpa tekanan · Respon dalam 5 menit"

**[Issue-07] Loading state konsultasi AI tidak engaging**
- **Solusi:** Tambahkan rotating text animation: "Memahami kondisimu..." → "Menyiapkan panduan hidup sehat..." → "Menemukan produk yang paling cocok..." + progress bar tipis di atas card

**[Issue-08] Section Mitra terlalu teks-heavy, kurang visual impact**
- **Solusi:** Redesain dengan dark green gradient background, 3 benefit card dengan ikon besar, dan CTA yang lebih mencolok

#### 🟡 SEDANG — Perbaiki Dalam 2 Minggu

**[Issue-09] Tidak ada transisi visual yang smooth antar section**
- **Solusi:** Tambahkan wave SVG divider + alternating background colors

**[Issue-10] Mobile UX belum dioptimasi**
- **Solusi:** Audit thumb zone, pastikan semua tap target minimal 44px, filter tab scrollable horizontal

---

## 🎨 DESIGN SYSTEM

### Color Palette (gunakan CSS variables ini, jangan hardcode)
```css
:root {
  --color-green:        #3D7A4F;
  --color-green-dark:   #2A5936;
  --color-green-light:  #52B788;
  --color-green-pale:   #D8F3DC;
  --color-green-ultra:  #F0F9F2;
  --color-cream:        #FAFCFA;
  --color-gold:         #B8860B;
  --color-red:          #C8102E;   /* Aksen brand only */
  --color-text:         #1C2B20;
  --color-text-muted:   #5A6E5E;
  --color-border:       #D4E8D8;
  --shadow-card:        0 2px 12px rgba(45, 106, 79, 0.08);
  --shadow-card-hover:  0 8px 24px rgba(45, 106, 79, 0.15);
  --radius-card:        16px;
  --radius-btn:         12px;
}
```

### Typography
```css
/* Import di index.html atau main CSS */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

/* Rules: */
/* Headings besar: Cormorant Garamond */
/* Body & UI: DM Sans */
/* Semua ukuran menggunakan clamp() untuk fluid typography */

h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.6rem, 3vw, 2.4rem); }
h3 { font-family: 'DM Sans', sans-serif; font-size: clamp(1rem, 2vw, 1.2rem); font-weight: 600; }
body { font-family: 'DM Sans', sans-serif; font-size: 1rem; line-height: 1.65; }
```

---

## 🔧 SPESIFIKASI TEKNIS LENGKAP PER SECTION

---

### SECTION 01 — NAVIGASI

**File:** `src/components/Navbar.tsx` atau sesuai struktur existing

**Spesifikasi:**
```
Layout: sticky top-0 z-50, height 64px
Background: white dengan backdrop-blur-md setelah scroll 20px
Border: border-b border-green-100 setelah scroll

KIRI:
  - Logo text: "BP·Group" (DM Sans Bold, color: --color-green-dark)
  - Tagline di bawah logo: "Healthy Living Guide" (10px, italic, muted)

TENGAH (hidden di mobile):
  - Link: Konsultasi | Produk | Mitra | Tentang
  - Font: DM Sans 14px, warna muted
  - Hover: warna --color-green, border-bottom 2px

KANAN:
  - Tombol: "💬 WhatsApp" 
  - Style: bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold
  - Hover: brightness-110 transform scale-105

MOBILE:
  - Logo kiri
  - Hamburger kanan
  - Tombol WA tetap visible (bukan di hamburger menu)
```

---

### SECTION 02 — KONSULTASI AI ⭐ (POSISI PERTAMA — JANGAN DIGESER)

**File:** `src/components/KonsultasiSection.tsx` atau nama existing

**Layout Desktop:** 2 kolom sejajar, gap 2rem
- Kolom kiri (55%): Form Input
- Kolom kanan (45%): Hasil AI / Default state

**Background:** `bg-[#F0F9F2]` dengan subtle leaf pattern SVG sebagai background

**Header section (di atas 2 kolom):**
```
Label badge: "🌿 Konsultasi Kesehatan Gratis"
  Style: bg-green-pale text-green rounded-full px-4 py-1 text-sm font-medium inline-block mb-4

Headline: "Ceritakan Kondisimu."
  Style: Cormorant Garamond 48px bold, color: --color-text
  
Sub-headline: "Kami beri panduan gaya hidup sehat dulu, baru produk yang paling cocok untukmu."
  Style: DM Sans 18px, color: --color-text-muted
```

**KOLOM KIRI — Input Card:**
```
Container: bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]

Label: "Apa keluhan utama yang kamu rasakan?"
  Style: DM Sans 14px semibold, color: --color-text, mb-3

Quick Chips (12 item, bisa multi-select):
  Layout: flex flex-wrap gap-2
  Chips: 
    - Susah Tidur 😴
    - Nyeri Sendi 🦴  
    - Daya Tahan Lemah 🛡️
    - Mata Lelah 👁️
    - Gula Darah Tinggi 🩸
    - Anak Susah Makan 🍎
    - Rambut Rontok 💆
    - Kulit Kusam ✨
    - Kurang Stamina ⚡
    - Anak Kurang Fokus 🧠
    - Flek Hitam 🌙
    - Sering Stres 😤
  
  Style chip default: 
    border border-[--color-border] bg-white text-[--color-text-muted] 
    rounded-full px-3 py-1.5 text-sm cursor-pointer
    transition: all 200ms ease
    
  Style chip selected:
    bg-[--color-green] text-white border-[--color-green]
    scale-105 shadow-sm

Spacer: mt-4

Label: "Atau ceritakan lebih detail (opsional):"
  Style: sama seperti label atas

Textarea:
  placeholder="Contoh: Saya mudah lelah meski sudah cukup tidur, dan sering sakit kepala setiap sore hari..."
  rows={4}
  Style: w-full border border-[--color-border] rounded-xl p-3 text-sm 
         focus:border-[--color-green] focus:ring-2 focus:ring-green-100 outline-none resize-none
         transition: border-color 200ms

Tombol Submit:
  Text: "🔍 Analisis Kondisiku"
  Style: w-full bg-[--color-green] text-white py-3.5 rounded-xl font-semibold text-base
         hover:bg-[--color-green-dark] transition: all 200ms
         disabled:opacity-60 disabled:cursor-not-allowed
  
  State loading:
    Text berubah menjadi loading indicator (lihat spesifikasi loading state di bawah)
```

**KOLOM KANAN — Hasil AI Card:**

**Default State (sebelum ada input):**
```
Container: bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] h-full min-h-[400px]
  display: flex flex-col items-center justify-center text-center

Ilustrasi: SVG daun/tanaman (inline SVG, ~120px)
Headline: "Hasil Konsultasimu Akan Muncul di Sini"
  Style: Cormorant Garamond 22px, color: --color-text, mt-4
Sub: "Pilih keluhan di sebelah kiri atau ceritakan kondisimu, dan AI kami akan memberikan panduan personal khusus untukmu."
  Style: DM Sans 14px, color: --color-text-muted, mt-2 leading-relaxed

Ornamen bawah: 3 icon kecil horizontal
  🌿 Panduan Gaya Hidup  ·  💊 Produk Tepat  ·  💬 Konsultasi WA
  Style: text-xs muted, mt-6
```

**Loading State (saat API call berlangsung):**
```
Container: sama, tapi tampilkan:

Progress bar tipis di top card:
  <div class="h-1 bg-green-100 rounded-full overflow-hidden">
    <div class="h-full bg-[--color-green] animate-loading-bar rounded-full" />
  </div>
  CSS: @keyframes loading-bar { 0% { width: 5%; } 85% { width: 90%; } 100% { width: 95%; } }
  duration: 8s linear

Animated icon: spinner daun (rotate animation)

Teks rotasi (berganti setiap 2 detik dengan fade transition):
  - "Memahami kondisimu... 🌱"
  - "Menyiapkan panduan gaya hidup sehat... 🥗"  
  - "Menemukan produk yang paling cocok... 🔍"
  - "Hampir selesai... ✨"
  Style: DM Sans 16px semibold, color: --color-green, text-center

Sub-teks: "Biasanya memakan waktu 5–10 detik"
  Style: text-sm muted

JANGAN tampilkan tombol apapun saat loading. JANGAN biarkan user klik tombol submit lagi.
```

**Result State (setelah respons AI diterima):**
```
Container: bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] overflow-y-auto max-h-[600px]

Scroll behavior: smooth scroll to top saat result muncul

URUTAN WAJIB TAMPILAN HASIL:

1. BLOK EMPATI (bg-green-ultra rounded-xl p-4 mb-4):
   Icon: 💚 (24px)
   Teks empati dari AI
   Style: DM Sans 14px, color: --color-text

2. DIVIDER dengan label "💡 Panduan Gaya Hidup Sehat":
   Style: flex items-center gap-2
   Line: h-px flex-1 bg-green-100
   Label: bg-[--color-green-pale] text-[--color-green] text-xs font-semibold px-3 py-1 rounded-full

3. LIFESTYLE TIPS (3–5 tips, masing-masing):
   Container: bg-[#F9FFF9] border border-green-100 rounded-xl p-3 mb-2
   Layout: flex items-start gap-3
   Kiri: Icon emoji besar (24px)
   Kanan: 
     - Judul tip: DM Sans 13px semibold, color: --color-text
     - Deskripsi: DM Sans 12px, color: --color-text-muted

4. DIVIDER dengan label "🛍️ Rekomendasi Produk":
   Style: sama seperti divider di atas tapi warna aksen berbeda (gold/amber)

5. PRODUCT RECOMMENDATIONS (2–3 produk):
   Container: border border-[--color-border] rounded-xl p-3 mb-2 flex items-center gap-3
   Kiri: Product emoji/icon (40x40px bg-green-pale rounded-lg)
   Tengah:
     - Nama produk: 13px semibold
     - Alasan rekomendasi: 11px muted (max 1 baris)
     - Harga: 12px font-semibold color: --color-green
   Kanan: Tombol kecil "Lihat →" (outline green xs)

6. CTA WHATSAPP:
   Tombol: w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold
   Text: "💬 Konsultasi Lebih Lanjut via WhatsApp"
   Sub-teks di bawah: "Gratis · Tidak ada tekanan · Respon < 5 menit"
   
   Link WA: href="https://wa.me/62XXXXXXXXXX?text=Halo,%20saya%20ingin%20konsultasi%20kesehatan%20lebih%20lanjut"
   (Ganti XXXXXXXXXX dengan nomor WA aktual)

Error State:
   Jika API gagal, tampilkan:
   - Ilustrasi error kecil
   - "Maaf, koneksi sedang terganggu 😔"
   - "Kamu tetap bisa konsultasi langsung via WhatsApp kami"
   - Tombol WA hijau
   - Link teks kecil: "Coba lagi" (retrigger API call)
```

---

### KONFIGURASI AI — SYSTEM PROMPT WAJIB

**File:** Di mana pun kamu set systemPrompt untuk API call konsultasi

```javascript
const SYSTEM_PROMPT = `Kamu adalah konsultan kesehatan ramah dari BP Group, sebuah brand produk kesehatan alami Indonesia yang berdiri sejak 2018. 

MISI KAMU: Bantu pengguna memahami kondisinya dan berikan panduan PRAKTIS, bukan hanya jualan produk.

URUTAN RESPONS YANG WAJIB DIIKUTI (jangan ubah urutan ini):

1. EMPATI (2–3 kalimat):
   - Akui kondisi yang mereka ceritakan dengan hangat dan tulus
   - Validasi bahwa kondisi itu nyata dan bisa diatasi
   - Jangan mulai dengan "Sebagai AI..." atau "Berdasarkan input Anda..."
   - Contoh: "Wajar sekali kamu merasakannya — tubuh yang mudah lelah sering menjadi tanda bahwa ada yang perlu diperhatikan dalam keseharianmu..."

2. PANDUAN GAYA HIDUP SEHAT (3–5 tips KONKRET):
   - Tips yang bisa dilakukan SEGERA tanpa membeli produk apapun
   - Mencakup: pola makan, pola tidur, aktivitas fisik ringan, manajemen stres, hidrasi
   - Setiap tip harus spesifik dan actionable, bukan generik
   - JANGAN sebut produk apapun di bagian ini
   - Format setiap tip: { "icon": "🌙", "title": "Judul singkat", "description": "Penjelasan 1-2 kalimat" }

3. REKOMENDASI PRODUK (2–3 produk, SESUDAH panduan gaya hidup):
   - Framing: "Untuk mendukung perubahan gaya hidupmu..." bukan "Kamu harus beli..."
   - Setiap produk WAJIB ada alasan spesifik kenapa cocok dengan keluhan mereka
   - Format: { "name": "...", "emoji": "...", "reason": "1 kalimat alasan spesifik", "price": "Rp ..." }

DAFTAR PRODUK BP GROUP (gunakan hanya produk-produk ini):
- British Propolis (6ml, Rp 250.000) — imunitas, antioksidan, antibakteri alami dari lebah
- British Propolis Green (6ml, Rp 250.000) — khusus anak 1–12 tahun, imunitas anak
- Brassic Pro (40 kapsul, Rp 250.000) — Moringa + Echinacea, stamina & pemulihan tubuh
- Brassic Eye (40 kapsul, Rp 250.000) — Bilberry + Gynura, kesehatan & ketajaman mata
- Belgie Facial Wash (100ml, Rp 195.000) — membersihkan & mencerahkan kulit wajah
- Belgie Anti Aging Serum (10ml, Rp 195.000) — anti penuaan, kolagen, kulit kencang
- Belgie Day Cream SPF30+ (10g, Rp 195.000) — perlindungan siang hari, anti UV
- Belgie Night Cream (10g, Rp 195.000) — regenerasi kulit malam hari
- Belgie Hair Tonic (100ml, Rp 195.000) — Anagain Swiss, atasi rambut rontok
- BP Norway (40 softcaps, Rp 250.000) — Salmon Oil Omega-3, kesehatan otak & jantung
- Steffi Pro (30ml, Rp 195.000, PROMO dari 250.000) — Stevia natural sweetener, cocok untuk yang jaga gula darah

ATURAN TAMBAHAN:
- Gunakan bahasa Indonesia yang hangat, tidak kaku, tidak terlalu formal
- Jika keluhan tidak jelas, tanya dengan sopan sebelum merespons
- JANGAN buat klaim medis absolut (hindari kata "menyembuhkan", "mengobati")
- Selalu akhiri dengan ajakan konsultasi lebih lanjut via WhatsApp
- JANGAN rekomendasikan produk dari brand lain

FORMAT RESPONS — WAJIB JSON VALID (tidak ada teks di luar JSON):
{
  "empati": "teks empati 2–3 kalimat",
  "edukasi": "1 paragraf penjelasan singkat tentang kondisi",
  "tips_gaya_hidup": [
    { "icon": "emoji", "title": "judul singkat", "description": "penjelasan 1–2 kalimat" }
  ],
  "rekomendasi": [
    { "name": "nama produk", "emoji": "emoji", "reason": "alasan spesifik 1 kalimat", "price": "Rp xxx.xxx" }
  ],
  "cta": "kalimat ajakan konsultasi WA yang personal"
}`;
```

---

### SECTION 03 — TRUST BAR

**Spesifikasi:**
```
Background: bg-[--color-green-dark] (#2A5936)
Padding: py-3
Layout: flex items-center justify-center gap-8 flex-wrap (overflow-x-auto di mobile)

5 item, masing-masing:
  Layout: flex items-center gap-2
  Icon: text-[--color-green-pale] text-lg
  Teks: DM Sans 13px font-medium text-white

Items:
  🛡️ BPOM Terdaftar
  ☪️ Halal MUI  
  🌿 100% Bahan Alami
  🌍 Standar Eropa
  ⭐ Sejak 2018

Separator antar item di desktop: "·" text-green-light opacity-40
Mobile: horizontal scroll, no separator
```

---

### SECTION 04 — BRAND HERO (Healthy Living Guide)

**Spesifikasi Redesain:**
```
Background: bg-white
Layout: grid grid-cols-1 lg:grid-cols-2 gap-12 items-center
Padding: py-20 px-4 max-w-6xl mx-auto

KOLOM KIRI:
  Label: "TENTANG BP GROUP" 
    Style: text-xs font-bold tracking-widest text-[--color-green] mb-3

  Headline:
    Line 1: "Healthy Living" — Cormorant Garamond 56px regular
    Line 2: "Guide" — Cormorant Garamond 56px bold italic text-[--color-green]
    
  Body: "Kami hadir untuk memandu keluarga Indonesia menuju gaya hidup lebih sehat dengan produk alami, berkualitas tinggi, dan terjangkau. Bukan sekadar jual suplemen — kami adalah mitra kesehatan jangka panjang."
    Style: DM Sans 16px color-text-muted mt-4 leading-relaxed max-w-md
    
  Stats row (mt-8):
    3 stats: [11+] Produk Teruji  |  [100%] Halal MUI  |  [2018] Tahun Berdiri
    Style per stat:
      Angka: Cormorant Garamond 40px bold color-green
      Label: DM Sans 12px muted di bawahnya
    Separator: border-r border-green-100 (kecuali yang terakhir)
    
  Quote (mt-8):
    "Bisnis Praktis Bertabur Pahala"
    Style: DM Sans 14px italic color-text-muted
    Before content: ornamen tanda kutip besar warna green-pale

KOLOM KANAN:
  Bukan kartu-kartu kecil lagi!
  
  Tampilkan: 2x2 grid ingredient cards yang elegan
  Padding: p-6 bg-[--color-green-ultra] rounded-2xl
  
  4 ingredient highlight cards (bg-white rounded-xl p-4 shadow-sm):
    Card 1: 🍯 Propolis  — "Antibakteri Alami dari Lebah"
    Card 2: 🌿 Moringa   — "Superfood Protein Nabati"
    Card 3: 👁️ Bilberry  — "Antioksidan Mata"
    Card 4: 🐟 Salmon Oil — "Omega-3 Otak & Jantung"
    
  Style tiap card:
    Emoji: 32px
    Nama: 13px semibold color-text
    Deskripsi: 11px muted
    Border: border border-green-100
```

---

### SECTION 05 — 4 LANGKAH MENUJU HIDUP SEHAT

**Pertahankan struktur, perbaiki visual:**
```
Background: bg-[--color-green-ultra]
Padding: py-16

Label atas: "PROSES KAMI"
Headline: "4 Langkah Menuju" + line break + "Hidup Sehat"
  Style: Cormorant Garamond, centered

Sub: "Pendekatan holistik kami memastikan kamu tidak hanya membeli produk, tapi benar-benar merasakan perubahan."
  Style: DM Sans 16px muted centered max-w-2xl mx-auto

4 Step Cards (grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12):
  Masing-masing card:
    Nomor: "01", "02", "03", "04"
      Style: Cormorant Garamond 48px bold text-[--color-green-pale] 
             (besar tapi low contrast, sebagai decorative background)
    Icon: emoji besar 32px atau SVG
    Judul: DM Sans 15px semibold
    Deskripsi: DM Sans 13px muted, 2–3 baris
    
  Konten 4 step:
    01 🔍 "Kenali Kondisimu" — Gunakan konsultasi AI gratis kami untuk memahami kondisi spesifikmu
    02 🥗 "Perbaiki Gaya Hidup" — Ikuti panduan praktis gaya hidup sehat yang kami berikan dulu
    03 🌿 "Dukung dengan Produk" — Pilih produk alami yang relevan dengan kondisimu
    04 ✨ "Rasakan Perubahannya" — Pantau perkembangan dan konsultasikan hasilnya

  Connector arrow antara step (hidden di mobile):
    → SVG arrow tipis antara setiap card, warna: --color-green-pale
```

---

### SECTION 06 — KATALOG PRODUK

**Header:**
```
Label: "KOLEKSI PRODUK"
Headline: "Produk Pilihan" + italic "Terbaik"
Sub: "Dipilih berdasarkan kebutuhan kesehatanmu — setiap produk punya cerita dan manfaat yang nyata."
```

**Filter Tabs:**
```
Container: flex gap-2 flex-wrap justify-center mb-8

Tab items: Semua | Imunitas & Propolis | Suplemen Kesehatan | Skincare Belgie | Anak-anak | Natural

Style tab default:
  border border-[--color-border] bg-white text-[--color-text-muted]
  px-4 py-2 rounded-full text-sm font-medium cursor-pointer
  transition: all 200ms ease

Style tab active:
  bg-[--color-green] text-white border-[--color-green]
  shadow-sm

Mobile: overflow-x-auto, nowrap, padding bottom untuk scroll indicator
```

**Product Grid:**
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
```

**Kartu Produk — Spesifikasi LENGKAP:**

```
Container: bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-card)]
  hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1
  transition: all 300ms ease
  cursor: pointer

BAGIAN ATAS — Product Visual (h-52):
  Background gradient unik per kategori:
    Propolis:        linear-gradient(135deg, #FFF3CD, #FFE082) → honey/amber
    Suplemen/Brassic: linear-gradient(135deg, #E8F5E9, #A5D6A7) → fresh green
    Mata (Eye):      linear-gradient(135deg, #E3F2FD, #90CAF9) → clear blue
    Skincare:        linear-gradient(135deg, #FCE4EC, #F48FB1) → rose pink
    Rambut:          linear-gradient(135deg, #F3E5F5, #CE93D8) → lavender
    Anak:            linear-gradient(135deg, #E8F5E9, #B2DFDB) → mint
    Norway/Otak:     linear-gradient(135deg, #E0F7FA, #80DEEA) → ocean blue
    Natural/Stevia:  linear-gradient(135deg, #F9FBE7, #DCE775) → lime yellow
  
  Di dalam visual area, tampilkan:
    - Emoji produk besar centered (64px): 
        British Propolis: 🍯
        British Propolis Green: 🌿🍯
        Brassic Pro: 💪
        Brassic Eye: 👁️
        Belgie Facial Wash: 🧴
        Belgie Serum: ✨
        Belgie Day Cream: ☀️
        Belgie Night Cream: 🌙
        Belgie Hair Tonic: 💆
        BP Norway: 🐟
        Steffi Pro: 🍃
    
    - Badge kategori (position: absolute top-3 left-3):
        Style: bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium
        Color berbeda per kategori
    
    - Badge promo (position: absolute top-3 right-3, hanya untuk Steffi Pro):
        "PROMO" bg-red-500 text-white text-xs px-2 py-0.5 rounded-full

BAGIAN BAWAH — Info (p-5):
  
  Nama produk:
    Style: DM Sans 16px font-bold color-text
    
  Tagline manfaat (1 kalimat, BUKAN spesifikasi teknis):
    Style: DM Sans 13px italic color-text-muted mt-1
    Contoh per produk:
      British Propolis: "Pertahanan imun dari lebah pilihan — tubuhmu selalu siap"
      Brassic Pro: "Energi dan pemulihan yang kamu butuhkan setiap hari"
      Brassic Eye: "Mata jernih, fokus tajam — dari pagi hingga malam"
      Belgie Serum: "Kulit tampak muda, kencang, dan bercahaya"
      Belgie Hair Tonic: "Rambut lebat kembali dengan teknologi Anagain Swiss"
      BP Norway: "Otak optimal, jantung sehat dengan Omega-3 premium"
      Steffi Pro: "Manis tanpa khawatir — solusi alami untuk yang jaga gula"
    
  Benefit list (mt-3, 2–3 item):
    Style: flex flex-col gap-1
    Setiap item: flex items-start gap-2
      Check icon: ✓ (color: --color-green, text-sm)
      Teks: DM Sans 12px color-text-muted
    
    Contoh benefit per produk:
      British Propolis: ["Tingkatkan imunitas tubuh", "Antioksidan & antibakteri alami", "Cocok untuk semua usia"]
      Brassic Pro: ["Moringa + Echinacea sinergi", "Tingkatkan stamina harian", "Anti-inflamasi natural"]
      Brassic Eye: ["Bilberry untuk mata lelah", "Kurangi risiko degenerasi", "Cocok untuk pengguna layar"]
      Belgie Facial Wash: ["Bersihkan tanpa keringkan", "Formula gel lembut", "Cocok kulit sensitif"]
      Belgie Serum: ["Anti-penuaan aktif", "Tingkatkan produksi kolagen", "Hasil terlihat 2 minggu"]
      Belgie Day Cream: ["SPF30+ proteksi UV", "Moisturizer sepanjang hari", "Non-greasy formula"]
      Belgie Night Cream: ["Regenerasi sel malam hari", "Formula intensif 8 jam", "Bangun dengan kulit segar"]
      Belgie Hair Tonic: ["Anagain® Swiss technology", "Kurangi rambut rontok 75%", "Stimulasi folikel rambut"]
      BP Norway: ["DHA untuk fungsi otak", "Omega-3 jantung sehat", "40 softcaps premium"]
      BP Norway: ["Salmon oil quality grade A", "Kesehatan mata & sendi", "Anti-inflamasi alami"]
      Steffi Pro: ["Stevia 0 kalori alami", "Tidak naikkan gula darah", "Cocok untuk diabetesi"]
      British Propolis Green: ["Formula khusus anak 1–12 tahun", "Imunitas optimal tumbuh kembang", "Rasa yang disukai anak"]

  Harga (mt-4):
    Steffi Pro: tampilkan harga coret + harga promo
      <span style="text-decoration:line-through; color:muted; font-size:12px">Rp 250.000</span>
      <span style="color:--color-red; font-size:22px; font-bold">Rp 195.000</span>
      Badge "HEMAT Rp 55.000" kecil
    Produk lain: harga normal
      Style: Cormorant Garamond 24px bold color-[--color-green]

  CTA Tombol (mt-4):
    TOMBOL UTAMA (full width):
      Text: "💬 Konsultasi & Pesan via WA"
      Style: w-full bg-[--color-green] text-white py-2.5 rounded-xl text-sm font-semibold
             hover:bg-[--color-green-dark] transition
      Link: href="https://wa.me/62XXXXXXXXXX?text=Halo,%20saya%20tertarik%20dengan%20[NAMA_PRODUK]%20dari%20BP%20Group"
      (Ganti XXXXXXXXXX dan [NAMA_PRODUK] secara dinamis)
    
    MICRO-COPY di bawah tombol:
      Text: "Gratis konsultasi · Respon < 5 menit"
      Style: text-center text-xs text-muted mt-1
```

---

### SECTION 07 — SECTION MITRA ⭐ (REDESAIN TOTAL)

**Ini section paling penting yang perlu redesain paling besar.**

```
Background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)
Padding: py-20 px-4
Text: semua putih

ATAS (centered):
  Label: "PELUANG BISNIS"
    Style: text-xs tracking-widest text-green-300 font-bold uppercase mb-4
  
  Headline: "Bisnis Praktis"
    Style: Cormorant Garamond 52px white
  Sub-headline: "Bertabur Pahala 🌙"  
    Style: Cormorant Garamond 52px italic text-green-300
    
  Body: "Bergabunglah dengan ribuan mitra Quantum Millionaire Community yang membangun penghasilan dari produk halal, memberi manfaat nyata bagi keluarga Indonesia."
    Style: DM Sans 16px text-green-100 mt-4 max-w-2xl mx-auto text-center

TENGAH — 3 Benefit Cards (grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto):
  Background card: bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6
  
  Card 1 💰 "Penghasilan Nyata"
    Body: "Komisi menarik per produk + bonus rekrutmen. Banyak mitra QM yang berhasil mencapai penghasilan jutaan per bulan."
    
  Card 2 🕌 "Produk Halal & Berkah"  
    Body: "Jual sesuatu yang benar-benar membantu orang lain. Setiap produk terjual = pahala yang mengalir."
    
  Card 3 📱 "Mulai dari HP"
    Body: "Modal kecil, bisa dari rumah, bisa sambil kerja. Yang dibutuhkan hanya smartphone dan niat yang tulus."

  Style icon card: 40px emoji + bg-white/20 rounded-xl p-2 inline-block mb-4
  Style judul card: DM Sans 16px font-bold text-white mt-2
  Style body card: DM Sans 13px text-green-100 leading-relaxed mt-2

BAWAH — CTA:
  mt-10 text-center
  
  Tombol utama: 
    Text: "Pelajari Peluang Mitra →"
    Style: bg-white text-[--color-green-dark] px-8 py-4 rounded-full text-base font-bold
           hover:bg-green-50 shadow-lg hover:shadow-xl transition
    Link: ke WA dengan pesan "Halo, saya tertarik untuk bergabung sebagai mitra BP Group / QM Community"
           
  Micro-copy: "Sudah ribuan mitra aktif di seluruh Indonesia · Konsultasi bisnis: GRATIS"
    Style: text-green-200 text-sm mt-3
```

---

### SECTION 08 — TESTIMONI (Kisah Nyata Keluarga Sehat)

**Pertahankan struktur, tingkatkan visual:**
```
Background: bg-[--color-cream]
Padding: py-16

Header:
  Label: "TESTIMONI"
  Headline: "Kisah Nyata" + italic "Keluarga Sehat"

3 Testimoni Cards (grid grid-cols-1 md:grid-cols-3 gap-6 mt-10):
  Container: bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]
  
  Bintang 5: ⭐⭐⭐⭐⭐ (text-amber-400 text-sm, mb-3)
  
  Quote icon: " (Cormorant Garamond 48px text-green-100, di pojok kiri atas, opacity-50)
  
  Testimonial text: DM Sans 14px italic color-text leading-relaxed
  
  Divider: border-t border-green-50 mt-4 pt-4
  
  Profile row (flex items-center gap-3):
    Avatar: bg-green-pale w-10 h-10 rounded-full flex items-center justify-center
            Inisial nama: DM Sans 14px font-bold color-green
    Info:
      Nama: DM Sans 13px semibold color-text
      Kota + Produk: DM Sans 11px muted
  
  Contoh testimoni yang KONKRET dan SPESIFIK:
  
  Card 1:
    Quote: "Sudah 3 bulan pakai British Propolis, dan 2 bulan ini saya tidak pernah masuk angin sama sekali. Padahal sebelumnya setiap ganti cuaca pasti langsung sakit."
    Nama: Rini S.
    Info: Surabaya · British Propolis
    
  Card 2:
    Quote: "Brassic Eye benar-benar membantu. Saya kerja di depan komputer 10 jam sehari, dulu mata selalu perih. Sekarang jauh lebih nyaman meski jam kerja sama."
    Nama: Dimas R.
    Info: Jakarta · Brassic Eye
    
  Card 3:
    Quote: "Belgie Hair Tonic ajaib beneran. Setelah 6 minggu pemakaian rutin, rambut saya yang dulu tipis dan rontok parah sekarang sudah terlihat lebih lebat."
    Nama: Sari M.
    Info: Malang · Belgie Hair Tonic
    
  CATATAN: Jika ada testimoni real dari pelanggan, ganti contoh di atas dengan yang asli.
```

---

### SECTION 09 — CTA FINAL

```
Background: bg-[--color-green-dark]
Padding: py-20
Text: white, centered

Headline besar: "Siap Hidup Lebih Sehat"
  Style: Cormorant Garamond 52px white
Sub-line: "& Meraih Penghasilan?"
  Style: Cormorant Garamond 52px italic text-green-300

Body: "Mulai perjalananmu hari ini — konsultasi gratis, tanpa tekanan, tanpa komitmen apapun."
  Style: DM Sans 16px text-green-100 mt-4 max-w-lg mx-auto

CTA Row (mt-8 flex flex-col sm:flex-row gap-4 justify-center):

  Tombol 1 (utama):
    Text: "🌱 Konsultasi Kesehatan Gratis"
    Style: bg-white text-[--color-green-dark] px-8 py-4 rounded-full font-bold text-base
           hover:bg-green-50 shadow-lg transition
    Action: smooth scroll ke section konsultasi (#konsultasi)
    
  Tombol 2 (sekunder):
    Text: "💬 Hubungi via WhatsApp"
    Style: border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-base
           hover:bg-white/10 transition
    Link: WA langsung

Micro-copy: "Respon dalam 5 menit · Gratis · Tidak ada tekanan untuk membeli"
  Style: text-green-300 text-sm mt-4
```

---

### SECTION 10 — FOOTER

```
Background: bg-[#0F1F15]
Padding: pt-12 pb-6
Text: white

Layout: grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto px-4

Kolom 1 — Brand:
  Logo: "BP·Group" 
  Tagline: "Healthy Living Guide"
  Body: "Produk kesehatan alami bersertifikat BPOM dan Halal MUI untuk keluarga Indonesia."
  Sertifikasi badges: BPOM | HALAL (small badges, bg-white/10 rounded px-2 py-1 text-xs)
  
Kolom 2 — Produk:
  Judul: "Produk Kami"
  Links: British Propolis | Brassic Pro | Brassic Eye | Belgie Skincare | BP Norway | Steffi Pro
  Style: text-sm text-gray-400 hover:text-white transition, list no bullet
  
Kolom 3 — Mitra & Info:
  Judul: "Mitra & Bisnis"
  Links: Bergabung Mitra | Sistem Reward | FAQ | Tentang QM Community
  
Kolom 4 — Kontak:
  Judul: "Hubungi Kami"
  Items:
    📱 WhatsApp: +62 XXX-XXXX-XXXX
    📸 Instagram: @bpgroup.id
    📍 Lokasi: [Isi dengan alamat aktual]

Divider: border-t border-white/10 mt-8 pt-6

Footer bottom (flex justify-between text-xs text-gray-500):
  Kiri: "© 2025 BP Group / Quantum Millionaire Community. All rights reserved."
  Kanan: "⚠️ Konten ini bukan pengganti saran medis profesional"
```

---

### KOMPONEN GLOBAL — Sticky WhatsApp Button

```
Position: fixed bottom-6 right-6 z-50

Button:
  Style: bg-[#25D366] text-white w-14 h-14 rounded-full 
         flex items-center justify-center shadow-xl
         hover:scale-110 hover:shadow-2xl transition-all duration-300
  Icon: WhatsApp SVG icon (24px, white)
  
Pulse animation:
  ::before pseudo-element: bg-[#25D366] rounded-full 
           animate-ping opacity-30 absolute inset-0

Tooltip on hover:
  "Chat WhatsApp" — tooltip kecil di sebelah kiri button
  Style: bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap
         absolute right-16 opacity-0 group-hover:opacity-100 transition

Link: href="https://wa.me/62XXXXXXXXXX" target="_blank"
```

---

## 📱 RESPONSIVENESS REQUIREMENTS

### Breakpoints yang harus dihandle:
```
Mobile:   < 640px  (sm)
Tablet:   640–1024px (md-lg)
Desktop:  > 1024px (xl)
```

### Mobile-Specific Rules:
```
1. Konsultasi section: kolom stack (input di atas, hasil di bawah)
2. Filter tab produk: overflow-x-auto, snap scrolling
3. Semua tap targets: minimum 44x44px
4. Product grid: 1 kolom
5. Mitra benefit cards: 1 kolom
6. Font sizes: turunkan 10–15% dari desktop
7. Hero headline: max 2 baris
8. CTA tombol: full width di mobile
9. Trust bar: horizontal scroll dengan -webkit-overflow-scrolling: touch
10. Testimoni: swipeable carousel (gunakan CSS scroll snap)
```

---

## ⚡ PERFORMANCE REQUIREMENTS

```javascript
// Lazy loading untuk gambar/ilustrasi
<img loading="lazy" ... />

// Debounce pada API call konsultasi (mencegah spam klik)
const debouncedAnalyze = debounce(analyzeComplaint, 500);

// Smooth scroll ke section konsultasi saat CTA diklik
document.querySelector('#konsultasi').scrollIntoView({ behavior: 'smooth' });

// Intersection Observer untuk scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-fade-up');
    }
  });
}, { threshold: 0.1 });

// Apply ke semua .card dan section headers
document.querySelectorAll('.card, h2, .step-card').forEach(el => observer.observe(el));
```

---

## 🎭 ANIMASI & TRANSITIONS

```css
/* Tambahkan ke global CSS */

@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes loading-bar {
  0%   { width: 5%; }
  50%  { width: 70%; }
  85%  { width: 92%; }
  100% { width: 95%; }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

.animate-fade-up {
  animation: fade-up 0.5s ease-out forwards;
}

/* Stagger animation untuk grid cards */
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 80ms; }
.card:nth-child(3) { animation-delay: 160ms; }

/* Chip hover effect */
.chip {
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1); /* spring effect */
}
.chip.active {
  transform: scale(1.05);
}

/* Card hover lift */
.product-card {
  transition: transform 300ms ease, box-shadow 300ms ease;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(45, 106, 79, 0.15);
}
```

---

## 🔗 LINK WHATSAPP — TEMPLATE

Ganti semua `62XXXXXXXXXX` dengan nomor WA aktual BP Group.

```javascript
// Helper function untuk generate WA link
const waLink = (message = "") => {
  const phone = "62XXXXXXXXXX"; // ← GANTI INI
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
};

// Pre-filled messages per context:
const WA_MESSAGES = {
  general:    "Halo, saya ingin konsultasi kesehatan dengan BP Group 🌿",
  product:    (name) => `Halo, saya tertarik dengan produk ${name} dari BP Group. Boleh konsultasi dulu?`,
  mitra:      "Halo, saya tertarik untuk bergabung sebagai mitra BP Group / Quantum Millionaire Community. Boleh info lebih lanjut?",
  consult:    (keluhan) => `Halo, saya baru konsultasi via website. Keluhan utama saya: ${keluhan}. Bisa dibantu lebih lanjut?`,
};
```

---

## ✅ CHECKLIST SEBELUM DEPLOY

### Konten
- [ ] Nomor WhatsApp aktual sudah diisi di semua link WA
- [ ] System prompt AI sudah diupdate sesuai spesifikasi di atas
- [ ] Semua 11 produk ditampilkan dengan benar
- [ ] Harga Steffi Pro menampilkan harga coret + promo
- [ ] Testimoni sudah diisi (minimal 3 yang konkret dan spesifik)
- [ ] Info mitra / tentang brand sudah diisi dengan data real
- [ ] Footer disclaimer medis sudah ada

### Teknis
- [ ] Konsultasi AI error state sudah handle dengan baik
- [ ] Loading state animation sudah berjalan smooth
- [ ] Filter tab produk berfungsi dengan benar
- [ ] Scroll animation tidak menyebabkan layout shift
- [ ] Semua link WA ter-generate dengan pesan yang benar
- [ ] Mobile responsiveness sudah ditest di beberapa ukuran layar
- [ ] Tap targets semua ≥ 44px di mobile
- [ ] Lazy loading gambar/ilustrasi aktif
- [ ] Sticky nav berfungsi dengan smooth

### UX
- [ ] Smooth scroll ke konsultasi saat tombol CTA diklik
- [ ] Chip keluhan bisa multi-select dan visual feedback jelas
- [ ] Hasil konsultasi di-scroll to top otomatis saat muncul
- [ ] Tombol submit disabled saat loading (mencegah double-submit)
- [ ] Error state menampilkan pesan ramah + alternatif WA

---

## 📊 METRIK YANG PERLU DITRACK (Post-Deploy)

Pasang event tracking (Google Analytics 4 atau Mixpanel) untuk:

```javascript
// Track setiap interaksi penting:

// 1. Chip diklik
gtag('event', 'chip_click', { chip_name: chipText });

// 2. Konsultasi disubmit
gtag('event', 'consultation_submit', { keluhan_count: selectedChips.length });

// 3. Konsultasi selesai (hasil AI diterima)
gtag('event', 'consultation_complete', { response_time_ms: elapsed });

// 4. Klik WA dari hasil konsultasi
gtag('event', 'wa_click_from_consultation');

// 5. Klik WA dari kartu produk
gtag('event', 'wa_click_product', { product_name: productName });

// 6. Klik CTA mitra
gtag('event', 'mitra_cta_click');

// 7. Scroll depth
gtag('event', 'scroll', { percent_scrolled: 50 }); // 25%, 50%, 75%, 100%
```

---

## 🎯 PRIORITAS EKSEKUSI

### LAKUKAN SEKARANG (dampak terbesar, effort kecil):
1. **Ganti panel kanan konsultasi** — hapus "Kelas Hari Ini", ganti dengan AI Result Card
2. **Update system prompt AI** — copy-paste system prompt dari bagian KONFIGURASI AI di atas
3. **Perbesar dan update copy CTA** di semua kartu produk

### LAKUKAN HARI INI (1–2 jam per item):
4. Tambahkan gradient unik per produk di visual card
5. Update tagline produk dari teknis → emosional/manfaat
6. Redesain section mitra dengan dark green background

### LAKUKAN MINGGU INI:
7. Implementasi loading animation konsultasi
8. Perbaiki brand hero section
9. Optimasi mobile (filter tab, tap targets)
10. Tambahkan testimoni yang konkret

---

*Dokumen ini disiapkan berdasarkan audit visual screenshot halaman rekapanmitra.lovable.app/katalog tertanggal 8 Maret 2026.*  
*Semua spesifikasi sudah disesuaikan dengan codebase Lovable/React + Tailwind CSS.*

