-- 1. Try to link existing orders to existing customers based on name and user_id
UPDATE orders
SET customer_id = c.id
FROM customers c
WHERE orders.customer_name = c.name 
  AND orders.user_id = c.user_id 
  AND orders.customer_id IS NULL;

-- 2. Insert missing customers for any remaining unlinked orders
-- We use DISTINCT ON name to avoid creating duplicates for multiple orders from the same person
INSERT INTO customers (user_id, name, phone, tier, total_orders, total_spent)
SELECT DISTINCT ON (user_id, customer_name)
    user_id, 
    customer_name, 
    customer_phone, 
    tier,
    0,
    0
FROM orders 
WHERE customer_id IS NULL;

-- 3. Link the newly created customers back to their orders
UPDATE orders
SET customer_id = c.id
FROM customers c
WHERE orders.customer_name = c.name 
  AND orders.user_id = c.user_id 
  AND orders.customer_id IS NULL;

-- 4. Recalculate and fix total_orders and total_spent for all customers to ensure consistency
WITH stats AS (
  SELECT customer_id, COUNT(id) as total_orders, COALESCE(SUM(total_price), 0) as total_spent
  FROM orders
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
)
UPDATE customers
SET 
  total_orders = stats.total_orders,
  total_spent = stats.total_spent
FROM stats
WHERE customers.id = stats.customer_id;
