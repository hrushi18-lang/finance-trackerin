-- Create Credit Card Bills System
-- This migration implements the comprehensive credit card bill feature

-- Credit Card Bill Cycles Table
CREATE TABLE IF NOT EXISTS public.credit_card_bill_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  
  -- Cycle Information
  cycle_start_date date NOT NULL,
  cycle_end_date date NOT NULL,
  statement_date date NOT NULL,
  due_date date NOT NULL,
  
  -- Billing Information
  opening_balance numeric(15,2) DEFAULT 0,
  closing_balance numeric(15,2) DEFAULT 0,
  total_charges numeric(15,2) DEFAULT 0,
  total_payments numeric(15,2) DEFAULT 0,
  total_credits numeric(15,2) DEFAULT 0,
  interest_charged numeric(15,2) DEFAULT 0,
  fees_charged numeric(15,2) DEFAULT 0,
  
  -- Payment Information
  minimum_due numeric(15,2) NOT NULL DEFAULT 0,
  full_balance_due numeric(15,2) NOT NULL DEFAULT 0,
  amount_paid numeric(15,2) DEFAULT 0,
  remaining_balance numeric(15,2) DEFAULT 0,
  
  -- Status and Lifecycle
  cycle_status text NOT NULL DEFAULT 'unbilled' CHECK (cycle_status IN (
    'unbilled', 'billed', 'partially_paid', 'paid_full', 'paid_minimum', 
    'overdue', 'carried_forward', 'closed', 'disputed'
  )),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid_full', 'paid_minimum', 'paid_partial', 'overdue', 'disputed'
  )),
  
  -- Currency Support
  currency_code text NOT NULL DEFAULT 'USD',
  original_amount numeric(15,2),
  original_currency text,
  exchange_rate_used numeric(10,4) DEFAULT 1.0,
  
  -- Metadata
  is_imported boolean DEFAULT false,
  import_source text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Credit Card Bill Payments Table
CREATE TABLE IF NOT EXISTS public.credit_card_bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_cycle_id uuid NOT NULL REFERENCES credit_card_bill_cycles(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Payment Details
  payment_amount numeric(15,2) NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('full', 'minimum', 'partial', 'overpayment')),
  payment_method text,
  payment_date date NOT NULL,
  
  -- Source Account
  source_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL,
  
  -- Currency Support
  currency_code text NOT NULL DEFAULT 'USD',
  original_amount numeric(15,2),
  original_currency text,
  exchange_rate_used numeric(10,4) DEFAULT 1.0,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Credit Card Account Settings Table
CREATE TABLE IF NOT EXISTS public.credit_card_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  
  -- Billing Cycle Settings
  billing_cycle_start_day integer NOT NULL DEFAULT 1 CHECK (billing_cycle_start_day >= 1 AND billing_cycle_start_day <= 31),
  billing_cycle_end_day integer NOT NULL DEFAULT 30 CHECK (billing_cycle_end_day >= 1 AND billing_cycle_end_day <= 31),
  due_date_days_after_statement integer NOT NULL DEFAULT 15 CHECK (due_date_days_after_statement >= 1 AND due_date_days_after_statement <= 60),
  
  -- Payment Settings
  minimum_due_percentage numeric(5,2) DEFAULT 5.0 CHECK (minimum_due_percentage > 0 AND minimum_due_percentage <= 100),
  auto_pay_enabled boolean DEFAULT false,
  auto_pay_amount_type text DEFAULT 'minimum' CHECK (auto_pay_amount_type IN ('minimum', 'full', 'custom')),
  auto_pay_custom_amount numeric(15,2),
  auto_pay_source_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL,
  
  -- Notification Settings
  reminder_days_before_due integer[] DEFAULT ARRAY[7, 3, 1],
  send_spending_alerts boolean DEFAULT true,
  spending_alert_thresholds numeric(15,2)[] DEFAULT ARRAY[50, 75, 90],
  send_overdue_alerts boolean DEFAULT true,
  
  -- Currency Settings
  primary_currency text NOT NULL DEFAULT 'USD',
  display_currency text NOT NULL DEFAULT 'USD',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(credit_card_account_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_card_bill_cycles_user_id ON credit_card_bill_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_bill_cycles_account_id ON credit_card_bill_cycles(credit_card_account_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_bill_cycles_status ON credit_card_bill_cycles(cycle_status);
CREATE INDEX IF NOT EXISTS idx_credit_card_bill_cycles_due_date ON credit_card_bill_cycles(due_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_bill_cycles_cycle_dates ON credit_card_bill_cycles(cycle_start_date, cycle_end_date);

CREATE INDEX IF NOT EXISTS idx_credit_card_bill_payments_user_id ON credit_card_bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_bill_payments_bill_cycle_id ON credit_card_bill_payments(bill_cycle_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_bill_payments_transaction_id ON credit_card_bill_payments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_credit_card_settings_user_id ON credit_card_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_settings_account_id ON credit_card_settings(credit_card_account_id);

-- Add credit card specific fields to bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_credit_card_bill boolean DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS credit_card_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_cycle_id uuid REFERENCES credit_card_bill_cycles(id) ON DELETE SET NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS minimum_due numeric(15,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS full_balance_due numeric(15,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('full', 'minimum', 'partial', 'overpayment'));
ALTER TABLE bills ADD COLUMN IF NOT EXISTS carry_forward_amount numeric(15,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS interest_charged numeric(15,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS fees_charged numeric(15,2) DEFAULT 0;

-- Create function to auto-generate credit card bills
CREATE OR REPLACE FUNCTION auto_generate_credit_card_bills()
RETURNS void AS $$
DECLARE
  card_record RECORD;
  cycle_record RECORD;
  current_cycle_start date;
  current_cycle_end date;
  statement_date date;
  due_date date;
  total_charges numeric(15,2);
  total_payments numeric(15,2);
  closing_balance numeric(15,2);
  minimum_due numeric(15,2);
  full_balance_due numeric(15,2);
BEGIN
  -- Loop through all active credit card accounts
  FOR card_record IN 
    SELECT fa.id, fa.user_id, fa.name, fa.currency, fa.credit_limit, fa.minimum_due,
           ccs.billing_cycle_start_day, ccs.billing_cycle_end_day, ccs.due_date_days_after_statement,
           ccs.minimum_due_percentage
    FROM financial_accounts fa
    LEFT JOIN credit_card_settings ccs ON fa.id = ccs.credit_card_account_id
    WHERE fa.type = 'credit_card' AND fa.is_visible = true
  LOOP
    -- Calculate current cycle dates
    current_cycle_start := date_trunc('month', CURRENT_DATE) + INTERVAL '1 day' * (card_record.billing_cycle_start_day - 1);
    current_cycle_end := date_trunc('month', current_cycle_start) + INTERVAL '1 month' + INTERVAL '1 day' * (card_record.billing_cycle_end_day - 1) - INTERVAL '1 day';
    statement_date := current_cycle_end;
    due_date := statement_date + INTERVAL '1 day' * COALESCE(card_record.due_date_days_after_statement, 15);
    
    -- Check if bill already exists for this cycle
    IF NOT EXISTS (
      SELECT 1 FROM credit_card_bill_cycles 
      WHERE credit_card_account_id = card_record.id 
      AND cycle_start_date = current_cycle_start 
      AND cycle_end_date = current_cycle_end
    ) THEN
      -- Calculate charges and payments for this cycle
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
      INTO total_charges, total_payments
      FROM transactions t
      WHERE t.account_id = card_record.id
      AND t.date >= current_cycle_start
      AND t.date <= current_cycle_end;
      
      -- Calculate closing balance
      closing_balance := total_charges - total_payments;
      
      -- Calculate minimum due (percentage of closing balance)
      minimum_due := closing_balance * (COALESCE(card_record.minimum_due_percentage, 5.0) / 100.0);
      full_balance_due := closing_balance;
      
      -- Only create bill if there are charges or outstanding balance
      IF closing_balance > 0 OR total_charges > 0 THEN
        -- Insert new bill cycle
        INSERT INTO credit_card_bill_cycles (
          user_id, credit_card_account_id, cycle_start_date, cycle_end_date,
          statement_date, due_date, closing_balance, total_charges, total_payments,
          minimum_due, full_balance_due, remaining_balance, cycle_status,
          currency_code, original_amount, original_currency, exchange_rate_used
        ) VALUES (
          card_record.user_id, card_record.id, current_cycle_start, current_cycle_end,
          statement_date, due_date, closing_balance, total_charges, total_payments,
          minimum_due, full_balance_due, closing_balance, 'billed',
          card_record.currency, closing_balance, card_record.currency, 1.0
        );
        
        -- Create corresponding bill entry
        INSERT INTO bills (
          user_id, title, description, category, bill_type, amount, currency_code,
          frequency, due_date, next_due_date, is_credit_card_bill, credit_card_account_id,
          minimum_due, full_balance_due, bill_stage, status, activity_scope,
          original_amount, original_currency, exchange_rate_used
        ) VALUES (
          card_record.user_id, 
          card_record.name || ' - ' || to_char(statement_date, 'Mon YYYY'),
          'Credit card statement for ' || to_char(current_cycle_start, 'Mon DD') || ' - ' || to_char(current_cycle_end, 'Mon DD, YYYY'),
          'Credit Card', 'liability_linked', closing_balance, card_record.currency,
          'monthly', due_date, due_date + INTERVAL '1 month', true, card_record.id,
          minimum_due, full_balance_due, 'pending', 'active', 'account_specific',
          closing_balance, card_record.currency, 1.0
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle credit card bill payments
CREATE OR REPLACE FUNCTION process_credit_card_payment(
  p_bill_cycle_id uuid,
  p_payment_amount numeric(15,2),
  p_payment_type text,
  p_source_account_id uuid,
  p_transaction_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  cycle_record RECORD;
  new_remaining_balance numeric(15,2);
  new_payment_status text;
  new_cycle_status text;
BEGIN
  -- Get current cycle information
  SELECT * INTO cycle_record
  FROM credit_card_bill_cycles
  WHERE id = p_bill_cycle_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit card bill cycle not found';
  END IF;
  
  -- Calculate new remaining balance
  new_remaining_balance := cycle_record.remaining_balance - p_payment_amount;
  
  -- Determine payment status
  IF new_remaining_balance <= 0 THEN
    new_payment_status := 'paid_full';
    new_cycle_status := 'paid_full';
  ELSIF p_payment_amount >= cycle_record.minimum_due THEN
    new_payment_status := 'paid_minimum';
    new_cycle_status := 'paid_minimum';
  ELSE
    new_payment_status := 'paid_partial';
    new_cycle_status := 'partially_paid';
  END IF;
  
  -- Record the payment
  INSERT INTO credit_card_bill_payments (
    user_id, bill_cycle_id, transaction_id, payment_amount, payment_type,
    payment_method, payment_date, source_account_id, currency_code,
    original_amount, original_currency, exchange_rate_used
  ) VALUES (
    cycle_record.user_id, p_bill_cycle_id, p_transaction_id, p_payment_amount, p_payment_type,
    'bank_transfer', CURRENT_DATE, p_source_account_id, cycle_record.currency_code,
    p_payment_amount, cycle_record.currency_code, 1.0
  );
  
  -- Update cycle status
  UPDATE credit_card_bill_cycles
  SET 
    amount_paid = amount_paid + p_payment_amount,
    remaining_balance = new_remaining_balance,
    payment_status = new_payment_status,
    cycle_status = new_cycle_status,
    updated_at = now()
  WHERE id = p_bill_cycle_id;
  
  -- Update corresponding bill
  UPDATE bills
  SET 
    bill_stage = CASE 
      WHEN new_remaining_balance <= 0 THEN 'paid'
      WHEN p_payment_amount >= cycle_record.minimum_due THEN 'paid'
      ELSE 'pending'
    END,
    status = CASE 
      WHEN new_remaining_balance <= 0 THEN 'completed'
      ELSE 'active'
    END,
    updated_at = now()
  WHERE credit_card_account_id = cycle_record.credit_card_account_id
  AND bill_cycle_id = p_bill_cycle_id;
END;
$$ LANGUAGE plpgsql;
