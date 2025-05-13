-- Update bi-monthly text in user interface
UPDATE user_profiles 
SET income_day = NULL 
WHERE income_frequency = 'bi-monthly';

-- Add comment to explain bi-monthly dates
COMMENT ON COLUMN user_profiles.income_frequency IS 'For bi-monthly frequency, payments occur on the 15th and last day of each month';