# Versioning dan Release

Proyek ini menggunakan Semantic Versioning: `MAJOR.MINOR.PATCH`, dengan **dua jalur versi** yang berjalan sendiri-sendiri:

| Produk | Versi ada di | Changelog | Tag rilis |
| --- | --- | --- | --- |
| Web (app.mitrabp.biz.id) | `package.json` | `CHANGELOG.md` | `web-vX.Y.Z` |
| Aplikasi mobile (iOS/Android) | `mobile/app.json` dan `mobile/package.json` (harus sama) | `mobile/CHANGELOG.md` | `mobile-vX.Y.Z` |

Nomor build (`buildNumber` iOS, `versionCode` Android) diurus EAS otomatis (`autoIncrement`), jadi tidak perlu diubah manual.

- **MAJOR**: perubahan yang memutus alur pengguna, kontrak API, skema data, atau kompatibilitas lama.
- **MINOR**: fitur baru yang kompatibel dengan penggunaan yang sudah ada.
- **PATCH**: perbaikan bug, keamanan, dokumentasi, atau perubahan internal tanpa fitur baru.

## Format Commit

Gunakan Conventional Commits:

- `feat:` untuk **minor**
- `fix:`, `perf:`, `refactor:`, `build:` untuk **patch**
- `docs:`, `test:`, `ci:`, `style:`, `chore:` **tidak memicu rilis**, karena tidak mengubah apa yang sampai ke pengguna
- Tambahkan `!` atau footer `BREAKING CHANGE:` untuk **major**

Produk mana yang terkena ditentukan dari file yang berubah, bukan dari cakupan di commit: `mobile/` untuk mobile, `src/` dan `public/` untuk web, sedangkan `src/lib`, `src/integrations`, `src/types`, dan `supabase/functions|migrations` dihitung untuk keduanya karena dipakai bersama. File dokumentasi, tes, `mobile/store`, dan `mobile/e2e` tidak dihitung.

Setiap release ke `main` harus memperbarui versi di `package.json` dan menambahkan entri versi yang sama di `CHANGELOG.md`. Untuk fitur yang terlihat oleh user, sertakan jenis release di bagian `Release Type` pada changelog agar user dapat memahami tingkat perubahannya.

## Checklist Push ke Main

1. Tentukan kategori perubahan: major, minor, atau patch.
2. Naikkan versi di `package.json`.
3. Tambahkan ringkasan dan kategori di `CHANGELOG.md`.
4. Jalankan `npm run lint` dan `npm run build`.
5. Push ke `main`; workflow CI akan memeriksa format commit, versi, dan changelog.

## Saran versi otomatis

Tidak perlu mengingat-ingat: sistem yang menghitung.

```bash
npm run version:advice                       # saran untuk web dan mobile
npm run release:bump -- mobile               # rencana naik versi (tidak mengubah file)
npm run release:bump -- mobile minor --write # tulis versi dan changelog; boleh pilih major|minor|patch
```

Saran dihitung dari commit sejak tag rilis terakhir. Tingkat tertinggi menang: ada `feat` berarti minor, hanya `fix` berarti patch, ada breaking berarti major. Sistem juga menyatakan **sudah waktunya rilis** bila ada perubahan besar, 3 fitur atau lebih menumpuk, atau perubahan tertua sudah lewat 14 hari.

Yang berjalan otomatis di GitHub:
- **Setiap PR dan push ke main**: komentar "Saran versi" di PR, ringkasan di tab Actions, serta pemeriksaan versi mobile (`app.json` = `package.json`, dan changelog punya entri versinya).
- **Setiap Senin pagi**: bila sudah waktunya rilis, dibuka (atau diperbarui) satu issue "Saatnya rilis versi baru?". Tutup issue itu setelah rilis.

### Alur rilis

1. Lihat saran: `npm run version:advice`.
2. `npm run release:bump -- <web|mobile> --write`, baca changelog yang dihasilkan, rapikan kalimatnya bila perlu.
3. Commit, buat tag, dan push: `git tag mobile-vX.Y.Z && git push --follow-tags`.
4. Mobile: `eas build --profile production --platform all`, lalu `eas submit`. Web: deploy seperti biasa.

Tag adalah penanda "sudah dirilis". Tanpa tag, web dihitung sejak commit terakhir yang mengubah versinya, dan mobile dianggap belum pernah dirilis (1.0.0 dipakai apa adanya untuk rilis pertama; setelah submit, buat tag `mobile-v1.0.0`).

### Kapan versi mobile perlu naik

Naikkan versi hanya saat akan mengirim build baru ke store, bukan setiap commit. Apple mewajibkan nomor versi baru untuk tiap rilis setelah rilis pertama; Google cukup nomor build. Perubahan yang hanya di web atau di backend (Supabase) tanpa mengubah aplikasi tidak perlu rilis mobile, kecuali perubahan itu memengaruhi kode bersama (lihat daftar di atas).
