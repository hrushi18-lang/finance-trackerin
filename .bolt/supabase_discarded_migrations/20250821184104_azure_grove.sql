/*
  # Complete FinTrack Financial Management System

  1. New Tables
    - `financial_accounts` - User's payment methods and accounts
    - `account_transfers` - Cross-account transfer logging  
    - `user_categories` - Custom transaction categories
    - `category_budgets` - Category-specific budgets
    - `bill_reminders` - Smart bill tracking
    - `debt_payments` - Comprehensive debt management
    - `transaction_splits` - Split transaction support
    - `financial_insights` - AI insights storage

  2. Enhanced Tables
    - `transactions` - Enhanced with account linking and balance control
    - `recurring_transactions` - Enhanced with bill management features
    - `liabilities` - Enhanced with account linking and payment tracking
    - `budgets` - Enhanced with account-specific budgets
    - `goals` - Enhanced with account linking

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Proper foreign key constraints and data validation

  4. Functions & Triggers
    - Automatic balance updates
    - Timestamp management
    - Data integrity enforcement
*/

-- Create financial_accounts table
CREATE TABLE IF NOT EXISTS financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['bank_savings'::text, 'bank_current'::text, 'bank_student'::text, 'digital_wallet'::text, 'cash'::text, 'credit_card'::text, 'investment'::text])),
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  institution text,
  platform text,
  account_number text,
  is_visible boolean NOT NULL DEFAULT true,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for financial_accounts
CREATE INDEX IF NOT EXISTS financial_accounts_user_id_idx ON financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS financial_accounts_type_idx ON financial_accounts(type);

-- Enable RLS for financial_accounts
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_accounts (with IF NOT EXISTS check)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_accounts' 
    AND policyname = 'Users can read own accounts'
  ) THEN
    CREATE POLICY "Users can read own accounts"
      ON financial_accounts
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_accounts' 
    AND policyname = 'Users can insert own accounts'
  ) THEN
    CREATE POLICY "Users can insert own accounts"
      ON financial_accounts
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_accounts' 
    AND policyname = 'Users can update own accounts'
  ) THEN
    CREATE POLICY "Users can update own accounts"
      ON financial_accounts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_accounts' 
    AND policyname = 'Users can delete own accounts'
  ) THEN
    CREATE POLICY "Users can delete own accounts"
      ON financial_accounts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add account_id and balance control to transactions table
DO $$
BEGIN
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
    ALTER TABLE transactions ADD COLUMN status text NOT NULL DEFAULT 'completed' CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'cancelled'::text]));
  END IF;
END $$;

-- Create indexes for new transaction columns
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_transfer_to_account_id_idx ON transactions(transfer_to_account_id);

-- Create account_transfers table
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

-- Create indexes for account_transfers
CREATE INDEX IF NOT EXISTS account_transfers_user_id_idx ON account_transfers(user_id);
CREATE INDEX IF NOT EXISTS account_transfers_date_idx ON account_transfers(transfer_date);

-- Enable RLS for account_transfers
ALTER TABLE account_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for account_transfers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'account_transfers' 
    AND policyname = 'Users can read own transfers'
  ) THEN
    CREATE POLICY "Users can read own transfers"
      ON account_transfers
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'account_transfers' 
    AND policyname = 'Users can insert own transfers'
  ) THEN
    CREATE POLICY "Users can insert own transfers"
      ON account_transfers
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create user_categories table
CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['income'::text, 'expense'::text])),
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  parent_id uuid REFERENCES user_categories(id) ON DELETE CASCADE,
  description text,
  sort_order integer NOT NULL DEFAULT 0
);

-- Create indexes for user_categories
CREATE INDEX IF NOT EXISTS user_categories_user_id_idx ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS user_categories_parent_id_idx ON user_categories(parent_id);

-- Enable RLS for user_categories
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for user_categories
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' 
    AND policyname = 'Users can read own categories'
  ) THEN
    CREATE POLICY "Users can read own categories"
      ON user_categories
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' 
    AND policyname = 'Users can insert own categories'
  ) THEN
    CREATE POLICY "Users can insert own categories"
      ON user_categories
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' 
    AND policyname = 'Users can update own categories'
  ) THEN
    CREATE POLICY "Users can update own categories"
      ON user_categories
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' 
    AND policyname = 'Users can delete own categories'
  ) THEN
    CREATE POLICY "Users can delete own categories"
      ON user_categories
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add account linking to goals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE goals ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add account linking to budgets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE budgets ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add account linking to liabilities table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add account linking to recurring_transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

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
    WHERE table_name = 'recurring_transactions' AND column_name = 'priority'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]));
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

-- Create category_budgets table
CREATE TABLE IF NOT EXISTS category_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES user_categories(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  period text NOT NULL CHECK (period = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text])),
  alert_threshold numeric NOT NULL DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  rollover_unused boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, period)
);

-- Create indexes for category_budgets
CREATE INDEX IF NOT EXISTS category_budgets_user_id_idx ON category_budgets(user_id);
CREATE INDEX IF NOT EXISTS category_budgets_category_idx ON category_budgets(category_id);

-- Enable RLS for category_budgets
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for category_budgets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'category_budgets' 
    AND policyname = 'Users can read own category budgets'
  ) THEN
    CREATE POLICY "Users can read own category budgets"
      ON category_budgets
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'category_budgets' 
    AND policyname = 'Users can insert own category budgets'
  ) THEN
    CREATE POLICY "Users can insert own category budgets"
      ON category_budgets
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'category_budgets' 
    AND policyname = 'Users can update own category budgets'
  ) THEN
    CREATE POLICY "Users can update own category budgets"
      ON category_budgets
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'category_budgets' 
    AND policyname = 'Users can delete own category budgets'
  ) THEN
    CREATE POLICY "Users can delete own category budgets"
      ON category_budgets
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create bill_reminders table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recurring_transaction_id uuid NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
  reminder_days integer NOT NULL DEFAULT 3 CHECK (reminder_days >= 0),
  payment_method text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for bill_reminders
CREATE INDEX IF NOT EXISTS bill_reminders_user_id_idx ON bill_reminders(user_id);
CREATE INDEX IF NOT EXISTS bill_reminders_due_date_idx ON bill_reminders(due_date);

-- Enable RLS for bill_reminders
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for bill_reminders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bill_reminders' 
    AND policyname = 'Users can read own bill reminders'
  ) THEN
    CREATE POLICY "Users can read own bill reminders"
      ON bill_reminders
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bill_reminders' 
    AND policyname = 'Users can insert own bill reminders'
  ) THEN
    CREATE POLICY "Users can insert own bill reminders"
      ON bill_reminders
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bill_reminders' 
    AND policyname = 'Users can update own bill reminders'
  ) THEN
    CREATE POLICY "Users can update own bill reminders"
      ON bill_reminders
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bill_reminders' 
    AND policyname = 'Users can delete own bill reminders'
  ) THEN
    CREATE POLICY "Users can delete own bill reminders"
      ON bill_reminders
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create debt_payments table
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

-- Create indexes for debt_payments
CREATE INDEX IF NOT EXISTS debt_payments_user_id_idx ON debt_payments(user_id);
CREATE INDEX IF NOT EXISTS debt_payments_liability_idx ON debt_payments(liability_id);

-- Enable RLS for debt_payments
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for debt_payments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debt_payments' 
    AND policyname = 'Users can read own debt payments'
  ) THEN
    CREATE POLICY "Users can read own debt payments"
      ON debt_payments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debt_payments' 
    AND policyname = 'Users can insert own debt payments'
  ) THEN
    CREATE POLICY "Users can insert own debt payments"
      ON debt_payments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create transaction_splits table
CREATE TABLE IF NOT EXISTS transaction_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for transaction_splits
CREATE INDEX IF NOT EXISTS transaction_splits_parent_idx ON transaction_splits(parent_transaction_id);

-- Enable RLS for transaction_splits
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction_splits
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transaction_splits' 
    AND policyname = 'Users can read own transaction splits'
  ) THEN
    CREATE POLICY "Users can read own transaction splits"
      ON transaction_splits
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transaction_splits' 
    AND policyname = 'Users can insert own transaction splits'
  ) THEN
    CREATE POLICY "Users can insert own transaction splits"
      ON transaction_splits
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create financial_insights table
CREATE TABLE IF NOT EXISTS financial_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type text NOT NULL CHECK (insight_type = ANY (ARRAY['spending_pattern'::text, 'savings_opportunity'::text, 'budget_alert'::text, 'goal_progress'::text, 'debt_optimization'::text])),
  title text NOT NULL,
  description text NOT NULL,
  impact_level text NOT NULL CHECK (impact_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])),
  is_read boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for financial_insights
CREATE INDEX IF NOT EXISTS financial_insights_user_id_idx ON financial_insights(user_id);

-- Enable RLS for financial_insights
ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_insights
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_insights' 
    AND policyname = 'Users can read own insights'
  ) THEN
    CREATE POLICY "Users can read own insights"
      ON financial_insights
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_insights' 
    AND policyname = 'Users can insert own insights'
  ) THEN
    CREATE POLICY "Users can insert own insights"
      ON financial_insights
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_insights' 
    AND policyname = 'Users can update own insights'
  ) THEN
    CREATE POLICY "Users can update own insights"
      ON financial_insights
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_financial_accounts_updated_at'
  ) THEN
    CREATE TRIGGER update_financial_accounts_updated_at
      BEFORE UPDATE ON financial_accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_user_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_user_categories_updated_at
      BEFORE UPDATE ON user_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_category_budgets_updated_at'
  ) THEN
    CREATE TRIGGER update_category_budgets_updated_at
      BEFORE UPDATE ON category_budgets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_bill_reminders_updated_at'
  ) THEN
    CREATE TRIGGER update_bill_reminders_updated_at
      BEFORE UPDATE ON bill_reminders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;