/*
  # Add Debit Cards Support
  
  1. New Tables
    - `debit_cards` - Store debit card information
      - Basic card details (name, bank, last 4 digits)
      - Balance tracking
      - Account type (checking/savings)
      - Auto-reload settings
  
  2. Security
    - Enable RLS
    - Add policy for users to manage their own debit cards
*/

-- Create debit_cards table
CREATE TABLE debit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  bank_name text NOT NULL,
  last_four_digits text NOT NULL,
  current_balance numeric NOT NULL DEFAULT 0,
  available_balance numeric NOT NULL DEFAULT 0,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  is_primary boolean NOT NULL DEFAULT false,
  auto_reload_enabled boolean NOT NULL DEFAULT false,
  auto_reload_threshold numeric,
  auto_reload_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint to ensure auto-reload settings are valid
ALTER TABLE debit_cards
  ADD CONSTRAINT auto_reload_check CHECK (
    (auto_reload_enabled = false) OR
    (auto_reload_enabled = true AND auto_reload_threshold IS NOT NULL AND auto_reload_amount IS NOT NULL)
  );

-- Enable RLS
ALTER TABLE debit_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own debit cards"
  ON debit_cards
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER debit_cards_updated_at
  BEFORE UPDATE ON debit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();