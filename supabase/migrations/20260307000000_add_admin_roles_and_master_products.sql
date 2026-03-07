-- Enum type for user roles
CREATE TYPE public.user_role AS ENUM ('mitra', 'admin');

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'mitra';

-- Create master_products table
CREATE TABLE public.master_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('STEFFI', 'BELGIE', 'BP', 'BRO', 'BRE', 'NORWAY')),
  package_type TEXT NOT NULL CHECK (package_type IN ('200_botol', '40_botol', '10_botol', '5_botol', '3_botol', 'satuan')),
  quantity_per_package INTEGER NOT NULL,
  price BIGINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on master_products
ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;

-- Product policies
-- Anyone (mitra) can view active products
CREATE POLICY "Anyone can view active master products" 
ON public.master_products FOR SELECT 
USING (is_active = true);

-- Only admins can manage products
CREATE POLICY "Admins can insert master products" 
ON public.master_products FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update master products" 
ON public.master_products FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete master products" 
ON public.master_products FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger for update_timestamp
CREATE TRIGGER update_master_products_updated_at 
BEFORE UPDATE ON public.master_products 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
