# Roadmap Admin Produk & Harga

> Status: Rencana eksekusi
> Tanggal: 11 September 2026
> Pemilik: Engineering / CTO

## Keputusan Arsitektur

### Kondisi saat ini

- Route admin `/admin/dashboard` dan `/admin/mitra` berada di repo aplikasi mitra ini.
- Akses admin saat ini diperiksa oleh `AdminLayout` berdasarkan `profiles.role`.
- Database sudah memiliki tabel `master_products` dengan RLS.
- Belum ada route `/admin/products` untuk mengelola produk dan harga.
- Harga order internal masih menggunakan fallback hardcoded di `src/lib/pricing.ts`.
- Toko publik membaca data dari `master_products`.

### Rekomendasi

Untuk fase implementasi pertama, admin tetap berada di repo ini agar:

- Perubahan schema, frontend, dan pricing bisa direview bersama.
- Deployment lebih sederhana.
- Tidak ada duplikasi type dan logic harga antar-repo.

Namun deployment admin sebaiknya dipisahkan dari aplikasi mitra, misalnya:

- Aplikasi mitra: `app.mitrabp.biz.id`
- Portal admin: `admin.mitrabp.biz.id`

Pemisahan host membantu isolasi operasional dan deployment, tetapi bukan pengganti authorization.

## Keamanan Admin

URL admin tidak perlu dibuat acak atau sulit ditebak. URL tersembunyi hanya security by obscurity dan tidak melindungi data.

Kontrol wajib:

- Supabase Auth untuk login.
- Role check server-side berdasarkan `profiles.role`.
- RLS pada semua tabel sensitif.
- `WITH CHECK` pada policy INSERT/UPDATE, bukan hanya `USING`.
- MFA untuk akun admin.
- Tidak ada service role key di browser.
- Audit log untuk perubahan harga: siapa, kapan, produk apa, harga lama, harga baru.
- Validasi harga positif dan batas maksimum yang masuk akal.
- Konfirmasi sebelum menghapus atau menonaktifkan produk.
- Admin route tidak menampilkan data sensitif yang tidak diperlukan.
- Monitoring login gagal dan perubahan harga.

Jika portal admin dipisah ke repo lain, repository tersebut sebaiknya private dan deployment memakai environment variable terpisah. Schema/migration tetap memiliki satu pemilik resmi agar tidak terjadi drift.

## Target Fitur

Tambahkan route:

```text
/admin/products
```

Fitur minimum:

- Daftar produk aktif/nonaktif.
- Filter kategori.
- Tambah produk.
- Edit nama, kategori, package type, jumlah paket, dan harga jual.
- Aktif/nonaktifkan produk.
- Konfirmasi penghapusan.
- Riwayat perubahan harga.

## Model Harga

`master_products` menjadi sumber kebenaran harga jual pusat.

| Jenis data | Sumber |
|---|---|
| Harga jual produk | `master_products.price` |
| Tier berdasarkan kuantitas | `master_products.quantity_per_package` |
| Harga modal level mitra | Konfigurasi level mitra |
| Harga transaksi lama | Snapshot pada order/order_items |
| Harga toko publik | `master_products` |

Harga transaksi lama tidak boleh dihitung ulang ketika admin mengubah harga baru.

### Invariant Harga Historis

Ini adalah aturan integritas data yang wajib dipertahankan:

- Perubahan harga katalog hanya berlaku untuk transaksi baru setelah perubahan aktif.
- Order yang sudah tersimpan tidak boleh membaca ulang harga dari `master_products`.
- Order lama harus menyimpan snapshot `price_per_bottle`, `subtotal`, `total_price`, dan biaya modal/margin yang dipakai saat transaksi dibuat.
- Edit katalog tidak boleh menjalankan bulk update terhadap order historis.
- Jika order masih berupa draft dan belum disimpan, harga boleh dihitung ulang menggunakan katalog terbaru.
- Jika diperlukan koreksi order lama, koreksi harus menjadi aksi eksplisit dengan audit trail, bukan efek samping perubahan katalog.

Test minimum:

1. Simpan order dengan harga katalog A.
2. Ubah katalog menjadi harga B.
3. Buka kembali order lama dan pastikan nilainya tetap A.
4. Buat order baru dan pastikan menggunakan B.

## Rencana Eksekusi

### Fase 0: Audit dan kontrak data

- [ ] Pastikan semua row `master_products` memiliki kategori, package type, quantity, dan price valid.
- [ ] Inventarisasikan kolom snapshot harga pada `orders` dan `order_items`.
- [ ] Putuskan format unik produk + package tier.
- [x] Pastikan schema database memiliki migration owner tunggal.

### Fase 1: Admin Produk

- [x] Buat `AdminProductsPage`.
- [x] Tambahkan route `/admin/products`.
- [x] Tambahkan item menu Produk pada `AdminLayout`.
- [ ] Buat hook admin CRUD khusus untuk `master_products`.
- [x] Tambahkan form validasi harga dan quantity.
- [x] Gunakan nonaktifkan sebagai pengganti delete keras dari UI.
- [x] Perkuat RLS dengan policy `WITH CHECK`.
- [x] Tambahkan audit log perubahan harga melalui migration dan trigger.

### Fase 2: Price Resolver Bersama

- [ ] Buat resolver berdasarkan catalog `master_products`.
- [ ] Resolver menentukan tier dari total quantity.
- [ ] Resolver mengembalikan harga unit, subtotal, product id, dan source tier.
- [ ] Pertahankan fallback hanya untuk mode migrasi/error, dengan logging.
- [ ] Tambahkan unit test untuk tier 1, 3, 5, 10, 40, dan 200.
- [ ] Hapus ketergantungan utama pada `PRICE_TABLE` setelah parity test lolos.

### Fase 3: Order Manual

- [ ] Update `TambahOrderFlow` agar memakai catalog resolver.
- [ ] Update `OrderForm` edit order agar memakai catalog resolver.
- [ ] Update `OrdersPage` agar menyimpan snapshot harga final.
- [ ] Pastikan perubahan harga baru tidak mengubah order lama.
- [ ] Tampilkan error yang jelas bila produk nonaktif atau tidak ditemukan.

### Fase 4: AI Order

- [ ] AI hanya melakukan parsing nama produk dan quantity.
- [ ] Cocokkan hasil parsing ke `master_products`.
- [ ] Hitung harga setelah parsing menggunakan resolver catalog.
- [ ] Tampilkan sumber tier dan harga pada kartu konfirmasi.
- [ ] Jangan menerima harga dari output AI sebagai sumber kebenaran.
- [ ] Tambahkan test untuk produk ambigu dan produk nonaktif.

### Fase 5: Telegram Bot / Edge Function

- [ ] Hapus pricing map hardcoded dari `telegram-bot`.
- [ ] Baca catalog aktif dari `master_products`.
- [ ] Samakan aturan tier dengan frontend.
- [ ] Simpan snapshot harga pada transaksi bot.
- [ ] Tambahkan regression test untuk bundle reseller dan multi-produk.

### Fase 6: Toko Publik

- [ ] Pastikan toko publik memakai resolver yang sama.
- [ ] Pastikan hanya produk aktif yang ditampilkan.
- [ ] Validasi ulang harga di server/RPC saat submit order publik.
- [ ] Jangan percaya total harga yang dikirim browser.
- [ ] Simpan harga final dari server sebagai snapshot transaksi.

### Fase 7: Release dan rollout

- [ ] Deploy ke staging.
- [ ] Uji perubahan harga dengan akun admin test.
- [ ] Uji order manual, AI, Telegram, dan toko publik.
- [ ] Bandingkan hasil dengan pricing lama untuk fixture yang sama.
- [ ] Jalankan test, build, dan security scan.
- [ ] Release dengan feature flag atau fallback sementara.
- [ ] Pantau error dan total transaksi setelah rollout.
- [ ] Hapus fallback hardcoded setelah periode stabil.

## Protokol Dokumentasi dan Handoff Agent

Setiap perubahan dari roadmap wajib meninggalkan konteks yang dapat dilanjutkan agent lain.

Sebelum mengakhiri satu fase atau sesi kerja, dokumentasikan:

- Status fase dan checklist yang sudah selesai.
- File yang diubah dan alasan perubahan.
- Keputusan teknis yang diambil dan alternatif yang ditolak.
- Migration, schema, atau environment variable yang ditambahkan.
- Test, build, lint, dan security scan yang dijalankan beserta hasilnya.
- Risiko, blocker, dan tindakan user yang masih diperlukan.
- Langkah berikutnya yang paling aman dan entry point file/symbol-nya.

Format handoff minimum:

```markdown
## Handoff [tanggal]

### Status
- Fase: Fase N - Nama fase
- Selesai: ...
- Belum selesai: ...

### Perubahan
- `path/file.ts`: ringkasan perubahan

### Keputusan
- Keputusan: ...
- Alasan: ...

### Validasi
- Test: ...
- Build: ...
- Security scan: ...

### Risiko / Blocker
- ...

### Next Step
1. ...
```

Handoff harus disimpan di `docs/qa/` atau pada bagian status file roadmap sebelum pekerjaan berikutnya dimulai. Agent berikutnya wajib membaca handoff terbaru dan tidak mengasumsikan status dari percakapan sebelumnya.

## Acceptance Criteria

Fitur dianggap selesai jika:

- Admin dapat mengubah harga melalui `/admin/products`.
- User non-admin tidak dapat melakukan mutation.
- Order manual memakai harga terbaru.
- AI order memakai harga terbaru.
- Telegram bot memakai harga terbaru.
- Toko publik memakai harga terbaru.
- Order lama tetap memiliki nilai lama.
- Semua harga final divalidasi server-side.
- Setiap perubahan harga tercatat di audit log.
- Tidak ada API key atau service role key di frontend.
- Unit test pricing dan regression test lulus.

## Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Harga transaksi berubah setelah katalog diedit | Simpan snapshot harga pada transaksi |
| Frontend dimanipulasi | Hitung ulang dan validasi di server/RPC |
| Resolver frontend dan bot berbeda | Gunakan kontrak data dan fixture test yang sama |
| Admin tidak sengaja menghapus produk | Soft-delete/nonaktifkan dan confirmation dialog |
| RLS salah konfigurasi | Test akses admin/non-admin di staging |
| Migration drift antar repo | Tetapkan satu migration owner |
| Harga hardcoded masih dipakai | Instrument fallback dan hapus setelah parity test |

## Keputusan yang Masih Dibutuhkan

- [ ] Apakah portal admin akan tetap satu repo atau dipisah setelah fase pertama?
- [ ] Apakah admin wajib MFA sejak awal?
- [ ] Apakah perubahan harga perlu approval dua admin?
- [ ] Berapa lama audit log harus disimpan?
- [ ] Apakah bundle reseller tetap dipertahankan atau dimodelkan seluruhnya di `master_products`?
