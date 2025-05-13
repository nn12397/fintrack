/*
  # Fix Database Schema and Relationships
  
  1. Changes
    - Create categories table with RLS
    - Create bills table with proper foreign key relationships
    - Create payoff_plans table
    - Add updated_at trigger function
    - Add RLS policies
*/

-- Create updated_at trigger function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_policy" ON categories;
CREATE POLICY "categories_policy"
  ON categories
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  frequency text NOT NULL DEFAULT 'monthly',
  is_autopay boolean NOT NULL DEFAULT false,
  credit_card_id uuid REFERENCES credit_cards(id),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bills_policy" ON bills;
CREATE POLICY "bills_policy"
  ON bills
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create payoff_plans table
CREATE TABLE IF NOT EXISTS payoff_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cards uuid[] NOT NULL,
  strategy text NOT NULL DEFAULT 'highest_interest',
  monthly_payment numeric NOT NULL DEFAULT 0,
  target_months integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE payoff_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payoff_plans_policy" ON payoff_plans;
CREATE POLICY "payoff_plans_policy"
  ON payoff_plans
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Add triggers to tables with updated_at
DROP TRIGGER IF EXISTS bills_updated_at ON bills;
CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS payoff_plans_updated_at ON payoff_plans;
CREATE TRIGGER payoff_plans_updated_at
  BEFORE UPDATE ON payoff_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();