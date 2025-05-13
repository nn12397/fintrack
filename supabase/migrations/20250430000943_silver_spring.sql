/*
  # Add User Creation Trigger
  
  1. Changes
    - Create trigger function to handle new user setup
    - Add trigger to auth.users table
    - Create default categories for new users
*/

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert the user record
  INSERT INTO public.users (id)
  VALUES (new.id);

  -- Create user profile
  INSERT INTO public.user_profiles (user_id, income_amount, income_frequency)
  VALUES (new.id, 0, 'monthly');
  
  -- Create default categories
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

  -- Create initial spending budget
  INSERT INTO public.spending_budgets (user_id, amount, frequency, is_auto_calculated)
  VALUES (new.id, 0, 'monthly', true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();