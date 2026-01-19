-- Create general_expenses table for expenses from total profit
CREATE TABLE IF NOT EXISTS public.general_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'other',
    notes TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.general_expenses ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own general expenses" ON public.general_expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own general expenses" ON public.general_expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own general expenses" ON public.general_expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own general expenses" ON public.general_expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS general_expenses_user_id_idx ON public.general_expenses(user_id);
CREATE INDEX IF NOT EXISTS general_expenses_expense_date_idx ON public.general_expenses(expense_date);