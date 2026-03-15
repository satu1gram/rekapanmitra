-- Make phone column nullable in customers table
ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;
