# 📜 Changelog: Rekapan Mitra

Semua perubahan penting pada proyek **Rekapan Mitra** akan dicatat di sini.

---

## [2.7.1] - 2026-09-11
### 🔧 Fixed
- Enter pada input AI kini membuat baris baru; pesan dikirim melalui tombol Send.
- Menambahkan opsi menyalin pesan chat AI.

### 📋 Release Type
- **Patch**: perbaikan perilaku input tanpa mengubah alur atau API.

---

## [2.7.0] - 2026-09-04
### ✨ Added
- Tombol cek pembaruan PWA yang selalu tersedia dan menampilkan versi aktif.
- Notifikasi update PWA dengan tombol **Update Sekarang**.
- Sumber versi aplikasi tunggal dari `package.json`.

### 📋 Release Type
- **Minor**: menambah fitur baru tanpa memutus alur atau API yang sudah ada.

---

## [2.1.0] - 2026-05-03
### ✨ Added
- **Smart Telegram Parser**: Bot sekarang mendukung input teks bebas (*Full Text Parser*) untuk deteksi otomatis nama pelanggan, produk, kuantitas, dan biaya tambahan (ongkir).
- **Atomic Expense Management**: Fitur untuk menambahkan biaya tambahan (seperti ongkir) langsung saat membuat atau mengedit pesanan. Biaya ini tersimpan secara mandiri untuk akurasi profit.
- **Inline Customer Management**: Tombol tambah pelanggan baru langsung dari form order dan ikon edit cepat untuk pelanggan yang sudah terpilih.
- **Bento-Grid Dashboard**: Tampilan dashboard yang lebih modern, compact, dan informatif dalam satu layar tanpa scroll berlebih.
- **Domain Baru**: Migrasi link utama ke `mitrabp.biz.id`.

### 🔧 Fixed
- Perbaikan logika perhitungan profit yang kini secara otomatis memotong biaya tambahan.
- Sinkronisasi harga dinamis berdasarkan level mitra (Mitra SAP, Agen Plus, dll) agar sesuai dengan kuantitas order.
- Perbaikan bug pada update status pesanan yang sempat tidak tersinkron ke database.

---

## [2.0.1] - 2026-05-02
### ✨ Added
- Fitur Dasar Bot Telegram untuk input pesanan sederhana.
- Dashboard Performa bulanan awal.
- Manajemen Stok produk dasar.

---

## [1.0.0] - 2026-04-25
### 🚀 Initial Release
- Sistem Autentikasi (Daftar & Login).
- Manajemen Produk & Mitra.
- Pencatatan Pesanan Manual.
- PWA Support.
