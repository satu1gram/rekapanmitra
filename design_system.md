# Design System: Rekapan Mitra

Panduan visual ini memastikan konsistensi penggunaan warna dan tipografi di seluruh aplikasi, dirancang khusus untuk menjaga aksesibilitas dan kemudahan baca bagi pengguna usia **40–70+ tahun**.

---

## 🎨 Sistem Warna

### Palet Warna Utama

| Nama Warna | Kode HEX | Pratinjau | Kegunaan Utama |
|---|---|---|---|
| **Hijau Utama** | `#059669` | 🟢 | Tombol aksi utama, ikon aktif, dan status operasional sukses |
| **Navy Gelap** | `#1E293B` | 🟦 | Kartu ringkasan berlatar gelap, panel khusus, dan teks utama |
| **Putih Bersih** | `#FFFFFF` | ⬜ | Latar belakang kartu produk, formulir, dan jendela pop-up |
| **Abu-abu Terang** | `#F8FAFC` | 🔲 | Latar belakang utama layar aplikasi |
| **Kuning Aksen** | `#FBBF24` | 🟡 | Label khusus penarik perhatian seperti status *Custom* atau *Baru* |
| **Merah Peringatan** | `#DC2626` | 🔴 | Pesan kesalahan, pembatalan pesanan, dan tindakan yang memerlukan kewaspadaan |
| **Biru Informasi** | `#2563EB` | 🔵 | Aksi stok ulang barang dan penanda informasi tambahan |
| **Oranye Perhatian** | `#F97316` | 🟠 | Status tertunda, peringatan stok rendah, atau butuh tindakan segera |
| **Abu-abu Teks** | `#64748B` | ⬛ | Teks informasi sekunder, label formulir, dan deskripsi pendukung |

---

### Prinsip Penggunaan Warna

> **Warna adalah isyarat bantu — bukan satu-satunya penyampai informasi.**

1. **Kontras Tinggi** — Selalu pastikan teks di atas latar belakang memiliki kontras yang tajam sesuai standar **WCAG AA**.
2. **Isyarat Visual Ganda** — Warna wajib disertai ikon atau teks label. Contoh: Warna Merah + Teks **"Gagal"**.
3. **Konsistensi Fungsi** — Jangan mengubah fungsi warna yang sudah ditetapkan. Contoh: jangan gunakan Hijau untuk tombol **"Batal"**.

---

## 🔤 Sistem Tipografi

Menggunakan jenis huruf **Sans-serif** (Inter, Roboto, atau font sistem standar) untuk kejernihan visual optimal.

### Skala Tipografi

| Kategori | Ukuran | Ketebalan | Kegunaan Utama |
|---|---|---|---|
| **Headline Raksasa** | 32px | Bold | Angka penting (Keuntungan, Total Bayar) dan sapaan dashboard |
| **Judul Halaman** | 24px | Bold | Judul di bagian atas layar (misal: "Tambah Order", "Stok") |
| **Judul Kartu** | 20px | Semibold | Nama produk, nama pelanggan, atau judul kategori anggaran |
| **Label Input** | 18px | Semibold | Penanda di atas kolom pengisian data (Nama, WhatsApp, dll.) |
| **Isi Teks Utama** | 18px | Regular | Instruksi, deskripsi singkat, dan detail rincian transaksi |
| **Teks Sekunder** | 16px | Regular | Informasi pendukung: tanggal, catatan kecil, atau label menu bawah |
| **Teks Terkecil** | 14px | Semibold | **Batas Minimal.** Hanya untuk status badge (misal: `TERCAPAI`) dalam huruf kapital |

---

### Prinsip Keterbacaan untuk Pengguna Senior

> **Tujuan: teks yang nyaman dibaca tanpa melelahkan mata.**

1. **Hindari Huruf Miring (Italic)** — Gunakan ketebalan **Bold** sebagai penekanan. Huruf miring lebih sulit dibaca oleh mata yang sudah tidak muda.
2. **Jarak Baris (Line Height)** — Gunakan minimal **1.5× ukuran font** agar teks tidak terlihat menumpuk.
3. **Kontras Warna Teks** — Teks utama wajib menggunakan **Navy Gelap `#1E293B`** di atas latar putih. Hindari teks abu-abu muda yang pudar.
4. **Huruf Kapital Seperlunya** — Kapital hanya untuk judul singkat atau label status. Hindari untuk kalimat panjang agar tidak terkesan "berteriak".
5. **Ukuran Area Sentuh Minimum** — Semua teks yang berfungsi sebagai tombol (link) harus berada dalam area sentuh minimal **48dp × 48dp**.

---

*Design System ini adalah dokumen hidup — perbarui setiap kali ada penambahan komponen atau perubahan panduan visual.*