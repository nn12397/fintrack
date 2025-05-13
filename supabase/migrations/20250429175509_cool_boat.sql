/*
  # Update Sample Bills Data
  
  1. Changes
    - Clear existing bills
    - Add sample recurring bills with various frequencies
    - Add sample one-time bills
    - Set appropriate recurrence patterns
*/

-- First, clear existing bills
DELETE FROM bills WHERE user_id = '00000000-0000-0000-0000-000000000000';

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

  -- Insert recurring bills
  INSERT INTO bills (
    user_id, name, amount, due_date, category_id,
    bill_type, recurrence_interval, start_date, recurrence_day,
    recurrence_week_day, is_autopay, credit_card_id, notes
  ) VALUES 
    -- Monthly bills on specific days
    (
      test_user_id, 'Rent', 1500, '2025-05-01',
      housing_category_id, 'recurring', 'monthly', '2025-05-01', 1,
      NULL, true, null, 'Monthly apartment rent'
    ),
    (
      test_user_id, 'Car Payment', 350, '2025-05-15',
      transportation_category_id, 'recurring', 'monthly', '2025-05-15', 15,
      NULL, true, null, 'Auto loan payment'
    ),
    (
      test_user_id, 'Internet', 75, '2025-05-10',
      utilities_category_id, 'recurring', 'monthly', '2025-05-10', 10,
      NULL, true, credit_card_id, 'High-speed internet service'
    ),
    -- Weekly bills on specific weekdays
    (
      test_user_id, 'Grocery Shopping', 100, '2025-05-01',
      food_category_id, 'recurring', 'weekly', '2025-05-01', NULL, 
      6, false, credit_card_id, 'Weekly grocery budget'
    ),
    -- Bi-weekly bills
    (
      test_user_id, 'Gym Membership', 25, '2025-05-01',
      entertainment_category_id, 'recurring', 'bi-weekly', '2025-05-01', NULL,
      1, true, credit_card_id, 'Bi-weekly fitness membership'
    ),
    -- Quarterly bills
    (
      test_user_id, 'Water Bill', 120, '2025-05-15',
      utilities_category_id, 'recurring', 'quarterly', '2025-05-15', 15,
      NULL, false, null, 'Quarterly water and sewage service'
    ),
    -- Yearly bills
    (
      test_user_id, 'Car Insurance', 1200, '2025-05-20',
      insurance_category_id, 'recurring', 'yearly', '2025-05-20', 20,
      NULL, true, credit_card_id, 'Annual car insurance premium'
    );

  -- Insert one-time bills
  INSERT INTO bills (
    user_id, name, amount, due_date, category_id,
    bill_type, is_autopay, credit_card_id, notes
  ) VALUES 
    (
      test_user_id, 'Car Maintenance', 250, '2025-05-25',
      transportation_category_id, 'one-time', false, credit_card_id,
      'Spring car maintenance service'
    ),
    (
      test_user_id, 'Home Repairs', 400, '2025-06-10',
      housing_category_id, 'one-time', false, null,
      'Fix bathroom leak'
    );

END $$;