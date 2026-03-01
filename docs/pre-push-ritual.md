# 🚀 Antigravity — Pre-Push & Deploy Ritual

> *"Production bukan tempat eksperimen. Staging adalah tempat kamu membuktikan kode kamu layak."*

Dokumen ini adalah standar ritual wajib setiap engineer Antigravity sebelum kode menyentuh production.  
Bukan sekadar checklist — ini adalah **budaya engineering** kita.

---

## Ritual #1 — Self Code Review (The Mirror Test)

Sebelum siapapun melihat kode kamu, **kamu harus jadi reviewer pertamanya.**  
Buka diff, baca line by line seolah kamu orang asing yang baru bergabung.

- [ ] Tidak ada `console.log`, `print`, atau debug statement yang tertinggal
- [ ] Tidak ada hardcoded value (URL, credential, config) di dalam kode
- [ ] Semua `TODO` dan `FIXME` sudah diselesaikan atau dibuat ticket-nya
- [ ] Naming variable, function, dan file jelas, konsisten, dan tidak ambigu
- [ ] Tidak ada dead code atau commented-out code yang ikut masuk
- [ ] Edge case sudah di-handle: `null`, `undefined`, empty array, timeout, error state

---

## Ritual #2 — Test Suite Harus Hijau

**Jangan andalkan CI/CD saja.** Jalankan sendiri di lokal sebelum push.

```bash
# Unit test
npm test
# atau
pytest
# atau
go test ./...

# Integration test (jika ada)
npm run test:integration

# Coverage check — minimum threshold Antigravity: 80%
npm run coverage
```

- [ ] Semua test **pass** tanpa ada yang di-skip secara curang
- [ ] Tidak ada test baru yang ditulis hanya untuk menaikkan coverage secara artificial
- [ ] Jika ada test yang gagal karena alasan valid, sudah didokumentasikan dan ada tiketnya

---

## Ritual #3 — Security & Secret Scan

Satu credential yang bocor bisa menghancurkan kepercayaan. Jangan anggap remeh.

```bash
# Scan secret di git history
git-secrets --scan
# atau
trufflehog git file://. --since-commit HEAD

# Vulnerability check dependency
npm audit
# atau
pip check && safety scan
# atau
snyk test
```

- [ ] Tidak ada API key, token, password, atau secret di dalam kode
- [ ] File `.env`, `.env.local`, `.env.production` **tidak ikut ter-commit**
- [ ] `.gitignore` sudah menutup semua file sensitif
- [ ] Tidak ada dependency baru dengan **known critical vulnerability**

---

## Ritual #4 — Build Production Harus Sukses

```bash
# Build production
npm run build
# atau
go build ./...
# atau
docker build -t antigravity-app .
```

- [ ] Build production **sukses tanpa warning yang kritis**
- [ ] Bundle size tidak melonjak drastis tanpa alasan yang jelas
- [ ] Tidak ada breaking change dari dependency yang di-update
- [ ] Environment variable production sudah terdaftar dan terdokumentasi

---

## Ritual #5 — Pull Request Quality Gate

PR yang baik adalah PR yang bisa di-review tanpa harus bertanya ke pembuatnya.

**Deskripsi PR wajib mengandung:**

```
## Apa yang berubah?
(Jelaskan perubahan secara singkat dan padat)

## Kenapa perubahan ini dilakukan?
(Link ke ticket Jira/Linear/Notion)

## Bagaimana cara test-nya?
(Step by step untuk reviewer memverifikasi)

## Ada dampak atau risiko?
(Database migration, breaking change, dependency baru, dll)
```

- [ ] Deskripsi PR sudah diisi lengkap sesuai template
- [ ] Link ke ticket sudah ada
- [ ] Screenshot atau screen recording untuk perubahan UI
- [ ] **Scope PR kecil dan focused** — 1 PR = 1 concern, bukan 1 sprint
- [ ] Label PR sudah dipasang (feature, bugfix, hotfix, refactor, dll)

---

## Ritual #6 — Staging Verification

**Wajib deploy ke staging terlebih dahulu.** Tidak ada pengecualian.

- [ ] Deploy ke staging environment berhasil
- [ ] Smoke test manual di fitur yang berubah sudah dilakukan
- [ ] Happy path berjalan dengan benar
- [ ] Edge case dan error state sudah dicoba
- [ ] Log staging tidak menunjukkan error baru yang mencurigakan
- [ ] QA atau rekan tim sudah memverifikasi (untuk fitur mayor)

---

## Ritual #7 — Observability Check

Kode yang tidak bisa dimonitor sama dengan bom waktu.

- [ ] Ada logging yang cukup di titik-titik kritis (bukan berlebihan)
- [ ] Format log konsisten dan **tidak menyertakan data sensitif user**
- [ ] Metric dan tracing sudah di-instrument untuk fitur baru
- [ ] Alert sudah di-setup jika ada threshold baru yang perlu dijaga
- [ ] Error di-capture dengan context yang cukup untuk debugging

---

## Ritual #8 — Deploy Strategy Awareness

Sebelum menekan tombol deploy, konfirmasi semua aspek berikut:

| Aspek | Pertanyaan | Status |
|---|---|---|
| **Rollback Plan** | Bisa di-rollback dalam < 5 menit? | ☐ |
| **Database Migration** | Backward compatible? Sudah dijalankan duluan? | ☐ |
| **Feature Flag** | Perlu dark launch atau gradual rollout dulu? | ☐ |
| **Timing** | Deploy di low-traffic hour? | ☐ |
| **Downstream Service** | Ada service lain yang perlu di-update duluan? | ☐ |
| **On-call Aware** | Tim on-call sudah tahu ada deploy? | ☐ |

---

## Ritual #9 — The On-Call Engineer Test

Sebelum deploy, tanyakan ini ke dirimu sendiri:

> *"Jika ini break jam 3 pagi, apakah engineer on-call bisa debug dan fix ini tanpa aku?"*

Jika jawabannya **tidak** — kamu belum selesai.

Tambahkan:
- [ ] Log yang cukup untuk identifikasi masalah
- [ ] Dokumentasi atau runbook untuk skenario failure
- [ ] Komentar kode di bagian yang kompleks atau tidak intuitif

---

## Ritual #10 — Post-Deploy Monitoring (15 Menit Pertama)

Ritual belum selesai setelah kamu menekan deploy. **Tetap di depan layar.**

```
T+0  → Deploy selesai
T+2  → Cek error rate di monitoring dashboard
T+5  → Cek latency & response time
T+10 → Cek log production real-time, tidak ada error baru
T+15 → Validasi fitur berjalan benar di production
```

- [ ] Error rate tidak meningkat
- [ ] Latency dalam batas normal
- [ ] CPU dan memory tidak melonjak
- [ ] Fitur baru berfungsi sesuai ekspektasi di production
- [ ] Siap execute rollback plan jika ada metrik yang memburuk

---

## ✅ Master Checklist — Cetak & Tempel

```
PRE-PUSH
[ ] Self review diff sudah dilakukan
[ ] Semua test hijau (unit + integration)
[ ] Tidak ada secret atau credential bocor
[ ] Build production sukses
[ ] PR deskripsi lengkap dan ada link tiket

PRE-DEPLOY
[ ] Sudah verified di staging
[ ] Smoke test manual sudah dilakukan
[ ] Logging & observability siap
[ ] Rollback plan sudah ada dan bisa dieksekusi
[ ] Database migration sudah dijalankan (jika ada)
[ ] Tim on-call sudah aware

POST-DEPLOY (15 menit)
[ ] Error rate normal
[ ] Latency normal
[ ] Log bersih
[ ] Fitur verified di production
```

---

## 🏛️ Prinsip Engineering Antigravity

**Ship fast, but ship right.**  
Kecepatan tanpa kualitas adalah hutang teknis.  
Kualitas tanpa kecepatan adalah kesempatan yang hilang.  
Kita lakukan keduanya — dengan ritual yang benar.

---

*Dokumen ini adalah living document. Jika ada ritual baru yang terbukti efektif, buat PR untuk update dokumen ini.*

*Last updated: Maret 2026 — Antigravity Engineering Team*
