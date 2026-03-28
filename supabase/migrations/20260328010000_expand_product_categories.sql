-- Migration: Expand Product Categories in master_products Table

-- Drop the existing constraint
ALTER TABLE public.master_products DROP CONSTRAINT IF EXISTS master_products_category_check;

-- Add the expanded constraint with granular categories
ALTER TABLE public.master_products ADD CONSTRAINT master_products_category_check 
CHECK (category IN (
  'STEFFI', 
  'BELGIE', 
  'BELGIE_FW', 
  'BELGIE_NC', 
  'BELGIE_DC', 
  'BELGIE_SERUM', 
  'BELGIE_HT',
  'BP', 
  'KID', 
  'BLUE',
  'BRO', 
  'BRE', 
  'NORWAY'
));
