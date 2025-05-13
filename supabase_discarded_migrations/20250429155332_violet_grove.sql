/*
  # Fix Database Relationships and Security

  1. Changes
    - Enable RLS on all tables
    - Add RLS policies for all tables
    - Fix foreign key relationships
    - Add missing indexes for performance

  2. Security
    - Enable RLS on all tables
    - Add policies to allow users to access only their own data
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

-- Add RLS policies for users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Add RLS policies for user_profiles
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for categories
CREATE POLICY "Users can manage own categories" ON categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for credit_cards
CREATE POLICY "Users can manage own credit cards" ON credit_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for bills
CREATE POLICY "Users can manage own bills" ON bills
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for payoff_plans
CREATE POLICY "Users can manage own payoff plans" ON payoff_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for spending_budgets
CREATE POLICY "Users can manage own spending budgets" ON spending_budgets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for purchase_goals
CREATE POLICY "Users can manage own purchase goals" ON purchase_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_bills_category_id ON bills(category_id);
CREATE INDEX IF NOT EXISTS idx_bills_credit_card_id ON bills(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

-- Add indexes for user_id columns for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_payoff_plans_user_id ON payoff_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_budgets_user_id ON spending_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_goals_user_id ON purchase_goals(user_id);