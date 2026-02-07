-- Add mitra_level column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mitra_level text NOT NULL DEFAULT 'reseller';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.mitra_level IS 'Level mitra: reseller, agen, agen_plus, sap, se';