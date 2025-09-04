/*
  # Fix currencyCode column in financial_accounts table
  
  The application expects 'currencyCode' but the database schema shows 'currency'.
  This migration ensures the column is properly renamed and the types are updated.
*/

-- First, check if the column exists as 'currency' and rename it to 'currencyCode'
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
