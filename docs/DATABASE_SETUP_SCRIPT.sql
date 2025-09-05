-- Finance Tracker Database Setup Script
-- This script applies all necessary database changes for the Finance Tracker application

-- ==============================================
-- 1. FIX CURRENCY COLUMN ISSUE
-- ==============================================
-- Fix the currency column name mismatch
ALTER TABLE financial_accounts RENAME COLUMN currency TO currencycode;

-- ==============================================
-- 2. ADD GOALS VAULT ACCOUNT TYPE
-- ==============================================
-- Add goals_vault as an allowed account type
ALTER TABLE financial_accounts 
DROP CONSTRAINT IF EXISTS financial_accounts_type_check;

ALTER TABLE financial_accounts 
ADD CONSTRAINT financial_accounts_type_check 
CHECK (type = ANY (ARRAY[
  'bank_savings', 'bank_current', 'bank_student', 
  'digital_wallet', 'cash', 'credit_card', 'investment', 'goals_vault'
]));

-- ==============================================
-- 3. ENHANCE GOALS TABLE
-- ==============================================
-- Add enhanced goal fields
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'general_savings' CHECK (goal_type = ANY (ARRAY[
  'account_specific', 'category_based', 'general_savings', 'debt_payoff', 
  'investment', 'education', 'retirement', 'emergency_fund', 'vacation', 
  'home_purchase', 'wedding'
]));

ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_category text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS period_type text DEFAULT 'monthly' CHECK (period_type = ANY (ARRAY[
  'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
]));
ALTER TABLE goals ADD COLUMN IF NOT EXISTS custom_period_days integer;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS recurring_frequency text CHECK (recurring_frequency = ANY (ARRAY[
  'weekly', 'monthly', 'quarterly', 'yearly'
]));
ALTER TABLE goals ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority = ANY (ARRAY[
  'low', 'medium', 'high'
]));
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status = ANY (ARRAY[
  'active', 'paused', 'completed', 'cancelled'
]));
ALTER TABLE goals ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;

-- ==============================================
-- 4. ENHANCE BILLS TABLE
-- ==============================================
-- Add enhanced bill fields
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_category text DEFAULT 'general_expense' CHECK (bill_category = ANY (ARRAY[
  'account_specific', 'category_based', 'general_expense'
]));
ALTER TABLE bills ADD COLUMN IF NOT EXISTS target_category text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority = ANY (ARRAY[
  'low', 'medium', 'high'
]));
ALTER TABLE bills ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status = ANY (ARRAY[
  'active', 'paused', 'completed', 'cancelled'
]));

-- ==============================================
-- 5. ENHANCE TRANSACTIONS TABLE
-- ==============================================
-- Add transaction status
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed' CHECK (status = ANY (ARRAY[
  'completed', 'pending', 'scheduled', 'cancelled'
]));

-- Add balance impact control
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS affects_balance boolean NOT NULL DEFAULT true;

-- Add reason for non-balance affecting transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reason text;

-- Add transfer tracking
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transfer_to_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;

-- ==============================================
-- 6. CREATE GOAL CONTRIBUTIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  source_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  contribution_type text DEFAULT 'manual' CHECK (contribution_type = ANY (ARRAY[
    'manual', 'automatic', 'round_up', 'bonus', 'refund'
  ])),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ==============================================
-- 7. CREATE BILL INSTANCES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS bill_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  paid_amount numeric DEFAULT 0 CHECK (paid_amount >= 0),
  paid_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending', 'paid', 'overdue', 'cancelled', 'partial'
  ])),
  payment_method text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================
-- 8. CREATE CALENDAR EVENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY[
    'bill_due', 'goal_deadline', 'payment_due', 'budget_review',
    'investment_review', 'tax_deadline', 'custom', 'recurring_transaction',
    'account_review', 'debt_payment', 'savings_contribution'
  ])),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  is_all_day boolean DEFAULT true,
  is_recurring boolean DEFAULT false,
  recurring_pattern text CHECK (recurring_pattern = ANY (ARRAY[
    'daily', 'weekly', 'monthly', 'yearly', 'custom'
  ])),
  recurring_end_date date,
  source_id uuid, -- References the source record (bill, goal, etc.)
  source_type text, -- Type of source record
  priority text DEFAULT 'medium' CHECK (priority = ANY (ARRAY[
    'low', 'medium', 'high', 'urgent'
  ])),
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================
-- 9. CREATE ANALYTICS METRICS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type = ANY (ARRAY[
    'net_worth', 'total_income', 'total_expenses', 'savings_rate',
    'debt_to_income', 'credit_utilization', 'investment_return'
  ])),
  metric_value numeric NOT NULL,
  period text NOT NULL CHECK (period = ANY (ARRAY[
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  ])),
  period_date date NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metric_type, period, period_date)
);

-- ==============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
-- Goals indexes
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);
CREATE INDEX IF NOT EXISTS goals_goal_type_idx ON goals(goal_type);
CREATE INDEX IF NOT EXISTS goals_status_idx ON goals(status);
CREATE INDEX IF NOT EXISTS goals_account_id_idx ON goals(account_id);

-- Bills indexes
CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
CREATE INDEX IF NOT EXISTS bills_bill_category_idx ON bills(bill_category);
CREATE INDEX IF NOT EXISTS bills_status_idx ON bills(status);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS transactions_affects_balance_idx ON transactions(affects_balance);
CREATE INDEX IF NOT EXISTS transactions_transfer_to_account_idx ON transactions(transfer_to_account_id);

-- Goal contributions indexes
CREATE INDEX IF NOT EXISTS goal_contributions_goal_id_idx ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS goal_contributions_user_id_idx ON goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS goal_contributions_contribution_date_idx ON goal_contributions(contribution_date);

-- Bill instances indexes
CREATE INDEX IF NOT EXISTS bill_instances_bill_id_idx ON bill_instances(bill_id);
CREATE INDEX IF NOT EXISTS bill_instances_user_id_idx ON bill_instances(user_id);
CREATE INDEX IF NOT EXISTS bill_instances_due_date_idx ON bill_instances(due_date);
CREATE INDEX IF NOT EXISTS bill_instances_status_idx ON bill_instances(status);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_event_type_idx ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS calendar_events_event_date_idx ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS calendar_events_source_idx ON calendar_events(source_id, source_type);

-- Analytics metrics indexes
CREATE INDEX IF NOT EXISTS analytics_metrics_user_id_idx ON analytics_metrics(user_id);
CREATE INDEX IF NOT EXISTS analytics_metrics_metric_type_idx ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS analytics_metrics_period_idx ON analytics_metrics(period, period_date);

-- ==============================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ==============================================
-- Enable RLS on new tables
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 12. CREATE RLS POLICIES
-- ==============================================
-- Goal contributions policies
CREATE POLICY "Users can read own goal contributions"
  ON goal_contributions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal contributions"
  ON goal_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal contributions"
  ON goal_contributions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal contributions"
  ON goal_contributions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bill instances policies
CREATE POLICY "Users can read own bill instances"
  ON bill_instances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bill instances"
  ON bill_instances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bill instances"
  ON bill_instances
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bill instances"
  ON bill_instances
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can read own calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Analytics metrics policies
CREATE POLICY "Users can read own analytics metrics"
  ON analytics_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics metrics"
  ON analytics_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics metrics"
  ON analytics_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analytics metrics"
  ON analytics_metrics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================
-- 13. CREATE TRIGGER FUNCTIONS
-- ==============================================
-- Create trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_instances_updated_at
  BEFORE UPDATE ON bill_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 14. CREATE UTILITY FUNCTIONS
-- ==============================================
-- Function to calculate goal progress
CREATE OR REPLACE FUNCTION calculate_goal_progress(goal_id uuid)
RETURNS numeric AS $$
DECLARE
  goal_record goals%ROWTYPE;
  total_contributions numeric;
  progress_percentage numeric;
BEGIN
  -- Get goal details
  SELECT * INTO goal_record FROM goals WHERE id = goal_id;
  
  -- Calculate total contributions
  SELECT COALESCE(SUM(amount), 0) INTO total_contributions 
  FROM goal_contributions 
  WHERE goal_id = goal_id;
  
  -- Calculate progress percentage
  IF goal_record.target_amount > 0 THEN
    progress_percentage := (total_contributions / goal_record.target_amount) * 100;
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Update goal current_amount
  UPDATE goals 
  SET current_amount = total_contributions,
      updated_at = now()
  WHERE id = goal_id;
  
  RETURN LEAST(progress_percentage, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to create bill instances for recurring bills
CREATE OR REPLACE FUNCTION create_bill_instances()
RETURNS void AS $$
DECLARE
  bill_record bills%ROWTYPE;
  next_due_date date;
  instance_count integer;
BEGIN
  -- Process all active recurring bills
  FOR bill_record IN 
    SELECT * FROM bills 
    WHERE is_active = true 
    AND is_recurring = true 
    AND status = 'active'
  LOOP
    -- Calculate next due date
    next_due_date := bill_record.next_due_date;
    
    -- Create instances for the next 12 months
    instance_count := 0;
    WHILE instance_count < 12 AND next_due_date <= CURRENT_DATE + INTERVAL '1 year' LOOP
      -- Check if instance already exists
      IF NOT EXISTS (
        SELECT 1 FROM bill_instances 
        WHERE bill_id = bill_record.id 
        AND due_date = next_due_date
      ) THEN
        -- Create new instance
        INSERT INTO bill_instances (
          bill_id, user_id, due_date, amount, status
        ) VALUES (
          bill_record.id, 
          bill_record.user_id, 
          next_due_date, 
          bill_record.amount, 
          'pending'
        );
      END IF;
      
      -- Calculate next due date based on frequency
      CASE bill_record.frequency
        WHEN 'weekly' THEN
          next_due_date := next_due_date + INTERVAL '1 week';
        WHEN 'bi_weekly' THEN
          next_due_date := next_due_date + INTERVAL '2 weeks';
        WHEN 'monthly' THEN
          next_due_date := next_due_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
          next_due_date := next_due_date + INTERVAL '3 months';
        WHEN 'semi_annual' THEN
          next_due_date := next_due_date + INTERVAL '6 months';
        WHEN 'annual' THEN
          next_due_date := next_due_date + INTERVAL '1 year';
        ELSE
          EXIT; -- Unknown frequency, exit loop
      END CASE;
      
      instance_count := instance_count + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 15. CREATE SCHEDULED JOBS (if using pg_cron)
-- ==============================================
-- Note: This requires pg_cron extension to be enabled
-- Uncomment if you have pg_cron available

-- Schedule bill instance creation (runs daily)
-- SELECT cron.schedule('create-bill-instances', '0 1 * * *', 'SELECT create_bill_instances();');

-- ==============================================
-- 16. VERIFY SETUP
-- ==============================================
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'goals', 'bills', 'transactions', 'goal_contributions', 
  'bill_instances', 'calendar_events', 'analytics_metrics'
)
ORDER BY table_name;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'goals', 'bills', 'transactions', 'goal_contributions', 
  'bill_instances', 'calendar_events', 'analytics_metrics'
)
ORDER BY tablename;

-- Check if indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'goals', 'bills', 'transactions', 'goal_contributions', 
  'bill_instances', 'calendar_events', 'analytics_metrics'
)
ORDER BY tablename, indexname;

-- ==============================================
-- SETUP COMPLETE
-- ==============================================
-- The database is now ready for the Finance Tracker application
-- All necessary tables, indexes, policies, and functions have been created
