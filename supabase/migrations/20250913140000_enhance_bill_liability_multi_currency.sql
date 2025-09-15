-- Enhanced multi-currency support for bills and liabilities
-- This migration adds multi-currency fields and functions for bills and liabilities

-- Add multi-currency fields to bills table
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS original_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS conversion_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE;

-- Add multi-currency fields to credit_card_bill_cycles table
ALTER TABLE credit_card_bill_cycles 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS original_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS conversion_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE;

-- Add multi-currency fields to credit_card_bill_payments table
ALTER TABLE credit_card_bill_payments 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS original_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS conversion_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE;

-- Add multi-currency fields to bill_instances table
ALTER TABLE bill_instances 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS original_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS conversion_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE;

-- Create function to safely add bills with multi-currency support
CREATE OR REPLACE FUNCTION safe_add_bill_with_conversion(
  p_user_id UUID,
  p_title TEXT,
  p_category TEXT,
  p_bill_type TEXT,
  p_amount NUMERIC(15,2),
  p_frequency TEXT,
  p_due_date DATE,
  p_next_due_date DATE,
  p_currency_code TEXT,
  p_default_account_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_estimated_amount NUMERIC(15,2) DEFAULT NULL,
  p_custom_frequency_days INTEGER DEFAULT NULL,
  p_last_paid_date DATE DEFAULT NULL,
  p_auto_pay BOOLEAN DEFAULT FALSE,
  p_linked_liability_id UUID DEFAULT NULL,
  p_is_emi BOOLEAN DEFAULT FALSE,
  p_is_essential BOOLEAN DEFAULT FALSE,
  p_reminder_days_before INTEGER DEFAULT 3,
  p_send_due_date_reminder BOOLEAN DEFAULT FALSE,
  p_send_overdue_reminder BOOLEAN DEFAULT FALSE,
  -- Multi-currency fields
  p_original_amount NUMERIC(15,2) DEFAULT NULL,
  p_original_currency TEXT DEFAULT NULL,
  p_exchange_rate NUMERIC(10,6) DEFAULT 1.0,
  p_exchange_rate_used NUMERIC(10,6) DEFAULT 1.0,
  p_conversion_source TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_bill_id UUID;
  v_primary_currency TEXT;
  v_account_currency TEXT;
  v_account_symbol TEXT;
  v_converted_amount NUMERIC(15,2);
  v_native_amount NUMERIC(15,2);
  v_exchange_rate NUMERIC(10,6);
BEGIN
  -- Get user's primary currency
  SELECT currency INTO v_primary_currency
  FROM profiles 
  WHERE id = p_user_id;
  
  IF v_primary_currency IS NULL THEN
    v_primary_currency := 'USD';
  END IF;

  -- Get account currency if default account is provided
  IF p_default_account_id IS NOT NULL THEN
    SELECT fa.currencycode, sc.symbol INTO v_account_currency, v_account_symbol
    FROM financial_accounts fa
    LEFT JOIN supported_currencies sc ON fa.currencycode = sc.code
    WHERE fa.id = p_default_account_id;
  ELSE
    v_account_currency := v_primary_currency;
    v_account_symbol := '$';
  END IF;

  -- Set default values for multi-currency fields
  v_converted_amount := p_amount;
  v_native_amount := COALESCE(p_original_amount, p_amount);
  v_exchange_rate := COALESCE(p_exchange_rate, 1.0);

  -- Insert the bill with multi-currency support
  INSERT INTO bills (
    user_id,
    title,
    category,
    bill_type,
    amount,
    frequency,
    due_date,
    next_due_date,
    currency_code,
    default_account_id,
    description,
    estimated_amount,
    custom_frequency_days,
    last_paid_date,
    auto_pay,
    linked_liability_id,
    is_emi,
    is_essential,
    reminder_days_before,
    send_due_date_reminder,
    send_overdue_reminder,
    status,
    is_active,
    is_recurring,
    activity_scope,
    target_category,
    linked_accounts_count,
    priority,
    -- Multi-currency fields
    original_amount,
    original_currency,
    exchange_rate,
    exchange_rate_used,
    conversion_source,
    last_conversion_date
  ) VALUES (
    p_user_id,
    p_title,
    p_category,
    p_bill_type,
    v_converted_amount,
    p_frequency,
    p_due_date,
    p_next_due_date,
    v_primary_currency,
    p_default_account_id,
    p_description,
    p_estimated_amount,
    p_custom_frequency_days,
    p_last_paid_date,
    p_auto_pay,
    p_linked_liability_id,
    p_is_emi,
    p_is_essential,
    p_reminder_days_before,
    p_send_due_date_reminder,
    p_send_overdue_reminder,
    'active',
    true,
    true,
    'general',
    'bills',
    0,
    'medium',
    -- Multi-currency fields
    v_native_amount,
    COALESCE(p_original_currency, v_account_currency),
    v_exchange_rate,
    v_exchange_rate,
    p_conversion_source,
    NOW()
  ) RETURNING id INTO v_bill_id;

  RETURN v_bill_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to process bill payment with multi-currency support
CREATE OR REPLACE FUNCTION process_bill_payment_with_conversion(
  p_bill_id UUID,
  p_payment_amount NUMERIC(15,2),
  p_account_id UUID,
  p_payment_type TEXT DEFAULT 'manual',
  p_payment_method TEXT DEFAULT 'bank_transfer',
  p_description TEXT DEFAULT NULL,
  -- Multi-currency fields
  p_original_amount NUMERIC(15,2) DEFAULT NULL,
  p_original_currency TEXT DEFAULT NULL,
  p_exchange_rate NUMERIC(10,6) DEFAULT 1.0,
  p_conversion_source TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_bill_record RECORD;
  v_account_record RECORD;
  v_converted_amount NUMERIC(15,2);
  v_native_amount NUMERIC(15,2);
  v_exchange_rate NUMERIC(10,6);
  v_primary_currency TEXT;
BEGIN
  -- Get bill information
  SELECT * INTO v_bill_record
  FROM bills
  WHERE id = p_bill_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found';
  END IF;

  -- Get account information
  SELECT * INTO v_account_record
  FROM financial_accounts
  WHERE id = p_account_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- Get user's primary currency
  SELECT currency INTO v_primary_currency
  FROM profiles 
  WHERE id = v_bill_record.user_id;
  
  IF v_primary_currency IS NULL THEN
    v_primary_currency := 'USD';
  END IF;

  -- Set default values for multi-currency fields
  v_converted_amount := p_payment_amount;
  v_native_amount := COALESCE(p_original_amount, p_payment_amount);
  v_exchange_rate := COALESCE(p_exchange_rate, 1.0);

  -- Create transaction with multi-currency support
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    category,
    description,
    date,
    account_id,
    affects_balance,
    status,
    bill_id,
    -- Multi-currency fields
    native_amount,
    native_currency,
    converted_amount,
    converted_currency,
    exchange_rate,
    exchange_rate_used,
    conversion_source,
    last_conversion_date
  ) VALUES (
    v_bill_record.user_id,
    'expense',
    v_converted_amount,
    v_bill_record.category,
    COALESCE(p_description, 'Bill Payment: ' || v_bill_record.title),
    NOW(),
    p_account_id,
    true,
    'completed',
    p_bill_id,
    -- Multi-currency fields
    v_native_amount,
    COALESCE(p_original_currency, v_account_record.currencycode),
    v_converted_amount,
    v_primary_currency,
    v_exchange_rate,
    v_exchange_rate,
    p_conversion_source,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Update account balance
  UPDATE financial_accounts
  SET 
    balance = balance - v_converted_amount,
    native_amount = COALESCE(native_amount, 0) - v_native_amount,
    converted_amount = COALESCE(converted_amount, 0) - v_converted_amount,
    last_conversion_date = NOW()
  WHERE id = p_account_id;

  -- Create bill instance record
  INSERT INTO bill_instances (
    bill_id,
    user_id,
    due_date,
    amount,
    actual_amount,
    status,
    payment_method,
    paid_date,
    paid_from_account_id,
    -- Multi-currency fields
    original_amount,
    original_currency,
    exchange_rate,
    exchange_rate_used,
    conversion_source,
    last_conversion_date
  ) VALUES (
    p_bill_id,
    v_bill_record.user_id,
    v_bill_record.due_date,
    v_bill_record.amount,
    v_converted_amount,
    'paid',
    p_payment_method,
    NOW(),
    p_account_id,
    -- Multi-currency fields
    v_native_amount,
    COALESCE(p_original_currency, v_account_record.currencycode),
    v_exchange_rate,
    v_exchange_rate,
    p_conversion_source,
    NOW()
  );

  -- Update bill status
  UPDATE bills
  SET 
    last_paid_date = NOW(),
    status = CASE 
      WHEN amount <= v_converted_amount THEN 'paid'
      ELSE 'active'
    END,
    updated_at = NOW()
  WHERE id = p_bill_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to process liability payment with multi-currency support
CREATE OR REPLACE FUNCTION process_liability_payment_with_conversion(
  p_liability_id UUID,
  p_payment_amount NUMERIC(15,2),
  p_account_id UUID,
  p_payment_type TEXT DEFAULT 'manual',
  p_payment_method TEXT DEFAULT 'bank_transfer',
  p_description TEXT DEFAULT NULL,
  -- Multi-currency fields
  p_original_amount NUMERIC(15,2) DEFAULT NULL,
  p_original_currency TEXT DEFAULT NULL,
  p_exchange_rate NUMERIC(10,6) DEFAULT 1.0,
  p_conversion_source TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_liability_record RECORD;
  v_account_record RECORD;
  v_converted_amount NUMERIC(15,2);
  v_native_amount NUMERIC(15,2);
  v_exchange_rate NUMERIC(10,6);
  v_primary_currency TEXT;
  v_new_remaining_amount NUMERIC(15,2);
BEGIN
  -- Get liability information
  SELECT * INTO v_liability_record
  FROM liabilities
  WHERE id = p_liability_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Liability not found';
  END IF;

  -- Get account information
  SELECT * INTO v_account_record
  FROM financial_accounts
  WHERE id = p_account_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- Get user's primary currency
  SELECT currency INTO v_primary_currency
  FROM profiles 
  WHERE id = v_liability_record.user_id;
  
  IF v_primary_currency IS NULL THEN
    v_primary_currency := 'USD';
  END IF;

  -- Set default values for multi-currency fields
  v_converted_amount := p_payment_amount;
  v_native_amount := COALESCE(p_original_amount, p_payment_amount);
  v_exchange_rate := COALESCE(p_exchange_rate, 1.0);

  -- Create transaction with multi-currency support
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    category,
    description,
    date,
    account_id,
    affects_balance,
    status,
    liability_id,
    -- Multi-currency fields
    native_amount,
    native_currency,
    converted_amount,
    converted_currency,
    exchange_rate,
    exchange_rate_used,
    conversion_source,
    last_conversion_date
  ) VALUES (
    v_liability_record.user_id,
    'expense',
    v_converted_amount,
    'Liability Payment',
    COALESCE(p_description, 'Payment: ' || v_liability_record.name),
    NOW(),
    p_account_id,
    true,
    'completed',
    p_liability_id,
    -- Multi-currency fields
    v_native_amount,
    COALESCE(p_original_currency, v_account_record.currencycode),
    v_converted_amount,
    v_primary_currency,
    v_exchange_rate,
    v_exchange_rate,
    p_conversion_source,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Update account balance
  UPDATE financial_accounts
  SET 
    balance = balance - v_converted_amount,
    native_amount = COALESCE(native_amount, 0) - v_native_amount,
    converted_amount = COALESCE(converted_amount, 0) - v_converted_amount,
    last_conversion_date = NOW()
  WHERE id = p_account_id;

  -- Update liability remaining amount
  v_new_remaining_amount := GREATEST(0, v_liability_record.remaining_amount - v_converted_amount);
  
  UPDATE liabilities
  SET 
    remaining_amount = v_new_remaining_amount,
    status = CASE 
      WHEN v_new_remaining_amount <= 0 THEN 'paid_off'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_liability_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for clarity
COMMENT ON COLUMN bills.original_amount IS 'Original amount in the original currency';
COMMENT ON COLUMN bills.original_currency IS 'Original currency code';
COMMENT ON COLUMN bills.exchange_rate IS 'Exchange rate used for conversion';
COMMENT ON COLUMN bills.exchange_rate_used IS 'Exchange rate used for last conversion';
COMMENT ON COLUMN bills.conversion_source IS 'Source of exchange rate (api, fallback, manual)';
COMMENT ON COLUMN bills.last_conversion_date IS 'Date of last currency conversion';

COMMENT ON COLUMN credit_card_bill_cycles.original_amount IS 'Original amount in the original currency';
COMMENT ON COLUMN credit_card_bill_cycles.original_currency IS 'Original currency code';
COMMENT ON COLUMN credit_card_bill_cycles.exchange_rate IS 'Exchange rate used for conversion';
COMMENT ON COLUMN credit_card_bill_cycles.exchange_rate_used IS 'Exchange rate used for last conversion';
COMMENT ON COLUMN credit_card_bill_cycles.conversion_source IS 'Source of exchange rate (api, fallback, manual)';
COMMENT ON COLUMN credit_card_bill_cycles.last_conversion_date IS 'Date of last currency conversion';

COMMENT ON COLUMN credit_card_bill_payments.original_amount IS 'Original amount in the original currency';
COMMENT ON COLUMN credit_card_bill_payments.original_currency IS 'Original currency code';
COMMENT ON COLUMN credit_card_bill_payments.exchange_rate IS 'Exchange rate used for conversion';
COMMENT ON COLUMN credit_card_bill_payments.exchange_rate_used IS 'Exchange rate used for last conversion';
COMMENT ON COLUMN credit_card_bill_payments.conversion_source IS 'Source of exchange rate (api, fallback, manual)';
COMMENT ON COLUMN credit_card_bill_payments.last_conversion_date IS 'Date of last currency conversion';

COMMENT ON COLUMN bill_instances.original_amount IS 'Original amount in the original currency';
COMMENT ON COLUMN bill_instances.original_currency IS 'Original currency code';
COMMENT ON COLUMN bill_instances.exchange_rate IS 'Exchange rate used for conversion';
COMMENT ON COLUMN bill_instances.exchange_rate_used IS 'Exchange rate used for last conversion';
COMMENT ON COLUMN bill_instances.conversion_source IS 'Source of exchange rate (api, fallback, manual)';
COMMENT ON COLUMN bill_instances.last_conversion_date IS 'Date of last currency conversion';
