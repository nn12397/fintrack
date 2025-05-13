/*
  # Fix Card Foreign Key Constraints
  
  1. Changes
    - Remove existing foreign key constraints
    - Remove existing trigger and function
    - Create new composite foreign key check using OR condition
    - Add proper validation for card references
*/

-- Drop existing constraints and trigger
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_credit_card_id_fkey;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_debit_card_id_fkey;
DROP TRIGGER IF EXISTS validate_card_id ON bills;
DROP FUNCTION IF EXISTS check_card_exists();

-- Create improved validation function that uses EXISTS
CREATE OR REPLACE FUNCTION validate_card_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if card_id is not null
  IF NEW.card_id IS NOT NULL THEN
    -- Check if card exists in either credit_cards or debit_cards
    IF NOT EXISTS (
      SELECT 1 FROM (
        SELECT id FROM credit_cards
        UNION
        SELECT id FROM debit_cards
      ) cards WHERE id = NEW.card_id
    ) THEN
      RAISE EXCEPTION 'Invalid card_id: % - must exist in either credit_cards or debit_cards', NEW.card_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
CREATE TRIGGER validate_card_reference
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION validate_card_reference();

-- Add comment to explain the card_id column's purpose
COMMENT ON COLUMN bills.card_id IS 'References either a credit_card.id or debit_card.id';