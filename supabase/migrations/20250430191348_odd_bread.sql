/*
  # Update Bills Schema for Multiple Card Types
  
  1. Changes
    - Add debit_card_id column to bills table
    - Update constraints to handle both credit and debit cards
    - Add foreign key relationship to debit_cards
    - Update existing data to maintain integrity
*/

-- Add debit_card_id column
ALTER TABLE bills
  ADD COLUMN debit_card_id uuid REFERENCES debit_cards(id);

-- Add constraint to ensure only one card type is selected
ALTER TABLE bills
  ADD CONSTRAINT card_type_check CHECK (
    (credit_card_id IS NULL AND debit_card_id IS NULL) OR
    (credit_card_id IS NOT NULL AND debit_card_id IS NULL) OR
    (credit_card_id IS NULL AND debit_card_id IS NOT NULL)
  );