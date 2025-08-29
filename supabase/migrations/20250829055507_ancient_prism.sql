/*
  # Upgrade Liabilities and Bills System

  1. Enhanced Tables
    - `enhanced_liabilities` - Comprehensive debt tracking
    - `bills` - Recurring and one-time payment obligations  
    - `bill_instances` - Individual bill occurrences
    - `liability_payments` - Payment history tracking
    - `assets` - Asset tracking for secured debts
    - `notifications` - Bill reminders and alerts

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Features
    - Multiple liability types (loans, credit cards, BNPL, etc.)
    - Bill automation and status tracking
    - Payment scheduling and reminders
    - Asset-liability linking for mortgages/auto loans
    - Comprehensive payment history
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own accounts" ON financial_accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON financial_accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON financial_accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON financial_accounts;

-- Enhanced Liabilities Table
CREATE TABLE IF NOT EXISTS enhanced_liabilities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  liability_type varchar(50) NOT NULL CHECK (liability_type IN ('personal_loan', 'student_loan', 'auto_loan', 'mortgage', 'credit_card', 'bnpl', 'installment', 'other')),
  description text,
  total_amount numeric(12,2) NOT NULL CHECK (total_amount > 0),
  remaining_amount numeric(12,2) NOT NULL CHECK (remaining_amount >= 0),
  interest_rate numeric(5,2) DEFAULT 0,
  monthly_payment numeric(12,2),
  minimum_payment numeric(12,2),
  payment_day integer DEFAULT 1 CHECK (payment_day >= 1 AND payment_day <= 31),
  loan_term_months integer,
  remaining_term_months integer,
  start_date date NOT NULL,
  due_date date,
  next_payment_date date,
  linked_asset_id uuid REFERENCES assets(id),
  is_secured boolean DEFAULT false,
  disbursement_account_id uuid REFERENCES financial_accounts(id),
  default_payment_account_id uuid REFERENCES financial_accounts(id),
  provides_funds boolean DEFAULT false,
  affects_credit_score boolean DEFAULT true,
  status varchar(50) DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted', 'restructured', 'closed')),
  is_active boolean DEFAULT true,
  auto_generate_bills boolean DEFAULT false,
  bill_generation_day integer DEFAULT 1 CHECK (bill_generation_day >= 1 AND bill_generation_day <= 31),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assets Table (for secured debts)
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  asset_type varchar(100) NOT NULL,
  description text,
  purchase_value numeric(12,2) NOT NULL CHECK (purchase_value >= 0),
  current_value numeric(12,2) NOT NULL CHECK (current_value >= 0),
  depreciation_rate numeric(5,2) DEFAULT 0,
  purchase_date date NOT NULL,
  last_valuation_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  category varchar(100) NOT NULL,
  bill_type varchar(50) NOT NULL CHECK (bill_type IN ('fixed', 'variable', 'one_time', 'liability_linked')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  estimated_amount numeric(12,2),
  frequency varchar(50) NOT NULL CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom', 'one_time')),
  custom_frequency_days integer,
  due_date date NOT NULL,
  next_due_date date NOT NULL,
  last_paid_date date,
  default_account_id uuid REFERENCES financial_accounts(id),
  auto_pay boolean DEFAULT false,
  linked_liability_id uuid REFERENCES liabilities(id),
  is_emi boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_essential boolean DEFAULT false,
  reminder_days_before integer DEFAULT 3,
  send_due_date_reminder boolean DEFAULT true,
  send_overdue_reminder boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bill Instances Table (individual bill occurrences)
CREATE TABLE IF NOT EXISTS bill_instances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  actual_amount numeric(12,2),
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'skipped', 'overdue')),
  payment_method varchar(50) CHECK (payment_method IN ('auto', 'manual', 'other_account')),
  paid_date timestamptz,
  paid_from_account_id uuid REFERENCES financial_accounts(id),
  transaction_id uuid REFERENCES transactions(id),
  failure_reason text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  late_fee numeric(12,2) DEFAULT 0,
  penalty_applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Liability Payments Table (payment history)
CREATE TABLE IF NOT EXISTS liability_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  liability_id uuid NOT NULL REFERENCES enhanced_liabilities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL,
  payment_type varchar(50) NOT NULL CHECK (payment_type IN ('regular', 'extra', 'minimum', 'full', 'partial')),
  principal_amount numeric(12,2) DEFAULT 0,
  interest_amount numeric(12,2) DEFAULT 0,
  fees_amount numeric(12,2) DEFAULT 0,
  paid_from_account_id uuid REFERENCES financial_accounts(id),
  transaction_id uuid REFERENCES transactions(id),
  bill_instance_id uuid REFERENCES bill_instances(id),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  notification_type varchar(50) NOT NULL CHECK (notification_type IN ('bill_reminder', 'bill_overdue', 'liability_due', 'payment_failed', 'payment_success', 'bill_generated')),
  bill_id uuid REFERENCES bills(id),
  bill_instance_id uuid REFERENCES bill_instances(id),
  liability_id uuid REFERENCES enhanced_liabilities(id),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  send_email boolean DEFAULT true,
  send_push boolean DEFAULT true,
  send_sms boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_user_id ON enhanced_liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_type ON enhanced_liabilities(liability_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_status ON enhanced_liabilities(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_next_payment ON enhanced_liabilities(next_payment_date);

CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets(is_active);

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_next_due_date ON bills(next_due_date);
CREATE INDEX IF NOT EXISTS idx_bills_active ON bills(is_active);

CREATE INDEX IF NOT EXISTS idx_bill_instances_user_id ON bill_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_instances_bill_id ON bill_instances(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_instances_status ON bill_instances(status);
CREATE INDEX IF NOT EXISTS idx_bill_instances_due_date ON bill_instances(due_date);

CREATE INDEX IF NOT EXISTS idx_liability_payments_user_id ON liability_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_liability_payments_liability_id ON liability_payments(liability_id);
CREATE INDEX IF NOT EXISTS idx_liability_payments_date ON liability_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);

-- Enable RLS on all tables
ALTER TABLE enhanced_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE liability_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Enhanced Liabilities
DROP POLICY IF EXISTS "Users can view their own enhanced liabilities" ON enhanced_liabilities;
DROP POLICY IF EXISTS "Users can insert their own enhanced liabilities" ON enhanced_liabilities;
DROP POLICY IF EXISTS "Users can update their own enhanced liabilities" ON enhanced_liabilities;
DROP POLICY IF EXISTS "Users can delete their own enhanced liabilities" ON enhanced_liabilities;

CREATE POLICY "Users can view their own enhanced liabilities"
  ON enhanced_liabilities FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enhanced liabilities"
  ON enhanced_liabilities FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enhanced liabilities"
  ON enhanced_liabilities FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enhanced liabilities"
  ON enhanced_liabilities FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- RLS Policies for Assets
DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;

CREATE POLICY "Users can view their own assets"
  ON assets FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON assets FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- RLS Policies for Bills
DROP POLICY IF EXISTS "Users can view their own bills" ON bills;
DROP POLICY IF EXISTS "Users can insert their own bills" ON bills;
DROP POLICY IF EXISTS "Users can update their own bills" ON bills;
DROP POLICY IF EXISTS "Users can delete their own bills" ON bills;

CREATE POLICY "Users can view their own bills"
  ON bills FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON bills FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bills FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON bills FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- RLS Policies for Bill Instances
DROP POLICY IF EXISTS "Users can view their own bill instances" ON bill_instances;
DROP POLICY IF EXISTS "Users can insert their own bill instances" ON bill_instances;
DROP POLICY IF EXISTS "Users can update their own bill instances" ON bill_instances;
DROP POLICY IF EXISTS "Users can delete their own bill instances" ON bill_instances;

CREATE POLICY "Users can view their own bill instances"
  ON bill_instances FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bill instances"
  ON bill_instances FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bill instances"
  ON bill_instances FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bill instances"
  ON bill_instances FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- RLS Policies for Liability Payments
DROP POLICY IF EXISTS "Users can view their own liability payments" ON liability_payments;
DROP POLICY IF EXISTS "Users can insert their own liability payments" ON liability_payments;
DROP POLICY IF EXISTS "Users can update their own liability payments" ON liability_payments;
DROP POLICY IF EXISTS "Users can delete their own liability payments" ON liability_payments;

CREATE POLICY "Users can view their own liability payments"
  ON liability_payments FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liability payments"
  ON liability_payments FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own liability payments"
  ON liability_payments FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liability payments"
  ON liability_payments FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- RLS Policies for Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON notifications FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Recreate Financial Accounts policies
CREATE POLICY "Users can read own accounts"
  ON financial_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON financial_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON financial_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON financial_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Account Balance History policies (fix the original error)
DROP POLICY IF EXISTS "Users can view their balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can insert balance history" ON account_balance_history;

CREATE POLICY "Users can view their balance history"
  ON account_balance_history FOR SELECT
  TO public
  USING (auth.uid() IN (
    SELECT user_id FROM financial_accounts WHERE id = account_balance_history.account_id
  ));

CREATE POLICY "Users can insert balance history"
  ON account_balance_history FOR INSERT
  TO public
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM financial_accounts WHERE id = account_balance_history.account_id
  ));

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_enhanced_liabilities_updated_at ON enhanced_liabilities;
CREATE TRIGGER update_enhanced_liabilities_updated_at
  BEFORE UPDATE ON enhanced_liabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bill_instances_updated_at ON bill_instances;
CREATE TRIGGER update_bill_instances_updated_at
  BEFORE UPDATE ON bill_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_liability_payments_updated_at ON liability_payments;
CREATE TRIGGER update_liability_payments_updated_at
  BEFORE UPDATE ON liability_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();