/*
  # Add Savings System
  
  1. New Tables
    - `savings` - Store savings account information
      - Basic account details (name, type, balance)
      - Account type (Financial Institute, Cash, Piggy Bank)
      - Auto-transfer settings
    - `savings_payments` - Track payments to savings accounts
      - Support both deposits and withdrawals
      - Track payment history
    - `savings_plans` - Track savings goals and plans
      - Goal amount and target date
      - Payment schedule settings
  
  2. Security
    - Enable RLS
    - Add policies for users to manage their own data
*/

-- Create savings table
CREATE TABLE savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL CHECK (
    account_type IN ('financial_institute', 'cash', 'piggy_bank')
  ),
  institution_name text,
  current_balance numeric NOT NULL DEFAULT 0,
  target_balance numeric,
  notes text,
  is_primary boolean NOT NULL DEFAULT false,
  auto_transfer_enabled boolean NOT NULL DEFAULT false,
  auto_transfer_threshold numeric,
  auto_transfer_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create savings_payments table
CREATE TABLE savings_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_id uuid REFERENCES savings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('deposit', 'withdrawal')),
  payment_date date NOT NULL,
  payment_method text NOT NULL CHECK (
    payment_method IN ('cash', 'bank_transfer', 'debit_card', 'direct_deposit')
  ),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create savings_plans table
CREATE TABLE savings_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  savings_id uuid REFERENCES savings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  goal_amount numeric NOT NULL,
  target_date date NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  payment_frequency text NOT NULL CHECK (
    payment_frequency IN ('weekly', 'bi-weekly', 'monthly', 'specific-date')
  ),
  payment_amount numeric NOT NULL,
  payment_day integer CHECK (payment_day BETWEEN 1 AND 31),
  payment_week_day integer CHECK (payment_week_day BETWEEN 0 AND 6),
  start_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraints for auto-transfer settings
ALTER TABLE savings
  ADD CONSTRAINT auto_transfer_check CHECK (
    (auto_transfer_enabled = false) OR
    (auto_transfer_enabled = true AND auto_transfer_threshold IS NOT NULL AND auto_transfer_amount IS NOT NULL)
  );

-- Add constraint for payment day based on frequency
ALTER TABLE savings_plans
  ADD CONSTRAINT payment_schedule_check CHECK (
    (payment_frequency = 'monthly' AND payment_day IS NOT NULL AND payment_week_day IS NULL) OR
    (payment_frequency IN ('weekly', 'bi-weekly') AND payment_week_day IS NOT NULL AND payment_day IS NULL) OR
    (payment_frequency = 'specific-date' AND payment_day IS NOT NULL AND payment_week_day IS NULL)
  );

-- Enable RLS
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own savings accounts"
  ON savings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own savings payments"
  ON savings_payments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own savings plans"
  ON savings_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER savings_updated_at
  BEFORE UPDATE ON savings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER savings_payments_updated_at
  BEFORE UPDATE ON savings_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER savings_plans_updated_at
  BEFORE UPDATE ON savings_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();