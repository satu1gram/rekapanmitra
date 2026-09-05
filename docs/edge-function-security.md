# Keamanan Edge Functions — Runbook K2 (IO-13)

Ringkasan kunci autentikasi untuk tiga edge function di `supabase/functions/`.

| Function | Autentikasi | Layer 1 (gateway) | Layer 2 (in-function) |
|---|---|---|---|
| `parse-order` | JWT sesi user in-app | `verify_jwt = true` | cek klaim role=authenticated, tolak anon key |
| `ai-konsultasi` | JWT sesi user in-app | `verify_jwt = true` | cek klaim role=authenticated, tolak anon key |
| `telegram-bot` | Secret webhook Telegram | — (`verify_jwt = false`) | header `X-Telegram-Bot-Api-Secret-Token` dibandingkan konstan-waktu |

Plus: CORS allowlist origin app, idempotensi webhook via tabel `telegram_processed_updates`,
dan log terstruktur (`auth_rejected`, `duplicate_update_skipped`, `*_failed`, dll).

## Prasyarat deploy

1. Set secrets (nilai contoh — generate sendiri):

   ```bash
   openssl rand -hex 32                       # untuk TELEGRAM_WEBHOOK_SECRET
   supabase secrets set TELEGRAM_WEBHOOK_SECRET=<hex-dari-atas>
   supabase secrets set ALLOWED_ORIGINS=https://<domain-app>,http://localhost:8080
   ```

2. Deploy TANPA `--no-verify-jwt`:

   ```bash
   supabase functions deploy parse-order
   supabase functions deploy ai-konsultasi
   supabase functions deploy telegram-bot
   ```

3. Jalankan migration `supabase/migrations/20260823000000_add_telegram_processed_updates.sql`
   (`supabase db push` atau lewat SQL editor).

4. Daftarkan ulang webhook Telegram dengan secret yang sama:

   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT-TOKEN>/setWebhook" \
     -d "url=https://<project-ref>.supabase.co/functions/v1/telegram-bot" \
     -d "secret_token=<NILAI-SECRET>" \
     -d 'allowed_updates=["message","callback_query"]'
   ```

## Matriks test pasca-deploy

```bash
BASE="https://<project-ref>.supabase.co/functions/v1"

# T1. Tanpa header auth sama sekali → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/parse-order" \
  -H "Content-Type: application/json" -d '{"text":"order 2 bp"}'

# T2. Anon/publishable key → 401 (bukan sesi user)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/ai-konsultasi" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PUBLISHABLE_KEY" -d '{"userInput":"susah tidur"}'

# T3. JWT sesi user in-app → 200 + hasil JSON
#     (ambil access_token dari browser yang sedang login)
curl -s -w "\n%{http_code}\n" -X POST "$BASE/parse-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -d '{"text":"mau order 2 bp green a.n Siti"}'

# T4. Webhook Telegram tanpa secret header → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/telegram-bot" \
  -H "Content-Type: application/json" \
  -d '{"update_id":999001,"message":{"chat":{"id":1},"text":"hi"}}'

# T5. Webhook dengan secret salah → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/telegram-bot" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: nilai-salah" \
  -d '{"update_id":999002,"message":{"chat":{"id":1},"text":"hi"}}'

# T6. Secret benar → 200 OK dan pesan diproses
curl -s -w "\n%{http_code}\n" -X POST "$BASE/telegram-bot" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: <NILAI-SECRET>" \
  -d '{"update_id":999003,"message":{"chat":{"id":<CHAT-ID>},"text":"hi"}}'

# T7. Idempotensi: kirim ulang update_id yang sama → 200, TIDAK diproses ulang
#     (cek log Supabase: event "duplicate_update_skipped", tidak ada order baru)
```

Unit test lokal untuk helper keamanan (secureCompare, authenticateUser,
resolveCorsHeaders) ada di `supabase/functions/_shared/security.test.ts` —
jalankan dengan `deno test supabase/functions/` bila deno tersedia.

## Catatan perilaku

- Pengunjung `/ai-advisor` yang belum login kini mendapat rekomendasi statis
  (`getDynamicFallback`) tanpa memanggil AI — kuota tidak bisa dibakar anonim.
- Jika `ALLOWED_ORIGINS` belum di-set saat deploy, hanya origin dev localhost
  yang lolos CORS; produksi wajib mengisi env ini.
- `telegram-bot` fail-closed: jika `TELEGRAM_WEBHOOK_SECRET` kosong, semua
  request ditolak 401.
- Entri `telegram_processed_updates` lebih tua dari ~7 hari boleh dihapus
  (lihat komentar pg_cron di file migration).
