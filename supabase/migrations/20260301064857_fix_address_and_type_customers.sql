-- Rename address column if it exists to full_address
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='customers' and column_name='address')
  THEN
      ALTER TABLE customers RENAME COLUMN address TO full_address;
  END IF;
END $$;

-- If full_address column still doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='customers' and column_name='full_address')
  THEN
      ALTER TABLE customers ADD COLUMN full_address TEXT;
  END IF;
END $$;

-- Ensure 'type' column exists before creating constraint
DO $$
BEGIN
  IF NOT EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='customers' and column_name='type')
  THEN
      ALTER TABLE customers ADD COLUMN type TEXT DEFAULT 'konsumen';
  END IF;
END $$;

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_type_check;

ALTER TABLE customers ADD CONSTRAINT customers_type_check 
CHECK (type IN ('konsumen', 'mitra', 'KONSUMEN', 'MITRA'));
