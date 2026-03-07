-- Mengaktifkan ekstensi vector jika belum aktif
create extension if not exists vector;

-- Membuat tabel untuk menyimpan pesan Telegram
create table telegram_messages (
  id text primary key, -- Menggunakan ID asli dari Telegram
  content text not null, -- Teks asli pesan (testimoni/product knowledge)
  sender text, -- Nama pengirim / admin
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  embedding vector(3072) -- Panjang vektor tergantung model yang digunakan
);

-- Index ditiadakan karena pgvector HNSW memiliki limit 2000 dimensi.
-- Karena data kita kurang dari 10.000 baris, pencarian persis (exact KNN) tanpa index akan bekerja secara instan tanpa masalah.

-- Membuat database function (RPC) untuk memanggil pencarian vektor dari Edge Function / API
create or replace function match_messages (
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  content text,
  sender text,
  created_at timestamp with time zone,
  similarity float
)
language sql stable
as $$
  select
    telegram_messages.id,
    telegram_messages.content,
    telegram_messages.sender,
    telegram_messages.created_at,
    1 - (telegram_messages.embedding <=> query_embedding) as similarity
  from telegram_messages
  where 1 - (telegram_messages.embedding <=> query_embedding) > match_threshold
  order by telegram_messages.embedding <=> query_embedding
  limit match_count;
$$;
