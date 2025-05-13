/*
  # Add Payment Schedule to Credit Cards
  
  1. Changes
    - Add payment_amount field
    - Add payment frequency options (weekly, bi-weekly, bi-monthly, monthly)
    - Add payment day/week day fields for scheduling
    - Add payment start/end dates
    - Add constraints for payment scheduling rules
    
  2. Security
    - No changes to RLS policies
*/

-- First add columns without constraints
ALTER TABLE credit_cards
  ADD COLUMN payment_amount numeric,
  ADD COLUMN payment_frequency text,
  ADD COLUMN payment_day integer,
  ADD COLUMN payment_week_day integer,
  ADD COLUMN payment_start_date date,
  ADD COLUMN payment_end_date date;

-- Update existing records with default values
UPDATE credit_cards 
SET 
  payment_amount = minimum_payment,
  payment_frequency = 'monthly',
  payment_day = EXTRACT(DAY FROM due_date),
  payment_start_date = CURRENT_DATE;

-- Now add NOT NULL constraints and defaults
ALTER TABLE credit_cards
  ALTER COLUMN payment_amount SET NOT NULL,
  ALTER COLUMN payment_amount SET DEFAULT 0,
  ALTER COLUMN payment_frequency SET NOT NULL,
  ALTER COLUMN payment_frequency SET DEFAULT 'monthly';

-- Add check constraints
ALTER TABLE credit_cards
  ADD CONSTRAINT payment_frequency_check 
    CHECK (payment_frequency IN ('weekly', 'bi-weekly', 'bi-monthly', 'monthly')),
  ADD CONSTRAINT payment_day_check 
    CHECK (payment_day BETWEEN 1 AND 31),
  ADD CONSTRAINT payment_week_day_check 
    CHECK (payment_week_day BETWEEN 0 AND 6),
  ADD CONSTRAINT payment_schedule_check CHECK (
    -- Monthly payments require payment_day
    (payment_frequency = 'monthly' AND payment_day IS NOT NULL AND payment_week_day IS NULL) OR
    -- Weekly/Bi-weekly payments require payment_week_day
    (payment_frequency IN ('weekly', 'bi-weekly') AND payment_week_day IS NOT NULL AND payment_day IS NULL) OR
    -- Bi-monthly payments don't require either (uses 15th and last day)
    (payment_frequency = 'bi-monthly' AND payment_day IS NULL AND payment_week_day IS NULL)
  ),
  ADD CONSTRAINT minimum_payment_check CHECK (
    payment_amount >= minimum_payment
  );