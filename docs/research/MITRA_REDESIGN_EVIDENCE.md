# Dasar redesign mitra BP: uang, tagihan, modal dan laba

25 Oktober 2026 WIB · baseline `f2f8319` · prototipe terisolasi, Bold Fintech.

## Bukti yang tersedia dan batasnya

Prioritas langsung dari pengguna sesi ini: **“Uang masuk, tagihan, modal, dan laba membingungkan.”** Ini menjadi kebutuhan utama yang ditindaklanjuti. Pernyataan tersebut bukan survei representatif mitra British Propolis dan tidak menyertakan jumlah responden atau wawancara individual.

Pekerjaan dibagi ke peran evidence researcher, walkthrough persona mitra, auditor bisnis, UX architect, serta implementer. Agent walkthrough menjalankan skenario sintetis Bu Rina, 45 tahun, pada aplikasi; usia/nama/peran adalah simulasi, bukan partisipan manusia. Auditor dan UX architect memberikan temuan awal independen. Sebagian agent terhenti karena batas penggunaan sebelum menyelesaikan laporan; dokumen ini menggabungkan temuan yang benar-benar diterima, kemudian implementasi dan pengujian dituntaskan agent utama.

Akses ke situs BP dan mesin pencari yang dicoba agent riset ditolak proxy `CONNECT 403`. Karena itu tidak ada kutipan keluhan publik BP, statistik prevalensi, atau klaim wawancara mitra yang dibuat dari hasil tersebut. Dokumen promosi internal bukan pengganti data pengguna.

| Kategori evidence | Sumber | Yang dapat disimpulkan |
|---|---|---|
| Kebutuhan langsung sesi | Jawaban pengguna di atas | Kejelasan empat makna uang adalah prioritas redesign ini |
| Observasi browser otomatis | [JSON baseline](baseline-walkthrough.json), Chromium 390 × 844 | Bug format biaya, posisi tindakan, langkah dan keterbatasan yang dapat direproduksi |
| Aturan produk internal | [MULA × BP Product Plan](../MULA_BP_PRODUCT_PLAN.md), bagian beranda, order dan laporan | Draf bukan omzet, restok bukan penjualan, laba/arus uang harus terpisah, modal belum diketahui tidak dianggap nol |
| Hipotesis pemasaran | [Strategi promosi](../promosi-threads/00-strategi.md), “Pain point audience” | Hipotesis catatan berantakan, laba tidak diketahui, stok mendadak habis; bukan bukti prevalensi atau testimoni tervalidasi |
| Heuristik antarmuka | [Material color](https://github.com/material-components/material-web/blob/main/docs/theming/color.md), [typography](https://github.com/material-components/material-web/blob/main/docs/theming/typography.md), [buttons](https://github.com/material-components/material-web/blob/main/docs/components/button.md), [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Dasar hierarki, label, penekanan tindakan dan keterbacaan; tidak membuktikan pengguna BP sudah mudah memakai aplikasi |

## Temuan dan keputusan yang dapat dilacak

| Temuan | Bukti / tingkat keyakinan | Perubahan |
|---|---|---|
| Empat makna uang membingungkan | Pengguna sesi; kuat sebagai prioritas produk, prevalensi belum diketahui | Empat kartu terpisah: uang diterima, belum dibayar, modal produk terjual, estimasi laba; detail dapat diketuk |
| Shortcut draf tersembunyi di bawah foto produk | Browser baseline: posisi y=842, navigasi mulai y=768; tinggi keyakinan | Foto produk dipindahkan dari prioritas beranda; tindakan harian dan antrean draf/tagihan tampil sebelum katalog |
| “Ongkir 20rb, infaq 5rb” menjadi biaya Rp25 | Browser baseline: laba Rp119.975, padahal seharusnya Rp95.000; tinggi keyakinan | Parsing rupiah konservatif: rb/ribu/k, pemisah ribuan dan bentuk jelas lainnya. Biaya Rp25.000, bukan Rp25 |
| “20.000” dan “5.000” tidak menghasilkan baris biaya | Browser baseline; tinggi keyakinan | Dukungan format ribuan; nominal ambigu/unknown tetap kosong dan memblokir konfirmasi |
| Paket campuran hanya menjelaskan kegagalan setelah review | Kode dan browser; tinggi keyakinan | Masalah harga/modal/biaya ditampilkan di langkah item; alasan tombol terblokir dekat tombol |
| Simpan draf memerlukan pembeli lengkap | Audit kode; tinggi keyakinan | Draf tanpa nama dapat disimpan sebagai “Pembeli belum diisi”; tidak masuk penjualan, tagihan, atau reservasi final |
| Restok dianggap dapat berhubungan langsung dengan laba | Risiko mental model dari kebutuhan pengguna + aturan produk; belum uji manusia | Modal produk dalam pesanan dan nilai pembelian pemasok dipisahkan. Pembelian tidak dikurangi dari laba dua kali |
| Tanggal rencana restok ditimpa tanggal menekan konfirmasi | Audit kode; tinggi keyakinan | Pengguna memilih tanggal pembelian aktual; tanggal itu dipertahankan untuk periode level |
| Pengiriman sebagian belum dapat diterima | Walkthrough prototipe; tinggi keyakinan tentang keterbatasan, frekuensi belum diketahui | Dicatat sebagai kebutuhan berikutnya; tidak menambah model stok parsial dalam redesign keuangan ini |

## Makna angka yang digunakan

- **Nilai penjualan:** jumlah nilai order yang sudah dikonfirmasi dalam periode pesanan. Draf dan pembatalan tidak dihitung.
- **Uang diterima:** pembayaran yang dicatat untuk order periode tersebut, setelah pengembalian yang tercatat. Ini bukan saldo rekening dan bukan laporan berdasarkan tanggal transfer.
- **Belum dibayar:** nilai jual dikurangi pembayaran yang sudah dicatat. Daftar “Semua periode” menjaga tagihan lama tetap dapat ditemukan. Tidak ada klaim terlambat karena tanggal jatuh tempo belum dicatat.
- **Modal produk terjual:** acuan modal yang tersimpan pada order ketika dicatat. Ini tidak sama dengan seluruh pembelian stok bulan berjalan dan tidak berubah otomatis ketika level/harga baru berubah.
- **Estimasi laba usaha:** laba order setelah modal/biaya penjual, dikurangi biaya usaha dan ditambah pendapatan lain. Nominal yang belum diketahui menghasilkan “Belum tersedia”, bukan nol.
- **Nilai pembelian pemasok:** nilai pembelian disepakati pada bulan beli. Ini tidak membuktikan pemasok sudah dibayar; prototipe belum memiliki ledger pembayaran pemasok.

Keterbatasan periode ditampilkan dekat pemilih bulan: pembayaran order September yang diterima Oktober tetap muncul pada laporan order September. Rekap transfer harian, saldo awal, penarikan pribadi, dan rekonsiliasi bank belum tersedia. Redesign tidak mengklaim sudah menyelesaikan akuntansi kas lengkap.

## Perjalanan yang dirancang

1. **Beranda:** catat penjualan/pembayaran, tempel chat/restok, empat arti uang, draf dan tagihan yang perlu dituntaskan. Navigasi tetap empat tujuan: Beranda, Pesanan, Stok, Uang. Profil tersedia dari avatar; katalog tersedia dari Stok atau tautan beranda.
2. **Uang → Ringkasan:** empat angka dan rekonsiliasi penjualan = pembayaran + sisa tagihan.
3. **Kenapa berbeda:** pilih pesanan dari data contoh. Contoh BP Green Rp285.000, modal Rp245.000, biaya Rp17.000 → laba Rp23.000; jika belum dibayar, uang diterima tetap Rp0 dan tagihan Rp285.000.
4. **Tagihan:** lihat periode ini atau semua periode, ketuk “Catat pembayaran”. Form menjelaskan nominal tambahan serta sisa sebelum/sesudah. Menerima uang tidak menciptakan penjualan/laba kedua.
5. **Modal & laba:** rumus berurutan; belanja stok ditampilkan terpisah. Pesanan baru memperlihatkan estimasi ini sebelum konfirmasi.
6. **Chat:** format biaya yang jelas dihitung; nominal tidak diketahui menjadi baris kosong wajib dilengkapi. Persetujuan pemeriksaan tidak dapat mengganti nominal kosong menjadi nol. Pesan asli tetap dapat dibuka.

## Pemeriksaan yang benar-benar dilakukan

`npm run test:prototype:finance` menjalankan skenario otomatis melalui UI, bukan menyuntik state React:

- Empat nilai baseline: uang diterima Rp835.000, tagihan Rp1.400.000, modal produk Rp1.995.000, laba Rp189.000.
- Order 3 SKU bernilai Rp1.595.000, modal Rp1.475.000, biaya “20rb + 5rb” Rp25.000 → laba order Rp95.000.
- Setelah order dikonfirmasi, pembayaran belum bertambah. Setelah penerimaan Rp100.000: uang diterima bertambah Rp100.000, tagihan turun Rp100.000; modal dan laba tetap.
- Draf tanpa nama tidak masuk angka keuangan. Biaya kosong/ambigu tidak dapat dikonfirmasi meskipun checkbox pemeriksaan dicentang.
- Tanggal pembelian aktual dipertahankan; pembelian pemasok tidak menaikkan uang dari pelanggan atau laba.
- Semua empat kartu uang dan shortcut draf berada di atas navigasi pada 360/390/430 × 844. Posisi sesudah tercatat pada manifest, bukan asumsi.

Baseline 390 px: pintasan perhatian y=842. Sesudah: shortcut draf sekitar y=647, seluruh tombol sampai y=711, sebelum navigasi y=768. Pengukuran ini menunjukkan keterjangkauan layar, bukan bukti penurunan waktu tugas manusia.

Gambar pembanding baseline memakai capture versi `f2f8319` yang sudah menunggu foto selesai dimuat; screenshot observasi awal juga disimpan terpisah. Foto yang terlambat dimuat tidak dipakai sebagai alasan menyebut desain lama lebih buruk.

Tambahan: 93 unit/integration tests pada 11 file; empat guard build; sweep 54 layar dan alur end-to-end sebelumnya. Bukti terbaru tersimpan pada `/workspace/artifacts/mula-finance-usability/manifest.json`. Gambar baseline dan sesudah disertakan dalam paket review.

## Validasi dengan mitra nyata yang masih dibutuhkan

Sesi ini belum merekrut atau menghubungi mitra. Untuk validasi formatif, gunakan 5–8 mitra secara sukarela, dengan variasi pengalaman dan kenyamanan memakai ponsel. Gunakan data sintetis dan perangkat yang biasa mereka pakai; jangan meminta data bank/chat pelanggan asli.

Tugas tanpa petunjuk: temukan uang yang sudah diterima; bedakan tagihan dari laba; catat order tiga SKU dan ongkir 20rb; terima pembayaran sebagian; jelaskan modal terjual versus belanja stok; temukan tagihan bulan lalu. Catat jawaban, salah ketuk, langkah yang memerlukan bantuan, dan biaya/nominal yang terlewat. Tanya “angka ini menurut Anda berarti apa?” sebelum menjelaskan istilah.

Kriteria review berikutnya: tidak ada kesalahan kritis yang mengubah nominal; pengguna dapat membedakan keempat angka dan menemukan tindakan pembayaran tanpa arahan. Ambang ini adalah rencana penerimaan, bukan hasil studi yang sudah lulus. Bila masih bingung, ubah label/hierarki lalu uji kembali; jangan menyebut desain “optimal untuk seluruh mitra” hanya dari pengujian otomatis.
