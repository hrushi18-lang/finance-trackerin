-- Currency Execution Engine Database Support
-- This migration adds comprehensive support for the Currency-Neutral Execution Engine
-- Includes audit trails, conversion tracking, and enhanced multi-currency support

-- 1. Create currency execution audit table
CREATE TABLE IF NOT EXISTS currency_execution_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('transaction', 'bill_payment', 'liability_payment', 'goal_contribution', 'transfer')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  
  -- Original request data
  original_amount NUMERIC(20, 8) NOT NULL,
  original_currency VARCHAR(3) NOT NULL,
  target_account_id UUID REFERENCES financial_accounts(id),
  target_entity_id UUID, -- For bills, liabilities, goals
  target_entity_type TEXT, -- 'bill', 'liability', 'goal'
  
  -- Conversion results
  conversion_case TEXT NOT NULL,
  account_amount NUMERIC(20, 8) NOT NULL,
  account_currency VARCHAR(3) NOT NULL,
  primary_amount NUMERIC(20, 8) NOT NULL,
  primary_currency VARCHAR(3) NOT NULL,
  exchange_rate NUMERIC(20, 8),
  exchange_rate_used NUMERIC(20, 8),
  conversion_source TEXT,
  
  -- Execution details
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT fk_currency_execution_audit_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for currency execution audit
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_user_id ON currency_execution_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_execution_id ON currency_execution_audit(execution_id);
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_operation_type ON currency_execution_audit(operation_type);
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_created_at ON currency_execution_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_status ON currency_execution_audit(status);

-- 2. Add conversion tracking to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS conversion_case TEXT,
ADD COLUMN IF NOT EXISTS conversion_source TEXT,
ADD COLUMN IF NOT EXISTS execution_id UUID,
ADD COLUMN IF NOT EXISTS conversion_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_transactions_conversion_case ON transactions(conversion_case);
CREATE INDEX IF NOT EXISTS idx_transactions_execution_id ON transactions(execution_id);
CREATE INDEX IF NOT EXISTS idx_transactions_conversion_timestamp ON transactions(conversion_timestamp);

-- 3. Add conversion tracking to financial_accounts table
ALTER TABLE financial_accounts
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_converted_amount NUMERIC(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_accuracy_score DECIMAL(3, 2) DEFAULT 1.0;

-- Create index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_financial_accounts_last_conversion_date ON financial_accounts(last_conversion_date);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_conversion_count ON financial_accounts(conversion_count);

-- 4. Add conversion tracking to bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_converted_amount NUMERIC(20, 8) DEFAULT 0;

-- Create index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_bills_last_conversion_date ON bills(last_conversion_date);
CREATE INDEX IF NOT EXISTS idx_bills_conversion_count ON bills(conversion_count);

-- 5. Add conversion tracking to enhanced_liabilities table
ALTER TABLE enhanced_liabilities
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_converted_amount NUMERIC(20, 8) DEFAULT 0;

-- Create index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_last_conversion_date ON enhanced_liabilities(last_conversion_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_conversion_count ON enhanced_liabilities(conversion_count);

-- 6. Add conversion tracking to financial_goals table
ALTER TABLE financial_goals
ADD COLUMN IF NOT EXISTS last_conversion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_converted_amount NUMERIC(20, 8) DEFAULT 0;

-- Create index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_financial_goals_last_conversion_date ON financial_goals(last_conversion_date);
CREATE INDEX IF NOT EXISTS idx_financial_goals_conversion_count ON financial_goals(conversion_count);

-- 7. Create currency conversion statistics table
CREATE TABLE IF NOT EXISTS currency_conversion_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Conversion counts
  total_conversions INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,
  failed_conversions INTEGER DEFAULT 0,
  
  -- Currency pair statistics
  most_used_from_currency VARCHAR(3),
  most_used_to_currency VARCHAR(3),
  most_used_conversion_case TEXT,
  
  -- Performance metrics
  average_execution_time_ms INTEGER,
  average_exchange_rate_accuracy DECIMAL(5, 4),
  
  -- Volume metrics
  total_volume_converted NUMERIC(20, 8),
  total_volume_primary_currency NUMERIC(20, 8),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for daily stats per user
  UNIQUE(user_id, date)
);

-- Create indexes for currency conversion stats
CREATE INDEX IF NOT EXISTS idx_currency_conversion_stats_user_id ON currency_conversion_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_conversion_stats_date ON currency_conversion_stats(date);
CREATE INDEX IF NOT EXISTS idx_currency_conversion_stats_most_used_from_currency ON currency_conversion_stats(most_used_from_currency);
CREATE INDEX IF NOT EXISTS idx_currency_conversion_stats_most_used_to_currency ON currency_conversion_stats(most_used_to_currency);

-- 8. Create function to log currency execution
CREATE OR REPLACE FUNCTION log_currency_execution(
  p_user_id UUID,
  p_execution_id UUID,
  p_operation_type TEXT,
  p_status TEXT,
  p_original_amount NUMERIC,
  p_original_currency VARCHAR(3),
  p_target_account_id UUID,
  p_target_entity_id UUID DEFAULT NULL,
  p_target_entity_type TEXT DEFAULT NULL,
  p_conversion_case TEXT,
  p_account_amount NUMERIC,
  p_account_currency VARCHAR(3),
  p_primary_amount NUMERIC,
  p_primary_currency VARCHAR(3),
  p_exchange_rate NUMERIC DEFAULT NULL,
  p_exchange_rate_used NUMERIC DEFAULT NULL,
  p_conversion_source TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO currency_execution_audit (
    user_id,
    execution_id,
    operation_type,
    status,
    original_amount,
    original_currency,
    target_account_id,
    target_entity_id,
    target_entity_type,
    conversion_case,
    account_amount,
    account_currency,
    primary_amount,
    primary_currency,
    exchange_rate,
    exchange_rate_used,
    conversion_source,
    execution_time_ms,
    error_message
  ) VALUES (
    p_user_id,
    p_execution_id,
    p_operation_type,
    p_status,
    p_original_amount,
    p_original_currency,
    p_target_account_id,
    p_target_entity_id,
    p_target_entity_type,
    p_conversion_case,
    p_account_amount,
    p_account_currency,
    p_primary_amount,
    p_primary_currency,
    p_exchange_rate,
    p_exchange_rate_used,
    p_conversion_source,
    p_execution_time_ms,
    p_error_message
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- 9. Create function to update conversion statistics
CREATE OR REPLACE FUNCTION update_conversion_stats(
  p_user_id UUID,
  p_conversion_case TEXT,
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3),
  p_original_amount NUMERIC,
  p_primary_amount NUMERIC,
  p_execution_time_ms INTEGER,
  p_success BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_stats_id UUID;
BEGIN
  -- Get or create today's stats record
  SELECT id INTO v_stats_id
  FROM currency_conversion_stats
  WHERE user_id = p_user_id AND date = v_today;
  
  IF v_stats_id IS NULL THEN
    INSERT INTO currency_conversion_stats (user_id, date)
    VALUES (p_user_id, v_today)
    RETURNING id INTO v_stats_id;
  END IF;
  
  -- Update statistics
  UPDATE currency_conversion_stats
  SET 
    total_conversions = total_conversions + 1,
    successful_conversions = CASE WHEN p_success THEN successful_conversions + 1 ELSE successful_conversions END,
    failed_conversions = CASE WHEN NOT p_success THEN failed_conversions + 1 ELSE failed_conversions END,
    most_used_from_currency = p_from_currency,
    most_used_to_currency = p_to_currency,
    most_used_conversion_case = p_conversion_case,
    average_execution_time_ms = CASE 
      WHEN average_execution_time_ms IS NULL THEN p_execution_time_ms
      ELSE (average_execution_time_ms + p_execution_time_ms) / 2
    END,
    total_volume_converted = total_volume_converted + p_original_amount,
    total_volume_primary_currency = total_volume_primary_currency + p_primary_amount,
    updated_at = NOW()
  WHERE id = v_stats_id;
END;
$$;

-- 10. Create function to get conversion analytics
CREATE OR REPLACE FUNCTION get_conversion_analytics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS TABLE(
  total_conversions BIGINT,
  successful_conversions BIGINT,
  failed_conversions BIGINT,
  success_rate DECIMAL(5, 2),
  average_execution_time_ms NUMERIC,
  total_volume_converted NUMERIC,
  total_volume_primary_currency NUMERIC,
  most_used_conversion_case TEXT,
  most_used_from_currency VARCHAR(3),
  most_used_to_currency VARCHAR(3)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(cs.total_conversions) as total_conversions,
    SUM(cs.successful_conversions) as successful_conversions,
    SUM(cs.failed_conversions) as failed_conversions,
    CASE 
      WHEN SUM(cs.total_conversions) > 0 
      THEN ROUND((SUM(cs.successful_conversions)::DECIMAL / SUM(cs.total_conversions)::DECIMAL) * 100, 2)
      ELSE 0
    END as success_rate,
    AVG(cs.average_execution_time_ms) as average_execution_time_ms,
    SUM(cs.total_volume_converted) as total_volume_converted,
    SUM(cs.total_volume_primary_currency) as total_volume_primary_currency,
    MODE() WITHIN GROUP (ORDER BY cs.most_used_conversion_case) as most_used_conversion_case,
    MODE() WITHIN GROUP (ORDER BY cs.most_used_from_currency) as most_used_from_currency,
    MODE() WITHIN GROUP (ORDER BY cs.most_used_to_currency) as most_used_to_currency
  FROM currency_conversion_stats cs
  WHERE cs.user_id = p_user_id
    AND cs.date >= CURRENT_DATE - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to get conversion history
CREATE OR REPLACE FUNCTION get_conversion_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
  execution_id UUID,
  operation_type TEXT,
  status TEXT,
  original_amount NUMERIC,
  original_currency VARCHAR(3),
  account_amount NUMERIC,
  account_currency VARCHAR(3),
  primary_amount NUMERIC,
  primary_currency VARCHAR(3),
  conversion_case TEXT,
  exchange_rate NUMERIC,
  conversion_source TEXT,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cea.execution_id,
    cea.operation_type,
    cea.status,
    cea.original_amount,
    cea.original_currency,
    cea.account_amount,
    cea.account_currency,
    cea.primary_amount,
    cea.primary_currency,
    cea.conversion_case,
    cea.exchange_rate,
    cea.conversion_source,
    cea.execution_time_ms,
    cea.error_message,
    cea.created_at
  FROM currency_execution_audit cea
  WHERE cea.user_id = p_user_id
  ORDER BY cea.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to clean up old audit records
CREATE OR REPLACE FUNCTION cleanup_old_conversion_audit(
  p_days_to_keep INTEGER DEFAULT 90
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM currency_execution_audit
  WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * p_days_to_keep;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- 13. Create view for conversion dashboard
CREATE OR REPLACE VIEW conversion_dashboard AS
SELECT 
  u.id as user_id,
  u.email,
  p.primary_currency,
  COALESCE(stats.total_conversions, 0) as total_conversions,
  COALESCE(stats.successful_conversions, 0) as successful_conversions,
  COALESCE(stats.failed_conversions, 0) as failed_conversions,
  CASE 
    WHEN COALESCE(stats.total_conversions, 0) > 0 
    THEN ROUND((stats.successful_conversions::DECIMAL / stats.total_conversions::DECIMAL) * 100, 2)
    ELSE 0
  END as success_rate,
  COALESCE(stats.average_execution_time_ms, 0) as average_execution_time_ms,
  COALESCE(stats.total_volume_converted, 0) as total_volume_converted,
  COALESCE(stats.total_volume_primary_currency, 0) as total_volume_primary_currency,
  stats.most_used_conversion_case,
  stats.most_used_from_currency,
  stats.most_used_to_currency,
  stats.last_updated
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN LATERAL (
  SELECT 
    SUM(cs.total_conversions) as total_conversions,
    SUM(cs.successful_conversions) as successful_conversions,
    SUM(cs.failed_conversions) as failed_conversions,
    AVG(cs.average_execution_time_ms) as average_execution_time_ms,
    SUM(cs.total_volume_converted) as total_volume_converted,
    SUM(cs.total_volume_primary_currency) as total_volume_primary_currency,
    MODE() WITHIN GROUP (ORDER BY cs.most_used_conversion_case) as most_used_conversion_case,
    MODE() WITHIN GROUP (ORDER BY cs.most_used_from_currency) as most_used_from_currency,
    MODE() WITHIN GROUP (ORDER BY cs.most_used_to_currency) as most_used_to_currency,
    MAX(cs.updated_at) as last_updated
  FROM currency_conversion_stats cs
  WHERE cs.user_id = u.id
    AND cs.date >= CURRENT_DATE - INTERVAL '30 days'
) stats ON true;

-- 14. Create RLS policies for new tables
ALTER TABLE currency_execution_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_conversion_stats ENABLE ROW LEVEL SECURITY;

-- RLS policy for currency_execution_audit
CREATE POLICY "Users can view their own currency execution audit" ON currency_execution_audit
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own currency execution audit" ON currency_execution_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policy for currency_conversion_stats
CREATE POLICY "Users can view their own currency conversion stats" ON currency_conversion_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own currency conversion stats" ON currency_conversion_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currency conversion stats" ON currency_conversion_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- 15. Add comments for documentation
COMMENT ON TABLE currency_execution_audit IS 'Audit trail for all currency execution operations';
COMMENT ON TABLE currency_conversion_stats IS 'Daily statistics for currency conversions per user';
COMMENT ON FUNCTION log_currency_execution IS 'Log a currency execution operation for audit purposes';
COMMENT ON FUNCTION update_conversion_stats IS 'Update daily conversion statistics for a user';
COMMENT ON FUNCTION get_conversion_analytics IS 'Get conversion analytics for a user over a specified period';
COMMENT ON FUNCTION get_conversion_history IS 'Get conversion history for a user with pagination';
COMMENT ON FUNCTION cleanup_old_conversion_audit IS 'Clean up old conversion audit records';
COMMENT ON VIEW conversion_dashboard IS 'Dashboard view showing conversion statistics for all users';

-- 16. Create a trigger to automatically update conversion stats
CREATE OR REPLACE FUNCTION trigger_update_conversion_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update conversion stats when a new audit record is inserted
  IF TG_OP = 'INSERT' AND NEW.status = 'success' THEN
    PERFORM update_conversion_stats(
      NEW.user_id,
      NEW.conversion_case,
      NEW.original_currency,
      NEW.account_currency,
      NEW.original_amount,
      NEW.primary_amount,
      NEW.execution_time_ms,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversion_stats
  AFTER INSERT ON currency_execution_audit
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_conversion_stats();

-- 17. Create a function to get real-time conversion rates
CREATE OR REPLACE FUNCTION get_realtime_conversion_rates(
  p_base_currency VARCHAR(3) DEFAULT 'USD'
) RETURNS TABLE(
  to_currency VARCHAR(3),
  rate DECIMAL(20, 8),
  source VARCHAR(50),
  last_updated TIMESTAMP WITH TIME ZONE,
  freshness TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.to_currency,
    er.rate,
    er.source,
    er.created_at as last_updated,
    CASE 
      WHEN er.created_at > NOW() - INTERVAL '1 hour' THEN 'realtime'
      WHEN er.created_at > NOW() - INTERVAL '24 hours' THEN 'recent'
      WHEN er.created_at > NOW() - INTERVAL '7 days' THEN 'stale'
      ELSE 'outdated'
    END as freshness
  FROM exchange_rates er
  WHERE er.from_currency = p_base_currency
    AND er.created_at >= NOW() - INTERVAL '7 days'
  ORDER BY er.created_at DESC, er.to_currency;
END;
$$ LANGUAGE plpgsql;

-- 18. Create a function to validate currency conversion
CREATE OR REPLACE FUNCTION validate_currency_conversion(
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3),
  p_amount NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_rate DECIMAL(20, 8);
  v_is_valid BOOLEAN := false;
BEGIN
  -- Check if currencies are supported
  IF NOT EXISTS (SELECT 1 FROM supported_currencies WHERE code = p_from_currency) THEN
    RETURN false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM supported_currencies WHERE code = p_to_currency) THEN
    RETURN false;
  END IF;
  
  -- Check if amount is positive
  IF p_amount <= 0 THEN
    RETURN false;
  END IF;
  
  -- Check if we have a recent exchange rate
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND created_at >= NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no recent rate, check for any rate
  IF v_rate IS NULL THEN
    SELECT rate INTO v_rate
    FROM exchange_rates
    WHERE from_currency = p_from_currency
      AND to_currency = p_to_currency
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- If still no rate, check if it's the same currency
  IF v_rate IS NULL AND p_from_currency = p_to_currency THEN
    v_rate := 1.0;
  END IF;
  
  -- Return true if we have a valid rate
  RETURN v_rate IS NOT NULL;
END;
$$;

-- 19. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_original_currency ON currency_execution_audit(original_currency);
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_account_currency ON currency_execution_audit(account_currency);
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_conversion_case ON currency_execution_audit(conversion_case);
CREATE INDEX IF NOT EXISTS idx_currency_execution_audit_operation_type_status ON currency_execution_audit(operation_type, status);

-- 20. Insert some initial data for testing
INSERT INTO currency_conversion_stats (user_id, date, total_conversions, successful_conversions, failed_conversions, most_used_from_currency, most_used_to_currency, most_used_conversion_case, average_execution_time_ms, total_volume_converted, total_volume_primary_currency)
SELECT 
  u.id,
  CURRENT_DATE,
  0,
  0,
  0,
  'USD',
  'USD',
  'all_same',
  0,
  0,
  0
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM currency_conversion_stats cs 
  WHERE cs.user_id = u.id AND cs.date = CURRENT_DATE
)
ON CONFLICT (user_id, date) DO NOTHING;

-- 21. Create a function to get conversion performance metrics
CREATE OR REPLACE FUNCTION get_conversion_performance_metrics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
) RETURNS TABLE(
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT,
  trend_direction TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_stats AS (
    SELECT 
      SUM(total_conversions) as total_conversions,
      SUM(successful_conversions) as successful_conversions,
      SUM(failed_conversions) as failed_conversions,
      AVG(average_execution_time_ms) as avg_execution_time,
      SUM(total_volume_converted) as total_volume,
      SUM(total_volume_primary_currency) as total_volume_primary
    FROM currency_conversion_stats
    WHERE user_id = p_user_id
      AND date >= CURRENT_DATE - INTERVAL '1 day' * p_days
  ),
  previous_stats AS (
    SELECT 
      SUM(total_conversions) as total_conversions,
      SUM(successful_conversions) as successful_conversions,
      SUM(failed_conversions) as failed_conversions,
      AVG(average_execution_time_ms) as avg_execution_time,
      SUM(total_volume_converted) as total_volume,
      SUM(total_volume_primary_currency) as total_volume_primary
    FROM currency_conversion_stats
    WHERE user_id = p_user_id
      AND date >= CURRENT_DATE - INTERVAL '1 day' * (p_days * 2)
      AND date < CURRENT_DATE - INTERVAL '1 day' * p_days
  )
  SELECT 
    'Total Conversions'::TEXT,
    COALESCE(rs.total_conversions, 0)::NUMERIC,
    'count'::TEXT,
    CASE 
      WHEN COALESCE(rs.total_conversions, 0) > COALESCE(ps.total_conversions, 0) THEN 'up'
      WHEN COALESCE(rs.total_conversions, 0) < COALESCE(ps.total_conversions, 0) THEN 'down'
      ELSE 'stable'
    END::TEXT
  FROM recent_stats rs, previous_stats ps
  
  UNION ALL
  
  SELECT 
    'Success Rate'::TEXT,
    CASE 
      WHEN COALESCE(rs.total_conversions, 0) > 0 
      THEN ROUND((rs.successful_conversions::DECIMAL / rs.total_conversions::DECIMAL) * 100, 2)
      ELSE 0
    END::NUMERIC,
    'percentage'::TEXT,
    CASE 
      WHEN COALESCE(rs.total_conversions, 0) > 0 AND COALESCE(ps.total_conversions, 0) > 0
      THEN CASE 
        WHEN (rs.successful_conversions::DECIMAL / rs.total_conversions::DECIMAL) > 
             (ps.successful_conversions::DECIMAL / ps.total_conversions::DECIMAL) THEN 'up'
        WHEN (rs.successful_conversions::DECIMAL / rs.total_conversions::DECIMAL) < 
             (ps.successful_conversions::DECIMAL / ps.total_conversions::DECIMAL) THEN 'down'
        ELSE 'stable'
      END
      ELSE 'stable'
    END::TEXT
  FROM recent_stats rs, previous_stats ps
  
  UNION ALL
  
  SELECT 
    'Average Execution Time'::TEXT,
    COALESCE(rs.avg_execution_time, 0)::NUMERIC,
    'milliseconds'::TEXT,
    CASE 
      WHEN COALESCE(rs.avg_execution_time, 0) > COALESCE(ps.avg_execution_time, 0) THEN 'up'
      WHEN COALESCE(rs.avg_execution_time, 0) < COALESCE(ps.avg_execution_time, 0) THEN 'down'
      ELSE 'stable'
    END::TEXT
  FROM recent_stats rs, previous_stats ps
  
  UNION ALL
  
  SELECT 
    'Total Volume Converted'::TEXT,
    COALESCE(rs.total_volume, 0)::NUMERIC,
    'amount'::TEXT,
    CASE 
      WHEN COALESCE(rs.total_volume, 0) > COALESCE(ps.total_volume, 0) THEN 'up'
      WHEN COALESCE(rs.total_volume, 0) < COALESCE(ps.total_volume, 0) THEN 'down'
      ELSE 'stable'
    END::TEXT
  FROM recent_stats rs, previous_stats ps;
END;
$$ LANGUAGE plpgsql;

-- 22. Add comments for all new functions
COMMENT ON FUNCTION get_realtime_conversion_rates IS 'Get real-time conversion rates with freshness indicators';
COMMENT ON FUNCTION validate_currency_conversion IS 'Validate if a currency conversion is possible and valid';
COMMENT ON FUNCTION get_conversion_performance_metrics IS 'Get conversion performance metrics with trend analysis';

-- 23. Create a function to get currency conversion insights
CREATE OR REPLACE FUNCTION get_currency_conversion_insights(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS TABLE(
  insight_type TEXT,
  insight_message TEXT,
  insight_value NUMERIC,
  insight_severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      SUM(total_conversions) as total_conversions,
      SUM(successful_conversions) as successful_conversions,
      SUM(failed_conversions) as failed_conversions,
      AVG(average_execution_time_ms) as avg_execution_time,
      SUM(total_volume_converted) as total_volume,
      MODE() WITHIN GROUP (ORDER BY most_used_conversion_case) as most_used_case,
      MODE() WITHIN GROUP (ORDER BY most_used_from_currency) as most_used_from,
      MODE() WITHIN GROUP (ORDER BY most_used_to_currency) as most_used_to
    FROM currency_conversion_stats
    WHERE user_id = p_user_id
      AND date >= CURRENT_DATE - INTERVAL '1 day' * p_days
  )
  SELECT 
    'High Failure Rate'::TEXT,
    'Your currency conversion failure rate is above 10%'::TEXT,
    CASE 
      WHEN us.total_conversions > 0 
      THEN ROUND((us.failed_conversions::DECIMAL / us.total_conversions::DECIMAL) * 100, 2)
      ELSE 0
    END::NUMERIC,
    CASE 
      WHEN us.total_conversions > 0 AND (us.failed_conversions::DECIMAL / us.total_conversions::DECIMAL) > 0.1 
      THEN 'high'
      ELSE 'low'
    END::TEXT
  FROM user_stats us
  WHERE us.total_conversions > 0 AND (us.failed_conversions::DECIMAL / us.total_conversions::DECIMAL) > 0.1
  
  UNION ALL
  
  SELECT 
    'Slow Execution'::TEXT,
    'Your average conversion execution time is above 2000ms'::TEXT,
    COALESCE(us.avg_execution_time, 0)::NUMERIC,
    CASE 
      WHEN COALESCE(us.avg_execution_time, 0) > 2000 THEN 'high'
      ELSE 'low'
    END::TEXT
  FROM user_stats us
  WHERE COALESCE(us.avg_execution_time, 0) > 2000
  
  UNION ALL
  
  SELECT 
    'High Volume'::TEXT,
    'You have converted a significant amount of currency this period'::TEXT,
    COALESCE(us.total_volume, 0)::NUMERIC,
    CASE 
      WHEN COALESCE(us.total_volume, 0) > 100000 THEN 'high'
      WHEN COALESCE(us.total_volume, 0) > 10000 THEN 'medium'
      ELSE 'low'
    END::TEXT
  FROM user_stats us
  WHERE COALESCE(us.total_volume, 0) > 1000;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_currency_conversion_insights IS 'Get currency conversion insights and recommendations for a user';

-- 24. Final cleanup and optimization
ANALYZE currency_execution_audit;
ANALYZE currency_conversion_stats;
ANALYZE transactions;
ANALYZE financial_accounts;
ANALYZE bills;
ANALYZE enhanced_liabilities;
ANALYZE financial_goals;

-- 25. Create a summary view of all currency-related tables
CREATE OR REPLACE VIEW currency_system_summary AS
SELECT 
  'exchange_rates' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_updated,
  'Live exchange rates' as description
FROM exchange_rates
UNION ALL
SELECT 
  'currency_execution_audit' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_updated,
  'Currency execution audit trail' as description
FROM currency_execution_audit
UNION ALL
SELECT 
  'currency_conversion_stats' as table_name,
  COUNT(*) as record_count,
  MAX(updated_at) as last_updated,
  'Daily conversion statistics' as description
FROM currency_conversion_stats
UNION ALL
SELECT 
  'transactions_with_conversions' as table_name,
  COUNT(*) as record_count,
  MAX(conversion_timestamp) as last_updated,
  'Transactions with conversion data' as description
FROM transactions
WHERE conversion_case IS NOT NULL;

COMMENT ON VIEW currency_system_summary IS 'Summary view of all currency-related tables and their status';

-- Migration completed successfully
SELECT 'Currency Execution Engine database support migration completed successfully' as status;
