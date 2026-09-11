# Deploy Edge Function: parse-order
# Jalankan dari repository root. API key wajib disediakan lewat environment.
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

: "${OPENAI_API_KEY:?Set OPENAI_API_KEY di shell sebelum menjalankan script ini}"

# ── LANGKAH 1: Login ke Supabase ──────────────────────────────────
# Buka https://supabase.com/dashboard/account/tokens
# Buat Personal Access Token baru, copy hasilnya
# Lalu jalankan:
supabase login
# (akan prompt input token)

# ── LANGKAH 2: Link ke project rekapanmitra ───────────────────────
supabase link --project-ref kqoitztjohxjnjoxctoz

# ── LANGKAH 3: Set API key sebagai Supabase secret ────────────────
# Jangan pernah menulis token langsung di file atau command yang disimpan di shell history.
supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
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
