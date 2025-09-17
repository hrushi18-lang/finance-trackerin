/*
  # Account Management Features Migration
  
  This migration adds comprehensive account management features:
  
  1. Account Organization (Pin to Dashboard, Visibility Controls)
  2. Account Status (Archived, Deleted with Soft Delete)
  3. Account Metadata (Last Activity, Transfer History)
  4. Enhanced Account Types and Categories
  5. Account Analytics and Insights Support
*/

-- Add new fields to financial_accounts table
DO $$
BEGIN
  -- Add pin to dashboard field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
  END IF;

  -- Add archive status field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
  END IF;

  -- Add soft delete field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN deleted_at timestamptz;
  END IF;

  -- Add last activity tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN last_activity_at timestamptz;
  END IF;

  -- Add account description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'description'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN description text;
  END IF;

  -- Add account tags for categorization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'tags'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;

  -- Add account priority for sorting
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'priority'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN priority integer DEFAULT 0;
  END IF;

  -- Add account color for UI customization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'color'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN color text;
  END IF;

  -- Add account notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'notes'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN notes text;
  END IF;

  -- Add account status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'status'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN status text NOT NULL DEFAULT 'active' 
      CHECK (status = ANY (ARRAY['active', 'inactive', 'suspended', 'closed']));
  END IF;

  -- Add account opening date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'opened_at'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN opened_at timestamptz DEFAULT now();
  END IF;

  -- Add account closing date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN closed_at timestamptz;
  END IF;

  -- Add account limit for credit cards
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN credit_limit numeric(15,2);
  END IF;

  -- Add minimum balance requirement
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'minimum_balance'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN minimum_balance numeric(15,2) DEFAULT 0;
  END IF;

  -- Add interest rate for savings accounts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'interest_rate'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN interest_rate numeric(5,4) DEFAULT 0;
  END IF;

  -- Add account fees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'monthly_fee'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN monthly_fee numeric(15,2) DEFAULT 0;
  END IF;

  -- Add account routing information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'routing_number'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN routing_number text;
  END IF;

  -- Add account IBAN for international accounts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'iban'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN iban text;
  END IF;

  -- Add account SWIFT code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'swift_code'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN swift_code text;
  END IF;

  -- Add account holder name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'account_holder_name'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN account_holder_name text;
  END IF;

  -- Add account holder type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'account_holder_type'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN account_holder_type text DEFAULT 'individual' 
      CHECK (account_holder_type = ANY (ARRAY['individual', 'joint', 'business', 'trust']));
  END IF;

  -- Add account verification status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
  END IF;

  -- Add account sync status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN last_synced_at timestamptz;
  END IF;

  -- Add account sync source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'sync_source'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN sync_source text;
  END IF;

  -- Add account external ID for syncing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN external_id text;
  END IF;

  -- Add account metadata JSON field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_accounts' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE financial_accounts ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create account_transfers table for transfer history
CREATE TABLE IF NOT EXISTS account_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  to_account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  converted_amount numeric(15,2),
  exchange_rate numeric(15,8),
  description text,
  transfer_type text NOT NULL DEFAULT 'manual' CHECK (transfer_type = ANY (ARRAY['manual', 'scheduled', 'recurring', 'auto'])),
  status text NOT NULL DEFAULT 'completed' CHECK (status = ANY (ARRAY['pending', 'completed', 'failed', 'cancelled'])),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text
);

-- Create account_analytics table for account insights
CREATE TABLE IF NOT EXISTS account_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_income numeric(15,2) DEFAULT 0,
  total_expenses numeric(15,2) DEFAULT 0,
  net_flow numeric(15,2) DEFAULT 0,
  transaction_count integer DEFAULT 0,
  average_transaction_amount numeric(15,2) DEFAULT 0,
  largest_transaction numeric(15,2) DEFAULT 0,
  smallest_transaction numeric(15,2) DEFAULT 0,
  most_common_category text,
  most_common_merchant text,
  balance_trend text CHECK (balance_trend = ANY (ARRAY['increasing', 'decreasing', 'stable', 'volatile'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, period_start, period_end)
);

-- Create account_goals table for account-specific goals
CREATE TABLE IF NOT EXISTS account_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type = ANY (ARRAY['balance_target', 'savings_rate', 'spending_limit', 'transaction_limit'])),
  target_value numeric(15,2) NOT NULL,
  current_value numeric(15,2) DEFAULT 0,
  target_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS financial_accounts_is_primary_idx ON financial_accounts(is_primary);
CREATE INDEX IF NOT EXISTS financial_accounts_is_archived_idx ON financial_accounts(is_archived);
CREATE INDEX IF NOT EXISTS financial_accounts_deleted_at_idx ON financial_accounts(deleted_at);
CREATE INDEX IF NOT EXISTS financial_accounts_last_activity_at_idx ON financial_accounts(last_activity_at);
CREATE INDEX IF NOT EXISTS financial_accounts_status_idx ON financial_accounts(status);
CREATE INDEX IF NOT EXISTS financial_accounts_priority_idx ON financial_accounts(priority);
CREATE INDEX IF NOT EXISTS financial_accounts_tags_idx ON financial_accounts USING GIN(tags);
CREATE INDEX IF NOT EXISTS financial_accounts_metadata_idx ON financial_accounts USING GIN(metadata);

CREATE INDEX IF NOT EXISTS account_transfers_user_id_idx ON account_transfers(user_id);
CREATE INDEX IF NOT EXISTS account_transfers_from_account_id_idx ON account_transfers(from_account_id);
CREATE INDEX IF NOT EXISTS account_transfers_to_account_id_idx ON account_transfers(to_account_id);
CREATE INDEX IF NOT EXISTS account_transfers_created_at_idx ON account_transfers(created_at DESC);

CREATE INDEX IF NOT EXISTS account_analytics_account_id_idx ON account_analytics(account_id);
CREATE INDEX IF NOT EXISTS account_analytics_user_id_idx ON account_analytics(user_id);
CREATE INDEX IF NOT EXISTS account_analytics_period_start_idx ON account_analytics(period_start);

CREATE INDEX IF NOT EXISTS account_goals_account_id_idx ON account_goals(account_id);
CREATE INDEX IF NOT EXISTS account_goals_user_id_idx ON account_goals(user_id);
CREATE INDEX IF NOT EXISTS account_goals_is_active_idx ON account_goals(is_active);

-- Enable RLS on new tables
ALTER TABLE account_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_transfers
CREATE POLICY "Users can read own account transfers"
  ON account_transfers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account transfers"
  ON account_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account transfers"
  ON account_transfers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for account_analytics
CREATE POLICY "Users can read own account analytics"
  ON account_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account analytics"
  ON account_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account analytics"
  ON account_analytics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for account_goals
CREATE POLICY "Users can read own account goals"
  ON account_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account goals"
  ON account_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account goals"
  ON account_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own account goals"
  ON account_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger functions for updated_at columns
CREATE TRIGGER update_account_analytics_updated_at
  BEFORE UPDATE ON account_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_goals_updated_at
  BEFORE UPDATE ON account_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update account last activity
CREATE OR REPLACE FUNCTION update_account_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_activity_at for both from and to accounts
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE financial_accounts 
    SET last_activity_at = now()
    WHERE id = NEW.account_id;
    
    -- If it's a transfer, update both accounts
    IF TG_TABLE_NAME = 'account_transfers' THEN
      UPDATE financial_accounts 
      SET last_activity_at = now()
      WHERE id = NEW.to_account_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update last activity
CREATE TRIGGER update_account_activity_on_transaction
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_last_activity();

CREATE TRIGGER update_account_activity_on_transfer
  AFTER INSERT OR UPDATE ON account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_account_last_activity();

-- Function to soft delete account
CREATE OR REPLACE FUNCTION soft_delete_account(account_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE financial_accounts 
  SET 
    deleted_at = now(),
    is_archived = true,
    is_visible = false,
    status = 'closed'
  WHERE id = account_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to restore soft deleted account
CREATE OR REPLACE FUNCTION restore_account(account_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE financial_accounts 
  SET 
    deleted_at = NULL,
    is_archived = false,
    is_visible = true,
    status = 'active'
  WHERE id = account_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get account summary
CREATE OR REPLACE FUNCTION get_account_summary(account_uuid uuid)
RETURNS TABLE (
  account_id uuid,
  account_name text,
  current_balance numeric,
  currency text,
  last_activity timestamptz,
  transaction_count bigint,
  total_income numeric,
  total_expenses numeric,
  net_flow numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id,
    fa.name,
    fa.balance,
    fa.currency,
    fa.last_activity_at,
    COUNT(t.id) as transaction_count,
    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(t.amount), 0) as net_flow
  FROM financial_accounts fa
  LEFT JOIN transactions t ON fa.id = t.account_id
  WHERE fa.id = account_uuid
  GROUP BY fa.id, fa.name, fa.balance, fa.currency, fa.last_activity_at;
END;
$$ LANGUAGE plpgsql;

-- Update existing accounts to have proper defaults
UPDATE financial_accounts 
SET 
  is_primary = false,
  is_archived = false,
  status = 'active',
  opened_at = COALESCE(opened_at, created_at),
  priority = 0,
  is_verified = true
WHERE is_primary IS NULL OR is_archived IS NULL OR status IS NULL;

-- Add comments for documentation
COMMENT ON TABLE account_transfers IS 'Tracks all transfers between accounts with currency conversion details';
COMMENT ON TABLE account_analytics IS 'Stores periodic analytics data for accounts';
COMMENT ON TABLE account_goals IS 'Account-specific goals and targets';

COMMENT ON COLUMN financial_accounts.is_primary IS 'Whether this account is pinned to dashboard';
COMMENT ON COLUMN financial_accounts.is_archived IS 'Whether this account is archived (soft delete)';
COMMENT ON COLUMN financial_accounts.deleted_at IS 'Timestamp when account was soft deleted';
COMMENT ON COLUMN financial_accounts.last_activity_at IS 'Last time account had any activity';
COMMENT ON COLUMN financial_accounts.tags IS 'Array of tags for categorizing accounts';
COMMENT ON COLUMN financial_accounts.priority IS 'Priority for sorting (higher = more important)';
COMMENT ON COLUMN financial_accounts.metadata IS 'Additional account metadata as JSON';
