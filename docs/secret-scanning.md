# Secret Scanning — Pencegahan Kebocoran Kredensial

> Konteks insiden: API key AI sempat ter-commit plaintext di `docs/deploy-edge-function.sh`
> (IO-12). Key tersebut wajib dirotasi; lihat komentar issue IO-12 untuk prosedur purge
> histori & rotasi. Dokumen ini mencegah kejadian serupa.

## Aturan dasar

1. **Tidak ada secret di repo** — API key, token, password, kredensial cloud hanya boleh ada di:
   - Supabase secrets (`supabase secrets set ...`) untuk Edge Functions.
   - Environment variable lokal / password manager untuk script & tooling.
2. Script contoh menulis perintah yang **membaca dari env var**, bukan nilai literal:
   ```bash
   export OPENAI_API_KEY="<ambil dari password manager>"
   supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
   ```
3. File `.env*` sudah di-ignore (`.gitignore`); jangan paksa commit dengan `-f`.

## Setup pre-commit hook (sekali per clone)

Prasyarat: Python + `pip`, dan [gitleaks](https://github.com/gitleaks/gitleaks#installing)
(`brew install gitleaks`).

```bash
pip install pre-commit
pre-commit install
```

Sejak titik ini, setiap `git commit` menjalankan gitleaks atas staged changes
(konfigurasi: `.gitleaks.toml`, hook: `.pre-commit-config.yaml`).

Alternatif tanpa pre-commit framework — pasang hook manual:

```bash
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
gitleaks protect --staged --redact || {
  echo "COMMIT DITOLAK: potensi secret terdeteksi. Rotasi key bila asli, lalu hapus dari staging."
  exit 1
}
EOF
chmod +x .git/hooks/pre-commit
```

## Scan manual

```bash
gitleaks detect --source . --redact          # seluruh histori git
gitleaks protect --staged --redact           # hanya perubahan ter-stage
gitleaks detect --source . --no-git --redact # working tree saja
```

Exit code `1` = temuan; pesan selalu di-redact (`--redact`) agar secret tidak ikut
tercopy ke log/tiket.

## Jika gitleaks menemukan secret saat commit

1. **Asumsikan bocor** — jangan sekadar hapus dari staging; key yang sempat di-commit
   harus dianggap terekspos.
2. **Rotasi/revoke key di provider** segera (provider AI, Supabase, Telegram, GCP, dll).
3. Simpan key baru di tempat aman (password manager → env var → `supabase secrets set`).
4. Baru bersihkan file/commit; untuk key yang sudah masuk histori publik, jalankan
   prosedur purge histori (lihat komentar issue IO-12).
