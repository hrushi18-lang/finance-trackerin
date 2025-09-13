/*
  # Multi-Currency Support Migration
  
  This migration adds comprehensive multi-currency support to the finance tracker:
  
  1. Exchange Rates Management
  2. User Currency Preferences  
  3. Multi-Currency Transaction Tracking
  4. Cross-Currency Conversion Logs
  5. Enhanced Tables for Currency Support
*/

-- Supported Currencies Table
CREATE TABLE IF NOT EXISTS supported_currencies (
  code text PRIMARY KEY CHECK (length(code) = 3),
  name text NOT NULL,
  symbol text NOT NULL,
  flag_emoji text,
  decimal_places integer NOT NULL DEFAULT 2 CHECK (decimal_places >= 0 AND decimal_places <= 4),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Exchange Rates Table (Historical tracking)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL REFERENCES supported_currencies(code),
  to_currency text NOT NULL REFERENCES supported_currencies(code),
  rate numeric(15,8) NOT NULL CHECK (rate > 0),
  source text NOT NULL CHECK (source = ANY (ARRAY['api', 'manual', 'fallback'])),
  api_provider text,
  created_at timestamptz DEFAULT now(),
  -- Note: Unique constraint removed due to PostgreSQL limitations with date functions in constraints
);

-- User Currency Preferences
CREATE TABLE IF NOT EXISTS user_currency_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  primary_currency text NOT NULL REFERENCES supported_currencies(code),
  display_currency text NOT NULL REFERENCES supported_currencies(code),
  auto_convert boolean NOT NULL DEFAULT true,
  show_original_amounts boolean NOT NULL DEFAULT true,
  preferred_currencies text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Currency Conversion Logs
CREATE TABLE IF NOT EXISTS currency_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_currency text NOT NULL REFERENCES supported_currencies(code),
  to_currency text NOT NULL REFERENCES supported_currencies(code),
  original_amount numeric(15,2) NOT NULL CHECK (original_amount > 0),
  converted_amount numeric(15,2) NOT NULL CHECK (converted_amount > 0),
  exchange_rate numeric(15,8) NOT NULL CHECK (exchange_rate > 0),
  conversion_fee numeric(15,2) DEFAULT 0 CHECK (conversion_fee >= 0),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  liability_id uuid REFERENCES liabilities(id) ON DELETE SET NULL,
  bill_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enhance existing tables with currency support
DO $$
BEGIN
  -- Add currency fields to transactions table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE transactions ADD COLUMN currency_code text REFERENCES supported_currencies(code) DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'original_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN original_amount numeric(15,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'original_currency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN original_currency text REFERENCES supported_currencies(code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'exchange_rate_used'
  ) THEN
    ALTER TABLE transactions ADD COLUMN exchange_rate_used numeric(15,8);
  END IF;

  -- Add currency fields to goals table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE goals ADD COLUMN currency_code text REFERENCES supported_currencies(code) DEFAULT 'USD';
  END IF;

  -- Add currency fields to liabilities table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN currency_code text REFERENCES supported_currencies(code) DEFAULT 'USD';
  END IF;

  -- Add currency fields to recurring_transactions (bills) table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN currency_code text REFERENCES supported_currencies(code) DEFAULT 'USD';
  END IF;
END $$;

-- Insert supported currencies
INSERT INTO supported_currencies (code, name, symbol, flag_emoji, decimal_places, is_active) VALUES
  ('USD', 'US Dollar', '$', '🇺🇸', 2, true),
  ('INR', 'Indian Rupee', '₹', '🇮🇳', 2, true),
  ('EUR', 'Euro', '€', '🇪🇺', 2, true),
  ('GBP', 'British Pound', '£', '🇬🇧', 2, true),
  ('JPY', 'Japanese Yen', '¥', '🇯🇵', 0, true),
  ('CNY', 'Chinese Yuan', '¥', '🇨🇳', 2, true),
  ('MYR', 'Malaysian Ringgit', 'RM', '🇲🇾', 2, true),
  ('SGD', 'Singapore Dollar', 'S$', '🇸🇬', 2, true),
  ('AED', 'UAE Dirham', 'د.إ', '🇦🇪', 2, true),
  ('NZD', 'New Zealand Dollar', 'NZ$', '🇳🇿', 2, true),
  ('ZAR', 'South African Rand', 'R', '🇿🇦', 2, true),
  ('CAD', 'Canadian Dollar', 'C$', '🇨🇦', 2, true),
  ('LKR', 'Sri Lankan Rupee', 'Rs', '🇱🇰', 2, true),
  ('AUD', 'Australian Dollar', 'A$', '🇦🇺', 2, true)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS exchange_rates_from_currency_idx ON exchange_rates(from_currency);
CREATE INDEX IF NOT EXISTS exchange_rates_to_currency_idx ON exchange_rates(to_currency);
CREATE INDEX IF NOT EXISTS exchange_rates_created_at_idx ON exchange_rates(created_at DESC);
CREATE INDEX IF NOT EXISTS user_currency_preferences_user_id_idx ON user_currency_preferences(user_id);
CREATE INDEX IF NOT EXISTS currency_conversions_user_id_idx ON currency_conversions(user_id);
CREATE INDEX IF NOT EXISTS currency_conversions_created_at_idx ON currency_conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_currency_code_idx ON transactions(currency_code);
CREATE INDEX IF NOT EXISTS goals_currency_code_idx ON goals(currency_code);
CREATE INDEX IF NOT EXISTS liabilities_currency_code_idx ON liabilities(currency_code);

-- Enable RLS on new tables
ALTER TABLE supported_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supported_currencies (public read)
CREATE POLICY "Anyone can read supported currencies"
  ON supported_currencies
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for exchange_rates (public read)
CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_currency_preferences
CREATE POLICY "Users can read own currency preferences"
  ON user_currency_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own currency preferences"
  ON user_currency_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own currency preferences"
  ON user_currency_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for currency_conversions
CREATE POLICY "Users can read own currency conversions"
  ON currency_conversions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own currency conversions"
  ON currency_conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create trigger functions for updated_at columns
CREATE TRIGGER update_supported_currencies_updated_at
  BEFORE UPDATE ON supported_currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_currency_preferences_updated_at
  BEFORE UPDATE ON user_currency_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get latest exchange rate
CREATE OR REPLACE FUNCTION get_latest_exchange_rate(
  from_curr text,
  to_curr text
) RETURNS numeric AS $$
DECLARE
  latest_rate numeric;
BEGIN
  -- Return 1.0 if same currency
  IF from_curr = to_curr THEN
    RETURN 1.0;
  END IF;
  
  -- Get latest rate
  SELECT rate INTO latest_rate
  FROM exchange_rates
  WHERE from_currency = from_curr 
    AND to_currency = to_curr
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no direct rate found, try inverse
  IF latest_rate IS NULL THEN
    SELECT 1.0 / rate INTO latest_rate
    FROM exchange_rates
    WHERE from_currency = to_curr 
      AND to_currency = from_curr
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- Return rate or NULL if not found
  RETURN COALESCE(latest_rate, NULL);
END;
$$ LANGUAGE plpgsql;

-- Function to convert amount between currencies
CREATE OR REPLACE FUNCTION convert_currency(
  amount numeric,
  from_curr text,
  to_curr text
) RETURNS numeric AS $$
DECLARE
  rate numeric;
  converted_amount numeric;
BEGIN
  -- Get exchange rate
  rate := get_latest_exchange_rate(from_curr, to_curr);
  
  -- Return NULL if no rate available
  IF rate IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate converted amount
  converted_amount := amount * rate;
  
  -- Round to appropriate decimal places
  RETURN ROUND(converted_amount, 2);
END;
$$ LANGUAGE plpgsql;
