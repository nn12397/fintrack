/*
  # Enable Row Level Security

  1. Security Changes
    - Enable RLS on all tables
    - Add security policies for each table to allow users to access their own data
    - Add policies for authenticated users to perform CRUD operations on their data

  2. Tables Modified
    - users
    - user_profiles
    - categories
    - bills
    - credit_cards
    - payoff_plans
    - spending_budgets
    - purchase_goals

  Note: This migration ensures proper security controls are in place for user data access
*/

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payoff_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_goals ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Bills policies
CREATE POLICY "Users can manage their own bills" ON public.bills
  FOR ALL USING (auth.uid() = user_id);

-- Credit cards policies
CREATE POLICY "Users can manage their own credit cards" ON public.credit_cards
  FOR ALL USING (auth.uid() = user_id);

-- Payoff plans policies
CREATE POLICY "Users can manage their own payoff plans" ON public.payoff_plans
  FOR ALL USING (auth.uid() = user_id);

-- Spending budgets policies
CREATE POLICY "Users can manage their own spending budgets" ON public.spending_budgets
  FOR ALL USING (auth.uid() = user_id);

-- Purchase goals policies
CREATE POLICY "Users can manage their own purchase goals" ON public.purchase_goals
  FOR ALL USING (auth.uid() = user_id);