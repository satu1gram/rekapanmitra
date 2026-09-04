# Versioning dan Release

Proyek ini menggunakan Semantic Versioning: `MAJOR.MINOR.PATCH`.

- **MAJOR**: perubahan yang memutus alur pengguna, kontrak API, skema data, atau kompatibilitas lama.
- **MINOR**: fitur baru yang kompatibel dengan penggunaan yang sudah ada.
- **PATCH**: perbaikan bug, keamanan, dokumentasi, atau perubahan internal tanpa fitur baru.

## Format Commit

Gunakan Conventional Commits:

- `feat:` untuk **minor**
- `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `build:`, `ci:` untuk **patch**
- Tambahkan `!` atau footer `BREAKING CHANGE:` untuk **major**

Setiap release ke `main` harus memperbarui versi di `package.json` dan menambahkan entri versi yang sama di `CHANGELOG.md`. Untuk fitur yang terlihat oleh user, sertakan jenis release di bagian `Release Type` pada changelog agar user dapat memahami tingkat perubahannya.

## Checklist Push ke Main

1. Tentukan kategori perubahan: major, minor, atau patch.
2. Naikkan versi di `package.json`.
3. Tambahkan ringkasan dan kategori di `CHANGELOG.md`.
4. Jalankan `npm run lint` dan `npm run build`.
5. Push ke `main`; workflow CI akan memeriksa format commit, versi, dan changelog.