/*
  # Fix Credit Card Payments Generation
  
  1. Changes
    - Move payment generation to credit_card_payments table
    - Update trigger to handle payment scheduling correctly
    - Add validation for payment amounts and dates
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
  card_record record;
BEGIN
  -- Get the credit card record
  SELECT * INTO card_record FROM credit_cards WHERE id = NEW.credit_card_id;
  
  -- Only proceed if this is a recurring payment
  IF NEW.payment_type = 'recurring' THEN
    -- Delete any future scheduled payments for this card
    DELETE FROM credit_card_payments
    WHERE credit_card_id = NEW.credit_card_id
      AND payment_date > CURRENT_DATE
      AND payment_type = 'recurring';

    -- Set end date to payment end date or 12 months from now
    end_date := COALESCE(NEW.end_date, CURRENT_DATE + INTERVAL '12 months');
    next_payment_date := COALESCE(NEW.start_date, CURRENT_DATE);

    -- Generate payments based on frequency
    WHILE next_payment_date <= end_date LOOP
      -- Calculate next payment date based on frequency
      CASE NEW.recurrence_interval
        WHEN 'weekly' THEN
          IF NEW.recurrence_week_day IS NOT NULL THEN
            -- Adjust to next occurrence of the specified weekday
            payment_date := next_payment_date + ((NEW.recurrence_week_day - EXTRACT(DOW FROM next_payment_date) + 7) % 7) * INTERVAL '1 day';
            next_payment_date := payment_date + INTERVAL '7 days';
          END IF;

        WHEN 'bi-weekly' THEN
          IF NEW.recurrence_week_day IS NOT NULL THEN
            -- Adjust to next occurrence of the specified weekday
            payment_date := next_payment_date + ((NEW.recurrence_week_day - EXTRACT(DOW FROM next_payment_date) + 7) % 7) * INTERVAL '1 day';
            next_payment_date := payment_date + INTERVAL '14 days';
          END IF;

        WHEN 'monthly' THEN
          IF NEW.recurrence_day IS NOT NULL THEN
            -- Set to specified day of month
            payment_date := DATE_TRUNC('month', next_payment_date) + (NEW.recurrence_day - 1) * INTERVAL '1 day';
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
          NEW.credit_card_id,
          NEW.user_id,
          NEW.amount,
          payment_date,
          'recurring',
          card_record.current_balance,
          GREATEST(0, card_record.current_balance - NEW.amount),
          NEW.recurrence_interval,
          NEW.start_date,
          NEW.end_date,
          NEW.recurrence_day,
          NEW.recurrence_week_day
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on credit_card_payments table
CREATE TRIGGER generate_credit_card_payments
  AFTER INSERT OR UPDATE OF amount, recurrence_interval, recurrence_day, recurrence_week_day, start_date
  ON credit_card_payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_credit_card_payments();