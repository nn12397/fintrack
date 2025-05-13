-- Add RLS policies for card access
CREATE POLICY "Users can read their own credit cards"
  ON credit_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own debit cards"
  ON debit_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update bills RLS policy to include card access
DROP POLICY IF EXISTS "Users can manage their own bills" ON bills;
CREATE POLICY "Users can manage their own bills"
  ON bills
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND (
      card_id IS NULL OR
      EXISTS (
        SELECT 1 FROM credit_cards WHERE id = card_id AND user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM debit_cards WHERE id = card_id AND user_id = auth.uid()
      )
    )
  );