-- Fix currencyCode column issue in financial_accounts table
-- Run this SQL in your Supabase SQL Editor

-- First, check if the currency column exists
DO $$
BEGIN
  -- Check if the currency column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' 
    AND column_name = 'currency'
    AND table_schema = 'public'
  ) THEN
    -- Rename the currency column to currencyCode
    ALTER TABLE financial_accounts 
    RENAME COLUMN currency TO currencyCode;
    
    -- Drop any existing check constraints on the old column name
    ALTER TABLE financial_accounts 
    DROP CONSTRAINT IF EXISTS financial_accounts_currency_check;
    
    -- Add a new check constraint for currencyCode if needed
    -- (The original constraint was just a default value, so we don't need a new constraint)
  END IF;
END $$;

-- Ensure the column has the correct default value
ALTER TABLE financial_accounts 
ALTER COLUMN currencyCode SET DEFAULT 'USD';

-- Add a comment to the column for clarity
COMMENT ON COLUMN financial_accounts.currencyCode IS 'Currency code for the account (e.g., USD, EUR, INR)';

-- Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'financial_accounts' 
AND column_name = 'currencyCode';
