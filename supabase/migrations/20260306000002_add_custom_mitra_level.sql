-- Add custom level fields to profiles table
-- Allows users to define their own mitra level name and buy price during onboarding.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS custom_level_name text,
ADD COLUMN IF NOT EXISTS custom_buy_price integer;
