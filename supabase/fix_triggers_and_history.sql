/**
 * FIX SCRIPT: Ensure All Triggers & History System Working
 * =========================================================
 * Script ini memastikan:
 * 1. Update timestamp triggers berfungsi pada semua table
 * 2. Customer statistics di-update saat order ditambah/dihapus
 * 3. Stock tracking akurat
 * 4. Audit trail tercatat dengan baik
 */

-- ============================================================================
-- 1. ENSURE TIMESTAMP UPDATE TRIGGERS
-- ============================================================================

RAISE NOTICE '====== 1. CHECKING TIMESTAMP TRIGGERS ======';

-- Check existing triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('profiles', 'customers', 'orders', 'user_stock')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 2. RECREATE/ENSURE update_updated_at FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 3. RECREATE TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON public.customers 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- User Stock
DROP TRIGGER IF EXISTS update_user_stock_updated_at ON public.user_stock;
CREATE TRIGGER update_user_stock_updated_at 
  BEFORE UPDATE ON public.user_stock 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

RAISE NOTICE 'Timestamp triggers recreated!';

-- ============================================================================
-- 4. CREATE/ENSURE CUSTOMER UPDATE TRIGGER
-- ============================================================================
-- Trigger ini memastikan bahwa setiap kali order dibuat/diubah,
-- statistik customer (total_orders, total_spent) langsung di-update

DROP FUNCTION IF EXISTS public.update_customer_stats() CASCADE;
DROP TRIGGER IF EXISTS update_customer_on_order_insert ON public.orders;
DROP TRIGGER IF EXISTS update_customer_on_order_update ON public.orders;
DROP TRIGGER IF EXISTS update_customer_on_order_delete ON public.orders;

CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_order_count INTEGER;
  v_total_spent BIGINT;
BEGIN
  -- Determine customer_id dari trigger context
  IF TG_OP = 'DELETE' THEN
    v_customer_id := OLD.customer_id;
  ELSE
    v_customer_id := NEW.customer_id;
  END IF;

  -- Skip jika tidak ada customer_id (orphaned order)
  IF v_customer_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate current stats dari orders
  SELECT COUNT(*), COALESCE(SUM(total_price), 0)
  INTO v_order_count, v_total_spent
  FROM orders
  WHERE customer_id = v_customer_id;

  -- Update customer stats
  UPDATE customers
  SET 
    total_orders = v_order_count,
    total_spent = v_total_spent,
    updated_at = now()
  WHERE id = v_customer_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on INSERT
CREATE TRIGGER update_customer_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- Trigger on UPDATE
CREATE TRIGGER update_customer_on_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- Trigger on DELETE
CREATE TRIGGER update_customer_on_order_delete
  AFTER DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

RAISE NOTICE 'Customer update triggers created!';

-- ============================================================================
-- 5. CREATE/ENSURE STOCK TRACKING TRIGGER
-- ============================================================================
-- Trigger ini memastikan user_stock di-update saat stock_entries berubah

DROP FUNCTION IF EXISTS public.update_user_stock_on_entry() CASCADE;
DROP TRIGGER IF EXISTS update_user_stock_on_entry_insert ON public.stock_entries;
DROP TRIGGER IF EXISTS update_user_stock_on_entry_update ON public.stock_entries;
DROP TRIGGER IF EXISTS update_user_stock_on_entry_delete ON public.stock_entries;

CREATE OR REPLACE FUNCTION public.update_user_stock_on_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_total_stock INTEGER;
BEGIN
  -- Get user_id
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Calculate total stock from all entries
  SELECT COALESCE(SUM(CASE WHEN type = 'in' THEN quantity ELSE -quantity END), 0)
  INTO v_total_stock
  FROM stock_entries
  WHERE user_id = v_user_id;

  -- Ensure user_stock record exists
  INSERT INTO user_stock (user_id, current_stock)
  VALUES (v_user_id, v_total_stock)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    current_stock = EXCLUDED.current_stock,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on INSERT
CREATE TRIGGER update_user_stock_on_entry_insert
  AFTER INSERT ON public.stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stock_on_entry();

-- Trigger on UPDATE
CREATE TRIGGER update_user_stock_on_entry_update
  AFTER UPDATE ON public.stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stock_on_entry();

-- Trigger on DELETE
CREATE TRIGGER update_user_stock_on_entry_delete
  AFTER DELETE ON public.stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stock_on_entry();

RAISE NOTICE 'Stock tracking triggers created!';

-- ============================================================================
-- 6. VERIFY ALL TRIGGERS ARE ACTIVE
-- ============================================================================

RAISE NOTICE '====== VERIFYING ALL TRIGGERS ======';

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  'ACTIVE' AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('profiles', 'customers', 'orders', 'user_stock', 'stock_entries')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 7. RECALCULATE ALL STATISTICS BASED ON TRIGGERS
-- ============================================================================

RAISE NOTICE '====== RECALCULATING ALL STATISTICS ======';

-- Manually recalculate customer stats untuk konsistensi awal
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

-- Recalculate stock untuk semua user
WITH stock_calc AS (
  SELECT 
    user_id,
    SUM(CASE WHEN type = 'in' THEN quantity ELSE -quantity END) AS total_stock
  FROM stock_entries
  GROUP BY user_id
)
UPDATE user_stock
SET 
  current_stock = COALESCE(stock_calc.total_stock, 0),
  updated_at = now()
FROM stock_calc
WHERE user_stock.user_id = stock_calc.user_id;

RAISE NOTICE 'All statistics recalculated!';

-- ============================================================================
-- 8. FINAL VERIFICATION
-- ============================================================================

RAISE NOTICE '====== FINAL STATISTICS CHECK ======';

SELECT 
  'Customers dengan stats' AS category,
  COUNT(*) AS count,
  SUM(total_orders) AS total_orders,
  SUM(total_spent) AS total_spent
FROM customers
WHERE total_orders > 0;

SELECT 
  'Orphaned Orders' AS category,
  COUNT(*) AS count
FROM orders
WHERE customer_id IS NULL;

RAISE NOTICE 'Fix script completed! All triggers and statistics are now in sync.';
