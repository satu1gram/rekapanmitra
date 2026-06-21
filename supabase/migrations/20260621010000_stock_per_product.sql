-- Migration: Change stock tracking from per-variant (product_id) to per-product-name
-- 
-- BEFORE: stock_entries had product_id → specific variant (e.g., "Paket Steffi 200 Botol")
-- AFTER:  stock_entries has product_name → product name (e.g., "STEFFI")
--         new user_product_stock table for per-product current stock

-- 1. Drop old product_id column if it exists, add product_name
ALTER TABLE public.stock_entries 
DROP COLUMN IF EXISTS product_id;

ALTER TABLE public.stock_entries 
ADD COLUMN product_name TEXT;

-- 2. Create user_product_stock table for per-product current stock
CREATE TABLE IF NOT EXISTS public.user_product_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_product_stock ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own product stock" ON public.user_product_stock
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product stock" ON public.user_product_stock
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product stock" ON public.user_product_stock
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product stock" ON public.user_product_stock
    FOR DELETE USING (auth.uid() = user_id);

-- Unique constraint: one stock row per user per product
CREATE UNIQUE INDEX IF NOT EXISTS user_product_stock_user_product_idx 
    ON public.user_product_stock (user_id, product_name);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS user_product_stock_user_id_idx 
    ON public.user_product_stock (user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_product_stock_updated_at
    BEFORE UPDATE ON public.user_product_stock
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Helper function for upserting product stock
CREATE OR REPLACE FUNCTION public.fn_upsert_product_stock(
    p_user_id UUID,
    p_product_name TEXT,
    p_quantity INTEGER
) RETURNS void AS $$
BEGIN
    INSERT INTO public.user_product_stock (user_id, product_name, current_stock)
    VALUES (p_user_id, p_product_name, p_quantity)
    ON CONFLICT (user_id, product_name)
    DO UPDATE SET current_stock = public.user_product_stock.current_stock + p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin RLS for user_product_stock (matching existing admin pattern)
CREATE POLICY "Admins can view all product stock" 
ON public.user_product_stock FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all product stock" 
ON public.user_product_stock FOR UPDATE 
USING (public.is_admin(auth.uid()));
