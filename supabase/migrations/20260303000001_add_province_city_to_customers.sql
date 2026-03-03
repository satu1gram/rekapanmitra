-- Add Province and City to customers table

DO $$
BEGIN
  IF NOT EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='customers' and column_name='province')
  THEN
      ALTER TABLE public.customers ADD COLUMN province TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='customers' and column_name='city')
  THEN
      ALTER TABLE public.customers ADD COLUMN city TEXT;
  END IF;
END $$;
