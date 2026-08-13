-- Ensure deleting a parent order does not leave stock-out movement records behind.
-- If an order is deleted, associated stock_entries created from that order should be removed.
-- This is safe because order-related stock records are already expected to be tied to a single order.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'stock_entries'
      AND constraint_name = 'stock_entries_order_id_fkey'
  ) THEN
    ALTER TABLE public.stock_entries DROP CONSTRAINT IF EXISTS stock_entries_order_id_fkey;
  END IF;
END $$;

ALTER TABLE public.stock_entries
  ADD CONSTRAINT stock_entries_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES public.orders(id)
  ON DELETE CASCADE;
