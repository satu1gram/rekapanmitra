---
description: Checklist wajib sebelum push ke git — termasuk update dokumentasi teknis
---

# Pre-Push Checklist — Rekapan Mitra BP

Jalankan workflow ini **setiap kali sebelum `git push`** untuk memastikan dokumentasi teknis selalu up-to-date dan kode siap dipublikasikan.

---

## 1. Perbarui Dokumentasi Teknis

Buka dan perbarui file dokumentasi teknis jika ada perubahan pada:

- Fitur baru yang ditambahkan atau dihapus
- Library / dependency baru di `package.json`
- Tabel database baru (migration baru di `supabase/migrations/`)
- Perubahan URL rute halaman (`App.tsx`)
- Perubahan konfigurasi deployment (Netlify, Vite, PWA)

**File yang WAJIB diperbarui:**

| File | Lokasi |
|---|---|
| Dokumentasi Teknis | `/Users/salinovakbar/.gemini/antigravity/brain/e2051e8e-c206-4aed-a96f-719a7e683f5d/docs/dokumentasi_teknis_v2.3.md` |
| Panduan Pengguna | `/Users/salinovakbar/Downloads/rekapan/docs/panduan-pengguna.md` |

**Bagian yang perlu dicek di Dokumentasi Teknis:**
- [ ] Versi library di tabel teknologi sudah sesuai `package.json`?
- [ ] Fitur baru sudah ditambahkan ke bagian "Fitur Utama"?
- [ ] Tabel database baru sudah dicatat di bagian "Struktur Database"?
- [ ] Rute URL baru sudah tercatat di tabel "Struktur Halaman"?
- [ ] Tanggal "Terakhir diperbarui" sudah diubah?

**Bagian yang perlu dicek di Panduan Pengguna:**
- [ ] Fitur baru sudah dijelaskan dengan bahasa sederhana?
- [ ] Langkah-langkah cara pakai masih akurat?

---

## 2. Cek Status Git

// turbo
```
git status
```

Pastikan semua file yang ingin di-push sudah masuk ke staging.

---

## 3. Stage Semua Perubahan

```
git add .
```

---

## 4. Tulis Commit Message yang Jelas

Format commit message yang disarankan:

```
git commit -m "feat: [deskripsi fitur baru]"
git commit -m "fix: [deskripsi bug yang diperbaiki]"
git commit -m "docs: update dokumentasi teknis [nama perubahan]"
git commit -m "chore: [perubahan konfigurasi/dependency]"
```

**Contoh:**
```
git commit -m "feat: tambah halaman toko publik dengan harga dinamis"
git commit -m "docs: update dokumentasi teknis - tambah fitur toko publik"
```

---

## 5. Push ke Repository

```
git push origin main
```

---

## ✅ Setelah Push

- Verifikasi Netlify berhasil deploy (cek dashboard Netlify)
- Pastikan aplikasi berfungsi normal di URL produksi

---

> 💡 **Tips**: Gunakan command berikut untuk melihat perubahan apa saja yang belum di-commit:
> ```
> git diff --stat
> ```
