/**
 * DATABASE CLEANUP GUIDE
 * ======================
 * 
 * Panduan lengkap untuk membersihkan dan memperbaiki database duplikat customer.
 * 
 * PERINGATAN PENTING:
 * - Selalu backup database sebelum menjalankan cleanup
 * - Test di staging environment terlebih dahulu
 * - Run scripts secara berurutan (jangan parallel)
 * 
 * ============================================================================
 * PHASE 1: PRE-CLEANUP VERIFICATION
 * ============================================================================
 * 
 * Sebelum menjalankan cleanup, verifikasi kondisi database:
 * 
 * 1. Login ke Supabase Database:
 *    - Buka https://app.supabase.com
 *    - Pilih project
 *    - Buka SQL Editor
 * 
 * 2. Run verification script untuk lihat status awal:
 *    - Copy file: supabase/verify_statistics.sql
 *    - Paste ke SQL Editor
 *    - Run dan catat hasilnya
 * 
 * Catat terutama:
 *    - Total customers
 *    - Duplicate customers count
 *    - Orphaned orders count
 *    - Total orders
 *    - Total revenue
 * 
 * ============================================================================
 * PHASE 2: CLEANUP DUPLICATE CUSTOMERS
 * ============================================================================
 * 
 * Jalankan cleanup untuk menggabungkan customer duplikat:
 * 
 * 1. Backup current data:
 *    $ pg_dump --file=backup_before_cleanup.sql
 * 
 * 2. Run cleanup script:
 *    - Copy file: supabase/cleanup_duplicate_customers.sql
 *    - Paste ke SQL Editor
 *    - Run script
 * 
 * Hasil yang diharapkan:
 *    - Script akan menampilkan daftar duplikat yang ditemukan
 *    - Merge dilakukan dengan menjaga customer tertua (oldest) sebagai primary
 *    - Semua orders akan di-link ke customer primary
 *    - Secondary duplicate customers akan dihapus
 * 
 * ============================================================================
 * PHASE 3: FIX TRIGGERS & HISTORY SYSTEM
 * ============================================================================
 * 
 * Pastikan semua triggers berfungsi dan history tercatat:
 * 
 * 1. Run fix script:
 *    - Copy file: supabase/fix_triggers_and_history.sql
 *    - Paste ke SQL Editor
 *    - Run script
 * 
 * Fungsi yang akan di-recreate:
 *    - update_updated_at_column() - trigger untuk timestamp
 *    - update_customer_stats() - trigger untuk update customer stats saat order berubah
 *    - update_user_stock_on_entry() - trigger untuk update stock saat entry berubah
 * 
 * Manfaat trigger:
 *    - Customer statistics selalu up-to-date
 *    - Stock tracking akurat
 *    - Audit trail tercatat
 * 
 * ============================================================================
 * PHASE 4: POST-CLEANUP VERIFICATION
 * ============================================================================
 * 
 * Setelah cleanup selesai, verifikasi lagi:
 * 
 * 1. Run verification script lagi:
 *    - Copy file: supabase/verify_statistics.sql
 *    - Paste ke SQL Editor
 *    - Run dan bandingkan dengan hasil awal
 * 
 * Yang harus diverifikasi:
 *    - Tidak ada lagi duplicate customers
 *    - Semua customer statistics cocok dengan actual orders
 *    - Semua orders punya customer_id (tidak ada orphaned)
 *    - Total orders dan revenue tetap sama
 *    - Stock calculations akurat
 * 
 * 2. Test aplikasi:
 *    - Login ke aplikasi
 *    - Buka halaman Customer - pastikan tidak ada duplikat \"Kak Isti\", \"Bu Isti\", etc
 *    - Buat order baru - pastikan customer baru ter-deduplicate dengan yang lama
 *    - Hapus order - pastikan stock dan customer stats ter-update
 * 
 * ============================================================================\n * TECHNICAL DETAILS\n * ==================\n *\n * 1. Normalization Functions:\n *    - Phone: remove all non-digits\n *    - Name: lowercase, remove accents, remove titles (Bu, Pak, Kak, etc)\n *\n * 2. Duplicate Detection Strategy:\n *    - Group by (user_id, normalized_name, normalized_phone)\n *    - Customer dengan same normalized data adalah duplikat\n *    - Primary = oldest customer (earliest created_at)\n *\n * 3. Merge Strategy:\n *    - Redirect ALL orders dari secondary ke primary\n *    - Delete secondary customer record\n *    - Recalculate primary's total_orders dan total_spent\n *\n * 4. Trigger System:\n *    - AFTER INSERT/UPDATE/DELETE triggers memastikan data consistency\n *    - Tidak perlu aplikasi yang call update_customer_stats() secara manual\n *    - Database yang enforce consistency\n *\n * ============================================================================\n * TROUBLESHOOTING\n * ================\n *\n * Problem: \"Trigger tidak jalan setelah run fix_triggers_and_history.sql\"\n * Solution:\n *    - Check: SELECT * FROM information_schema.triggers WHERE trigger_schema='public'\n *    - Verify trigger function exists: SELECT * FROM pg_proc WHERE proname='update_customer_stats'\n *    - Re-run fix_triggers_and_history.sql\n *\n * Problem: \"Customer statistics masih tidak akurat setelah cleanup\"\n * Solution:\n *    - Manually recalculate:\n *      WITH stats AS (SELECT customer_id, COUNT(*) AS total_orders, SUM(total_price) AS total_spent\n *        FROM orders GROUP BY customer_id)\n *      UPDATE customers SET total_orders = stats.total_orders, total_spent = stats.total_spent\n *      FROM stats WHERE customers.id = stats.customer_id;\n *\n * Problem: \"Ada order tanpa customer_id (orphaned)\"\n * Solution:\n *    - Query di verify_statistics.sql akan menunjukkan orphaned orders\n *    - Manual link atau create customer: lihat query di STEP 5 verify_statistics.sql\n *\n * ============================================================================\n * APLIKASI CHANGES YANG SUDAH DILAKUKAN\n * ======================================\n *\n * File: src/lib/customerDedup.ts\n * - Fungsi normalization untuk phone dan name\n * - Fungsi resolveCustomerMatch untuk find customer dengan dedupe logic\n *\n * File: src/hooks/useCustomersDb.ts\n * - Update addOrUpdateCustomer untuk use resolveCustomerMatch\n * - Phone dan name di-normalize sebelum insert\n * - Existing customer detection lebih robust\n *\n * Hasil:\n * - Aplikasi tidak akan create duplicate customer lagi\n * - \"Kak Isti\" dan \"Isti\" akan diperlakukan sebagai orang yang sama\n *\n * ============================================================================\n * NEXT STEPS\n * ==========\n *\n * 1. Run verification script untuk baseline\n * 2. Run cleanup script untuk deduplicate customers\n * 3. Run fix triggers script untuk ensure system berfungsi optimal\n * 4. Run verification script lagi untuk confirm success\n * 5. Test aplikasi thoroughly\n * 6. Monitor database untuk ensure consistency\n *\n * ============================================================================\n */\n\n-- Dokumentasi ini adalah text-only reference\n-- Bukan SQL script, tidak perlu di-execute\n