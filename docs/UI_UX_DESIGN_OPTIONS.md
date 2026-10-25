# Arsip eksplorasi: pilihan UI/UX dan aktivitas multiproduk

25 Oktober 2026 · branch `preview/mobile-ai` · prototipe React + Capacitor.

**Status terbaru:** pengguna telah memilih **Bold Fintech** dengan referensi visual tambahan. Implementasi aktif dan panduan ada di [Bold Fintech Reference](BOLD_FINTECH_REFERENCE.md). Dokumen ini menyimpan perbandingan sebelum keputusan tersebut; rute desain lama kini mengikuti tampilan Bold yang dipilih.

## Pilihan yang bisa dicoba

Buka [galeri desain](https://rekapanmitra-mobile-demo.pages.dev/#/designs) setelah deployment branch preview selesai. Tombol **Coba di seluruh layar** mengubah tampilan sesi yang sedang dibuka, termasuk form, detail, katalog, laporan, onboarding, dan pengaturan. Tautan langsung di bawah membuka data contoh yang sama. Belum ada keputusan desain final; reload tanpa parameter desain kembali ke tampilan awal.

| Opsi | Tampilan dan prioritas | Cocok untuk dipertimbangkan | Pertimbangan |
|---|---|---|---|
| **A — Calm Finance** | Putih/mint, emerald, angka ringkas, ruang cukup, kartu tenang; ringkasan usaha lebih dulu | Mitra yang ingin cepat membaca omzet/hasil dan mencatat, termasuk target pengguna 40+ | Ekspresi visual lebih tenang |
| **B — Bold Fintech** | Navy/biru elektrik/lime, angka lebih besar, kartu padat dan sudut lebih tegas; ringkasan usaha lebih dulu | Penjual aktif yang menyukai tampilan finansial ekspresif | Kepadatan perlu diuji pada pengguna yang baru belajar |
| **C — Warm Companion** | Cream/sage, kartu membulat, tombol lapang; daftar tindakan tampil sebelum ringkasan finansial | Mitra pemula yang lebih terbantu oleh pekerjaan yang harus diselesaikan | Laporan angka memerlukan lebih banyak scroll |

Rekomendasi awal **A**: kombinasi hierarki angka sederhana dan tampilan tenang sesuai kebutuhan membaca kondisi usaha serta mencatat order/restok. Ini penilaian desain dari desk research, belum bukti bahwa A paling mudah dipakai oleh mitra BP. Keputusan akhir menunggu pilihan pemilik produk dan uji singkat dengan pengguna.

- [Coba A](https://rekapanmitra-mobile-demo.pages.dev/#/home?design=calm)
- [Coba B](https://rekapanmitra-mobile-demo.pages.dev/#/home?design=bold)
- [Coba C](https://rekapanmitra-mobile-demo.pages.dev/#/home?design=warm)

Perbedaannya mencakup urutan informasi, hierarki angka, ukuran/kerapatan kartu dan bentuk kontrol. Pada C, urutan DOM juga mengikuti urutan visual agar navigasi keyboard dan pembaca layar tetap sejalan. Tidak ada harga, modal, stok, atau data order yang berubah ketika mencoba desain.

## Dasar riset

Desk research memakai dokumentasi resmi berikut, dibaca melalui berkas sumber publik pada 25 Oktober 2026. Tidak mencakup wawancara, pengamatan kerja mitra, benchmark kecepatan pengguna, atau sertifikasi aksesibilitas.

| Sumber | Temuan yang diterapkan |
|---|---|
| [Material Web — Color](https://github.com/material-components/material-web/blob/main/docs/theming/color.md) | Gunakan peran warna untuk permukaan, teks dan tindakan; warna utama membantu hierarki serta identitas, status tidak hanya dibedakan oleh warna |
| [Material Web — Typography](https://github.com/material-components/material-web/blob/main/docs/theming/typography.md) | Bedakan peran judul, angka utama, isi dan label; ukuran/berat/line-height membantu pemindaian |
| [Material Web — Buttons](https://github.com/material-components/material-web/blob/main/docs/components/button.md) | Tindakan utama lebih menonjol; tindakan sekunder seperti simpan rencana dan kembali memiliki penekanan lebih rendah |
| [W3C — Target Size (Minimum), WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [sumber yang dibaca](https://github.com/w3c/wcag/blob/main/understanding/22/target-size-minimum.html) | Minimum AA adalah 24 × 24 CSS px dengan pengecualian termasuk jarak. Untuk kandidat ini, kontrol ikon utama dipilih minimal 48 px dan tombol utama 52–56 px sebagai keputusan produk |
| [W3C — Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [sumber yang dibaca](https://github.com/w3c/wcag/blob/main/understanding/20/contrast-minimum.html) | Teks normal memerlukan rasio 4,5:1, teks besar 3:1. Periksa pasangan teks/latar utama, jangan menganggap palet saja menjamin aksesibilitas |

### Pemeriksaan kontras pasangan utama

Dihitung dari luminansi relatif sRGB. Angka ini hanya memeriksa pasangan warna berikut; belum audit seluruh komponen, placeholder, grafik, state disabled/focus, pembesaran teks, atau platform native.

| Opsi | Teks utama / latar halaman | Teks putih / tombol utama | Teks sekunder / permukaan kartu |
|---|---|---|---|
| A | `#173b32` / `#f5f8f6`: **11,50:1** | `#ffffff` / `#087f60`: **4,98:1** | `#617568` / `#ffffff`: **4,94:1** |
| B | `#14244a` / `#f3f5fb`: **13,95:1** | `#ffffff` / `#3058ed`: **5,61:1** | `#63728c` / `#ffffff`: **4,87:1** |
| C | `#2d3829` / `#faf7f0`: **11,48:1** | `#ffffff` / `#486344`: **6,68:1** | `#716d5e` / `#fffdf8`: **5,10:1** |

Tombol lime pada hero B memakai teks navy, rasio **12,69:1**. Semua pasangan di tabel melampaui 4,5:1; ini bukan klaim seluruh prototipe sudah memenuhi WCAG.

## Satu aktivitas, banyak produk

### Penjualan

Pembeli/tanggal/sumber diisi sekali → pilih beberapa SKU sekaligus → atur botol masing-masing → isi biaya untuk seluruh order → review semua item dan angka → satu konfirmasi dan satu nomor order.

- Pemilih menyembunyikan SKU yang sudah berada dalam keranjang; dropdown mencegah pilihan SKU ganda. Hasil baca yang mengandung SKU berulang digabung sebelum perhitungan dan penyimpanan, tanpa menyembunyikan kuantitas tidak valid.
- Setiap SKU mengikuti harga jual dan modal sesuai rulebook/cara jual. Paket BP/Belgie campuran tetap diblokir bila aturan paket belum ditetapkan; harga tidak ditebak.
- Biaya tingkat order dihitung sekali. Beban penjual mengurangi laba; biaya yang langsung dibayar pembeli ke pihak lain tidak dianggap beban penjual.
- Satu snapshot transaksi memuat seluruh item. Pembayaran berlaku untuk total order; nota pelanggan memuat semua item tanpa modal/laba.
- Konfirmasi mengalokasikan tiap SKU, pengiriman mengurangi stok fisik tiap SKU, pembatalan/retur penuh mengoreksi seluruh order sesuai alur yang sudah ada.

Contoh yang diuji: **BP Reguler 2 + BP Blue 1 + Belgie Facial Wash 4**, jual satuan level Agent. Omzet **Rp1.595.000**, modal **Rp1.475.000**, ongkir penjual **Rp20.000**, estimasi laba **Rp100.000**. Ini angka skenario PRD, bukan perubahan harga produksi.

### Restok

Satu pemasok/tanggal/catatan → pilih beberapa SKU sekaligus → atur botol dan modal/botol masing-masing → satu ringkasan → simpan rencana atau konfirmasi pembelian → terima seluruh produk dalam satu aktivitas.

- Rencana belum menambah stok maupun ekuivalen level.
- Pembelian disepakati menambah barang perjalanan tiap SKU dan ekuivalen pada bulan pembelian.
- Penerimaan memerlukan pemeriksaan seluruh item dan tanggal valid; memperbarui stok semua SKU satu kali. Prototipe ini menggunakan penerimaan lengkap; kiriman belum lengkap dibiarkan berstatus perjalanan.
- Pembatalan sebelum penerimaan membatalkan seluruh baris dan mengoreksi perjalanan/ekuivalen bersama.
- Pembelian tidak menambah omzet penjualan. Tanggal beli dan tanggal terima tetap memiliki fungsi berbeda.
- Baris kosong, SKU tidak dikenal/berulang, botol pecahan/nol, modal tidak diketahui/nol dan total tidak aman memblokir penyimpanan.

Contoh restok yang diuji: **3 SKU, 7 botol fisik, 5 ekuivalen, Rp1.475.000**. Satu aktivitas menyimpan tiga baris, bukan tiga pembelian terpisah.

## Review bersama pengguna

Bandingkan skenario yang sama pada A/B/C: temukan omzet dan hasil usaha; buat order tiga produk; koreksi jumlah; temukan modal yang kosong; rencanakan restok dan terima kiriman. Amati salah ketuk, pemahaman angka, bagian yang terlewat dan kebutuhan scroll. Rekomendasi untuk 40+ perlu divalidasi pada pengguna sasaran, termasuk ukuran teks perangkat mereka.

Pilihan yang dibutuhkan saat ini adalah arah visual **A, B, atau C**. Setelah dipilih, detail komponen dan kondisi error/kosong bisa diseragamkan sebelum integrasi backend/native.

## Bukti dan artefak

- `npm test`: 69 tes aplikasi pada 9 file, termasuk model pembelian multiproduk dan quote campuran.
- `npm run test:prototype`: 54 layar, 67 tangkapan layar, perjalanan akun/order/pembayaran/pengiriman/retur/restok/fitur usaha.
- `npm run test:prototype:multi`: perjalanan multiproduk, pembatalan pembelian, perbandingan tiga tema tanpa mutasi data bisnis, dan layout 360/390/430 px.
- Screenshot asli UI: `/workspace/artifacts/mula-design-options/`; manifest mencatat hasil pemeriksaan.
- PDF perbandingan: `/workspace/artifacts/MULA-UI-Options.pdf`; halaman awal: `/workspace/artifacts/MULA-UI-Options.png`.

Seluruh implementasi berada dalam prototipe terisolasi pada branch preview. Tidak ada perubahan skema, transaksi, atau koneksi backend produksi. Belum merupakan APK/IPA atau fitur transaksi live.
