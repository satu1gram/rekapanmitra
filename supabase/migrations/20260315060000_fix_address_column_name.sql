-- Rename full_address back to address for consistency with frontend and types
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='customers' and column_name='full_address')
  AND NOT EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='customers' and column_name='address')
  THEN
      ALTER TABLE public.customers RENAME COLUMN full_address TO address;
  END IF;
END $$;

-- Ensure required columns exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='customers' and column_name='address')
  THEN
      ALTER TABLE public.customers ADD COLUMN address TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='customers' and column_name='province')
  THEN
      ALTER TABLE public.customers ADD COLUMN province TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='customers' and column_name='city')
  THEN
      ALTER TABLE public.customers ADD COLUMN city TEXT;
  END IF;
END $$;
