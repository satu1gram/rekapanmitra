# Database Cleanup & Verification - Quick Start

Saya sudah membuat 4 script lengkap untuk membersihkan dan memperbaiki database duplikat customer. Berikut panduan implementasinya.

## 📋 File-file yang Telah Dibuat

### 1. **supabase/verify_statistics.sql**
Script untuk audit/verifikasi kondisi database:
- ✓ Customer statistics vs actual orders
- ✓ Tier consistency check
- ✓ Orders integrity (orphaned orders)
- ✓ Stock entries accuracy
- ✓ Duplicate customer detection
- ✓ Summary statistics

### 2. **supabase/cleanup_duplicate_customers.sql**
Script untuk menggabungkan duplicate customers:
- ✓ Identifikasi duplikat berdasarkan nama + phone (normalized)
- ✓ Merge ke customer tertua (oldest)
- ✓ Redirect semua orders ke customer primary
- ✓ Hapus secondary duplicate records
- ✓ Recalculate customer statistics

### 3. **supabase/fix_triggers_and_history.sql**
Script untuk memastikan system berfungsi:
- ✓ Recreate timestamp update triggers
- ✓ Create customer stats update triggers
- ✓ Create stock tracking triggers
- ✓ Recalculate semua statistics untuk konsistensi awal
- ✓ Verify semua triggers active

### 4. **database-cleanup.sh**
Shell script otomatis untuk run semua step:
```bash
./database-cleanup.sh verify    # hanya check status
./database-cleanup.sh cleanup   # run cleanup saja
./database-cleanup.sh fix       # run fix triggers saja
./database-cleanup.sh full      # run semua (verify → cleanup → fix → verify)
```

### 5. **docs/DATABASE_CLEANUP_GUIDE.md**
Dokumentasi lengkap dengan technical details dan troubleshooting.

---

## 🚀 Implementasi Step-by-Step

### Phase 1: PRE-CLEANUP VERIFICATION

**Jalankan di Supabase SQL Editor:**

1. Buka https://app.supabase.com → pilih project
2. Masuk ke **SQL Editor**
3. Copy isi dari: `supabase/verify_statistics.sql`
4. Paste ke SQL Editor
5. **Run** (Ctrl+Enter)

**Catat hasil:**
- Total customers sekarang: ?
- Duplicate customers count: ?
- Orphaned orders: ?
- Total orders: ?
- Total revenue: ?

Ini akan jadi baseline untuk membandingkan sebelum & sesudah cleanup.

---

### Phase 2: CLEANUP DUPLICATE CUSTOMERS

**Backup dulu (sangat penting!):**

```bash
# Login ke Supabase CLI (jika sudah installed)
supabase db pull  # atau buat backup manual dari Supabase dashboard

# Atau export via psql:
PGPASSWORD="your-db-password" pg_dump \
  -h project-id.db.supabase.co \
  -U postgres \
  -d postgres \
  --file=backup_before_cleanup.sql
```

**Jalankan cleanup:**

1. Di Supabase SQL Editor
2. Copy isi dari: `supabase/cleanup_duplicate_customers.sql`
3. Paste & Run

**Hasil yang akan terlihat:**
```
NOTICE: Merged duplicate customer <id> into <id>
NOTICE: Merged duplicate customer <id> into <id>
...
```

**Verifikasi hasil:**
- Duplicate customers sudah hilang
- Customer statistics ter-update
- Semua orders ter-link ke primary customer

---

### Phase 3: FIX TRIGGERS & HISTORY SYSTEM

**Jalankan di Supabase SQL Editor:**

1. Copy isi dari: `supabase/fix_triggers_and_history.sql`
2. Paste & Run

**Apa yang dilakukan:**
- Recreate semua UPDATE timestamp triggers
- Create customer stats auto-update trigger (saat order berubah)
- Create stock tracking auto-update trigger
- Recalculate semua statistics untuk konsistensi

**Hasil:**
- Setiap kali ada order baru/dihapus, customer stats otomatis ter-update
- Setiap kali stock entry berubah, user_stock otomatis ter-update
- Tidak perlu aplikasi manual call update function

---

### Phase 4: POST-CLEANUP VERIFICATION

**Jalankan verification lagi:**

1. Di Supabase SQL Editor
2. Copy & Run `supabase/verify_statistics.sql` lagi
3. Bandingkan hasil dengan Phase 1

**Yang harus diverifikasi:**
- ✓ Duplicate customers: **0**
- ✓ Orphaned orders: **0** atau minimal
- ✓ Customer statistics mismatches: **0**
- ✓ Stock mismatches: **0**
- ✓ Total orders dan revenue: **sama** (tidak berkurang)

---

## 🧪 Testing di Aplikasi

Setelah database cleanup selesai, test di aplikasi:

1. **Login** ke aplikasi
2. Buka halaman **Customer**
   - ✓ "Kak Isti" tidak muncul 2x lagi
   - ✓ "Bu Isti" dan "Isti" sudah merged
3. **Buat order baru**
   - Cari customer dengan nama mirip (misal: "Kak Joko" → "Joko")
   - ✓ Aplikasi akan detect sebagai customer yang sama (tidak bikin duplikat)
4. **Hapus order**
   - ✓ Customer statistics (total_orders, total_spent) ter-update otomatis
   - ✓ Stock ter-restore ke inventory

---

## ⚙️ Alternatif: Gunakan Shell Script Otomatis

Jika ingin fully automated (diperlukan psql + Supabase credentials):

```bash
# Set credentials
export SUPABASE_PROJECT_ID="your-project-id"
export SUPABASE_DB_PASSWORD="your-db-password"

# Run full cleanup
./database-cleanup.sh full

# Atau individual steps
./database-cleanup.sh verify    # Step 1
./database-cleanup.sh cleanup   # Step 2
./database-cleanup.sh fix       # Step 3
```

---

## 🔍 Troubleshooting

### Problem: "Masih ada duplicate customers di halaman Customer"
**Solution:**
- Reload browser (hard refresh: Ctrl+Shift+R)
- Cek di SQL: `SELECT name, COUNT(*) FROM customers GROUP BY name HAVING COUNT(*) > 1`
- Jika masih ada, re-run cleanup script

### Problem: "Customer statistics masih tidak cocok"
**Solution:**
- Run fix_triggers script lagi untuk ensure triggers active
- Manual recalculate:
  ```sql
  WITH stats AS (
    SELECT customer_id, COUNT(*) AS total_orders, SUM(total_price) AS total_spent
    FROM orders GROUP BY customer_id
  )
  UPDATE customers SET 
    total_orders = stats.total_orders, 
    total_spent = stats.total_spent
  FROM stats WHERE customers.id = stats.customer_id;
  ```

### Problem: "Order count tidak sesuai di UI"
**Solution:**
- Cek apakah trigger update_customer_on_order_insert active:
  ```sql
  SELECT trigger_name FROM information_schema.triggers 
  WHERE event_object_table='orders' AND trigger_schema='public';
  ```
- Jika tidak ada, re-run fix_triggers script

---

## 📊 Contoh Hasil Cleanup

**Sebelum Cleanup:**
```
Customers: 25
  - Kak Isti (id: c1)
  - Isti (id: c2)
  - Bu Isti (id: c3)
  - Kak Joko (id: c4)
  - Joko (id: c5)
```

**Setelah Cleanup:**
```
Customers: 20
  - Isti (id: c1, merged c2 & c3)
  - Joko (id: c4, merged c5)
  - ... (18 other customers)
```

---

## 🛑 PENTING - PERINGATAN

⚠️ **Selalu backup sebelum menjalankan cleanup!**

- Database cleanup adalah operasi yang mengubah data
- Test di staging/development environment dulu
- Jangan run di production tanpa testing
- Revert dari backup jika ada masalah

---

## 📞 Pertanyaan?

Jika ada error atau pertanyaan saat run cleanup, cek:
1. `docs/DATABASE_CLEANUP_GUIDE.md` untuk technical details
2. Logs dari SQL execution (semua query printed ke terminal)
3. Hasil dari `verify_statistics.sql` untuk diagnostic info

---

## ✅ Checklist Implementasi

- [ ] Phase 1: Run verify_statistics.sql (catat baseline)
- [ ] Phase 2a: Create backup
- [ ] Phase 2b: Run cleanup_duplicate_customers.sql
- [ ] Phase 3: Run fix_triggers_and_history.sql
- [ ] Phase 4: Run verify_statistics.sql lagi (bandingkan)
- [ ] Test di aplikasi (buat/hapus order, cek customer stats)
- [ ] Monitor untuk ensure consistency

Selamat! Database cleanup sudah siap dijalankan! 🎉
