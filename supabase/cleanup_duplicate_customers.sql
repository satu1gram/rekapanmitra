/**
 * CLEANUP SCRIPT: Merge Duplicate Customers
 * ==========================================
 * Script ini menggabungkan customer yang duplikat berdasarkan:
 * - Nama yang sama (setelah normalisasi: lowercase, hapus sapaan)
 * - Nomor HP yang sama (setelah normalisasi: hanya digit)
 * 
 * PERINGATAN: Jalankan di database backup terlebih dahulu!
 * 
 * Langkah:
 * 1. Identifikasi duplikat
 * 2. Merge orders ke customer utama (yang pertama/oldest)
 * 3. Update statistik customer
 * 4. Hapus customer duplikat
 */

-- ============================================================================
-- HELPER FUNCTION: Normalize phone number (remove non-digits)
-- ============================================================================
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- HELPER FUNCTION: Normalize customer name (lowercase, remove titles)
-- ============================================================================
CREATE OR REPLACE FUNCTION normalize_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Lowercase, remove accents, remove titles, remove extra spaces
  RETURN trim(regexp_replace(
    lower(
      regexp_replace(name, '[éèêë]', 'e', 'g')
    ),
    '^(bu|bpk|pak|ibu|mbak|mas|kak|si|om|tante|bang|nona|sdr|saudara|nyonya|ny|kk)\s+',
    '',
    'g'
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 1: Identifikasi dan log duplikat customers
-- ============================================================================

-- Buat temporary table untuk tracking duplikat
CREATE TEMP TABLE duplicate_customers AS
SELECT
  user_id,
  normalize_name(name) AS normalized_name,
  normalize_phone(phone) AS normalized_phone,
  ARRAY_AGG(id ORDER BY created_at) AS customer_ids,
  COUNT(*) AS duplicate_count,
  MIN(created_at) AS earliest_created,
  MAX(created_at) AS latest_created
FROM customers
WHERE user_id IS NOT NULL
GROUP BY user_id, normalize_name(name), normalize_phone(phone)
HAVING COUNT(*) > 1
ORDER BY user_id, normalized_name;

-- Log hasil identifikasi duplikat
SELECT 
  user_id,
  normalized_name,
  normalized_phone,
  duplicate_count,
  earliest_created,
  latest_created,
  customer_ids
FROM duplicate_customers;

-- ============================================================================
-- STEP 2: Merger duplikat customers
-- ============================================================================

DO $$
DECLARE
  dup_record RECORD;
  primary_id UUID;
  secondary_id UUID;
  secondary_id_text TEXT;
BEGIN
  -- Iterate melalui setiap grup duplikat
  FOR dup_record IN SELECT * FROM duplicate_customers LOOP
    -- Primary customer adalah yang paling lama (oldest)
    primary_id := dup_record.customer_ids[1];
    
    -- Update setiap secondary customer ke primary
    FOR i IN 2..array_length(dup_record.customer_ids, 1) LOOP
      secondary_id := dup_record.customer_ids[i];
      
      -- 1. Pindahkan semua orders dari secondary ke primary
      UPDATE orders
      SET customer_id = primary_id
      WHERE customer_id = secondary_id;
      
      -- 2. Hapus secondary customer record
      DELETE FROM customers
      WHERE id = secondary_id;
      
      RAISE NOTICE 'Merged duplicate customer % into %', secondary_id, primary_id;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Recalculate customer statistics (total_orders, total_spent)
-- ============================================================================

WITH order_stats AS (
  SELECT 
    customer_id,
    COUNT(*) AS total_orders,
    COALESCE(SUM(total_price), 0) AS total_spent
  FROM orders
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
)
UPDATE customers
SET 
  total_orders = COALESCE(order_stats.total_orders, 0),
  total_spent = COALESCE(order_stats.total_spent, 0),
  updated_at = now()
FROM order_stats
WHERE customers.id = order_stats.customer_id;

-- ============================================================================
-- STEP 4: Verify cleanup results
-- ============================================================================

-- Tampilkan summary hasil cleanup
SELECT 
  COUNT(*) AS total_customers,
  COUNT(DISTINCT normalize_name(name)) AS unique_normalized_names,
  COUNT(DISTINCT normalize_phone(phone)) AS unique_normalized_phones,
  COUNT(DISTINCT user_id) AS total_users,
  SUM(total_orders) AS total_orders_count,
  SUM(total_spent) AS total_revenue
FROM customers;

-- Cek apakah masih ada duplikat
SELECT 
  user_id,
  normalize_name(name) AS normalized_name,
  COUNT(*) AS customer_count,
  ARRAY_AGG(name) AS customer_names
FROM customers
GROUP BY user_id, normalize_name(name)
HAVING COUNT(*) > 1
ORDER BY user_id, normalized_name;

-- ============================================================================
-- CLEANUP: Drop helper functions jika diperlukan di masa depan
-- ============================================================================
-- DROP FUNCTION IF EXISTS normalize_phone(TEXT);
-- DROP FUNCTION IF EXISTS normalize_name(TEXT);

-- Cleanup selesai! Cek hasil di atas untuk verifikasi data yang sudah di-merge.
