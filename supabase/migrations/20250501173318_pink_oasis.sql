/*
  # Fix Credit Card Payment Generation
  
  1. Changes
    - Create function to generate credit card payments when credit card is updated
    - Generate payments for the next 12 months based on payment schedule
    - Handle all payment frequencies (weekly, bi-weekly, bi-monthly, monthly)
    - Update existing payments if schedule changes
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS generate_credit_card_payments ON credit_cards;
DROP FUNCTION IF EXISTS generate_credit_card_payments();

-- Create improved payment generation function
CREATE OR REPLACE FUNCTION generate_credit_card_payments()
RETURNS TRIGGER AS $$
DECLARE
  payment_date date;
  end_date date;
  next_payment_date date;
BEGIN
  -- Only proceed if payment schedule is configured
  IF NEW.payment_amount <= 0 OR NEW.payment_frequency IS NULL THEN
    RETURN NEW;
  END IF;

  -- Delete existing future payments
  DELETE FROM credit_card_payments
  WHERE credit_card_id = NEW.id
    AND payment_date > CURRENT_DATE
    AND payment_type = 'recurring';

  -- Set end date to 12 months from now
  end_date := CURRENT_DATE + INTERVAL '12 months';
  
  -- Set initial payment date based on start date or current date
  next_payment_date := CASE
    WHEN NEW.payment_start_date > CURRENT_DATE THEN NEW.payment_start_date
    ELSE CURRENT_DATE
  END;

  -- Generate payments based on frequency
  WHILE next_payment_date <= end_date LOOP
    -- Calculate payment date based on frequency
    CASE NEW.payment_frequency
      WHEN 'weekly' THEN
        IF NEW.payment_week_day IS NOT NULL THEN
          -- Adjust to next occurrence of the specified weekday
          payment_date := next_payment_date + 
            ((NEW.payment_week_day - EXTRACT(DOW FROM next_payment_date) + 7) % 7) * 
            INTERVAL '1 day';
          next_payment_date := payment_date + INTERVAL '7 days';
        END IF;

      WHEN 'bi-weekly' THEN
        IF NEW.payment_week_day IS NOT NULL THEN
          -- Adjust to next occurrence of the specified weekday
          payment_date := next_payment_date + 
            ((NEW.payment_week_day - EXTRACT(DOW FROM next_payment_date) + 7) % 7) * 
            INTERVAL '1 day';
          next_payment_date := payment_date + INTERVAL '14 days';
        END IF;

      WHEN 'bi-monthly' THEN
        -- Payments on 15th and last day of month
        IF EXTRACT(DAY FROM next_payment_date) < 15 THEN
          payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '14 days';
          next_payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '1 month' - INTERVAL '1 day';
        ELSE
          payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '1 month' - INTERVAL '1 day';
          next_payment_date := DATE_TRUNC('month', next_payment_date) + INTERVAL '1 month' + INTERVAL '14 days';
        END IF;

      WHEN 'monthly' THEN
        IF NEW.payment_day IS NOT NULL THEN
          -- Set to specified day of month
          payment_date := DATE_TRUNC('month', next_payment_date) + (NEW.payment_day - 1) * INTERVAL '1 day';
          -- If we're past this month's date, move to next month
          IF payment_date < next_payment_date THEN
            payment_date := payment_date + INTERVAL '1 month';
          END IF;
          next_payment_date := DATE_TRUNC('month', payment_date) + INTERVAL '1 month';
        END IF;
    END CASE;

    -- Insert payment if date was calculated
    IF payment_date IS NOT NULL AND payment_date <= end_date THEN
      INSERT INTO credit_card_payments (
        credit_card_id,
        user_id,
        amount,
        payment_date,
        payment_type,
        previous_balance,
        new_balance,
        recurrence_interval,
        start_date,
        end_date,
        recurrence_day,
        recurrence_week_day
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.payment_amount,
        payment_date,
        'recurring',
        NEW.current_balance,
        GREATEST(0, NEW.current_balance - NEW.payment_amount),
        NEW.payment_frequency,
        NEW.payment_start_date,
        NEW.payment_end_date,
        NEW.payment_day,
        NEW.payment_week_day
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on credit_cards table
CREATE TRIGGER generate_credit_card_payments
  AFTER INSERT OR UPDATE OF payment_amount, payment_frequency, payment_day, payment_week_day
  ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION generate_credit_card_payments();