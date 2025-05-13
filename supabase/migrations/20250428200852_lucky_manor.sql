/*
  # Initial Schema for Financial Management App

  1. New Tables
    - `user_profiles` - User income information
    - `categories` - Bill categories
    - `bills` - Bill information
    - `credit_cards` - Credit card details
    - `payoff_plans` - Credit card payoff plans
    - `spending_budgets` - Spending budget information
    - `purchase_goals` - Large purchase goals

  2. Security
    - Enable RLS on all tables
    - Add policies to restrict access to user's own data
*/

-- Create tables

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Credit Cards
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_balance numeric NOT NULL DEFAULT 0,
  credit_limit numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  minimum_payment numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  is_autopay boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bills
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payoff Plans
CREATE TABLE IF NOT EXISTS payoff_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cards uuid[] NOT NULL,
  strategy text NOT NULL DEFAULT 'highest_interest',
  monthly_payment numeric NOT NULL DEFAULT 0,
  target_months integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Spending Budgets
CREATE TABLE IF NOT EXISTS spending_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'monthly',
  is_auto_calculated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase Goals
CREATE TABLE IF NOT EXISTS purchase_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payoff_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User Profiles
CREATE POLICY user_profiles_policy
  ON user_profiles
  USING (auth.uid() = user_id);

-- Categories
CREATE POLICY categories_policy
  ON categories
  USING (auth.uid() = user_id);

-- Bills
CREATE POLICY bills_policy
  ON bills
  USING (auth.uid() = user_id);

-- Credit Cards
CREATE POLICY credit_cards_policy
  ON credit_cards
  USING (auth.uid() = user_id);

-- Payoff Plans
CREATE POLICY payoff_plans_policy
  ON payoff_plans
  USING (auth.uid() = user_id);

-- Spending Budgets
CREATE POLICY spending_budgets_policy
  ON spending_budgets
  USING (auth.uid() = user_id);

-- Purchase Goals
CREATE POLICY purchase_goals_policy
  ON purchase_goals
  USING (auth.uid() = user_id);

-- Add default categories for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, monthly_income)
  VALUES (new.id, 0);
  
  INSERT INTO public.categories (user_id, name, color)
  VALUES 
    (new.id, 'Housing', '#3B82F6'),
    (new.id, 'Transportation', '#F59E0B'),
    (new.id, 'Food', '#10B981'),
    (new.id, 'Utilities', '#6366F1'),
    (new.id, 'Insurance', '#8B5CF6'),
    (new.id, 'Medical', '#EC4899'),
    (new.id, 'Debt', '#EF4444'),
    (new.id, 'Entertainment', '#14B8A6'),
    (new.id, 'Other', '#9CA3AF');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();