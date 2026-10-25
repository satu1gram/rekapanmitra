# Ringkasan Harga Jual, Modal, dan Paket Produk

> Acuan harga jual paket dalam ringkasan ini adalah pembaruan katalog yang berlaku mulai 1 September 2026. Migrasi harga yang lebih baru tidak ditemukan di repository. Harga ini berasal dari file migrasi, bukan hasil pengecekan langsung ke database produksi.

## 1. Harga jual paket terbaru

Migrasi September menetapkan harga berikut. Setiap harga paket berlaku untuk semua produk dalam kelompoknya.

| Produk/kelompok | 1 botol | 3 botol | 5 botol | 10 botol | 40 botol | 200 botol |
|---|---:|---:|---:|---:|---:|---:|
| British Propolis, Steffi Pro, Brassic Eye, Brassic Pro, BP Norway | Rp265.000 | Rp720.000 | Rp1.125.000 | Rp2.100.000 | Rp7.800.000 | Rp35.000.000 |
| British Propolis Blue, British Propolis Green | Rp285.000 | Rp780.000 | Rp1.225.000 | Rp2.250.000 | Rp8.400.000 | Rp35.000.000 |
| Belgie Facial Wash, Anti Aging Serum, Day Cream, Night Cream, Hair Tonic | Rp195.000 | Rp585.000 | Rp975.000 | Rp1.800.000 | Rp6.800.000 | Rp30.000.000 |

Harga efektif per botol untuk tujuh produk/kategori yang diperbarui:

| Ukuran | BP Group/reguler: BP, Steffi, Brassic Eye, Brassic Pro, Norway | Efektif/botol | Blue & Green | Efektif/botol |
|---:|---:|---:|---:|---:|
| 1 botol | Rp265.000 | Rp265.000 | Rp285.000 | Rp285.000 |
| 3 botol | Rp720.000 | Rp240.000 | Rp780.000 | Rp260.000 |
| 5 botol | Rp1.125.000 | Rp225.000 | Rp1.225.000 | Rp245.000 |
| 10 botol | Rp2.100.000 | Rp210.000 | Rp2.250.000 | Rp225.000 |
| 40 botol | Rp7.800.000 | Rp195.000 | Rp8.400.000 | Rp210.000 |
| 200 botol | Rp35.000.000 | Rp175.000 | Rp35.000.000 | Rp175.000 |

**Pemetaan kategori master katalog:**

| Kategori katalog | Produk |
|---|---|
| BP | British Propolis |
| STEFFI | Steffi Pro |
| BRE | Brassic Eye |
| BRO | Brassic Pro |
| NORWAY | BP Norway |
| BLUE | British Propolis Blue |
| KID | British Propolis Green |
| BELGIE* | Belgie Facial Wash, Belgie Anti Aging Serum, Belgie Day Cream, Belgie Night Cream, Belgie Hair Tonic |

\* Kategori BELGIE tidak tercantum pada migrasi harga September 2026, namun harga produk-produk BELGIE masih tetap mengikuti harga lama yang sama dan belum berubah.

## 2. Harga modal mitra

Harga modal standar per botol mengikuti harga efektif paket BP reguler terbaru (harga paket dibagi jumlah minimum botol). Pola ini konsisten dengan data lama: modal Reseller Rp217.000 cocok dengan paket lama Rp651.000 ÷ 3. Harga custom tetap mengikuti nilai yang disimpan pada profil masing-masing pengguna dan tidak ditimpa.

| Level mitra | Minimal pembelian | Modal terbaru/botol | Total modal paket minimum |
| Level mitra | Minimal pembelian | Modal standar/botol | Total paket minimum |
|---|---:|---:|---:|
| Reseller | 3 botol | Rp240.000 | Rp720.000 |
| Agen | 5 botol | Rp225.000 | Rp1.125.000 |
| Agen Plus | 10 botol | Rp210.000 | Rp2.100.000 |
| Spesial Agen Plus (SAP) | 40 botol | Rp195.000 | Rp7.800.000 |
| Special Entrepreneur (SE) | 200 botol | Rp175.000 | Rp35.000.000 |
| Kustom | Ditentukan sendiri | Sesuai modal kustom aktif | Modal kustom × kuantitas |

Kuantitas order menentukan tier harga jual paket, tetapi tidak otomatis menaikkan level/modal pemilik order. Nilai standar di atas menggunakan kelompok BP reguler. Paket Green/Blue memiliki harga efektif berbeda pada beberapa tier; profil saat ini menyimpan satu modal standar per level, bukan modal per kategori produk. Level kustom memakai nilai khusus yang tersimpan pada profil pengguna.

## 3. Selisih kotor indikatif untuk paket

Keuntungan kotor bergantung pada modal aktif akun. Karena nilai modal terbaru belum terverifikasi, tabel berikut menunjukkan rumusnya, bukan nominal keuntungan. `M` adalah modal per botol aktif pada level mitra pemilik order.

| Paket | Harga jual BP Group/reguler | Profit kotor BP Group/reguler | Harga jual Blue/Green | Profit kotor Blue/Green |
|---:|---:|---:|---:|---:|
| 3 botol | Rp720.000 | Rp720.000 − (3 × M) | Rp780.000 | Rp780.000 − (3 × M) |
| 5 botol | Rp1.125.000 | Rp1.125.000 − (5 × M) | Rp1.225.000 | Rp1.225.000 − (5 × M) |
| 10 botol | Rp2.100.000 | Rp2.100.000 − (10 × M) | Rp2.250.000 | Rp2.250.000 − (10 × M) |
| 40 botol | Rp7.800.000 | Rp7.800.000 − (40 × M) | Rp8.400.000 | Rp8.400.000 − (40 × M) |
| 200 botol | Rp35.000.000 | Rp35.000.000 − (200 × M) | Rp35.000.000 | Rp35.000.000 − (200 × M) |

Profit bersih order didapat setelah mengurangi pengeluaran tambahan order. Harga satuan juga menggunakan rumus yang sama: harga jual satuan − modal per botol aktif.

## 4. Logika perhitungan keuntungan di sistem

Perhitungannya berjalan dalam dua lapis: keuntungan per order, lalu keuntungan bersih periode.

1. **Total penjualan barang** = jumlah seluruh subtotal item order. Harga per item berasal dari paket katalog sesuai produk dan tier/kuantitas order.
2. **Total modal produk** = modal per botol level mitra pemilik order × total botol. Untuk level kustom, sistem memakai modal kustom yang tersimpan.
3. **Profit kotor order** = total penjualan barang − total modal produk.
4. **Margin/profit bersih order** = profit kotor order − pengeluaran tambahan order yang dicatat, misalnya ongkos kirim atau biaya lain.
5. **Profit bersih periode pada laporan yang menyertakan biaya** = total profit kotor order − pengeluaran tambahan order − pengeluaran umum + pemasukan lain.

> Contoh rumus: paket BP Group 3 botol memiliki profit kotor Rp720.000 − (3 × M). Jika ada pengeluaran order sebesar `B`, margin order = Rp720.000 − (3 × M) − `B`.

**Yang mengurangi keuntungan:**

- Modal pokok semua botol berdasarkan level mitra pemilik order.
- Pengeluaran tambahan yang dimasukkan pada order, seperti ongkir/packing atau biaya lain. Nilainya mengurangi margin order.
- Pengeluaran umum yang dicatat di menu Pengeluaran. Nilainya mengurangi profit bersih pada laporan periode yang menyertakan biaya.

Diskon tidak dikurangkan sebagai pos tersendiri dalam rumus profit; bila harga paket/subtotal item sudah berupa harga setelah diskon, dampaknya sudah mengurangi total penjualan barang. Pemasukan lain yang dicatat di menu Pemasukan ditambahkan pada profit bersih periode.

**Perbedaan tampilan dan batasan pencatatan:**

- Pilihan **Eksl. Biaya** menampilkan profit kotor (penjualan barang − modal), sedangkan **Inkl. Biaya** memasukkan pengeluaran order, pengeluaran umum, dan pemasukan lain. Kartu order menampilkan profit kotor dan margin order setelah pengeluaran order, tetapi belum mengalokasikan pengeluaran umum.
- Form order menambahkan pengeluaran tambahan ke total tagihan yang ditampilkan, tetapi `orders.total_price` menyimpan subtotal barang saja. Karena itu, pengeluaran yang dibebankan kembali ke pelanggan tidak tercatat sebagai penjualan barang pada `total_price`; angka omzet/profit laporan dapat lebih rendah sebesar biaya yang ditagihkan tersebut.
- Biaya, diskon, pajak, dan potongan pembayaran hanya memengaruhi hitungan jika masuk ke subtotal item atau dicatat sebagai pengeluaran/pemasukan. Pada jalur rumus order yang diperiksa, tidak ada potongan otomatis terpisah untuk pajak atau biaya pembayaran.

## 5. Catatan penting

- Harga produk-produk BELGIE masih sama seperti harga sebelumnya: Rp195.000 per botol, Rp585.000 untuk 3 botol, Rp975.000 untuk 5 botol, Rp1.800.000 untuk 10 botol, Rp6.800.000 untuk 40 botol, dan Rp30.000.000 untuk 200 botol. Keuntungan BELGIE juga perlu memakai modal aktif yang sudah dikonfirmasi.
- Migrasi September mengatur harga jual paket untuk kelompok BP, BP Blue/Green, dan produk lain yang tercantum; BELGIE belum ada pembaruan yang mengubah angka sebelumnya.
- Nilai modal standar mengikuti harga efektif paket BP reguler yang terbaru: Reseller Rp240.000, Agen Rp225.000, Agen Plus Rp210.000, SAP Rp195.000, dan SE Rp175.000 per botol.
- Nilai modal kustom dan kemungkinan perubahan langsung di database perlu diperiksa pada akun/katalog aktif.
- File sumber menyimpan modal default dalam kode, sedangkan data transaksi memakai snapshot harga. Perubahan katalog baru tidak semestinya mengubah harga order historis.

## Sumber

- `src/types/index.ts` — harga modal default dan tier paket.
- `src/lib/pricing.ts` — harga fallback dan aturan tier lama.
- `supabase/migrations/20260912010000_update_katalog_harga_september_2026.sql` — harga paket yang berlaku mulai 1 September 2026.
- `supabase/seed.sql` — nilai seeder awal; bukan acuan harga September.
