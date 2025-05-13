/*
  # Complete Database Schema Setup
  
  1. Tables Created:
    - users (for foreign key references)
    - user_profiles (user income information)
    - categories (bill categories)
    - credit_cards (credit card details)
    - bills (bill information)
    - payoff_plans (credit card payoff plans)
    - spending_budgets (spending budget information)
    - purchase_goals (large purchase goals)
    
  2. Features:
    - Automatic updated_at timestamp handling
    - Foreign key constraints
    - Default values
    - Test data for development
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS purchase_goals CASCADE;
DROP TABLE IF EXISTS spending_budgets CASCADE;
DROP TABLE IF EXISTS payoff_plans CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create a test user in auth.users first
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com')
ON CONFLICT (id) DO NOTHING;

-- Create default categories for test user
INSERT INTO categories (user_id, name, color)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Housing', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000000', 'Transportation', '#F59E0B'),
  ('00000000-0000-0000-0000-000000000000', 'Food', '#10B981'),
  ('00000000-0000-0000-0000-000000000000', 'Utilities', '#6366F1'),
  ('00000000-0000-0000-0000-000000000000', 'Insurance', '#8B5CF6'),
  ('00000000-0000-0000-0000-000000000000', 'Medical', '#EC4899'),
  ('00000000-0000-0000-0000-000000000000', 'Debt', '#EF4444'),
  ('00000000-0000-0000-0000-000000000000', 'Entertainment', '#14B8A6'),
  ('00000000-0000-0000-0000-000000000000', 'Other', '#9CA3AF');

-- Create test user profile
INSERT INTO user_profiles (user_id, monthly_income)
VALUES ('00000000-0000-0000-0000-000000000000', 5000);