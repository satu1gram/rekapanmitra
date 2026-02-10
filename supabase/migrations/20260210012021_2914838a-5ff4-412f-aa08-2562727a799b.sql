
CREATE TABLE public.general_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'other',
  notes TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.general_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own general income" ON public.general_income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own general income" ON public.general_income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own general income" ON public.general_income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own general income" ON public.general_income FOR DELETE USING (auth.uid() = user_id);
