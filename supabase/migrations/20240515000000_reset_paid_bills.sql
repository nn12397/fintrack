-- Create a function to reset is_paid status for bills after their due date
CREATE OR REPLACE FUNCTION reset_paid_bills()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bill RECORD;
  v_next_due_date DATE;
BEGIN
  -- Loop through all paid bills
  FOR v_bill IN 
    SELECT * FROM bills 
    WHERE is_paid = true
  LOOP
    -- Calculate next due date based on bill type
    IF v_bill.bill_type = 'one-time' THEN
      -- For one-time bills, just use the due_date
      v_next_due_date := v_bill.due_date;
    ELSE
      -- For recurring bills, calculate next due date based on recurrence pattern
      CASE v_bill.recurrence_interval
        WHEN 'weekly' THEN
          -- Next week's same day
          v_next_due_date := v_bill.due_date + INTERVAL '1 week';
        
        WHEN 'bi-weekly' THEN
          -- Two weeks from the due date
          v_next_due_date := v_bill.due_date + INTERVAL '2 weeks';
        
        WHEN 'monthly' THEN
          -- Next month's same day
          v_next_due_date := v_bill.due_date + INTERVAL '1 month';
        
        WHEN 'quarterly' THEN
          -- Three months from the due date
          v_next_due_date := v_bill.due_date + INTERVAL '3 months';
        
        WHEN 'yearly' THEN
          -- One year from the due date
          v_next_due_date := v_bill.due_date + INTERVAL '1 year';
        
        ELSE
          -- Default to monthly if interval is not recognized
          v_next_due_date := v_bill.due_date + INTERVAL '1 month';
      END CASE;
    END IF;

    -- Reset is_paid if the next due date is in the past
    IF v_next_due_date < CURRENT_DATE THEN
      UPDATE bills
      SET is_paid = false
      WHERE id = v_bill.id;
    END IF;
  END LOOP;
END;
$$;

-- Create a cron job to run this function daily at midnight
SELECT cron.schedule(
  'reset-paid-bills',  -- job name
  '0 0 * * *',        -- cron schedule (every day at midnight)
  $$SELECT reset_paid_bills()$$
); 