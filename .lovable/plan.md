

# Penyederhanaan Form Order & Restok

Setelah menganalisis seluruh alur input, berikut masalah utama yang ditemukan dan solusi untuk membuatnya ramah pengguna usia 40+.

---

## Masalah yang Ditemukan

### Form Order (10+ field sekaligus - terlalu banyak!)
1. **Toggle "Customer Lama/Baru"** membingungkan - langkah ekstra yang tidak perlu
2. **"Tier Harga" dan "Level Mitra"** - dua dropdown mirip, membingungkan 
3. **Tanggal** selalu diisi padahal 90% kasus pakai hari ini
4. **Harga jual per botol** bisa diedit manual - jarang dipakai tapi selalu tampil
5. **Semua field tampil sekaligus** - overwhelming

### Form Restok (6 field)
1. **"Tier Harga Beli"** - istilah teknis yang membingungkan
2. **Harga beli per botol** bisa diedit manual - jarang dipakai
3. **Tanggal, catatan, bukti bayar** selalu tampil meski opsional

---

## Solusi

### 1. Simpan "Level Mitra" di Profil (satu kali saja)
Level mitra (Reseller/Agen/Agen Plus/SAP/SE) jarang berubah. Memindahkan pengaturan ini ke halaman **Settings** sehingga tidak perlu dipilih setiap kali input order. Database sudah memiliki tabel `profiles` yang bisa ditambahkan kolom `mitra_level`.

### 2. Form Order Baru - Hanya 3 Langkah Utama
Form disederhanakan menjadi field esensial saja:

**Yang selalu tampil:**
- **Nama Customer** (dengan auto-suggest dari customer lama saat mengetik - tidak perlu toggle lagi)
- **No. WhatsApp** (otomatis terisi jika pilih dari suggestion)
- **Jumlah Botol** (dengan tombol +/- yang besar)
- **Tier Customer** (dropdown sederhana, otomatis isi harga jual)

**Yang tersembunyi di bagian "Lainnya" (collapsible):**
- Tanggal (default: hari ini)
- Harga jual custom
- Bukti transfer

**Yang dihapus dari form:**
- Toggle customer baru/lama (diganti auto-suggest)
- Dropdown "Level Mitra" (pindah ke Settings)

### 3. Form Restok Baru - Lebih Ringkas
**Yang selalu tampil:**
- **Jumlah Botol** (dengan tombol +/- yang besar)
- **Harga Beli per Botol** (otomatis dari level mitra di Settings)
- **Total** (ditampilkan langsung)

**Yang tersembunyi di bagian "Lainnya" (collapsible):**
- Tanggal (default: hari ini)
- Catatan
- Bukti bayar

**Yang dihapus:**
- Dropdown "Tier Harga Beli" (tidak perlu, harga otomatis dari level mitra)

### 4. Perbaikan UI untuk Usia 40+
- **Font label lebih besar** (dari text-sm ke text-base)
- **Input field lebih tinggi** (min height 48px)
- **Tombol +/- untuk jumlah botol** (lebih mudah dari keyboard angka)
- **Spacing antar field lebih lega**
- **Ringkasan harga selalu terlihat di bawah** dengan font besar dan jelas

---

## Detail Teknis

### Database
- Tambah kolom `mitra_level` (default: 'reseller') ke tabel `profiles`

### File yang Diubah

1. **`src/components/settings/SettingsPage.tsx`**
   - Tambah dropdown pemilihan Level Mitra yang tersimpan ke database
   - Tambah hook untuk baca/tulis profil

2. **`src/hooks/useProfile.ts`** (baru)
   - Hook untuk mengelola data profil pengguna termasuk mitra_level

3. **`src/components/orders/OrdersPage.tsx`**
   - Redesign form: hapus toggle customer, hapus dropdown mitra level
   - Tambah auto-suggest customer saat ketik nama
   - Tambah tombol +/- untuk quantity
   - Pindahkan tanggal, harga custom, bukti transfer ke section collapsible "Lainnya"
   - Gunakan mitra_level dari profil

4. **`src/components/stock/StockPage.tsx`**
   - Redesign form: hapus tier selector
   - Tambah tombol +/- untuk quantity
   - Harga otomatis dari level mitra di profil
   - Pindahkan tanggal, catatan, bukti bayar ke section collapsible "Lainnya"

5. **`src/index.css`**
   - Tidak ada perubahan besar, penyesuaian dilakukan langsung via Tailwind classes

