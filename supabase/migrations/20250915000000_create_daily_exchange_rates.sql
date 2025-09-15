-- Create daily exchange rates table for September 2025
-- This table stores live exchange rates fetched daily for all users

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'live_api',
  api_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure we don't have duplicate rates for the same day
  UNIQUE(from_currency, to_currency, DATE(created_at))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_from_to ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at ON exchange_rates(created_at);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_source ON exchange_rates(source);

-- Create a function to get the latest exchange rate
CREATE OR REPLACE FUNCTION get_latest_exchange_rate(
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3)
) RETURNS DECIMAL(20, 8) AS $$
DECLARE
  latest_rate DECIMAL(20, 8);
BEGIN
  -- Get the most recent rate for today
  SELECT rate INTO latest_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND DATE(created_at) = CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no rate found for today, get the most recent rate
  IF latest_rate IS NULL THEN
    SELECT rate INTO latest_rate
    FROM exchange_rates
    WHERE from_currency = p_from_currency
      AND to_currency = p_to_currency
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- If still no rate found, return 1.0 (same currency)
  IF latest_rate IS NULL THEN
    latest_rate := 1.0;
  END IF;
  
  RETURN latest_rate;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all rates for a base currency for today
CREATE OR REPLACE FUNCTION get_today_exchange_rates(
  p_base_currency VARCHAR(3) DEFAULT 'USD'
) RETURNS TABLE(
  to_currency VARCHAR(3),
  rate DECIMAL(20, 8),
  source VARCHAR(50),
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.to_currency,
    er.rate,
    er.source,
    er.created_at as last_updated
  FROM exchange_rates er
  WHERE er.from_currency = p_base_currency
    AND DATE(er.created_at) = CURRENT_DATE
  ORDER BY er.to_currency;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old exchange rates (keep only last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_exchange_rates() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM exchange_rates
  WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy access to current rates
CREATE OR REPLACE VIEW current_exchange_rates AS
SELECT 
  from_currency,
  to_currency,
  rate,
  source,
  api_provider,
  created_at as last_updated,
  CASE 
    WHEN DATE(created_at) = CURRENT_DATE THEN 'today'
    WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 'yesterday'
    ELSE 'older'
  END as freshness
FROM exchange_rates
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY from_currency, to_currency, created_at DESC;

-- Insert some initial fallback rates for September 2025
INSERT INTO exchange_rates (from_currency, to_currency, rate, source, api_provider) VALUES
-- USD to major currencies (September 2025 rates)
('USD', 'EUR', 0.87, 'fallback', 'manual_2025'),
('USD', 'GBP', 0.76, 'fallback', 'manual_2025'),
('USD', 'INR', 88.22, 'fallback', 'manual_2025'),
('USD', 'JPY', 152.00, 'fallback', 'manual_2025'),
('USD', 'CAD', 1.38, 'fallback', 'manual'),
('USD', 'AUD', 1.55, 'fallback', 'manual_2025'),
('USD', 'CHF', 0.89, 'fallback', 'manual'),
('USD', 'CNY', 7.15, 'fallback', 'manual'),
('USD', 'SGD', 1.37, 'fallback', 'manual_2025'),
('USD', 'HKD', 7.80, 'fallback', 'manual'),
('USD', 'KRW', 1350.00, 'fallback', 'manual_2025'),
('USD', 'BRL', 5.25, 'fallback', 'manual_2025'),
('USD', 'MXN', 17.80, 'fallback', 'manual'),
('USD', 'RUB', 95.00, 'fallback', 'manual'),
('USD', 'ZAR', 18.20, 'fallback', 'manual'),
('USD', 'NZD', 1.65, 'fallback', 'manual_2025'),
('USD', 'SEK', 10.50, 'fallback', 'manual'),
('USD', 'NOK', 10.60, 'fallback', 'manual'),
('USD', 'DKK', 6.85, 'fallback', 'manual'),
('USD', 'PLN', 4.05, 'fallback', 'manual'),
('USD', 'CZK', 23.20, 'fallback', 'manual'),
('USD', 'HUF', 365.00, 'fallback', 'manual'),
('USD', 'TRY', 29.50, 'fallback', 'manual'),
('USD', 'ILS', 3.65, 'fallback', 'manual'),
('USD', 'AED', 3.67, 'fallback', 'manual'),
('USD', 'SAR', 3.75, 'fallback', 'manual'),
('USD', 'QAR', 3.64, 'fallback', 'manual'),
('USD', 'KWD', 0.31, 'fallback', 'manual'),
('USD', 'BHD', 0.38, 'fallback', 'manual'),
('USD', 'OMR', 0.38, 'fallback', 'manual'),
('USD', 'JOD', 0.71, 'fallback', 'manual'),
('USD', 'LBP', 150000.00, 'fallback', 'manual'),
('USD', 'EGP', 31.20, 'fallback', 'manual'),
('USD', 'MAD', 10.15, 'fallback', 'manual'),
('USD', 'TND', 3.12, 'fallback', 'manual'),
('USD', 'DZD', 135.00, 'fallback', 'manual'),
('USD', 'NGN', 1620.00, 'fallback', 'manual'),
('USD', 'KES', 162.00, 'fallback', 'manual'),
('USD', 'GHS', 12.60, 'fallback', 'manual'),
('USD', 'UGX', 3750.00, 'fallback', 'manual'),
('USD', 'TZS', 2520.00, 'fallback', 'manual'),
('USD', 'ETB', 56.00, 'fallback', 'manual'),
('USD', 'MUR', 46.00, 'fallback', 'manual'),
('USD', 'BWP', 13.60, 'fallback', 'manual'),
('USD', 'SZL', 18.20, 'fallback', 'manual'),
('USD', 'LSL', 18.20, 'fallback', 'manual'),
('USD', 'NAD', 18.20, 'fallback', 'manual'),
('USD', 'MWK', 1720.00, 'fallback', 'manual'),
('USD', 'ZMW', 25.50, 'fallback', 'manual'),
('USD', 'BIF', 2900.00, 'fallback', 'manual'),
('USD', 'RWF', 1220.00, 'fallback', 'manual'),
('USD', 'CDF', 2850.00, 'fallback', 'manual'),
('USD', 'AOA', 840.00, 'fallback', 'manual'),
('USD', 'MZN', 65.00, 'fallback', 'manual'),
('USD', 'SLL', 22500.00, 'fallback', 'manual'),
('USD', 'LRD', 195.00, 'fallback', 'manual'),
('USD', 'GMD', 68.00, 'fallback', 'manual'),
('USD', 'GNF', 8750.00, 'fallback', 'manual'),
('USD', 'SLE', 22500.00, 'fallback', 'manual'),
('USD', 'STN', 23.00, 'fallback', 'manual'),
('USD', 'CVE', 102.00, 'fallback', 'manual'),
('USD', 'XOF', 610.00, 'fallback', 'manual'),
('USD', 'XAF', 610.00, 'fallback', 'manual'),
('USD', 'KMF', 460.00, 'fallback', 'manual'),
('USD', 'DJF', 180.00, 'fallback', 'manual'),
('USD', 'ERN', 15.20, 'fallback', 'manual'),
('USD', 'SOS', 580.00, 'fallback', 'manual'),
('USD', 'SSP', 610.00, 'fallback', 'manual'),
('USD', 'NPR', 135.00, 'fallback', 'manual'),
('USD', 'BTN', 88.22, 'fallback', 'manual_2025'),
('USD', 'BDT', 112.00, 'fallback', 'manual'),
('USD', 'PKR', 285.00, 'fallback', 'manual'),
('USD', 'AFN', 72.00, 'fallback', 'manual'),
('USD', 'TJS', 11.20, 'fallback', 'manual'),
('USD', 'KGS', 91.00, 'fallback', 'manual'),
('USD', 'UZS', 12200.00, 'fallback', 'manual'),
('USD', 'TMT', 3.55, 'fallback', 'manual'),
('USD', 'KZT', 460.00, 'fallback', 'manual'),
('USD', 'AMD', 410.00, 'fallback', 'manual'),
('USD', 'AZN', 1.72, 'fallback', 'manual'),
('USD', 'GEL', 2.75, 'fallback', 'manual'),
('USD', 'MDL', 18.50, 'fallback', 'manual'),
('USD', 'RON', 4.65, 'fallback', 'manual'),
('USD', 'BGN', 1.82, 'fallback', 'manual'),
('USD', 'HRK', 7.05, 'fallback', 'manual'),
('USD', 'RSD', 109.00, 'fallback', 'manual'),
('USD', 'MKD', 57.00, 'fallback', 'manual'),
('USD', 'ALL', 96.00, 'fallback', 'manual'),
('USD', 'BAM', 1.82, 'fallback', 'manual'),
('USD', 'MNT', 3450.00, 'fallback', 'manual'),
('USD', 'LAK', 21200.00, 'fallback', 'manual'),
('USD', 'KHR', 4150.00, 'fallback', 'manual'),
('USD', 'VND', 24800.00, 'fallback', 'manual'),
('USD', 'THB', 37.00, 'fallback', 'manual'),
('USD', 'MYR', 4.80, 'fallback', 'manual'),
('USD', 'IDR', 15800.00, 'fallback', 'manual'),
('USD', 'PHP', 57.00, 'fallback', 'manual'),
('USD', 'MMK', 2120.00, 'fallback', 'manual'),
('USD', 'BND', 1.37, 'fallback', 'manual_2025'),
('USD', 'FJD', 2.28, 'fallback', 'manual'),
('USD', 'PGK', 3.85, 'fallback', 'manual'),
('USD', 'SBD', 8.60, 'fallback', 'manual'),
('USD', 'VUV', 122.00, 'fallback', 'manual'),
('USD', 'WST', 2.75, 'fallback', 'manual'),
('USD', 'TOP', 2.45, 'fallback', 'manual'),
('USD', 'KID', 1.52, 'fallback', 'manual'),
('USD', 'XPF', 112.00, 'fallback', 'manual'),
('USD', 'ISK', 142.00, 'fallback', 'manual')
ON CONFLICT (from_currency, to_currency, DATE(created_at)) DO NOTHING;

-- Create a scheduled job to refresh rates daily (if using pg_cron extension)
-- This would need to be set up separately in production
-- SELECT cron.schedule('refresh-exchange-rates', '0 6 * * *', 'SELECT refresh_daily_exchange_rates();');

COMMENT ON TABLE exchange_rates IS 'Daily exchange rates fetched from live APIs for September 2025';
COMMENT ON FUNCTION get_latest_exchange_rate IS 'Get the latest exchange rate between two currencies';
COMMENT ON FUNCTION get_today_exchange_rates IS 'Get all exchange rates for a base currency for today';
COMMENT ON FUNCTION cleanup_old_exchange_rates IS 'Clean up exchange rates older than 30 days';
COMMENT ON VIEW current_exchange_rates IS 'View of current exchange rates with freshness indicators';
