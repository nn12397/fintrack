/*
  # Remove Current Balance from Debit Cards
  
  1. Changes
    - Remove current_balance column from debit_cards table
    - Update existing records to use available_balance
*/

-- First update any existing records to ensure available_balance is set
UPDATE debit_cards
SET available_balance = GREATEST(available_balance, current_balance)
WHERE current_balance > available_balance;

-- Remove the current_balance column
ALTER TABLE debit_cards
  DROP COLUMN current_balance;