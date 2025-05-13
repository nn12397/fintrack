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

-- Create bills table
CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  due_date date NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  frequency text DEFAULT 'monthly' NOT NULL,
  is_autopay boolean DEFAULT false NOT NULL,
  credit_card_id uuid REFERENCES credit_cards(id),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
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
  utilities_category_id uuid;
  credit_card_id uuid;
BEGIN
  -- Create test user profile
  INSERT INTO user_profiles (user_id, monthly_income)
  VALUES (test_user_id, 5000);

  -- Create test categories
  INSERT INTO categories (user_id, name, color)
  VALUES 
    (test_user_id, 'Housing', '#3B82F6'),
    (test_user_id, 'Transportation', '#F59E0B'),
    (test_user_id, 'Food', '#10B981'),
    (test_user_id, 'Utilities', '#6366F1'),
    (test_user_id, 'Insurance', '#8B5CF6'),
    (test_user_id, 'Medical', '#EC4899'),
    (test_user_id, 'Debt', '#EF4444'),
    (test_user_id, 'Entertainment', '#14B8A6'),
    (test_user_id, 'Other', '#9CA3AF');

  -- Get the Utilities category ID specifically
  SELECT id INTO utilities_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Utilities';

  -- Create test credit card
  INSERT INTO credit_cards (
    user_id, name, current_balance, credit_limit, 
    interest_rate, minimum_payment, due_date, is_autopay
  )
  VALUES (
    test_user_id, 'Main Credit Card', 1500, 5000,
    18.99, 35, '2025-05-15', false
  )
  RETURNING id INTO credit_card_id;

  -- Create test bill
  INSERT INTO bills (
    user_id, name, amount, due_date, category_id,
    frequency, is_autopay, credit_card_id, notes
  )
  VALUES (
    test_user_id, 'Electricity', 150, '2025-05-10',
    utilities_category_id, 'monthly', false, credit_card_id,
    'Monthly electricity bill'
  );

  -- Create test payoff plan
  INSERT INTO payoff_plans (
    user_id, name, cards, strategy, monthly_payment
  )
  VALUES (
    test_user_id, 'Credit Card Payoff', ARRAY[credit_card_id],
    'highest_interest', 200
  );
END $$;