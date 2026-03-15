-- Reference Script: Reset Transactional Data
-- This script clears all orders, customers, and stock entries while preserving master data and profiles.

-- 1. Truncate transactional tables (Cascade handles foreign keys)
TRUNCATE TABLE 
    public.order_items, 
    public.order_expenses, 
    public.orders, 
    public.stock_entries, 
    public.customers, 
    public.general_expenses, 
    public.general_income, 
    public.monthly_targets
RESTART IDENTITY CASCADE;

-- 2. Reset user stock levels to zero
UPDATE public.user_stock SET current_stock = 0;

-- 3. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
