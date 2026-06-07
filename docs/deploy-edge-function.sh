# Deploy Edge Function: parse-order
# Jalankan perintah ini satu per satu di terminal

# ── LANGKAH 1: Login ke Supabase ──────────────────────────────────
# Buka https://supabase.com/dashboard/account/tokens
# Buat Personal Access Token baru, copy hasilnya
# Lalu jalankan:
supabase login
# (akan prompt input token)

# ── LANGKAH 2: Link ke project rekapanmitra ───────────────────────
cd /Users/salinovakbar/Downloads/rekapanmitra
supabase link --project-ref kqoitztjohxjnjoxctoz

# ── LANGKAH 3: Set API key sebagai Supabase secret ────────────────
# (ganti sk-TFYJu00a24lDqgOhTUwFKQ dengan API key Anda)
supabase secrets set OPENAI_API_KEY=sk-TFYJu00a24lDqgOhTUwFKQ
supabase secrets set OPENAI_BASE_URL=https://ai.sumopod.com/v1

# Verifikasi secret tersimpan:
supabase secrets list

# ── LANGKAH 4: Deploy Edge Function ───────────────────────────────
supabase functions deploy parse-order --no-verify-jwt

# ── VERIFIKASI: Test edge function langsung ───────────────────────
curl -X POST \
  "https://kqoitztjohxjnjoxctoz.supabase.co/functions/v1/parse-order" \
  -H "Content-Type: application/json" \
  -d '{"text": "mau order 2 bp green + 1 brassic eye. a.n Siti 081234567890"}'
# Harusnya return JSON hasil parsing
