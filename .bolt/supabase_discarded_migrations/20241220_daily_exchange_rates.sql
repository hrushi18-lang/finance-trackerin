-- Create daily exchange rates table
CREATE TABLE IF NOT EXISTS daily_exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(12,6) NOT NULL, -- 6 decimal precision for FX rates
  fx_date DATE NOT NULL, -- YYYY-MM-DD format
  fx_source VARCHAR(50) NOT NULL, -- 'wise', 'reuters', 'exchangerate-host', etc.
  is_stale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_rates_date ON daily_exchange_rates(fx_date);
CREATE INDEX IF NOT EXISTS idx_daily_rates_currencies ON daily_exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_daily_rates_lookup ON daily_exchange_rates(base_currency, target_currency, fx_date);
CREATE INDEX IF NOT EXISTS idx_daily_rates_stale ON daily_exchange_rates(is_stale, fx_date);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_rates_unique 
ON daily_exchange_rates(base_currency, target_currency, fx_date);

-- Add RLS policies
ALTER TABLE daily_exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read rates
CREATE POLICY "Users can read daily exchange rates" ON daily_exchange_rates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to manage rates
CREATE POLICY "Service role can manage daily exchange rates" ON daily_exchange_rates
  FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_exchange_rates_updated_at 
  BEFORE UPDATE ON daily_exchange_rates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
