# Deploy Edge Functions (parse-order / ai-konsultasi / telegram-bot)
# Jalankan perintah ini satu per satu di terminal
#
# PENTING (K2 / IO-13): JANGAN deploy dengan --no-verify-jwt.
# verify_jwt kini dikelola per-function via supabase/config.toml.

# ── LANGKAH 1: Login ke Supabase ──────────────────────────────────
# Buka https://supabase.com/dashboard/account/tokens
# Buat Personal Access Token baru, copy hasilnya, lalu:
supabase login

# ── LANGKAH 2: Link ke project rekapanmitra ───────────────────────
cd <path-repo>/rekapanmitra
supabase link --project-ref kqoitztjohxjnjoxctoz

# ── LANGKAH 3: Set secrets ────────────────────────────────────────
# API key AI (GANTI dengan key BARU — key lama ter-commit di repo & harus dirotasi):
supabase secrets set OPENAI_API_KEY=<API-KEY-BARU>
supabase secrets set OPENAI_BASE_URL=https://ai.sumopod.com/v1

# Secret webhook Telegram (generate bebas, min. 1-256 karakter):
#   openssl rand -hex 32
supabase secrets set TELEGRAM_WEBHOOK_SECRET=<NILAI-SECRET>

# Origin app yang boleh memanggil function AI (pisahkan dengan koma):
supabase secrets set ALLOWED_ORIGINS=https://<domain-app-produksi>,http://localhost:8080

# Verifikasi secret tersimpan:
supabase secrets list

# ── LANGKAH 4: Deploy Edge Function ───────────────────────────────
supabase functions deploy parse-order
supabase functions deploy ai-konsultasi
supabase functions deploy telegram-bot

# ── LANGKAH 5: Daftarkan ulang webhook Telegram dengan secret ────
# WAJIB setelah deploy telegram-bot, agar Telegram mengirim header secret:
curl -X POST "https://api.telegram.org/bot<BOT-TOKEN>/setWebhook" \
  -d "url=https://kqoitztjohxjnjoxctoz.supabase.co/functions/v1/telegram-bot" \
  -d "secret_token=<NILAI-SECRET>" \
  -d 'allowed_updates=["message","callback_query"]'

# ── VERIFIKASI cepat ──────────────────────────────────────────────
# Tanpa JWT → harus 401:
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://kqoitztjohxjnjoxctoz.supabase.co/functions/v1/parse-order" \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}'
