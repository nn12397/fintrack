/*
  # Fix Database Schema and Add Test Data
  
  1. Changes
    - Drop existing tables to start fresh
    - Recreate tables without RLS
    - Add proper foreign key relationships
    - Add test data
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS purchase_goals CASCADE;
DROP TABLE IF EXISTS spending_budgets CASCADE;
DROP TABLE IF EXISTS payoff_plans CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  monthly_income numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create credit_cards table
CREATE TABLE credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  current_balance numeric DEFAULT 0 NOT NULL,
  credit_limit numeric DEFAULT 0 NOT NULL,
  interest_rate numeric DEFAULT 0 NOT NULL,
  minimum_payment numeric DEFAULT 0 NOT NULL,
  due_date date NOT NULL,
  is_autopay boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create bills table with explicit foreign key names
CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  due_date date NOT NULL,
  category_id uuid NOT NULL,
  frequency text DEFAULT 'monthly' NOT NULL,
  is_autopay boolean DEFAULT false NOT NULL,
  credit_card_id uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT bills_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT bills_credit_card_id_fkey FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id)
);

-- Create payoff_plans table
CREATE TABLE payoff_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  cards uuid[] NOT NULL,
  strategy text DEFAULT 'highest_interest' NOT NULL,
  monthly_payment numeric DEFAULT 0 NOT NULL,
  target_months integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create spending_budgets table
CREATE TABLE spending_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  frequency text DEFAULT 'monthly' NOT NULL,
  is_auto_calculated boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create purchase_goals table
CREATE TABLE purchase_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_amount numeric DEFAULT 0 NOT NULL,
  current_amount numeric DEFAULT 0 NOT NULL,
  target_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create triggers for updated_at columns
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payoff_plans_updated_at
  BEFORE UPDATE ON payoff_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER spending_budgets_updated_at
  BEFORE UPDATE ON spending_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER purchase_goals_updated_at
  BEFORE UPDATE ON purchase_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert test data
DO $$ 
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  housing_category_id uuid;
  utilities_category_id uuid;
  credit_card1_id uuid;
  credit_card2_id uuid;
BEGIN
  -- Create test user profile
  INSERT INTO user_profiles (user_id, monthly_income)
  VALUES (test_user_id, 5000);

  -- Create test categories
  INSERT INTO categories (id, user_id, name, color)
  VALUES 
    (gen_random_uuid(), test_user_id, 'Housing', '#3B82F6'),
    (gen_random_uuid(), test_user_id, 'Transportation', '#F59E0B'),
    (gen_random_uuid(), test_user_id, 'Food', '#10B981'),
    (gen_random_uuid(), test_user_id, 'Utilities', '#6366F1'),
    (gen_random_uuid(), test_user_id, 'Insurance', '#8B5CF6'),
    (gen_random_uuid(), test_user_id, 'Medical', '#EC4899'),
    (gen_random_uuid(), test_user_id, 'Debt', '#EF4444'),
    (gen_random_uuid(), test_user_id, 'Entertainment', '#14B8A6'),
    (gen_random_uuid(), test_user_id, 'Other', '#9CA3AF');

  -- Get specific category IDs for reference
  SELECT id INTO housing_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Housing';

  SELECT id INTO utilities_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Utilities';

  -- Create test credit cards
  INSERT INTO credit_cards (
    user_id, name, current_balance, credit_limit, 
    interest_rate, minimum_payment, due_date, is_autopay
  )
  VALUES 
    (
      test_user_id, 'Chase Freedom', 2500, 5000,
      18.99, 50, '2025-05-15', false
    ),
    (
      test_user_id, 'Citi Double Cash', 1500, 3000,
      15.99, 35, '2025-05-20', true
    )
  RETURNING id INTO credit_card1_id;

  -- Get the second credit card ID
  SELECT id INTO credit_card2_id
  FROM credit_cards
  WHERE user_id = test_user_id AND name = 'Citi Double Cash';

  -- Create test bills
  INSERT INTO bills (
    user_id, name, amount, due_date, category_id,
    frequency, is_autopay, credit_card_id, notes
  )
  VALUES 
    (
      test_user_id, 'Rent', 1200, '2025-05-01',
      housing_category_id, 'monthly', true, null,
      'Monthly rent payment'
    ),
    (
      test_user_id, 'Electricity', 150, '2025-05-10',
      utilities_category_id, 'monthly', false, credit_card1_id,
      'Monthly electricity bill'
    ),
    (
      test_user_id, 'Internet', 80, '2025-05-15',
      utilities_category_id, 'monthly', true, credit_card2_id,
      'Monthly internet service'
    );

  -- Create test payoff plan
  INSERT INTO payoff_plans (
    user_id, name, cards, strategy, monthly_payment, target_months
  )
  VALUES (
    test_user_id,
    'Credit Card Debt Freedom',
    ARRAY[credit_card1_id, credit_card2_id],
    'highest_interest',
    300,
    12
  );

  -- Create test spending budget
  INSERT INTO spending_budgets (
    user_id, amount, frequency, is_auto_calculated
  )
  VALUES (
    test_user_id,
    3000,
    'monthly',
    false
  );

  -- Create test purchase goal
  INSERT INTO purchase_goals (
    user_id, name, target_amount, current_amount, target_date
  )
  VALUES (
    test_user_id,
    'New Car Down Payment',
    5000,
    1500,
    '2025-12-31'
  );
END $$;