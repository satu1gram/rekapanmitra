-- Create an UPDATE policy for stock_entries so users can edit their restok date and other fields
CREATE POLICY "Users can update their own stock entries" 
ON public.stock_entries 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create a DELETE policy for stock_entries just in case it doesn't exist
CREATE POLICY "Users can delete their own stock entries" 
ON public.stock_entries 
FOR DELETE 
USING (auth.uid() = user_id);
