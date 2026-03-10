-- AI & TESTIMONIAL INFRASTRUCTURE
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create/Update telegram_messages table for AI Testimonials
CREATE TABLE IF NOT EXISTS public.telegram_messages (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  sender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  embedding VECTOR(3072), -- Adjust to 768 if using smaller Gemini model
  is_testimoni BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- approved, rejected, pending
  foto_url TEXT,
  nama_pengirim TEXT,
  produk TEXT,
  bintang INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  kota TEXT
);

-- AI Vector Search Function (RPC)
DROP FUNCTION IF EXISTS public.match_messages(vector, float, int);
CREATE OR REPLACE FUNCTION public.match_messages (
  query_embedding VECTOR(3072),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  sender TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity FLOAT,
  foto_url TEXT,
  nama_pengirim TEXT,
  produk TEXT,
  bintang INTEGER
)
LANGUAGE sql STABLE
AS $$
  SELECT
    telegram_messages.id,
    telegram_messages.content,
    telegram_messages.sender,
    telegram_messages.created_at,
    1 - (telegram_messages.embedding <=> query_embedding) AS similarity,
    telegram_messages.foto_url,
    telegram_messages.nama_pengirim,
    telegram_messages.produk,
    telegram_messages.bintang
  FROM telegram_messages
  WHERE 1 - (telegram_messages.embedding <=> query_embedding) > match_threshold
    AND status = 'approved'
  ORDER BY telegram_messages.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RLS POLICIES FOR TESTIMONIAL SYNCing
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read of approved testimonials
CREATE POLICY "Approved testimonials are viewable by everyone" 
ON public.telegram_messages FOR SELECT 
USING (status = 'approved');

-- Allow anon/service role to sync data (INSERT/UPDATE)
CREATE POLICY "Anon can sync testimonials" 
ON public.telegram_messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anon can update testimonials" 
ON public.telegram_messages FOR UPDATE
USING (true)
WITH CHECK (true);
