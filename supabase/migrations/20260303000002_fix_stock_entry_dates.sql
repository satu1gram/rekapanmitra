-- Update stock_entries created_at to match the corresponding order's created_at where applicable
UPDATE stock_entries
SET created_at = orders.created_at
FROM orders
WHERE stock_entries.order_id = orders.id
  AND stock_entries.created_at != orders.created_at;
