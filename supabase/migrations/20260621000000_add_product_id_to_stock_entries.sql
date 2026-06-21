-- Add product_id to stock_entries for per-product restok tracking
ALTER TABLE public.stock_entries 
ADD COLUMN product_id UUID REFERENCES public.master_products(id) ON DELETE SET NULL;
