-- Create storage bucket for transfer proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-proofs', 'transfer-proofs', true);

-- Create policy for users to upload their own transfer proofs
CREATE POLICY "Users can upload their own transfer proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'transfer-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own transfer proofs
CREATE POLICY "Users can view their own transfer proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'transfer-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for public access to transfer proofs (since bucket is public)
CREATE POLICY "Public can view transfer proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'transfer-proofs');

-- Create policy for users to delete their own transfer proofs
CREATE POLICY "Users can delete their own transfer proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'transfer-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);