# Setup Telegram Bot — Rekapan Mitra

Bot Telegram yang membaca pesan order dari mitra, parsing pakai AI, lalu membuat order otomatis di Rekapan.

## Arsitektur

```
Mitra forward pesan order ke Telegram Bot
        ↓
Telegram mengirim webhook ke Supabase Edge Function
        ↓
AI (Gemini via Lovable Gateway) parse pesan → JSON order
        ↓
Tampilkan konfirmasi ke mitra di Telegram
        ↓
Mitra ketik "ya" → submit_public_order() RPC
        ↓
Order masuk ke dashboard Rekapan ✅
```

## Langkah Setup

### 1. Buat Bot Telegram

1. Buka Telegram, cari `@BotFather`
2. Kirim `/newbot`
3. Ikuti instruksi, beri nama bot (misal: `Rekapan Mitra Bot`)
4. Salin `BOT_TOKEN` yang diberikan

### 2. Deploy Edge Function

```bash
# Login ke Supabase CLI
supabase login

# Deploy function
supabase functions deploy telegram-bot --project-ref mplnfciugxojlpurxiwk
```

### 3. Set Environment Variables di Supabase

Buka **Supabase Dashboard → Project Settings → Edge Functions → Secrets**, tambahkan:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | Token dari BotFather |
| `LOVABLE_API_KEY` | Sudah ada (sama dengan ai-konsultasi) |

> `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah otomatis tersedia di Edge Functions.

### 4. Jalankan Migration Database

```bash
supabase db push --project-ref mplnfciugxojlpurxiwk
```

Atau jalankan manual di **Supabase SQL Editor**:
```
supabase/migrations/20260328000000_add_telegram_bot_tables.sql
```

### 5. Set Webhook Telegram

Ganti `BOT_TOKEN` dan `PROJECT_REF` dengan nilai yang sesuai, lalu jalankan di browser atau curl:

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<PROJECT_REF>.supabase.co/functions/v1/telegram-bot
```

Contoh:
```
https://api.telegram.org/bot8679533321:AAEDFkDEI2yvmCKi-tddwKm70lZ9Vc2_n70/setWebhook?url=https://kqoitztjohxjnjoxctoz.supabase.co/functions/v1/telegram-bot

```

Verifikasi webhook aktif:
```
https://api.telegram.org/bot8679533321:AAEDFkDEI2yvmCKi-tddwKm70lZ9Vc2_n70/getWebhookInfo
```

---

## Cara Pakai (untuk Mitra)

### Registrasi (sekali saja)

1. Buka Telegram, cari bot kamu
2. Kirim perintah:
   ```
   /daftar [slug_toko]
   ```
   Contoh: `/daftar tokobudi123`
3. Bot akan konfirmasi toko berhasil terhubung

Slug toko ada di menu **Toko Online** di aplikasi Rekapan.

### Buat Order dari Pesan

1. Forward pesan order dari pelanggan ke bot, atau ketik manual:
   ```
   min order 2 bp green sama 1 brassic eye
   a.n Siti Wahyuni
   08123456789
   ```
2. Bot akan parse dan tampilkan konfirmasi
3. Ketik **ya** untuk buat order, **batal** untuk batalkan
4. Order langsung masuk ke dashboard Rekapan dengan status *menunggu bayar*

### Perintah Tersedia

| Perintah | Fungsi |
|----------|--------|
| `/daftar [slug]` | Hubungkan bot ke toko |
| `/bantuan` | Tampilkan panduan |
| `/batal` | Batalkan order yang sedang diproses |

---

## Produk yang Dikenali AI

| Nama di Pesan | Produk di Rekapan |
|---------------|-------------------|
| bp, british propolis | British Propolis |
| bp green, green, bp hijau | British Propolis Green |
| bp blue, blue, bp biru | British Propolis Blue |
| brassic pro, bpro | Brassic Pro |
| brassic eye, beye, eye | Brassic Eye |
| belgie | Belgie |
| steffi, stef | Steffi Pro |
| norway, bp norway | BP Norway |

---

## Troubleshooting

**Bot tidak merespons:**
- Cek webhook sudah di-set dengan benar
- Cek log di Supabase Dashboard → Edge Functions → telegram-bot → Logs

**Order gagal dibuat:**
- Pastikan slug toko aktif di aplikasi Rekapan
- Cek produk yang dipesan ada di master catalog

**AI tidak bisa parse pesan:**
- Pastikan nama produk dan jumlah disebutkan dengan jelas
- Format yang aman: `[jumlah] [nama produk]`

---

## File yang Dibuat

```
supabase/
├── functions/
│   └── telegram-bot/
│       └── index.ts          ← Edge Function utama
├── migrations/
│   └── 20260328000000_add_telegram_bot_tables.sql  ← Schema DB
└── config.toml               ← Ditambah config telegram-bot
```
