-- Drop the existing constraint
ALTER TABLE public.stock_entries DROP CONSTRAINT stock_entries_tier_check;

-- Add updated constraint that includes 'se'
ALTER TABLE public.stock_entries ADD CONSTRAINT stock_entries_tier_check 
CHECK (tier IS NULL OR tier = ANY (ARRAY['satuan'::text, 'reseller'::text, 'agen'::text, 'agen_plus'::text, 'sap'::text, 'se'::text]));