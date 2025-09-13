/*
  # Enhanced Dual Currency Support Migration
  
  This migration enhances the financial_accounts table to support:
  1. Native currency amounts and symbols
  2. Converted currency amounts and symbols  
  3. Exchange rates and conversion metadata
  4. Proper dual currency storage for all accounts
*/

-- Add dual currency columns to financial_accounts table
ALTER TABLE financial_accounts 
ADD COLUMN IF NOT EXISTS native_amount numeric(15,2),
ADD COLUMN IF NOT EXISTS native_currency text,
ADD COLUMN IF NOT EXISTS native_symbol text,
ADD COLUMN IF NOT EXISTS converted_amount numeric(15,2),
ADD COLUMN IF NOT EXISTS converted_currency text,
ADD COLUMN IF NOT EXISTS converted_symbol text,
ADD COLUMN IF NOT EXISTS exchange_rate numeric(10,4) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS conversion_metadata jsonb,
ADD COLUMN IF NOT EXISTS rate_source text CHECK (rate_source IN ('api', 'cached', 'fallback')) DEFAULT 'fallback',
ADD COLUMN IF NOT EXISTS last_conversion_date timestamptz;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_accounts_native_currency ON financial_accounts(native_currency);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_converted_currency ON financial_accounts(converted_currency);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_rate_source ON financial_accounts(rate_source);

-- Update existing records to populate dual currency data
-- This will set native amounts equal to current balance for existing accounts
UPDATE financial_accounts 
SET 
  native_amount = balance,
  native_currency = currency,
  native_symbol = CASE 
    WHEN currency = 'USD' THEN '$'
    WHEN currency = 'EUR' THEN '€'
    WHEN currency = 'GBP' THEN '£'
    WHEN currency = 'INR' THEN '₹'
    WHEN currency = 'JPY' THEN '¥'
    WHEN currency = 'CNY' THEN '¥'
    WHEN currency = 'AUD' THEN 'A$'
    WHEN currency = 'CAD' THEN 'C$'
    WHEN currency = 'SGD' THEN 'S$'
    WHEN currency = 'HKD' THEN 'HK$'
    WHEN currency = 'KRW' THEN '₩'
    WHEN currency = 'AED' THEN 'د.إ'
    WHEN currency = 'NZD' THEN 'NZ$'
    WHEN currency = 'CHF' THEN 'CHF'
    WHEN currency = 'BRL' THEN 'R$'
    WHEN currency = 'RUB' THEN '₽'
    WHEN currency = 'MYR' THEN 'RM'
    WHEN currency = 'THB' THEN '฿'
    WHEN currency = 'VND' THEN '₫'
    WHEN currency = 'IDR' THEN 'Rp'
    WHEN currency = 'NPR' THEN '₨'
    ELSE currency
  END,
  converted_amount = balance,
  converted_currency = currency,
  converted_symbol = CASE 
    WHEN currency = 'USD' THEN '$'
    WHEN currency = 'EUR' THEN '€'
    WHEN currency = 'GBP' THEN '£'
    WHEN currency = 'INR' THEN '₹'
    WHEN currency = 'JPY' THEN '¥'
    WHEN currency = 'CNY' THEN '¥'
    WHEN currency = 'AUD' THEN 'A$'
    WHEN currency = 'CAD' THEN 'C$'
    WHEN currency = 'SGD' THEN 'S$'
    WHEN currency = 'HKD' THEN 'HK$'
    WHEN currency = 'KRW' THEN '₩'
    WHEN currency = 'AED' THEN 'د.إ'
    WHEN currency = 'NZD' THEN 'NZ$'
    WHEN currency = 'CHF' THEN 'CHF'
    WHEN currency = 'BRL' THEN 'R$'
    WHEN currency = 'RUB' THEN '₽'
    WHEN currency = 'MYR' THEN 'RM'
    WHEN currency = 'THB' THEN '฿'
    WHEN currency = 'VND' THEN '₫'
    WHEN currency = 'IDR' THEN 'Rp'
    WHEN currency = 'NPR' THEN '₨'
    ELSE currency
  END,
  exchange_rate = 1.0,
  conversion_metadata = jsonb_build_object(
    'needs_conversion', false,
    'last_updated', now(),
    'source', 'migration'
  ),
  rate_source = 'fallback',
  last_conversion_date = now()
WHERE native_amount IS NULL;

-- Create function to update account balances with currency conversion
CREATE OR REPLACE FUNCTION update_account_balance_with_conversion()
RETURNS TRIGGER AS $$
DECLARE
  user_primary_currency text;
  conversion_data jsonb;
BEGIN
  -- Get user's primary currency
  SELECT primary_currency INTO user_primary_currency
  FROM profiles 
  WHERE user_id = NEW.user_id;
  
  -- If no primary currency found, use USD as default
  user_primary_currency := COALESCE(user_primary_currency, 'USD');
  
  -- Update the balance to use converted_amount as the main balance
  -- This ensures all calculations use the primary currency
  NEW.balance := NEW.converted_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balance with conversion
DROP TRIGGER IF EXISTS update_account_balance_conversion_trigger ON financial_accounts;
CREATE TRIGGER update_account_balance_conversion_trigger
  BEFORE INSERT OR UPDATE ON financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_with_conversion();

-- Create function to get account display data
CREATE OR REPLACE FUNCTION get_account_display_data(account_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  native_amount numeric,
  native_currency text,
  native_symbol text,
  converted_amount numeric,
  converted_currency text,
  converted_symbol text,
  exchange_rate numeric,
  needs_conversion boolean,
  rate_source text,
  last_conversion_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id,
    fa.name,
    fa.type,
    fa.native_amount,
    fa.native_currency,
    fa.native_symbol,
    fa.converted_amount,
    fa.converted_currency,
    fa.converted_symbol,
    fa.exchange_rate,
    (fa.native_currency != fa.converted_currency) as needs_conversion,
    fa.rate_source,
    fa.last_conversion_date
  FROM financial_accounts fa
  WHERE fa.id = account_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN financial_accounts.native_amount IS 'Original amount in the account currency';
COMMENT ON COLUMN financial_accounts.native_currency IS 'Original currency code of the account';
COMMENT ON COLUMN financial_accounts.native_symbol IS 'Currency symbol for native currency';
COMMENT ON COLUMN financial_accounts.converted_amount IS 'Amount converted to user primary currency';
COMMENT ON COLUMN financial_accounts.converted_currency IS 'User primary currency code';
COMMENT ON COLUMN financial_accounts.converted_symbol IS 'Currency symbol for converted currency';
COMMENT ON COLUMN financial_accounts.exchange_rate IS 'Exchange rate used for conversion (native to converted)';
COMMENT ON COLUMN financial_accounts.conversion_metadata IS 'Additional conversion metadata (JSON)';
COMMENT ON COLUMN financial_accounts.rate_source IS 'Source of exchange rate (api, cached, fallback)';
COMMENT ON COLUMN financial_accounts.last_conversion_date IS 'When the conversion was last performed';
