-- Merge customer "Alfiyana" and "Bu Alfiyana" into one record.
-- Run the preview SELECT first. Execute the merge only after verifying user_id and rows.
-- This changes customer_id links and removes only the duplicate customer row;
-- order totals and order data are preserved.

-- 1) Preview the candidate records and their linked orders.
WITH candidates AS (
  SELECT
    c.id,
    c.user_id,
    c.name,
    c.phone,
    c.type,
    c.tier,
    c.created_at,
    COUNT(o.id) AS linked_orders,
    COALESCE(SUM(o.total_price), 0) AS linked_spent
  FROM public.customers c
  LEFT JOIN public.orders o ON o.customer_id = c.id
  WHERE lower(regexp_replace(trim(c.name), '^(bu|bpk|pak|ibu|mbak|mas|kak|si|om|tante)\s+', '', 'i')) = 'alfiyana'
  GROUP BY c.id
)
SELECT *
FROM candidates
ORDER BY user_id, linked_orders DESC, created_at ASC;

-- 2) Merge only the intended user's records.
-- Replace the UUID below with the user_id shown by the preview above.
BEGIN;

DO $$
DECLARE
  target_user_id uuid := 'REPLACE_WITH_USER_ID'::uuid;
  primary_id uuid;
  duplicate_id uuid;
BEGIN
  SELECT c.id
  INTO primary_id
  FROM public.customers c
  LEFT JOIN public.orders o ON o.customer_id = c.id
  WHERE c.user_id = target_user_id
    AND lower(regexp_replace(trim(c.name), '^(bu|bpk|pak|ibu|mbak|mas|kak|si|om|tante)\s+', '', 'i')) = 'alfiyana'
  GROUP BY c.id, c.created_at
  ORDER BY COUNT(o.id) DESC, c.created_at ASC
  LIMIT 1;

  IF primary_id IS NULL THEN
    RAISE EXCEPTION 'Tidak ditemukan customer Alfiyana pada user_id %', target_user_id;
  END IF;

  -- First link orders that have no customer_id but carry either name variant.
  UPDATE public.orders o
  SET customer_id = primary_id
  WHERE o.user_id = target_user_id
    AND o.customer_id IS NULL
    AND lower(regexp_replace(trim(o.customer_name), '^(bu|bpk|pak|ibu|mbak|mas|kak|si|om|tante)\s+', '', 'i')) = 'alfiyana';

  -- Move orders from every other matching customer to the primary record.
  FOR duplicate_id IN
    SELECT c.id
    FROM public.customers c
    WHERE c.user_id = target_user_id
      AND c.id <> primary_id
      AND lower(regexp_replace(trim(c.name), '^(bu|bpk|pak|ibu|mbak|mas|kak|si|om|tante)\s+', '', 'i')) = 'alfiyana'
  LOOP
    UPDATE public.orders
    SET customer_id = primary_id
    WHERE customer_id = duplicate_id;

    DELETE FROM public.customers
    WHERE id = duplicate_id;
  END LOOP;

  -- Rebuild the summary fields from the actual orders, not from old counters.
  UPDATE public.customers c
  SET total_orders = stats.total_orders,
      total_spent = stats.total_spent,
      updated_at = now()
  FROM (
    SELECT COUNT(*)::integer AS total_orders,
           COALESCE(SUM(total_price), 0)::bigint AS total_spent
    FROM public.orders
    WHERE customer_id = primary_id
  ) stats
  WHERE c.id = primary_id;
END $$;

-- 3) Verify the result before committing.
SELECT
  c.id,
  c.user_id,
  c.name,
  c.phone,
  c.total_orders,
  c.total_spent,
  COUNT(o.id) AS actual_orders,
  COALESCE(SUM(o.total_price), 0) AS actual_spent
FROM public.customers c
LEFT JOIN public.orders o ON o.customer_id = c.id
WHERE c.user_id = 'REPLACE_WITH_USER_ID'::uuid
  AND lower(regexp_replace(trim(c.name), '^(bu|bpk|pak|ibu|mbak|mas|kak|si|om|tante)\s+', '', 'i')) = 'alfiyana'
GROUP BY c.id;

-- If the verification result is correct:
COMMIT;
-- Otherwise use: ROLLBACK;
