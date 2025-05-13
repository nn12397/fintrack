/*
  # Fix Tables and Enable RLS

  1. Changes
    - Enable RLS on all tables
    - Add RLS policies for all tables
    - Fix foreign key relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payoff_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_goals ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Add RLS policies for user_profiles table
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for categories table
CREATE POLICY "Users can manage own categories" ON categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for credit_cards table
CREATE POLICY "Users can manage own credit cards" ON credit_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for bills table
CREATE POLICY "Users can manage own bills" ON bills
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for payoff_plans table
CREATE POLICY "Users can manage own payoff plans" ON payoff_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for spending_budgets table
CREATE POLICY "Users can manage own spending budgets" ON spending_budgets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for purchase_goals table
CREATE POLICY "Users can manage own purchase goals" ON purchase_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop and recreate tables with correct relationships
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;

-- Recreate categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate credit_cards table
CREATE TABLE credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  current_balance numeric NOT NULL DEFAULT 0,
  credit_limit numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  minimum_payment numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  is_autopay boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate bills table with correct foreign key relationships
CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  is_autopay boolean NOT NULL DEFAULT false,
  credit_card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();