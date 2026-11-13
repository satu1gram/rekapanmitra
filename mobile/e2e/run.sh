#!/usr/bin/env bash
# Release smoke test: builds the web bundle and drives every main flow in Chromium against a
# mocked Supabase (no real data is touched). Usage: bash e2e/run.sh [output-dir]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-${TMPDIR:-/tmp}/rekapan-e2e}"
mkdir -p "$OUT"
npx expo export --platform web --output-dir "$OUT/web" > "$OUT/export.log" 2>&1
status=0
for mode in full hapus loggedout empty error onboarding slow slowroot; do
  echo "== $mode"
  node e2e/release.cjs "$OUT/web" "$OUT/shots-$mode" "$mode" || status=1
done
exit $status
