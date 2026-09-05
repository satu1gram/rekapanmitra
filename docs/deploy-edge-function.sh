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
# PENTING: JANGAN pernah menulis nilai API key di file ini.
# Export dulu di terminal Anda — ambil nilai dari password manager:
#   export OPENAI_API_KEY="<API key Anda>"
# Lalu jalankan perintah di bawah (membaca dari environment variable):
supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
supabase secrets set OPENAI_BASE_URL=https://ai.sumopod.com/v1
# Lihat docs/secret-scanning.md untuk aturan penanganan secret.

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
