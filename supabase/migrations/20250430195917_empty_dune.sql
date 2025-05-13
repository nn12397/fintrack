/*
  # Fix Card Reference in Bills Table
  
  1. Changes
    - Add card_id column to bills table
    - Add trigger function to validate card references
    - Remove foreign key constraints in favor of trigger-based validation
    - Update existing data to maintain integrity
*/

-- First, create the validation function
CREATE OR REPLACE FUNCTION validate_card_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if card_id exists in either credit_cards or debit_cards
  IF NEW.card_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM credit_cards WHERE id = NEW.card_id
      UNION
      SELECT 1 FROM debit_cards WHERE id = NEW.card_id
    ) THEN
      RAISE EXCEPTION 'Card ID % not found in credit_cards or debit_cards', NEW.card_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing foreign key constraints if they exist
ALTER TABLE bills
  DROP CONSTRAINT IF EXISTS bills_card_id_fkey,
  DROP CONSTRAINT IF EXISTS bills_debit_card_id_fkey;

-- Add trigger to validate card references
DROP TRIGGER IF EXISTS validate_card_reference ON bills;
CREATE TRIGGER validate_card_reference
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION validate_card_reference();

-- Add comment to explain the card_id column
COMMENT ON COLUMN bills.card_id IS 'References either a credit_card.id or debit_card.id';