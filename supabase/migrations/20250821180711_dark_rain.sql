/*
  # Complete FinTrack Financial Management System

  1. New Tables
    - `financial_accounts` - User's payment methods and accounts
    - `income_sources` - Multiple income stream tracking
    - `account_transfers` - Cross-account transfer logging
    - `category_budgets` - Category-specific budget management
    - `user_categories` - Custom hierarchical categories
    - `bill_reminders` - Smart bill tracking and notifications
    - `debt_payments` - Comprehensive debt payment tracking
    - `transaction_splits` - Split transaction management
    - `financial_insights` - AI-generated insights storage

  2. Enhanced Tables
    - Enhanced `transactions` table with account linking
    - Enhanced `recurring_transactions` with bill features
    - Enhanced `liabilities` with payment tracking
    - Enhanced `goals` with account linking

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Financial Accounts Table (Payment Methods & Accounts)
CREATE TABLE IF NOT EXISTS financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank_savings', 'bank_current', 'bank_student', 'digital_wallet', 'cash', 'credit_card', 'investment')),
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  institution text, -- Bank name or platform
  platform text, -- For digital wallets (PayTM, PhonePe, etc.)
  account_number text, -- Optional account identifier
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
  type text NOT NULL CHECK (type IN ('salary', 'freelance', 'business', 'investment', 'rental', 'other')),
  amount numeric NOT NULL CHECK (amount > 0),
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  is_active boolean NOT NULL DEFAULT true,
  last_received date,
  next_expected date,
  reliability text NOT NULL DEFAULT 'medium' CHECK (reliability IN ('high', 'medium', 'low')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced Transactions Table
DO $$
BEGIN
  -- Add new columns to transactions table if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'affects_balance'
  ) THEN
    ALTER TABLE transactions ADD COLUMN affects_balance boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'reason'
  ) THEN
    ALTER TABLE transactions ADD COLUMN reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'transfer_to_account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN transfer_to_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled'));
  END IF;
END $$;

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

-- User Categories Table (Hierarchical)
CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  parent_id uuid REFERENCES user_categories(id) ON DELETE CASCADE,
  description text,
  sort_order integer NOT NULL DEFAULT 0
);

-- Category Budgets Table
CREATE TABLE IF NOT EXISTS category_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES user_categories(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  period text NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  alert_threshold numeric NOT NULL DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  rollover_unused boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, period)
);

-- Enhanced Recurring Transactions Table
DO $$
BEGIN
  -- Add new columns to recurring_transactions table if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'is_bill'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN is_bill boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'priority'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'reminder_days'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN reminder_days integer NOT NULL DEFAULT 3 CHECK (reminder_days >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'auto_process'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN auto_process boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Bill Reminders Table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recurring_transaction_id uuid NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  reminder_days integer NOT NULL DEFAULT 3 CHECK (reminder_days >= 0),
  payment_method text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced Liabilities Table
DO $$
BEGIN
  -- Add new columns to liabilities table if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN start_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'linked_purchase_id'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN linked_purchase_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'total_payments_made'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN total_payments_made numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN last_payment_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'auto_payment_enabled'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN auto_payment_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

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
  insight_type text NOT NULL CHECK (insight_type IN ('spending_pattern', 'savings_opportunity', 'budget_alert', 'goal_progress', 'debt_optimization')),
  title text NOT NULL,
  description text NOT NULL,
  impact_level text NOT NULL CHECK (impact_level IN ('high', 'medium', 'low')),
  is_read boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS financial_accounts_user_id_idx ON financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS financial_accounts_type_idx ON financial_accounts(type);
CREATE INDEX IF NOT EXISTS income_sources_user_id_idx ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS income_sources_type_idx ON income_sources(type);
CREATE INDEX IF NOT EXISTS account_transfers_user_id_idx ON account_transfers(user_id);
CREATE INDEX IF NOT EXISTS account_transfers_date_idx ON account_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS user_categories_user_id_idx ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS user_categories_parent_id_idx ON user_categories(parent_id);
CREATE INDEX IF NOT EXISTS category_budgets_user_id_idx ON category_budgets(user_id);
CREATE INDEX IF NOT EXISTS category_budgets_category_idx ON category_budgets(category_id);
CREATE INDEX IF NOT EXISTS bill_reminders_user_id_idx ON bill_reminders(user_id);
CREATE INDEX IF NOT EXISTS bill_reminders_due_date_idx ON bill_reminders(due_date);
CREATE INDEX IF NOT EXISTS debt_payments_user_id_idx ON debt_payments(user_id);
CREATE INDEX IF NOT EXISTS debt_payments_liability_idx ON debt_payments(liability_id);
CREATE INDEX IF NOT EXISTS transaction_splits_parent_idx ON transaction_splits(parent_transaction_id);
CREATE INDEX IF NOT EXISTS financial_insights_user_id_idx ON financial_insights(user_id);
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions(category);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_recurring_transaction_id_idx ON transactions(recurring_transaction_id);
CREATE INDEX IF NOT EXISTS transactions_parent_transaction_id_idx ON transactions(parent_transaction_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_user_id_idx ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_account_id_idx ON recurring_transactions(account_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_next_occurrence_date_idx ON recurring_transactions(next_occurrence_date);
CREATE INDEX IF NOT EXISTS liabilities_user_id_idx ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS liabilities_linked_purchase_id_idx ON liabilities(linked_purchase_id);

-- Enable RLS on all tables
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
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

-- RLS Policies for user_categories
CREATE POLICY "Users can read own categories"
  ON user_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON user_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON user_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON user_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Create triggers for updated_at columns
CREATE TRIGGER update_financial_accounts_updated_at
  BEFORE UPDATE ON financial_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_sources_updated_at
  BEFORE UPDATE ON income_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_categories_updated_at
  BEFORE UPDATE ON user_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_budgets_updated_at
  BEFORE UPDATE ON category_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_reminders_updated_at
  BEFORE UPDATE ON bill_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update account balance when transactions are created
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balance if the transaction affects balance and has an account
  IF NEW.affects_balance = true AND NEW.account_id IS NOT NULL THEN
    IF NEW.type = 'income' THEN
      UPDATE financial_accounts 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE financial_accounts 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.account_id;
    END IF;
    
    -- Handle transfers
    IF NEW.transfer_to_account_id IS NOT NULL THEN
      UPDATE financial_accounts 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.transfer_to_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for account balance updates
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();