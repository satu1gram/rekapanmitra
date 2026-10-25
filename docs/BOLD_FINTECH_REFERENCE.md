# MULA — UI/UX berdasarkan referensi, Bold Fintech

25 Oktober 2026 (WIB) · prototipe mobile v3 · branch `preview/mobile-ai`.

**Pembaruan v4:** visual Bold dipertahankan, tetapi prioritas informasi diubah berdasarkan keluhan keuangan pengguna dan walkthrough otomatis. Navigasi aktif kini Beranda/Pesanan/Stok/Uang. Lihat [evidence dan hasil redesign](research/MITRA_REDESIGN_EVIDENCE.md); dokumen ini mencatat fondasi visual v3.

Pengguna memilih **Bold Fintech** dan memberikan referensi delapan layar aplikasi mobile. Arah ini sudah menjadi default pada seluruh prototipe. Halaman `/#/designs` sekarang menjelaskan sistem desain yang diterapkan; bukan lagi pemilihan A/B/C.

## Pembacaan referensi secara sistematis

Referensi memperlihatkan satu layar pembuka dengan visual dominan dan tujuh layar operasional dengan permukaan terang. Hierarkinya konsisten: konteks/judul → pencarian atau navigasi lokal → konten utama → satu tindakan atau navigasi bawah. Foto menjadi jangkar pengenalan produk, sedangkan harga dan jumlah tetap berupa teks yang jelas.

| Pola yang diamati | Penerapan dalam MULA | Penyesuaian pada kebutuhan usaha BP |
|---|---|---|
| Pembuka dengan foto dominan, judul pendek, satu CTA | Splash navy, tiga slide dengan judul besar, komposisi foto BP, bukti ringkas, CTA lime | Manfaat: catat pesanan, pahami hasil usaha, pantau stok/level |
| Header konteks, pencarian, banner utama | Identitas usaha, pencarian order, banner angka, tombol catat | Omzet, estimasi hasil, uang diterima dan periode dibedakan |
| Kategori berbentuk ikon dengan latar lembut | Empat pintasan: Pesanan, Restok, Stok, Asisten | Jalan singkat untuk pekerjaan harian, tanpa dekorasi kategori makanan |
| Dua kartu foto berdampingan | Produk bulan ini dan katalog dua kolom | Foto dari repository, jumlah terkonfirmasi dari data, harga dan stok SKU |
| Detail dengan cover besar, judul, metadata, tab | Foto produk, nama, kelompok, harga, stok/level, tab harga/modal, CTA bawah | Harga satuan/paket serta modal yang belum diketahui tetap eksplisit |
| Keranjang dengan thumbnail, nama, jumlah dan total | Baris order/restok/toko; stepper dan input angka; subtotal per SKU; total tetap terlihat | Satu pembeli/pemasok, satu aktivitas, banyak item; biaya order dihitung sekali |
| Tracking dengan tahapan vertikal | Timeline order dan restok dengan selesai/saat ini/menunggu | Hanya memakai aktivitas yang dicatat; tidak mengarang lokasi, kurir, waktu tiba atau ETA |
| Favorit, profil dan menu terkelompok | Favorit produk, kartu level mitra, profil berinisial, daftar menu berikon | Mempermudah produk berulang; level bukan klaim langganan berbayar |
| Navigasi empat tujuan yang konsisten | Beranda, Produk, Pesanan, Akun | Laporan tersedia dari banner beranda; aksi catat/restok muncul sesuai konteks |

Yang diambil adalah struktur, penekanan, irama jarak dan pola interaksi. Identitas, foto makanan, ulasan, lokasi pengiriman, diskon serta klaim layanan pada referensi tidak dijadikan data usaha BP. Foto produk lokal tidak diedit menjadi kemasan baru.

## Sistem visual yang diterapkan

### Peran warna

| Peran | Nilai | Penggunaan |
|---|---|---|
| Navy | `#14244a` | Judul, angka, pembuka, banner usaha, kartu level |
| Electric blue | `#3058ed` | CTA utama, navigasi aktif, stepper, progres |
| Lime | `#d7f86b` | CTA pada permukaan navy, tombol konfirmasi yang menonjol |
| White | `#ffffff` | Permukaan utama dan ruang baca |
| Cloud | `#f5f6fa` | Pencarian, kontrol, permukaan pendukung |
| Secondary text | `#63728c` | Label, periode, keterangan dan status menunggu |
| Border | `#e9edf4` | Pembatas tipis dan kontur kartu |

Warning tetap amber, error/cancel merah, dan informasi tetap memiliki label teks. Warna brand tidak menggantikan status bisnis. Latar kartu produk mengikuti foto asli; halaman dan kontrol memakai palet Bold.

### Aturan komponen

- Jarak memakai kelipatan 4: 8/12/16/20/24/32 px. Isi ponsel memiliki gutter 20 px, turun menjadi 16 px pada lebar di bawah 375 px.
- Judul layar 23–26 px; judul utama onboarding 35–38 px; angka banner 31–34 px. Isi form tetap 16 px agar tidak memicu zoom input iOS. Label metadata lebih kecil dan dipisahkan dari angka utama.
- Kartu umum bersudut 20 px dengan garis tipis. Kartu produk 17 px. Tombol utama minimal 52 px; kontrol jumlah memiliki area 44 px; tombol navigasi minimal 52 px. Ikon pada tombol tetap memakai label aksesibel.
- Foto pada daftar memakai ukuran konsisten; grid katalog dua kolom dengan rasio foto 1,28. Cover detail 248 px. Dimensi intrinsik ditetapkan untuk mengurangi pergeseran layout.
- Satu layar memiliki satu tindakan utama yang jelas. Simpan draf/rencana dan kembali memiliki penekanan sekunder; pembatalan memakai warna khusus.
- Panel total/CTA berada di atas navigasi, memiliki ruang konten cadangan dan tidak menutup input terakhir. Safe area perangkat diperhitungkan. Pindah langkah wizard atau masuk checkout kembali ke heading awal.
- Data kosong, hasil pencarian kosong, modal belum diketahui, offline, gagal baca dan konfirmasi tetap memakai komponen bersama. Focus keyboard dan preferensi reduced motion dipertahankan.

Ini adalah spesifikasi implementasi MULA; bukan klaim ukuran piksel atau nama font asli gambar referensi.

## Perilaku operasional

**Pesanan:** identitas pembeli → pilih beberapa SKU → atur botol dan cara jual → biaya order → review seluruh item → satu persetujuan dan nomor order. Produk yang sama tidak dipilih ulang; input tidak valid tidak disembunyikan lewat penggabungan. Panel total mengikuti nilai quote, bukan angka tampilan terpisah.

**Restok:** pemasok/tanggal sekali → beberapa SKU dengan jumlah/modal masing-masing → ringkasan botol, ekuivalen dan nilai → rencana atau pembelian disepakati → penerimaan lengkap. Barang perjalanan, ekuivalen bulan pembelian, dan stok fisik tanggal terima tetap dipisahkan. Pembatalan mengoreksi seluruh aktivitas sebelum penerimaan.

**Pembayaran dan pemenuhan:** timeline mengikuti status pesanan/pengiriman. Pelunasan tidak menyelesaikan pengiriman otomatis, dan pengiriman tidak membuat lunas. Nota pelanggan tidak menampilkan modal atau laba. Timeline restok tidak menambah omzet.

**Toko pelanggan:** pencarian/kategori → keranjang beberapa produk → ubah/hapus jumlah → data penerima → satu permintaan sebagai draf pemilik. Ongkir diperiksa pemilik. Tidak ada pembayaran atau pesan eksternal yang dikirim. Submit dilindungi agar satu tindakan tidak membuat draf ganda.

**Pencarian dan favorit:** pencarian beranda membuka daftar order dengan filter yang sama. Favorit adalah preferensi SKU dalam memori sesi, dapat ditambah/dihapus dan difilter. Tidak mengubah stok, harga, order atau laporan. Reset skenario memuat ulang preferensi contoh.

## Aksesibilitas dan pembatasan

Peran warna dan hierarki tetap mengacu dokumentasi resmi [Material Color](https://github.com/material-components/material-web/blob/main/docs/theming/color.md), [Typography](https://github.com/material-components/material-web/blob/main/docs/theming/typography.md), [Buttons](https://github.com/material-components/material-web/blob/main/docs/components/button.md), serta [WCAG Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) dan [Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Pasangan brand utama sudah dihitung: teks putih pada biru **5,61:1**, navy pada lime **12,69:1**, teks sekunder pada putih **4,87:1**. Label aksesibel tetap ada pada input yang label visualnya disederhanakan, dan status progres memakai teks serta penanda bentuk. Angka ini bukan audit WCAG seluruh aplikasi. Usability test mitra, pembesaran teks sistem, screen reader dan keyboard perangkat asli masih perlu dilakukan sebelum rilis.

## Verifikasi dan artefak

- 69 tes aplikasi dan 4 tes guard output build.
- Pengujian browser mencakup 54 layar serta alur akun, capture, order, pembayaran, pemenuhan/retur, restok, stok, pelanggan, toko dan pengaturan.
- Pengujian tambahan mencakup satu restok/order tiga SKU, penerimaan/pembatalan, biaya satu kali, nota pelanggan, favorit, pencarian beranda, pemindahan jumlah dari katalog, input nol, checkout, dan desain Bold sebagai default.
- Layout diperiksa pada 360/390/430 × 844 px. Posisi panel aksi diperiksa terhadap navigasi dan viewport; viewport pendek 390 × 640 juga diperiksa. Gambar yang direkam ditunggu hingga selesai decode; respons aset gagal dicatat sebagai kegagalan.
- PDF/board review: `/workspace/artifacts/MULA-Bold-Fintech-Reference.pdf` dan `.png`.
- Tangkapan layar terfokus serta manifest: `/workspace/artifacts/mula-bold-fintech/`.
- Kumpulan lengkap: `/workspace/artifacts/MULA-Mobile-Prototype.pdf` dan `/workspace/artifacts/MULA-Mobile-Screens.zip`.

Build tetap menolak modul Auth/Supabase serta endpoint produksi. Foto dibundel lokal, tidak diambil dari backend live. Data dan AI/OCR/koneksi akun masih simulasi. Native shell Android/iOS disinkronkan, tetapi APK/IPA dan perangkat native belum diuji. Type-check aplikasi utama masih memiliki error lama di luar prototipe; direktori prototipe tidak menambah error.

```bash
npm run build:cloudflare-preview
npm test
node --test scripts/verify-preview-output.test.mjs
npm run test:prototype
DESIGN_ARTIFACTS=/workspace/artifacts/mula-bold-fintech npm run test:prototype:multi
npm run mobile:prototype:sync
```

Setelah screenshot selesai, `python3 scripts/export-bold-reference.py` membuat board/PDF dan ZIP dari manifest terverifikasi (memerlukan ReportLab dan font DejaVu). Render halaman pertama PDF ke PNG menggunakan `pdftoppm -f 1 -singlefile -scale-to 1800 -png /workspace/artifacts/MULA-Bold-Fintech-Reference.pdf /workspace/artifacts/MULA-Bold-Fintech-Reference`.
