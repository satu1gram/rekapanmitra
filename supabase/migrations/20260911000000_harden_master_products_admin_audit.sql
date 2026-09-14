-- Harden master product administration and preserve an audit trail for catalog changes.

DROP POLICY IF EXISTS "Admins can update master products" ON public.master_products;

CREATE POLICY "Admins can update master products"
ON public.master_products FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE TABLE IF NOT EXISTS public.master_product_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.master_products(id) ON DELETE RESTRICT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'deactivate', 'activate')),
  old_name TEXT,
  new_name TEXT,
  old_price BIGINT,
  new_price BIGINT,
  old_quantity_per_package INTEGER,
  new_quantity_per_package INTEGER,
  old_is_active BOOLEAN,
  new_is_active BOOLEAN,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.master_product_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view master product audit logs" ON public.master_product_audit_logs;

CREATE POLICY "Admins can view master product audit logs"
ON public.master_product_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.audit_master_product_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.master_product_audit_logs (
    product_id,
    changed_by,
    action,
    old_name,
    new_name,
    old_price,
    new_price,
    old_quantity_per_package,
    new_quantity_per_package,
    old_is_active,
    new_is_active
  )
  VALUES (
    NEW.id,
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'insert'
      WHEN OLD.is_active = false AND NEW.is_active = true THEN 'activate'
      WHEN OLD.is_active = true AND NEW.is_active = false THEN 'deactivate'
      ELSE 'update'
    END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.name END,
    NEW.name,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.price END,
    NEW.price,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.quantity_per_package END,
    NEW.quantity_per_package,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.is_active END,
    NEW.is_active
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_master_product_change_trigger ON public.master_products;

CREATE TRIGGER audit_master_product_change_trigger
AFTER INSERT OR UPDATE ON public.master_products
FOR EACH ROW
EXECUTE FUNCTION public.audit_master_product_change();
