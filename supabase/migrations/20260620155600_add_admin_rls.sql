-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = user_uid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies for Admins
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Customers policies for Admins
CREATE POLICY "Admins can view all customers" 
ON public.customers FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all customers" 
ON public.customers FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Orders policies for Admins
CREATE POLICY "Admins can view all orders" 
ON public.orders FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all orders" 
ON public.orders FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Stock entries policies for Admins
CREATE POLICY "Admins can view all stock entries" 
ON public.stock_entries FOR SELECT 
USING (public.is_admin(auth.uid()));

-- User stock policies for Admins
CREATE POLICY "Admins can view all user stock" 
ON public.user_stock FOR SELECT 
USING (public.is_admin(auth.uid()));
