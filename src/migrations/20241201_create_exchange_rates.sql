-- Create exchange_rates table for storing daily exchange rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(15, 8) NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('api', 'manual', 'fallback')),
  api_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at ON exchange_rates(created_at);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_source ON exchange_rates(source);

-- Create unique constraint to prevent duplicate rates for the same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_unique_daily 
ON exchange_rates(from_currency, to_currency, DATE(created_at));

-- Add RLS (Row Level Security) policies
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow all users to read exchange rates (they're public data)
CREATE POLICY "Allow read access to exchange rates" ON exchange_rates
  FOR SELECT USING (true);

-- Only authenticated users can insert/update rates (for manual adjustments)
CREATE POLICY "Allow authenticated users to manage exchange rates" ON exchange_rates
  FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_exchange_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_exchange_rates_updated_at();

-- Insert some initial fallback rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, source, api_provider) VALUES
  ('USD', 'USD', 1.0, 'fallback', NULL),
  ('USD', 'EUR', 0.92, 'fallback', NULL),
  ('USD', 'GBP', 0.79, 'fallback', NULL),
  ('USD', 'INR', 83.45, 'fallback', NULL),
  ('USD', 'CNY', 7.24, 'fallback', NULL),
  ('USD', 'AUD', 1.53, 'fallback', NULL),
  ('USD', 'NZD', 1.65, 'fallback', NULL),
  ('USD', 'JPY', 150.0, 'fallback', NULL),
  ('USD', 'CAD', 1.36, 'fallback', NULL),
  ('USD', 'SGD', 1.35, 'fallback', NULL),
  ('USD', 'HKD', 7.82, 'fallback', NULL),
  ('USD', 'KRW', 1350, 'fallback', NULL),
  ('USD', 'AED', 3.67, 'fallback', NULL),
  ('USD', 'CHF', 0.88, 'fallback', NULL),
  ('USD', 'BRL', 5.15, 'fallback', NULL),
  ('USD', 'RUB', 92.5, 'fallback', NULL),
  ('USD', 'IDR', 15650, 'fallback', NULL),
  ('USD', 'MYR', 4.75, 'fallback', NULL),
  ('USD', 'THB', 36.5, 'fallback', NULL),
  ('USD', 'VND', 24500, 'fallback', NULL),
  ('USD', 'NPR', 133.5, 'fallback', NULL)
ON CONFLICT (from_currency, to_currency, DATE(created_at)) DO NOTHING;
