-- Migration to add support for custom user mitra levels
-- This involves creating a new table for custom levels and removing the CHECK constraint 
-- on the existing profiles.mitra_level column to allow custom string IDs.

-- 1. Create user_mitra_levels table
CREATE TABLE IF NOT EXISTS public.user_mitra_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level_code TEXT NOT NULL,
    label TEXT NOT NULL,
    buy_price_per_bottle INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a user cannot have duplicate level_codes
    UNIQUE (user_id, level_code)
);

-- Add comments for documentation
COMMENT ON TABLE public.user_mitra_levels IS 'Stores custom mitra levels defined by users';
COMMENT ON COLUMN public.user_mitra_levels.level_code IS 'Unique identifier string for this level, used in profiles.mitra_level';

-- Enable RLS
ALTER TABLE public.user_mitra_levels ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own custom levels"
    ON public.user_mitra_levels
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom levels"
    ON public.user_mitra_levels
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom levels"
    ON public.user_mitra_levels
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom levels"
    ON public.user_mitra_levels
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_mitra_levels_user_id ON public.user_mitra_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mitra_levels_level_code ON public.user_mitra_levels(level_code);

-- Create updated_at trigger
CREATE TRIGGER update_user_mitra_levels_updated_at
    BEFORE UPDATE ON public.user_mitra_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Drop the restrictive CHECK constraint on profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_mitra_level_check;

-- Note: We now allow any string in profiles.mitra_level. 
-- The application logic will enforce that it matches either a predefined level or a user's custom level.
