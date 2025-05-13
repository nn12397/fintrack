/*
  # Add Income Frequency Support
  
  1. Changes
    - Add income_frequency column to user_profiles table
    - Add income_day column for specific monthly dates
    - Update existing profiles to default to monthly frequency
*/

-- Add new columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN income_frequency text NOT NULL DEFAULT 'monthly'
  CHECK (income_frequency IN ('weekly', 'bi-weekly', 'bi-monthly', 'monthly', 'specific-date')),
  ADD COLUMN income_day integer
  CHECK (income_day BETWEEN 1 AND 31);

-- Add constraint to ensure income_day is set only for specific-date frequency
ALTER TABLE user_profiles
  ADD CONSTRAINT income_day_constraint CHECK (
    (income_frequency = 'specific-date' AND income_day IS NOT NULL) OR
    (income_frequency != 'specific-date' AND income_day IS NULL)
  );

-- Update existing profiles to monthly frequency
UPDATE user_profiles SET income_frequency = 'monthly';