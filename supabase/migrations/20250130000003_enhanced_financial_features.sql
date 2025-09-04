/*
  # Enhanced Financial Features Migration
  
  This migration adds comprehensive financial tracking features to transform
  the basic bolt.new database into a professional-grade financial management system.
  
  Features Added:
  1. Enhanced user profiles with financial preferences
  2. Investment and crypto tracking
  3. Advanced analytics and reporting
  4. Security and audit features
  5. Mobile sync and offline capabilities
  6. AI-powered insights and recommendations
  7. Advanced categorization and tagging
  8. Multi-currency and international support
  9. Tax and compliance features
  10. Advanced budgeting and forecasting
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. ENHANCED USER PROFILES & PREFERENCES
-- =============================================

-- Add financial preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  financial_preferences JSONB DEFAULT '{
    "default_currency": "USD",
    "date_format": "MM/DD/YYYY",
    "number_format": "US",
    "timezone": "UTC",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "share_analytics": false,
      "data_retention_days": 2555
    },
    "features": {
      "ai_insights": true,
      "auto_categorization": true,
      "recurring_detection": true,
      "budget_alerts": true
    }
  }'::jsonb;

-- Add user financial status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  financial_status TEXT DEFAULT 'active' 
  CHECK (financial_status IN ('active', 'suspended', 'archived', 'deleted'));

-- Add last active timestamp
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add subscription tier
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  subscription_tier TEXT DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'premium', 'enterprise'));

-- =============================================
-- 2. INVESTMENT & CRYPTO TRACKING
-- =============================================

-- Investment portfolios
CREATE TABLE IF NOT EXISTS investment_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  portfolio_type TEXT NOT NULL DEFAULT 'general'
    CHECK (portfolio_type IN ('general', 'retirement', 'education', 'crypto', 'real_estate')),
  total_value DECIMAL(15,2) DEFAULT 0,
  total_cost_basis DECIMAL(15,2) DEFAULT 0,
  total_gain_loss DECIMAL(15,2) DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment holdings
CREATE TABLE IF NOT EXISTS investment_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES investment_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'stock'
    CHECK (asset_type IN ('stock', 'bond', 'etf', 'mutual_fund', 'crypto', 'commodity', 'real_estate', 'other')),
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  average_cost_basis DECIMAL(15,2) DEFAULT 0,
  current_price DECIMAL(15,2) DEFAULT 0,
  current_value DECIMAL(15,2) DEFAULT 0,
  total_gain_loss DECIMAL(15,2) DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment transactions
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holding_id UUID NOT NULL REFERENCES investment_holdings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'split', 'merger', 'spinoff', 'rights', 'warrants')),
  quantity DECIMAL(20,8) NOT NULL,
  price_per_share DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  fees DECIMAL(15,2) DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crypto wallets
CREATE TABLE IF NOT EXISTS crypto_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'hot'
    CHECK (wallet_type IN ('hot', 'cold', 'exchange', 'hardware', 'paper')),
  address TEXT,
  private_key_encrypted TEXT, -- Encrypted private key
  public_key TEXT,
  currency_code TEXT NOT NULL,
  balance DECIMAL(20,8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. ADVANCED ANALYTICS & REPORTING
-- =============================================

-- Financial snapshots for historical analysis
CREATE TABLE IF NOT EXISTS financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_assets DECIMAL(15,2) DEFAULT 0,
  total_liabilities DECIMAL(15,2) DEFAULT 0,
  net_worth DECIMAL(15,2) DEFAULT 0,
  liquid_assets DECIMAL(15,2) DEFAULT 0,
  investment_value DECIMAL(15,2) DEFAULT 0,
  real_estate_value DECIMAL(15,2) DEFAULT 0,
  crypto_value DECIMAL(15,2) DEFAULT 0,
  total_debt DECIMAL(15,2) DEFAULT 0,
  monthly_income DECIMAL(15,2) DEFAULT 0,
  monthly_expenses DECIMAL(15,2) DEFAULT 0,
  savings_rate DECIMAL(5,2) DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spending patterns analysis
CREATE TABLE IF NOT EXISTS spending_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly'
    CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  average_transaction DECIMAL(15,2) DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable'
    CHECK (trend_direction IN ('increasing', 'decreasing', 'stable', 'volatile')),
  percentage_of_income DECIMAL(5,2) DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial goals tracking
CREATE TABLE IF NOT EXISTS financial_goals_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'savings'
    CHECK (goal_type IN ('savings', 'debt_payoff', 'investment', 'purchase', 'emergency_fund', 'retirement', 'education')),
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  is_smart_goal BOOLEAN DEFAULT false,
  smart_goal_criteria JSONB,
  linked_account_id UUID REFERENCES financial_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. SECURITY & AUDIT FEATURES
-- =============================================

-- User sessions and security
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events and audit log
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('login', 'logout', 'password_change', 'email_change', 'suspicious_activity', 'data_export', 'data_import')),
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  severity TEXT DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data backup and recovery
CREATE TABLE IF NOT EXISTS data_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL DEFAULT 'full'
    CHECK (backup_type IN ('full', 'incremental', 'differential')),
  backup_data JSONB NOT NULL,
  file_size_bytes BIGINT,
  encryption_key_id TEXT,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 5. MOBILE SYNC & OFFLINE CAPABILITIES
-- =============================================

-- Sync status tracking
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_version BIGINT DEFAULT 1,
  pending_changes JSONB DEFAULT '[]'::jsonb,
  conflict_resolution TEXT DEFAULT 'server_wins'
    CHECK (conflict_resolution IN ('server_wins', 'client_wins', 'manual')),
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline data cache
CREATE TABLE IF NOT EXISTS offline_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation_type TEXT NOT NULL
    CHECK (operation_type IN ('create', 'update', 'delete')),
  data JSONB,
  sync_status TEXT DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 6. AI-POWERED INSIGHTS & RECOMMENDATIONS
-- =============================================

-- AI insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL
    CHECK (insight_type IN ('spending_pattern', 'savings_opportunity', 'budget_alert', 'investment_advice', 'debt_optimization', 'tax_optimization', 'goal_progress')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  impact_level TEXT DEFAULT 'medium'
    CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  actionable_items JSONB DEFAULT '[]'::jsonb,
  related_data JSONB,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart categorization rules
CREATE TABLE IF NOT EXISTS smart_categorization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL DEFAULT 'description'
    CHECK (pattern_type IN ('description', 'merchant', 'amount', 'account', 'date')),
  pattern_value TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.8
    CHECK (confidence >= 0 AND confidence <= 1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. ADVANCED CATEGORIZATION & TAGGING
-- =============================================

-- Enhanced categories with hierarchy
CREATE TABLE IF NOT EXISTS category_hierarchy_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES category_hierarchy_enhanced(id),
  category_type TEXT NOT NULL DEFAULT 'expense'
    CHECK (category_type IN ('income', 'expense', 'transfer', 'investment')),
  icon TEXT,
  color TEXT,
  description TEXT,
  is_system_category BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction tags
CREATE TABLE IF NOT EXISTS transaction_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  description TEXT,
  is_system_tag BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction tag assignments
CREATE TABLE IF NOT EXISTS transaction_tag_assignments (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES transaction_tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (transaction_id, tag_id)
);

-- =============================================
-- 8. MULTI-CURRENCY & INTERNATIONAL SUPPORT
-- =============================================

-- Enhanced exchange rates with historical data
CREATE TABLE IF NOT EXISTS exchange_rates_historical (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(15,8) NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT DEFAULT 'api'
    CHECK (source IN ('api', 'manual', 'bank', 'crypto_exchange')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, rate_date)
);

-- Currency preferences per user
CREATE TABLE IF NOT EXISTS user_currency_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  primary_currency TEXT NOT NULL DEFAULT 'USD',
  display_currency TEXT NOT NULL DEFAULT 'USD',
  supported_currencies TEXT[] DEFAULT ARRAY['USD'],
  auto_convert BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. TAX & COMPLIANCE FEATURES
-- =============================================

-- Tax categories and tracking
CREATE TABLE IF NOT EXISTS tax_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tax_code TEXT,
  description TEXT,
  is_deductible BOOLEAN DEFAULT false,
  deduction_limit DECIMAL(15,2),
  tax_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax documents and receipts
CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('receipt', 'invoice', 'statement', 'form_1099', 'form_w2', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  tax_year INTEGER NOT NULL,
  amount DECIMAL(15,2),
  currency_code TEXT DEFAULT 'USD',
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 10. ADVANCED BUDGETING & FORECASTING
-- =============================================

-- Budget templates
CREATE TABLE IF NOT EXISTS budget_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial forecasts
CREATE TABLE IF NOT EXISTS financial_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  forecast_name TEXT NOT NULL,
  forecast_type TEXT NOT NULL DEFAULT 'monthly'
    CHECK (forecast_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  forecast_data JSONB NOT NULL,
  confidence_level DECIMAL(3,2) DEFAULT 0.7
    CHECK (confidence_level >= 0 AND confidence_level <= 1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Investment tables indexes
CREATE INDEX IF NOT EXISTS idx_investment_portfolios_user_id ON investment_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_portfolio_id ON investment_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_id ON investment_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_holding_id ON investment_transactions(holding_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user_id ON crypto_wallets(user_id);

-- Analytics tables indexes
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_user_id ON financial_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_date ON financial_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_spending_patterns_user_id ON spending_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_patterns_period ON spending_patterns(period_start, period_end);

-- Security tables indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);

-- Sync tables indexes
CREATE INDEX IF NOT EXISTS idx_sync_status_user_id ON sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_cache_user_id ON offline_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_cache_sync_status ON offline_cache(sync_status);

-- AI and insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_smart_categorization_user_id ON smart_categorization_rules(user_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_hierarchy_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates_historical ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_forecasts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all new tables
-- Investment tables policies
CREATE POLICY "Users can manage own investment portfolios" ON investment_portfolios
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own investment holdings" ON investment_holdings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own investment transactions" ON investment_transactions
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own crypto wallets" ON crypto_wallets
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Analytics tables policies
CREATE POLICY "Users can manage own financial snapshots" ON financial_snapshots
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own spending patterns" ON spending_patterns
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own enhanced goals" ON financial_goals_enhanced
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Security tables policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own security events" ON security_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own data backups" ON data_backups
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Sync tables policies
CREATE POLICY "Users can manage own sync status" ON sync_status
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own offline cache" ON offline_cache
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- AI and insights policies
CREATE POLICY "Users can manage own AI insights" ON ai_insights
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categorization rules" ON smart_categorization_rules
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Category and tagging policies
CREATE POLICY "Users can manage own enhanced categories" ON category_hierarchy_enhanced
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transaction tags" ON transaction_tags
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tag assignments" ON transaction_tag_assignments
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Currency and tax policies
CREATE POLICY "Users can manage own currency preferences" ON user_currency_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tax categories" ON tax_categories
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tax documents" ON tax_documents
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Budget and forecast policies
CREATE POLICY "Users can manage own budget templates" ON budget_templates
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own financial forecasts" ON financial_forecasts
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Exchange rates are public read-only
CREATE POLICY "Anyone can read exchange rates" ON exchange_rates_historical
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update triggers for all tables with updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all new tables
CREATE TRIGGER update_investment_portfolios_updated_at
  BEFORE UPDATE ON investment_portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_holdings_updated_at
  BEFORE UPDATE ON investment_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_transactions_updated_at
  BEFORE UPDATE ON investment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_wallets_updated_at
  BEFORE UPDATE ON crypto_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_enhanced_updated_at
  BEFORE UPDATE ON financial_goals_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at
  BEFORE UPDATE ON sync_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_categorization_rules_updated_at
  BEFORE UPDATE ON smart_categorization_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_hierarchy_enhanced_updated_at
  BEFORE UPDATE ON category_hierarchy_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_currency_preferences_updated_at
  BEFORE UPDATE ON user_currency_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_templates_updated_at
  BEFORE UPDATE ON budget_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_forecasts_updated_at
  BEFORE UPDATE ON financial_forecasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR ADVANCED FEATURES
-- =============================================

-- Function to calculate net worth
CREATE OR REPLACE FUNCTION calculate_net_worth(user_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  total_assets DECIMAL(15,2) := 0;
  total_liabilities DECIMAL(15,2) := 0;
BEGIN
  -- Calculate total assets
  SELECT COALESCE(SUM(balance), 0) INTO total_assets
  FROM financial_accounts
  WHERE user_id = user_uuid AND is_visible = true;
  
  -- Calculate total liabilities
  SELECT COALESCE(SUM(remaining_amount), 0) INTO total_liabilities
  FROM enhanced_liabilities
  WHERE user_id = user_uuid AND status = 'active';
  
  RETURN total_assets - total_liabilities;
END;
$$ LANGUAGE plpgsql;

-- Function to generate financial snapshot
CREATE OR REPLACE FUNCTION generate_financial_snapshot(user_uuid UUID, snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  snapshot_id UUID;
  net_worth DECIMAL(15,2);
BEGIN
  net_worth := calculate_net_worth(user_uuid);
  
  INSERT INTO financial_snapshots (
    user_id, snapshot_date, net_worth
  ) VALUES (
    user_uuid, snapshot_date, net_worth
  ) RETURNING id INTO snapshot_id;
  
  RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect spending patterns
CREATE OR REPLACE FUNCTION detect_spending_patterns(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS VOID AS $$
BEGIN
  -- This function would analyze spending patterns and insert into spending_patterns table
  -- Implementation would include complex analytics logic
  NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default system categories
INSERT INTO category_hierarchy_enhanced (id, user_id, name, category_type, is_system_category, sort_order)
VALUES 
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Food & Dining', 'expense', true, 1),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Transportation', 'expense', true, 2),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Housing', 'expense', true, 3),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Entertainment', 'expense', true, 4),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Healthcare', 'expense', true, 5),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Salary', 'income', true, 1),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Freelance', 'income', true, 2),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Investment Returns', 'income', true, 3)
ON CONFLICT DO NOTHING;

-- Insert default exchange rates
INSERT INTO exchange_rates_historical (from_currency, to_currency, rate, rate_date)
VALUES 
  ('USD', 'EUR', 0.85, CURRENT_DATE),
  ('USD', 'GBP', 0.73, CURRENT_DATE),
  ('USD', 'JPY', 110.0, CURRENT_DATE),
  ('USD', 'CAD', 1.25, CURRENT_DATE),
  ('EUR', 'USD', 1.18, CURRENT_DATE),
  ('GBP', 'USD', 1.37, CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, rate_date) DO NOTHING;

COMMIT;
