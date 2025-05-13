/*
  # Add Credit Card Payments Table
  
  1. New Tables
    - `credit_card_payments` - Track payments made to credit cards
      - `id` (uuid, primary key)
      - `credit_card_id` (uuid, references credit_cards)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `payment_date` (date)
      - `previous_balance` (numeric)
      - `new_balance` (numeric)
      - `payment_type` (one-time or recurring)
      - `recurrence_interval` (weekly, bi-weekly, monthly)
      - `start_date` (date, for recurring payments)
      - `end_date` (date, for recurring payments)
      - `recurrence_day` (integer, for monthly payments)
      - `recurrence_week_day` (integer, for weekly payments)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policy for users to manage their own payments
*/

-- Create credit_card_payments table
CREATE TABLE credit_card_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_card_id uuid REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  previous_balance numeric NOT NULL DEFAULT 0,
  new_balance numeric NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'one-time'
    CHECK (payment_type IN ('one-time', 'recurring')),
  recurrence_interval text
    CHECK (recurrence_interval IN ('weekly', 'bi-weekly', 'monthly')),
  start_date date,
  end_date date,
  recurrence_day integer
    CHECK (recurrence_day BETWEEN 1 AND 31),
  recurrence_week_day integer
    CHECK (recurrence_week_day BETWEEN 0 AND 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint for recurring payments
ALTER TABLE credit_card_payments
  ADD CONSTRAINT recurring_payment_check CHECK (
    (payment_type = 'recurring' AND recurrence_interval IS NOT NULL AND start_date IS NOT NULL) OR
    (payment_type = 'one-time' AND recurrence_interval IS NULL AND start_date IS NULL AND end_date IS NULL AND recurrence_day IS NULL AND recurrence_week_day IS NULL)
  );

-- Add constraint for payment schedule
ALTER TABLE credit_card_payments
  ADD CONSTRAINT payment_schedule_check CHECK (
    -- Monthly payments require recurrence_day
    (recurrence_interval = 'monthly' AND recurrence_day IS NOT NULL AND recurrence_week_day IS NULL) OR
    -- Weekly/Bi-weekly payments require recurrence_week_day
    (recurrence_interval IN ('weekly', 'bi-weekly') AND recurrence_week_day IS NOT NULL AND recurrence_day IS NULL) OR
    -- One-time payments don't require either
    (payment_type = 'one-time' AND recurrence_day IS NULL AND recurrence_week_day IS NULL)
  );

-- Enable RLS
ALTER TABLE credit_card_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own credit card payments"
  ON credit_card_payments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER credit_card_payments_updated_at
  BEFORE UPDATE ON credit_card_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();