/*
  # Add Recurring Bills Support
  
  1. Changes
    - Add bill_type column to distinguish between one-time and recurring bills
    - Add recurrence_interval column for recurring bills
    - Add start_date and end_date columns for recurring bills
    - Add recurrence_day column for monthly/yearly bills
    - Add recurrence_week_day column for weekly bills
    - Update existing bills to be one-time bills
*/

-- Add new columns to bills table
ALTER TABLE bills
  -- Bill type (one-time or recurring)
  ADD COLUMN bill_type text NOT NULL DEFAULT 'one-time' CHECK (bill_type IN ('one-time', 'recurring')),
  
  -- Recurrence pattern (weekly, monthly, yearly)
  ADD COLUMN recurrence_interval text CHECK (recurrence_interval IN ('weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Start and end dates for recurring bills
  ADD COLUMN start_date date,
  ADD COLUMN end_date date,
  
  -- Day of month (1-31) for monthly/yearly bills
  ADD COLUMN recurrence_day integer CHECK (recurrence_day BETWEEN 1 AND 31),
  
  -- Day of week (0-6, Sunday-Saturday) for weekly bills
  ADD COLUMN recurrence_week_day integer CHECK (recurrence_week_day BETWEEN 0 AND 6);

-- Add constraint to ensure recurring bills have required fields
ALTER TABLE bills
  ADD CONSTRAINT recurring_bills_check CHECK (
    (bill_type = 'recurring' AND recurrence_interval IS NOT NULL AND start_date IS NOT NULL) OR
    (bill_type = 'one-time' AND recurrence_interval IS NULL AND start_date IS NULL AND end_date IS NULL AND recurrence_day IS NULL AND recurrence_week_day IS NULL)
  );

-- Update existing bills to be one-time bills
UPDATE bills SET bill_type = 'one-time';

-- Create function to generate next due date for recurring bills
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  p_start_date date,
  p_recurrence_interval text,
  p_recurrence_day integer,
  p_recurrence_week_day integer
) RETURNS date AS $$
DECLARE
  next_date date;
BEGIN
  CASE p_recurrence_interval
    WHEN 'weekly' THEN
      next_date := p_start_date + (7 * INTERVAL '1 day');
    WHEN 'bi-weekly' THEN
      next_date := p_start_date + (14 * INTERVAL '1 day');
    WHEN 'monthly' THEN
      next_date := date_trunc('month', p_start_date + INTERVAL '1 month')::date + (p_recurrence_day - 1);
    WHEN 'quarterly' THEN
      next_date := date_trunc('month', p_start_date + INTERVAL '3 months')::date + (p_recurrence_day - 1);
    WHEN 'yearly' THEN
      next_date := date_trunc('year', p_start_date + INTERVAL '1 year')::date + (p_recurrence_day - 1);
    ELSE
      next_date := NULL;
  END CASE;
  
  RETURN next_date;
END;
$$ LANGUAGE plpgsql;