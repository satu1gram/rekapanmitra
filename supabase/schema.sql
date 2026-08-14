-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  onboarding_completed boolean DEFAULT false,
  custom_level_name text,
  custom_buy_price integer,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT ''::text,
  location text DEFAULT 'Malang'::text,
  mitra_level text NOT NULL DEFAULT 'reseller'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL UNIQUE,
  phone text,
  role USER-DEFINED NOT NULL DEFAULT 'mitra'::user_role,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.customers (
  address text,
  type text DEFAULT 'konsumen'::text CHECK (type = ANY (ARRAY['konsumen'::text, 'mitra'::text, 'KONSUMEN'::text, 'MITRA'::text])),
  province text,
  city text,
  user_id uuid NOT NULL,
  name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tier text NOT NULL DEFAULT 'satuan'::text CHECK (tier = ANY (ARRAY['satuan'::text, 'reseller'::text, 'agen'::text, 'agen_plus'::text, 'sap'::text])),
  total_orders integer NOT NULL DEFAULT 0,
  total_spent bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  phone text,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.orders (
  user_id uuid NOT NULL,
  customer_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  tier text NOT NULL CHECK (tier = ANY (ARRAY['satuan'::text, 'reseller'::text, 'agen'::text, 'agen_plus'::text, 'sap'::text])),
  quantity integer NOT NULL,
  price_per_bottle bigint NOT NULL,
  total_price bigint NOT NULL,
  buy_price bigint NOT NULL,
  margin bigint NOT NULL,
  transfer_proof_url text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['menunggu_bayar'::text, 'pending'::text, 'terkirim'::text, 'selesai'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.order_items (
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  price_per_bottle bigint NOT NULL,
  subtotal bigint NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.master_products(id)
);
CREATE TABLE public.order_expenses (
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT order_expenses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.general_expenses (
  user_id uuid NOT NULL,
  name text NOT NULL,
  notes text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  amount numeric NOT NULL DEFAULT 0,
  category text DEFAULT 'other'::text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT general_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT general_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.stock_entries (
  product_name text,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['in'::text, 'out'::text])),
  quantity integer NOT NULL,
  tier text CHECK (tier IS NULL OR (tier = ANY (ARRAY['satuan'::text, 'reseller'::text, 'agen'::text, 'agen_plus'::text, 'sap'::text, 'se'::text]))),
  buy_price_per_bottle bigint,
  total_buy_price bigint,
  order_id uuid,
  transfer_proof_url text,
  notes text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_entries_pkey PRIMARY KEY (id),
  CONSTRAINT stock_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT stock_entries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.user_stock (
  user_id uuid NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  current_stock integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_stock_pkey PRIMARY KEY (id),
  CONSTRAINT user_stock_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.monthly_targets (
  user_id uuid NOT NULL,
  year smallint NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month smallint NOT NULL CHECK (month >= 0 AND month <= 11),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  target_profit bigint NOT NULL DEFAULT 0,
  target_qty integer NOT NULL DEFAULT 0,
  target_stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT monthly_targets_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_mitra_levels (
  user_id uuid NOT NULL,
  level_code text NOT NULL,
  label text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buy_price_per_bottle integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_mitra_levels_pkey PRIMARY KEY (id),
  CONSTRAINT user_mitra_levels_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.store_settings (
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  welcome_message text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT ''::text,
  is_active boolean NOT NULL DEFAULT true,
  payment_info jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_pkey PRIMARY KEY (id),
  CONSTRAINT store_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.master_products (
  name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['STEFFI'::text, 'BELGIE'::text, 'BELGIE_FW'::text, 'BELGIE_NC'::text, 'BELGIE_DC'::text, 'BELGIE_SERUM'::text, 'BELGIE_HT'::text, 'BP'::text, 'KID'::text, 'BLUE'::text, 'BRO'::text, 'BRE'::text, 'NORWAY'::text])),
  package_type text NOT NULL CHECK (package_type = ANY (ARRAY['200_botol'::text, '40_botol'::text, '10_botol'::text, '5_botol'::text, '3_botol'::text, 'satuan'::text])),
  quantity_per_package integer NOT NULL,
  price bigint NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT master_products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.telegram_messages (
  id text NOT NULL,
  content text NOT NULL,
  sender text,
  embedding USER-DEFINED,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  foto_url text,
  is_testimoni boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  nama_pengirim text,
  kota text,
  produk text,
  bintang smallint DEFAULT 5 CHECK (bintang >= 1 AND bintang <= 5),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  category text,
  sender_profile text,
  channel_name text,
  tags ARRAY,
  CONSTRAINT telegram_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.telegram_bot_registrations (
  chat_id text NOT NULL,
  user_id uuid NOT NULL,
  slug text NOT NULL,
  store_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT telegram_bot_registrations_pkey PRIMARY KEY (chat_id),
  CONSTRAINT telegram_bot_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.telegram_bot_sessions (
  chat_id text NOT NULL,
  pending_order jsonb,
  state text NOT NULL DEFAULT 'idle'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT telegram_bot_sessions_pkey PRIMARY KEY (chat_id)
);
CREATE TABLE public.telegram_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  tenant_id uuid NOT NULL,
  chat_id text NOT NULL UNIQUE,
  username text,
  connected_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT telegram_connections_pkey PRIMARY KEY (id),
  CONSTRAINT telegram_connections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES auth.users(id),
  CONSTRAINT telegram_connections_connected_by_fkey FOREIGN KEY (connected_by) REFERENCES auth.users(id)
);
CREATE TABLE public.telegram_sessions (
  chat_id text NOT NULL,
  tenant_id uuid,
  current_step text NOT NULL DEFAULT 'idle'::text,
  session_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT telegram_sessions_pkey PRIMARY KEY (chat_id),
  CONSTRAINT telegram_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES auth.users(id)
);
CREATE TABLE public.general_income (
  user_id uuid NOT NULL,
  name text NOT NULL,
  notes text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  amount numeric NOT NULL DEFAULT 0,
  category text DEFAULT 'other'::text,
  income_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT general_income_pkey PRIMARY KEY (id),
  CONSTRAINT general_income_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_product_stock (
  user_id uuid NOT NULL,
  product_name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  current_stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_product_stock_pkey PRIMARY KEY (id),
  CONSTRAINT user_product_stock_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);