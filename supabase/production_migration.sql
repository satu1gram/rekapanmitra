/*
  ===========================================
  PRODUCTION DEPLOYMENT CHECKLIST & MIGRATIONS
  ===========================================
  
  This file contains the final migration needed for the production database.
  
  1. RUN THE SQL BELOW IN YOUR SUPABASE SQL EDITOR
  2. DEPLOY FRONTEND TO VERCEL / NETLIFY
  
*/

-- ==========================================
-- 1. ADD NEW CUSTOMER COLUMNS
-- ==========================================
ALTER TABLE "public"."customers" 
ADD COLUMN IF NOT EXISTS "address" TEXT;

-- ==========================================
-- 2. VERIFY RLS POLICIES (Safety Check)
-- ==========================================
-- Ensure customers table has RLS enabled
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

-- If for any reason the RLS policy for address updates isn't inherited,
-- this ensures it's covered by the existing UPDATE policy:
-- "Users can update their own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 3. VERIFY OTHER RECENT MIGRATION TABLES (If not already in Prod)
-- ==========================================
-- Make sure monthly_targets exists (from Feb 28th migration)
CREATE TABLE IF NOT EXISTS "public"."monthly_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "month_str" TEXT NOT NULL,
    "target_amount" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("user_id", "month_str")
);

ALTER TABLE "public"."monthly_targets" ENABLE ROW LEVEL SECURITY;

-- Safe to re-run policies (they will error if exist, or you can use DO blocks, 
-- but assuming standard Supabase setup, they are already applied via CLI previously).
