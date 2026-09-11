# Handoff Agent

## Status

- Fase: Fase 1 - Admin Produk & Harga.
- Status: `/admin/products` sudah dibuat; integrasi pricing ke order belum dimulai.
- Route admin yang tersedia: `/admin/dashboard`, `/admin/products`, dan `/admin/mitra`.
- Harga order internal masih memakai fallback `src/lib/pricing.ts`.
- Toko publik membaca katalog dari `master_products`.

## Perubahan Dokumentasi

- `docs/ROADMAP_ADMIN_HARGA.md`: roadmap admin harga, keamanan URL/admin, invariant harga historis, dan protokol handoff.
- `docs/dokumentasi_teknis_v2.6.md`: versi, sumber katalog, dan status admin harga diperbarui.
- `docs/panduan-pengguna.md`: dihapus asumsi bahwa user dapat mengubah katalog sendiri.
- `docs/panduan-setup-awal.md`: setup produk disesuaikan dengan kondisi katalog terpusat.
- `src/pages/admin/AdminProductsPage.tsx`: CRUD admin produk, validasi harga, dan nonaktifkan produk.
- `src/components/admin/AdminLayout.tsx`: menu Produk & Harga.
- `src/App.tsx`: route `/admin/products`.
- `supabase/migrations/20260911000000_harden_master_products_admin_audit.sql`: `WITH CHECK` RLS dan audit log perubahan produk.

## Keputusan

- Order lama wajib immutable terhadap perubahan katalog.
- Perubahan harga hanya berlaku untuk transaksi baru atau draft yang belum disimpan.
- Harga transaksi harus disimpan sebagai snapshot, bukan dihitung ulang dari katalog saat dibaca.
- URL admin tidak dianggap sebagai kontrol keamanan.
- UI admin tidak melakukan hard delete; produk dinonaktifkan agar transaksi lama tetap aman.
- Fase pertama disarankan tetap satu repo, dengan deployment admin dapat dipisahkan ke host khusus.

## Validasi

- Production build terakhir berhasil sebelum perubahan dokumentasi terakhir.
- Production build, type-check editor, dan lint file admin yang disentuh berhasil.
- Belum ada implementasi resolver pricing ke order manual/AI/Telegram.
- Migration audit belum dijalankan ke database remote.
- Belum ada test untuk invariant harga historis.

## Next Step

1. Jalankan dan verifikasi migration audit di staging.
2. Audit kolom snapshot harga pada `orders` dan `order_items`.
3. Buat resolver harga berbasis `master_products`.
4. Tambahkan test order lama versus harga katalog baru.
5. Migrasikan order manual, AI order, Telegram bot, dan public store secara bertahap.
