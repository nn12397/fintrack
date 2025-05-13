/*
  # Add Paychecks Support
  
  1. Changes
    - Add income_start_date to user_profiles
    - Create paychecks table
    - Add trigger to generate paychecks when user profile is updated
    - Add RLS policies
*/

-- Add income_start_date to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN income_start_date date;

-- Create paychecks table
CREATE TABLE paychecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  frequency text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on paychecks
ALTER TABLE paychecks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for paychecks
CREATE POLICY "Users can manage their own paychecks"
  ON paychecks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER paychecks_updated_at
  BEFORE UPDATE ON paychecks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate paychecks
CREATE OR REPLACE FUNCTION generate_paychecks()
RETURNS TRIGGER AS $$
DECLARE
  payment_date date;
  end_date date;
  next_payment_date date;
BEGIN
  -- Only proceed if income amount and frequency are set
  IF NEW.income_amount <= 0 OR NEW.income_frequency IS NULL OR NEW.income_start_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Delete future paychecks
  DELETE FROM paychecks
  WHERE user_id = NEW.user_id
    AND payment_date > CURRENT_DATE;

  -- Set end date to 12 months from now
  end_date := CURRENT_DATE + INTERVAL '12 months';
  next_payment_date := NEW.income_start_date;

  -- Generate paychecks based on frequency
  WHILE next_payment_date <= end_date LOOP
    CASE NEW.income_frequency
      WHEN 'weekly' THEN
        payment_date := next_payment_date;
        next_payment_date := payment_date + INTERVAL '7 days';

      WHEN 'bi-weekly' THEN
        payment_date := next_payment_date;
        next_payment_date := payment_date + INTERVAL '14 days';

      WHEN 'bi-monthly' THEN
        IF EXTRACT(DAY FROM next_payment_date) < 15 THEN
          payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '14 days';
          next_payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '1 month' - INTERVAL '1 day';
        ELSE
          payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '1 month' - INTERVAL '1 day';
          next_payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '1 month' + INTERVAL '14 days';
        END IF;

      WHEN 'monthly' THEN
        payment_date := next_payment_date;
        next_payment_date := payment_date + INTERVAL '1 month';

      WHEN 'specific-date' THEN
        IF NEW.income_day IS NOT NULL THEN
          payment_date := DATE_TRUNC('month', next_payment_date) + (NEW.income_day - 1) * INTERVAL '1 day';
          next_payment_date := DATE_TRUNC('month', payment_date) + INTERVAL '1 month';
        END IF;
    END CASE;

    -- Insert paycheck if date was calculated
    IF payment_date IS NOT NULL AND payment_date <= end_date THEN
      INSERT INTO paychecks (
        user_id,
        amount,
        payment_date,
        frequency
      ) VALUES (
        NEW.user_id,
        NEW.income_amount,
        payment_date,
        NEW.income_frequency
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for paycheck generation
CREATE TRIGGER generate_paychecks
  AFTER INSERT OR UPDATE OF income_amount, income_frequency, income_day, income_start_date
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_paychecks();