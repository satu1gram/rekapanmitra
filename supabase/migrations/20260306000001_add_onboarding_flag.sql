-- Add onboarding_completed flag to profiles table
-- This column tracks whether the user has completed the initial setup wizard.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Existing users who already have a name set are considered to have completed onboarding
-- (they were using the app before this feature was added)
UPDATE profiles
SET onboarding_completed = true
WHERE name IS NOT NULL AND name <> '';
