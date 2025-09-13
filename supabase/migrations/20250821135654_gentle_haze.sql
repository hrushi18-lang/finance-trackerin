

  1. New Tables
    - `financial_accounts` - Multi-account management (Bank, UPI, Cash, Credit Cards, Investment)
    - `income_sources` - Multiple income stream tracking with reliability scoring
    - `account_transfers` - Cross-account transfer tracking
    - `category_budgets` - Category-specific budget management
    - `bill_reminders` - Smart bill tracking and notifications
    - `debt_payments` - Comprehensive debt payment tracking
    - `transaction_splits` - Split transaction management
    - `financial_insights` - AI-generated financial insights storage

  2. Enhanced Tables
    - Enhanced `transactions` table with account linking and balance impact control
    - Enhanced `user_categories` table with hierarchical support
    - Enhanced `recurring_transactions` table with bill management features
    - Enhanced `liabilities` table with advanced debt tracking

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for authenticated users
    - Proper foreign key constraints and data integrity

  4. Performance
    - Optimized indexes for fast queries
    - Trigger functions for automatic updates
    - Efficient data relationships
*/

-- Financial Accounts Table
CREATE TABLE IF NOT EXISTS financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY[
    'bank_savings', 'bank_current', 'bank_student', 
    'digital_wallet', 'cash', 'credit_card', 'investment'
  ])),
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  institution text,
  platform text,
  account_number text,
  is_visible boolean NOT NULL DEFAULT true,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Income Sources Table
CREATE TABLE IF NOT EXISTS income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY[
    'salary', 'freelance', 'business', 'investment', 'rental', 'other'
  ])),
  amount numeric NOT NULL CHECK (amount > 0),
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY[
    'weekly', 'monthly', 'yearly'
  ])),
  is_active boolean NOT NULL DEFAULT true,
  last_received date,
  next_expected date,
  reliability text NOT NULL DEFAULT 'medium' CHECK (reliability = ANY (ARRAY[
    'high', 'medium', 'low'
  ])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Account Transfers Table
CREATE TABLE IF NOT EXISTS account_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  to_account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  from_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  to_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Category Budgets Table
CREATE TABLE IF NOT EXISTS category_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES user_categories(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  period text NOT NULL CHECK (period = ANY (ARRAY['weekly', 'monthly', 'yearly'])),
  alert_threshold numeric NOT NULL DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  rollover_unused boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, period)
);

-- Bill Reminders Table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recurring_transaction_id uuid NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending', 'paid', 'overdue', 'cancelled'
  ])),
  reminder_days integer NOT NULL DEFAULT 3 CHECK (reminder_days >= 0),
  payment_method text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY[
    'high', 'medium', 'low'
  ])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Debt Payments Table
CREATE TABLE IF NOT EXISTS debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liability_id uuid NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
  payment_amount numeric NOT NULL CHECK (payment_amount > 0),
  principal_amount numeric NOT NULL CHECK (principal_amount >= 0),
  interest_amount numeric NOT NULL CHECK (interest_amount >= 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Transaction Splits Table
CREATE TABLE IF NOT EXISTS transaction_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Financial Insights Table
CREATE TABLE IF NOT EXISTS financial_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type text NOT NULL CHECK (insight_type = ANY (ARRAY[
    'spending_pattern', 'savings_opportunity', 'budget_alert', 'goal_progress', 'debt_optimization'
  ])),
  title text NOT NULL,
  description text NOT NULL,
  impact_level text NOT NULL CHECK (impact_level = ANY (ARRAY['high', 'medium', 'low'])),
  is_read boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enhance existing transactions table
DO $$
BEGIN
  -- Add account linking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add balance impact control
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'affects_balance'
  ) THEN
    ALTER TABLE transactions ADD COLUMN affects_balance boolean NOT NULL DEFAULT true;
  END IF;

  -- Add reason for non-balance affecting transactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'reason'
  ) THEN
    ALTER TABLE transactions ADD COLUMN reason text;
  END IF;

  -- Add transfer tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'transfer_to_account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN transfer_to_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add transaction status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN status text NOT NULL DEFAULT 'completed' CHECK (status = ANY (ARRAY[
      'completed', 'pending', 'cancelled'
    ]));
  END IF;
END $$;

-- Enhance user_categories table for hierarchical support
DO $$
BEGIN
  -- Add parent category support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_categories' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE user_categories ADD COLUMN parent_id uuid REFERENCES user_categories(id) ON DELETE CASCADE;
  END IF;

  -- Add description field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_categories' AND column_name = 'description'
  ) THEN
    ALTER TABLE user_categories ADD COLUMN description text;
  END IF;

  -- Add sort order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_categories' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE user_categories ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Enhance recurring_transactions table for bill management
DO $$
BEGIN
  -- Add bill flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'is_bill'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN is_bill boolean NOT NULL DEFAULT false;
  END IF;

  -- Add payment method
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN payment_method text;
  END IF;

  -- Add account linking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add priority
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'priority'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY[
      'high', 'medium', 'low'
    ]));
  END IF;

  -- Add reminder settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'reminder_days'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN reminder_days integer NOT NULL DEFAULT 3;
  END IF;

  -- Add auto processing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'auto_process'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN auto_process boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Enhance liabilities table for advanced debt management
DO $$
BEGIN
  -- Add payment tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'total_payments_made'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN total_payments_made numeric NOT NULL DEFAULT 0;
  END IF;

  -- Add last payment date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN last_payment_date date;
  END IF;

  -- Add payment method
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN payment_method text;
  END IF;

  -- Add auto payment flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'auto_payment_enabled'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN auto_payment_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS financial_accounts_user_id_idx ON financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS financial_accounts_type_idx ON financial_accounts(type);
CREATE INDEX IF NOT EXISTS income_sources_user_id_idx ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS income_sources_type_idx ON income_sources(type);
CREATE INDEX IF NOT EXISTS account_transfers_user_id_idx ON account_transfers(user_id);
CREATE INDEX IF NOT EXISTS account_transfers_date_idx ON account_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS category_budgets_user_id_idx ON category_budgets(user_id);
CREATE INDEX IF NOT EXISTS category_budgets_category_idx ON category_budgets(category_id);
CREATE INDEX IF NOT EXISTS bill_reminders_user_id_idx ON bill_reminders(user_id);
CREATE INDEX IF NOT EXISTS bill_reminders_due_date_idx ON bill_reminders(due_date);
CREATE INDEX IF NOT EXISTS debt_payments_user_id_idx ON debt_payments(user_id);
CREATE INDEX IF NOT EXISTS debt_payments_liability_idx ON debt_payments(liability_id);
CREATE INDEX IF NOT EXISTS transaction_splits_parent_idx ON transaction_splits(parent_transaction_id);
CREATE INDEX IF NOT EXISTS financial_insights_user_id_idx ON financial_insights(user_id);
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON transactions(account_id);
CREATE INDEX IF NOT EXISTS user_categories_parent_id_idx ON user_categories(parent_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_account_id_idx ON recurring_transactions(account_id);

-- Enable RLS on all new tables
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_accounts
CREATE POLICY "Users can read own accounts"
  ON financial_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON financial_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON financial_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON financial_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for income_sources
CREATE POLICY "Users can read own income sources"
  ON income_sources
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income sources"
  ON income_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income sources"
  ON income_sources
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income sources"
  ON income_sources
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for account_transfers
CREATE POLICY "Users can read own transfers"
  ON account_transfers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers"
  ON account_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for category_budgets
CREATE POLICY "Users can read own category budgets"
  ON category_budgets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category budgets"
  ON category_budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category budgets"
  ON category_budgets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own category budgets"
  ON category_budgets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for bill_reminders
CREATE POLICY "Users can read own bill reminders"
  ON bill_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bill reminders"
  ON bill_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bill reminders"
  ON bill_reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bill reminders"
  ON bill_reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for debt_payments
CREATE POLICY "Users can read own debt payments"
  ON debt_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debt payments"
  ON debt_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transaction_splits
CREATE POLICY "Users can read own transaction splits"
  ON transaction_splits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction splits"
  ON transaction_splits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for financial_insights
CREATE POLICY "Users can read own insights"
  ON financial_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON financial_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON financial_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger functions for automatic updates
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update account balance when transaction affects balance
  IF NEW.affects_balance = true AND NEW.account_id IS NOT NULL THEN
    IF NEW.type = 'income' THEN
      UPDATE financial_accounts 
      SET balance = balance + NEW.amount, updated_at = now()
      WHERE id = NEW.account_id;
    ELSE
      UPDATE financial_accounts 
      SET balance = balance - NEW.amount, updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction balance updates
DROP TRIGGER IF EXISTS update_account_balance_trigger ON transactions;
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Create trigger functions for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_financial_accounts_updated_at'
  ) THEN
    CREATE TRIGGER update_financial_accounts_updated_at
      BEFORE UPDATE ON financial_accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_income_sources_updated_at'
  ) THEN
    CREATE TRIGGER update_income_sources_updated_at
      BEFORE UPDATE ON income_sources
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_category_budgets_updated_at'
  ) THEN
    CREATE TRIGGER update_category_budgets_updated_at
      BEFORE UPDATE ON category_budgets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_bill_reminders_updated_at'
  ) THEN
    CREATE TRIGGER update_bill_reminders_updated_at
      BEFORE UPDATE ON bill_reminders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;