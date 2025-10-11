-- Ensure all multi-currency fields exist in transactions table
DO $$
BEGIN
  -- Add native_amount (original transaction amount)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'native_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN native_amount NUMERIC(15,2);
  END IF;
  
  -- Add native_currency (currency user transacted in)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'native_currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN native_currency TEXT;
  END IF;
  
  -- Add native_symbol (for display)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'native_symbol'
  ) THEN
    ALTER TABLE transactions ADD COLUMN native_symbol TEXT;
  END IF;
  
  -- Add converted_amount (amount in account currency)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'converted_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN converted_amount NUMERIC(15,2);
  END IF;
  
  -- Add converted_currency (account currency)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'converted_currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN converted_currency TEXT;
  END IF;
  
  -- Add converted_symbol
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'converted_symbol'
  ) THEN
    ALTER TABLE transactions ADD COLUMN converted_symbol TEXT;
  END IF;
  
  -- Add primary_amount (amount in primary currency for reporting)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'primary_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN primary_amount NUMERIC(15,2);
  END IF;
  
  -- Add primary_currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'primary_currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN primary_currency TEXT;
  END IF;
  
  -- Add exchange_rate (native to account)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'exchange_rate'
  ) THEN
    ALTER TABLE transactions ADD COLUMN exchange_rate NUMERIC(15,8) DEFAULT 1.0;
  END IF;
  
  -- Add conversion_source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'conversion_source'
  ) THEN
    ALTER TABLE transactions ADD COLUMN conversion_source TEXT;
  END IF;
  
  -- Add conversion_metadata (JSON for detailed conversion info)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'conversion_metadata'
  ) THEN
    ALTER TABLE transactions ADD COLUMN conversion_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes for currency queries
CREATE INDEX IF NOT EXISTS idx_transactions_native_currency ON transactions(native_currency);
CREATE INDEX IF NOT EXISTS idx_transactions_primary_currency ON transactions(primary_currency);
CREATE INDEX IF NOT EXISTS idx_transactions_currency_code ON transactions(currency_code);

-- Add comments for documentation
COMMENT ON COLUMN transactions.native_amount IS 'Original transaction amount in the currency user entered';
COMMENT ON COLUMN transactions.native_currency IS 'Currency user actually transacted in';
COMMENT ON COLUMN transactions.converted_amount IS 'Amount converted to account currency (for balance deduction)';
COMMENT ON COLUMN transactions.primary_amount IS 'Amount converted to user primary currency (for reporting/display)';
COMMENT ON COLUMN transactions.conversion_metadata IS 'Detailed conversion information including all rates and currencies involved';


