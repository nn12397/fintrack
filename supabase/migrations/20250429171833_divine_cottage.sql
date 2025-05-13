/*
  # Add Sample Bills
  
  1. Changes
    - Add 10 more sample bills with various categories and frequencies
    - Bills span across different months to demonstrate recurring patterns
*/

-- Insert sample bills
DO $$ 
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  housing_category_id uuid;
  utilities_category_id uuid;
  food_category_id uuid;
  transportation_category_id uuid;
  insurance_category_id uuid;
  entertainment_category_id uuid;
  credit_card_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO housing_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Housing';

  SELECT id INTO utilities_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Utilities';

  SELECT id INTO food_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Food';

  SELECT id INTO transportation_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Transportation';

  SELECT id INTO insurance_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Insurance';

  SELECT id INTO entertainment_category_id
  FROM categories
  WHERE user_id = test_user_id AND name = 'Entertainment';

  -- Get credit card ID
  SELECT id INTO credit_card_id
  FROM credit_cards
  WHERE user_id = test_user_id
  LIMIT 1;

  -- Insert sample bills
  INSERT INTO bills (
    user_id, name, amount, due_date, category_id,
    frequency, is_autopay, credit_card_id, notes
  ) VALUES 
    (
      test_user_id, 'Rent', 1500, '2025-05-01',
      housing_category_id, 'monthly', true, null,
      'Monthly apartment rent'
    ),
    (
      test_user_id, 'Internet', 75, '2025-05-15',
      utilities_category_id, 'monthly', true, credit_card_id,
      'High-speed internet service'
    ),
    (
      test_user_id, 'Grocery Budget', 400, '2025-05-01',
      food_category_id, 'monthly', false, null,
      'Monthly grocery allowance'
    ),
    (
      test_user_id, 'Car Insurance', 120, '2025-05-20',
      insurance_category_id, 'monthly', true, credit_card_id,
      'Auto insurance premium'
    ),
    (
      test_user_id, 'Gas Bill', 60, '2025-05-18',
      utilities_category_id, 'monthly', false, null,
      'Natural gas service'
    ),
    (
      test_user_id, 'Water Bill', 45, '2025-05-22',
      utilities_category_id, 'quarterly', false, null,
      'Water and sewage service'
    ),
    (
      test_user_id, 'Netflix', 15.99, '2025-05-05',
      entertainment_category_id, 'monthly', true, credit_card_id,
      'Streaming service subscription'
    ),
    (
      test_user_id, 'Car Payment', 350, '2025-05-15',
      transportation_category_id, 'monthly', true, null,
      'Auto loan payment'
    ),
    (
      test_user_id, 'Gym Membership', 50, '2025-05-01',
      entertainment_category_id, 'monthly', true, credit_card_id,
      'Monthly fitness membership'
    ),
    (
      test_user_id, 'Phone Bill', 85, '2025-05-12',
      utilities_category_id, 'monthly', true, credit_card_id,
      'Mobile phone service'
    );
END $$;