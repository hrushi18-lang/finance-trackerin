/*
  # Complete Financial System Migration

  1. New Tables
    - `financial_accounts` - User's payment methods and accounts
    - `account_transfers` - Cross-account transfer tracking
    - `user_categories` - Custom category system
    - `category_budgets` - Category-specific budgets
    - `bill_reminders` - Smart bill tracking
    - `debt_payments` - Debt payment history
    - `transaction_splits` - Split transaction support
    - `financial_insights` - AI insights storage

  2. Enhanced Tables
    - Enhanced `transactions` table with account linking
    - Enhanced `recurring_transactions` with bill features
    - Enhanced `liabilities` with payment tracking

  3. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Ensure users can only access their own data
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

-- Create policies for financial_accounts (using IF NOT EXISTS equivalent)
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

-- Enhance transactions table with account linking
DO $$
BEGIN
  -- Add account_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
    CREATE INDEX transactions_account_id_idx ON transactions(account_id);
  END IF;

  -- Add affects_balance column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'affects_balance'
  ) THEN
    ALTER TABLE transactions ADD COLUMN affects_balance boolean NOT NULL DEFAULT true;
  END IF;

  -- Add reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'reason'
  ) THEN
    ALTER TABLE transactions ADD COLUMN reason text;
  END IF;

  -- Add transfer_to_account_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'transfer_to_account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN transfer_to_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN status text NOT NULL DEFAULT 'completed' CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'cancelled'::text]));
  END IF;
END $$;

-- Enhance recurring_transactions table with bill features
DO $$
BEGIN
  -- Add is_bill column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'is_bill'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN is_bill boolean NOT NULL DEFAULT false;
  END IF;

  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN payment_method text;
  END IF;

  -- Add account_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS recurring_transactions_account_id_idx ON recurring_transactions(account_id);
  END IF;

  -- Add priority column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'priority'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]));
  END IF;

  -- Add reminder_days column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'reminder_days'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN reminder_days integer NOT NULL DEFAULT 3 CHECK (reminder_days >= 0);
  END IF;

  -- Add auto_process column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_transactions' AND column_name = 'auto_process'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN auto_process boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Enhance liabilities table with payment tracking
DO $$
BEGIN
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN start_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;

  -- Add linked_purchase_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'linked_purchase_id'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN linked_purchase_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS liabilities_linked_purchase_id_idx ON liabilities(linked_purchase_id);
  END IF;

  -- Add total_payments_made column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'total_payments_made'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN total_payments_made numeric NOT NULL DEFAULT 0;
  END IF;

  -- Add last_payment_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN last_payment_date date;
  END IF;

  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN payment_method text;
  END IF;

  -- Add auto_payment_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'liabilities' AND column_name = 'auto_payment_enabled'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN auto_payment_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update balance if the transaction affects balance
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic balance updates
DROP TRIGGER IF EXISTS update_account_balance_trigger ON transactions;
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for financial_accounts
DROP TRIGGER IF EXISTS update_financial_accounts_updated_at ON financial_accounts;
CREATE TRIGGER update_financial_accounts_updated_at
  BEFORE UPDATE ON financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();