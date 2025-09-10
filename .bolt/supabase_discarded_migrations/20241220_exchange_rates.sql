-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'api',
  api_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(from_currency, to_currency, created_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_from_to ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at ON exchange_rates(created_at);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_valid_until ON exchange_rates(valid_until);

-- Create function to clean up old exchange rates (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_exchange_rates()
RETURNS void AS $$
BEGIN
  DELETE FROM exchange_rates 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old rates (if pg_cron is available)
-- This would need to be set up manually in the Supabase dashboard
-- SELECT cron.schedule('cleanup-exchange-rates', '0 2 * * *', 'SELECT cleanup_old_exchange_rates();');

-- Add RLS policies
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow all users to read exchange rates
CREATE POLICY "Allow all users to read exchange rates" ON exchange_rates
  FOR SELECT USING (true);

-- Allow authenticated users to insert exchange rates (for the service)
CREATE POLICY "Allow authenticated users to insert exchange rates" ON exchange_rates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update exchange rates
CREATE POLICY "Allow authenticated users to update exchange rates" ON exchange_rates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete exchange rates
CREATE POLICY "Allow authenticated users to delete exchange rates" ON exchange_rates
  FOR DELETE USING (auth.role() = 'authenticated');
