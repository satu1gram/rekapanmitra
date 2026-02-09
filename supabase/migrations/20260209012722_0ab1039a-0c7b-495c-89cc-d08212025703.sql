-- Drop the existing check constraint and add a new one that includes 'initial'
ALTER TABLE public.stock_entries DROP CONSTRAINT IF EXISTS stock_entries_type_check;
ALTER TABLE public.stock_entries ADD CONSTRAINT stock_entries_type_check CHECK (type IN ('in', 'out', 'initial'));