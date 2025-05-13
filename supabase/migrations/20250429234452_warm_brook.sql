/*
  # Rename monthly_income to income_amount
  
  1. Changes
    - Rename monthly_income column to income_amount in user_profiles table
    - Update column comment to reflect the new meaning
*/

ALTER TABLE user_profiles 
  RENAME COLUMN monthly_income TO income_amount;