/*
  # Update Bills Table to Use Single Card ID
  
  1. Changes
    - Remove credit_card_id and debit_card_id columns
    - Add new card_id column
    - Remove card type check constraint
    - Update foreign key relationships
*/

-- Remove the foreign key constraints
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_credit_card_id_fkey;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_debit_card_id_fkey;

-- Remove the check constraint on card types
ALTER TABLE bills DROP CONSTRAINT IF EXISTS card_type_check;

-- Add the new card_id column before dropping the old ones
-- to preserve existing credit card relationships
ALTER TABLE bills ADD COLUMN card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL;

-- Update card_id with existing credit_card_id values
UPDATE bills SET card_id = credit_card_id WHERE credit_card_id IS NOT NULL;

-- Remove the old columns
ALTER TABLE bills DROP COLUMN IF EXISTS credit_card_id;
ALTER TABLE bills DROP COLUMN IF EXISTS debit_card_id;