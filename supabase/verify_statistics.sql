/**
 * VERIFICATION SCRIPT: Data Statistics & Health Check
 * ====================================================
 * Script ini melakukan audit lengkap untuk memastikan:
 * 1. Konsistensi statistik customer (total_orders, total_spent)
 * 2. Konsistensi tier (mitra level)
 * 3. Integrity orders dan stock entries
 * 4. Missing atau orphaned records
 * 5. Status history dan audit trail
 * 
 * Jalankan script ini di SQL Editor Supabase. 
 * Review hasil setiap section untuk diagnosis.
 */

-- ============================================================================
-- 1. CUSTOMER STATISTICS AUDIT
-- ============================================================================
-- Cek apakah customer statistics cocok dengan actual orders

-- Cek apakah customer statistics cocok dengan actual orders
WITH calculated_stats AS (
  SELECT 
    customer_id,
    COUNT(*) AS actual_orders,
    COALESCE(SUM(total_price), 0) AS actual_spent
  FROM orders
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
)
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.phone,
  c.tier,
  c.total_orders AS recorded_orders,
  COALESCE(cs.actual_orders, 0) AS actual_orders,
  CASE 
    WHEN c.total_orders != COALESCE(cs.actual_orders, 0) THEN 'MISMATCH'
    ELSE 'OK'
  END AS orders_status,
  c.total_spent AS recorded_spent,
  COALESCE(cs.actual_spent, 0) AS actual_spent,
  CASE 
    WHEN c.total_spent != COALESCE(cs.actual_spent, 0) THEN 'MISMATCH'
    ELSE 'OK'
  END AS spent_status,
  c.created_at,
  c.updated_at
FROM customers c
LEFT JOIN calculated_stats cs ON c.id = cs.customer_id
WHERE c.user_id IS NOT NULL
ORDER BY c.user_id, c.created_at;

-- ============================================================================
-- 2. CUSTOMER TIER AUDIT
-- ============================================================================
-- Identifikasi customer yang tier-nya mungkin tidak optimal
-- Tier seharusnya: satuan < reseller < agen < agen_plus < sap
WITH order_analysis AS (
  SELECT 
    customer_id,
    MIN(tier) AS minimum_tier_in_orders,
    MAX(tier) AS maximum_tier_in_orders
  FROM orders
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
)
SELECT 
  c.id,
  c.name,
  c.phone,
  c.tier AS current_tier,
  oa.maximum_tier_in_orders,
  CASE 
    WHEN c.tier = 'satuan' AND oa.maximum_tier_in_orders IN ('reseller', 'agen', 'agen_plus', 'sap') THEN 'SHOULD_UPGRADE'
    WHEN c.tier = 'reseller' AND oa.maximum_tier_in_orders IN ('agen', 'agen_plus', 'sap') THEN 'SHOULD_UPGRADE'
    WHEN c.tier = 'agen' AND oa.maximum_tier_in_orders IN ('agen_plus', 'sap') THEN 'SHOULD_UPGRADE'
    ELSE 'OK'
  END AS tier_status,
  COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN order_analysis oa ON c.id = oa.customer_id
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.user_id IS NOT NULL
GROUP BY c.id, c.name, c.phone, c.tier, oa.maximum_tier_in_orders
HAVING c.tier = 'satuan' AND oa.maximum_tier_in_orders IN ('reseller', 'agen', 'agen_plus', 'sap')
  OR c.tier = 'reseller' AND oa.maximum_tier_in_orders IN ('agen', 'agen_plus', 'sap')
  OR c.tier = 'agen' AND oa.maximum_tier_in_orders IN ('agen_plus', 'sap')
ORDER BY c.user_id, c.created_at;

-- ============================================================================
-- 3. ORDERS INTEGRITY CHECK
-- ============================================================================
-- Cek orders yang orphaned (tidak punya customer_id)
SELECT 
  COUNT(*) AS orphaned_orders_count
FROM orders
WHERE customer_id IS NULL;

-- Detail orphaned orders
SELECT 
  id,
  user_id,
  customer_name,
  customer_phone,
  tier,
  total_price,
  status,
  created_at
FROM orders
WHERE customer_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- 4. STOCK ENTRIES INTEGRITY CHECK
-- ============================================================================
-- Cek apakah user_stock statistics cocok dengan actual entries
WITH stock_calc AS (
  SELECT 
    user_id,
    SUM(CASE WHEN type = 'in' THEN quantity ELSE -quantity END) AS calculated_stock
  FROM stock_entries
  GROUP BY user_id
)
SELECT 
  us.user_id,
  us.current_stock AS recorded_stock,
  COALESCE(sc.calculated_stock, 0) AS calculated_stock,
  CASE 
    WHEN us.current_stock != COALESCE(sc.calculated_stock, 0) THEN 'MISMATCH'
    ELSE 'OK'
  END AS stock_status,
  us.updated_at
FROM user_stock us
LEFT JOIN stock_calc sc ON us.user_id = sc.user_id
ORDER BY us.user_id;

-- ============================================================================
-- 5. MISSING CUSTOMER_ID IN ORDERS
-- ============================================================================
-- Identify orders yang bisa dilinkkan ke existing customers
SELECT 
  o.id AS order_id,
  o.customer_name,
  o.customer_phone,
  o.tier,
  c.id AS matching_customer_id,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.total_orders,
  o.total_price
FROM orders o
LEFT JOIN customers c ON o.user_id = c.user_id 
  AND (
    (LOWER(o.customer_name) = LOWER(c.name))
    OR (regexp_replace(o.customer_phone, '[^0-9]', '', 'g') = regexp_replace(c.phone, '[^0-9]', '', 'g') 
        AND o.customer_phone != ''
        AND c.phone != '')
  )
WHERE o.customer_id IS NULL
  AND o.user_id IS NOT NULL
ORDER BY o.user_id, o.created_at;

-- ============================================================================
-- 6. CUSTOMER DUPLICATE CHECK
-- ============================================================================
-- Cek apakah masih ada customer yang sama
CREATE OR REPLACE FUNCTION normalize_phone_check(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

SELECT 
  user_id,
  COUNT(*) AS customer_count,
  ARRAY_AGG(name ORDER BY created_at) AS customer_names,
  ARRAY_AGG(phone ORDER BY created_at) AS customer_phones,
  ARRAY_AGG(id ORDER BY created_at) AS customer_ids
FROM customers
WHERE user_id IS NOT NULL
GROUP BY user_id, LOWER(name), normalize_phone_check(phone)
HAVING COUNT(*) > 1
ORDER BY user_id;

-- ============================================================================
-- 7. SUMMARY STATISTICS
-- ============================================================================

SELECT 
  'Total Users' AS metric,
  COUNT(DISTINCT user_id)::TEXT AS value
FROM customers
UNION ALL
SELECT 'Total Customers' AS metric, COUNT(*)::TEXT FROM customers
UNION ALL
SELECT 'Total Orders' AS metric, COUNT(*)::TEXT FROM orders
UNION ALL
SELECT 'Total Revenue' AS metric, SUM(total_price)::TEXT FROM orders
UNION ALL
SELECT 'Avg Orders per Customer' AS metric, 
  (SELECT (SUM(total_orders)::NUMERIC / NULLIF(COUNT(*), 0))::TEXT FROM customers WHERE total_orders > 0)
UNION ALL
SELECT 'Tier Distribution - Satuan' AS metric, 
  (SELECT COUNT(*)::TEXT FROM customers WHERE tier = 'satuan')
UNION ALL
SELECT 'Tier Distribution - Reseller' AS metric, 
  (SELECT COUNT(*)::TEXT FROM customers WHERE tier = 'reseller')
UNION ALL
SELECT 'Tier Distribution - Agen' AS metric, 
  (SELECT COUNT(*)::TEXT FROM customers WHERE tier = 'agen')
UNION ALL
SELECT 'Tier Distribution - Agen Plus' AS metric, 
  (SELECT COUNT(*)::TEXT FROM customers WHERE tier = 'agen_plus')
UNION ALL
SELECT 'Tier Distribution - SAP' AS metric, 
  (SELECT COUNT(*)::TEXT FROM customers WHERE tier = 'sap')
UNION ALL
SELECT 'Order Status - Pending' AS metric, 
  (SELECT COUNT(*)::TEXT FROM orders WHERE status = 'pending')
UNION ALL
SELECT 'Order Status - Terkirim' AS metric, 
  (SELECT COUNT(*)::TEXT FROM orders WHERE status = 'terkirim')
UNION ALL
SELECT 'Order Status - Selesai' AS metric, 
  (SELECT COUNT(*)::TEXT FROM orders WHERE status = 'selesai');

-- Verification selesai! Review hasil query di atas untuk diagnostic info.
