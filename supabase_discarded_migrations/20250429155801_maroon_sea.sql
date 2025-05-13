/*
  # Enable RLS and add policies

  1. Security Changes
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read their own data
      - Insert their own data
      - Update their own data
      - Delete their own data
    
  2. Tables Modified
    - users
    - categories
    - credit_cards
    - user_profiles
    - bills
    - payoff_plans
    - spending_budgets
    - purchase_goals

  Note: All policies are scoped to the user's own data using auth.uid()
*/

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payoff_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_goals ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Categories table policies
CREATE POLICY "Users can read own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Credit cards table policies
CREATE POLICY "Users can read own credit cards" ON credit_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit cards" ON credit_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit cards" ON credit_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit cards" ON credit_cards
  FOR DELETE USING (auth.uid() = user_id);

-- User profiles table policies
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Bills table policies
CREATE POLICY "Users can read own bills" ON bills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills" ON bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills" ON bills
  FOR DELETE USING (auth.uid() = user_id);

-- Payoff plans table policies
CREATE POLICY "Users can read own payoff plans" ON payoff_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payoff plans" ON payoff_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payoff plans" ON payoff_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payoff plans" ON payoff_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Spending budgets table policies
CREATE POLICY "Users can read own spending budgets" ON spending_budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending budgets" ON spending_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending budgets" ON spending_budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spending budgets" ON spending_budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Purchase goals table policies
CREATE POLICY "Users can read own purchase goals" ON purchase_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchase goals" ON purchase_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchase goals" ON purchase_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchase goals" ON purchase_goals
  FOR DELETE USING (auth.uid() = user_id);