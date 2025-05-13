/*
  # Add Bank Details to Credit Cards
  
  1. Changes
    - Add bank_name column to credit_cards table
    - Add last_four_digits column to credit_cards table
    - Add constraints to ensure valid data
    - Update existing records with placeholder data
*/

-- Add new columns
ALTER TABLE credit_cards
  ADD COLUMN bank_name text,
  ADD COLUMN last_four_digits text;

-- Update existing records with placeholder data
UPDATE credit_cards
SET 
  bank_name = 'Unknown Bank',
  last_four_digits = '0000'
WHERE bank_name IS NULL;

-- Make columns required
ALTER TABLE credit_cards
  ALTER COLUMN bank_name SET NOT NULL,
  ALTER COLUMN last_four_digits SET NOT NULL;

-- Add constraint for last_four_digits format
ALTER TABLE credit_cards
  ADD CONSTRAINT last_four_digits_format 
  CHECK (last_four_digits ~ '^[0-9]{4}$');