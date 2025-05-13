/*
  # Update Bi-Monthly Income Handling
  
  1. Changes
    - Add check constraint for bi-monthly income dates
    - Update income_day_constraint to handle bi-monthly frequency
*/

-- Drop existing income_day_constraint
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS income_day_constraint;

-- Add new constraint for income_day
ALTER TABLE user_profiles
  ADD CONSTRAINT income_day_constraint CHECK (
    (income_frequency = 'specific-date' AND income_day IS NOT NULL) OR
    (income_frequency = 'bi-monthly' AND income_day IS NULL) OR
    (income_frequency NOT IN ('specific-date', 'bi-monthly') AND income_day IS NULL)
  );

-- Update any existing bi-monthly records to ensure they follow the new pattern
UPDATE user_profiles 
SET income_day = NULL 
WHERE income_frequency = 'bi-monthly';