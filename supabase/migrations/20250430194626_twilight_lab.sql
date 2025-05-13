/*
  # Fix Card References
  
  1. Changes
    - Drop existing foreign key constraints
    - Drop existing trigger
    - Create new function to validate card existence
    - Add new trigger with proper validation
*/

-- Drop existing constraints and trigger
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_credit_card_id_fkey;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_debit_card_id_fkey;
DROP TRIGGER IF EXISTS validate_card_id ON bills;
DROP FUNCTION IF EXISTS check_card_exists();

-- Create improved validation function
CREATE OR REPLACE FUNCTION check_card_exists()
RETURNS TRIGGER AS $$
DECLARE
  credit_card_exists BOOLEAN;
  debit_card_exists BOOLEAN;
BEGIN
  IF NEW.card_id IS NOT NULL THEN
    -- Check credit cards
    SELECT EXISTS (
      SELECT 1 FROM credit_cards WHERE id = NEW.card_id
    ) INTO credit_card_exists;
    
    -- Check debit cards
    SELECT EXISTS (
      SELECT 1 FROM debit_cards WHERE id = NEW.card_id
    ) INTO debit_card_exists;
    
    -- Ensure card exists in exactly one table
    IF NOT (credit_card_exists OR debit_card_exists) THEN
      RAISE EXCEPTION 'Card ID % does not exist in either credit_cards or debit_cards', NEW.card_id;
    END IF;
    
    IF credit_card_exists AND debit_card_exists THEN
      RAISE EXCEPTION 'Card ID % exists in both credit_cards and debit_cards', NEW.card_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER validate_card_id
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION check_card_exists();