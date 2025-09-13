-- Enhance transaction multi-currency support
-- Update the safe_insert_transaction_with_conversion function to handle all 5 currency cases

-- Drop and recreate the function with enhanced multi-currency support
DROP FUNCTION IF EXISTS safe_insert_transaction_with_conversion;

CREATE OR REPLACE FUNCTION safe_insert_transaction_with_conversion(
  p_user_id UUID,
  p_type TEXT,
  p_amount NUMERIC,
  p_category TEXT,
  p_description TEXT,
  p_date DATE,
  p_account_id UUID,
  p_currency_code TEXT,
  p_affects_balance BOOLEAN DEFAULT TRUE,
  p_reason TEXT DEFAULT NULL,
  p_transfer_to_account_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'completed',
  p_goal_id UUID DEFAULT NULL,
  p_bill_id UUID DEFAULT NULL,
  p_liability_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  -- Multi-currency fields
  p_native_amount NUMERIC DEFAULT NULL,
  p_native_currency TEXT DEFAULT NULL,
  p_native_symbol TEXT DEFAULT NULL,
  p_converted_amount NUMERIC DEFAULT NULL,
  p_converted_currency TEXT DEFAULT NULL,
  p_converted_symbol TEXT DEFAULT NULL,
  p_exchange_rate NUMERIC DEFAULT 1.0,
  p_exchange_rate_used NUMERIC DEFAULT 1.0
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_primary_currency TEXT;
  v_account_currency TEXT;
  v_account_symbol TEXT;
  v_primary_symbol TEXT;
BEGIN
  -- Get primary currency from user profile
  SELECT p.primary_currency INTO v_primary_currency
  FROM profiles p
  WHERE p.id = p_user_id;
  
  -- Get account currency
  SELECT fa.currencycode, fa.currency_symbol INTO v_account_currency, v_account_symbol
  FROM financial_accounts fa
  WHERE fa.id = p_account_id;
  
  -- Get primary currency symbol
  SELECT symbol INTO v_primary_symbol
  FROM supported_currencies
  WHERE code = v_primary_currency;
  
  -- Set defaults for multi-currency fields if not provided
  p_native_amount := COALESCE(p_native_amount, p_amount);
  p_native_currency := COALESCE(p_native_currency, v_account_currency);
  p_native_symbol := COALESCE(p_native_symbol, v_account_symbol);
  p_converted_amount := COALESCE(p_converted_amount, p_amount);
  p_converted_currency := COALESCE(p_converted_currency, v_account_currency);
  p_converted_symbol := COALESCE(p_converted_symbol, v_account_symbol);
  
  -- Insert transaction with multi-currency data
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    category,
    description,
    date,
    account_id,
    affects_balance,
    reason,
    transfer_to_account_id,
    status,
    goal_id,
    bill_id,
    liability_id,
    notes,
    currency_code,
    -- Multi-currency fields
    native_amount,
    native_currency,
    native_symbol,
    converted_amount,
    converted_currency,
    converted_symbol,
    exchange_rate,
    exchange_rate_used,
    conversion_source
  ) VALUES (
    p_user_id,
    p_type,
    p_converted_amount, -- Use converted amount for account balance
    p_category,
    p_description,
    p_date,
    p_account_id,
    p_affects_balance,
    p_reason,
    p_transfer_to_account_id,
    p_status,
    p_goal_id,
    p_bill_id,
    p_liability_id,
    p_notes,
    v_primary_currency, -- Use primary currency for totals
    -- Multi-currency fields
    p_native_amount,
    p_native_currency,
    p_native_symbol,
    p_converted_amount,
    p_converted_currency,
    p_converted_symbol,
    p_exchange_rate,
    p_exchange_rate_used,
    'api'
  ) RETURNING id INTO v_transaction_id;
  
  -- Update account balance if transaction affects balance
  IF p_affects_balance THEN
    -- Update account balance using converted amount
    UPDATE financial_accounts
    SET 
      balance = CASE 
        WHEN p_type = 'income' THEN balance + p_converted_amount
        WHEN p_type = 'expense' THEN balance - p_converted_amount
        ELSE balance
      END,
      -- Update dual currency amounts
      native_amount = CASE 
        WHEN p_type = 'income' THEN COALESCE(native_amount, balance) + p_native_amount
        WHEN p_type = 'expense' THEN COALESCE(native_amount, balance) - p_native_amount
        ELSE COALESCE(native_amount, balance)
      END,
      converted_amount = CASE 
        WHEN p_type = 'income' THEN COALESCE(converted_amount, balance) + p_converted_amount
        WHEN p_type = 'expense' THEN COALESCE(converted_amount, balance) - p_converted_amount
        ELSE COALESCE(converted_amount, balance)
      END,
      last_conversion_date = NOW()
    WHERE id = p_account_id;
  END IF;
  
  RETURN v_transaction_id;
END;
$$;
