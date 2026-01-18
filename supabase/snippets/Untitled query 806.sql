-- Create order_expenses table
CREATE TABLE IF NOT EXISTS public.order_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.order_expenses ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can manage their own order expenses" ON public.order_expenses
    FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS order_expenses_order_id_idx ON public.order_expenses(order_id);