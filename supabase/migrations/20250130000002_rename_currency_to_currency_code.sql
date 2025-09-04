/*
  # Rename currency column to currencyCode in financial_accounts table
  
  The application expects 'currencyCode' but the database has 'currency'.
  This migration renames the column to match the application interface.
*/

-- Rename the currency column to currencyCode
ALTER TABLE financial_accounts 
RENAME COLUMN currency TO currencyCode;

-- Update the check constraint to use the new column name
ALTER TABLE financial_accounts 
DROP CONSTRAINT IF EXISTS financial_accounts_currency_check;

-- Add a new check constraint for currencyCode if needed
-- (The original constraint was just a default value, so we don't need a new constraint)
