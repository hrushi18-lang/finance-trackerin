/*
  # Fix Account and Category Scoping Migration
  
  This migration adds missing fields for account-specific and category-specific
  features to the main financial tables.
*/

-- Add account and category scoping fields to goals table
DO $$
BEGIN
  -- Add account_id for account-specific goals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE goals ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add activity scope
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'activity_scope'
  ) THEN
    ALTER TABLE goals ADD COLUMN activity_scope text NOT NULL DEFAULT 'general' 
      CHECK (activity_scope = ANY (ARRAY['general', 'account_specific', 'category_based']));
  END IF;

  -- Add account IDs array for multi-account goals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'account_ids'
  ) THEN
    ALTER TABLE goals ADD COLUMN account_ids uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;

  -- Add target category for category-based goals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'target_category'
  ) THEN
    ALTER TABLE goals ADD COLUMN target_category text;
  END IF;

  -- Add currency code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE goals ADD COLUMN currency_code text NOT NULL DEFAULT 'USD';
  END IF;

  -- Add goal type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'goal_type'
  ) THEN
    ALTER TABLE goals ADD COLUMN goal_type text NOT NULL DEFAULT 'general_savings'
      CHECK (goal_type = ANY (ARRAY['general_savings', 'account_specific', 'category_based']));
  END IF;

  -- Add priority
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'priority'
  ) THEN
    ALTER TABLE goals ADD COLUMN priority text NOT NULL DEFAULT 'medium'
      CHECK (priority = ANY (ARRAY['low', 'medium', 'high']));
  END IF;

  -- Add status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'status'
  ) THEN
    ALTER TABLE goals ADD COLUMN status text NOT NULL DEFAULT 'active'
      CHECK (status = ANY (ARRAY['active', 'paused', 'completed', 'cancelled']));
  END IF;
END $$;

-- Add account and category scoping fields to budgets table
DO $$
BEGIN
  -- Add account_id for account-specific budgets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE budgets ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add activity scope
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'activity_scope'
  ) THEN
    ALTER TABLE budgets ADD COLUMN activity_scope text NOT NULL DEFAULT 'general'
      CHECK (activity_scope = ANY (ARRAY['general', 'account_specific', 'category_based']));
  END IF;

  -- Add account IDs array for multi-account budgets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'account_ids'
  ) THEN
    ALTER TABLE budgets ADD COLUMN account_ids uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;

  -- Add target category for category-based budgets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'target_category'
  ) THEN
    ALTER TABLE budgets ADD COLUMN target_category text;
  END IF;

  -- Add currency code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE budgets ADD COLUMN currency_code text NOT NULL DEFAULT 'USD';
  END IF;

  -- Add start and end dates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE budgets ADD COLUMN start_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE budgets ADD COLUMN end_date date;
  END IF;
END $$;

-- Add account and category scoping fields to liabilities table
DO $$
BEGIN
  -- Add account_id for account-specific liabilities
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add activity scope
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'activity_scope'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN activity_scope text NOT NULL DEFAULT 'general'
      CHECK (activity_scope = ANY (ARRAY['general', 'account_specific', 'category_based']));
  END IF;

  -- Add account IDs array for multi-account liabilities
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'account_ids'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN account_ids uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;

  -- Add target category for category-based liabilities
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'target_category'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN target_category text;
  END IF;

  -- Add currency code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN currency_code text NOT NULL DEFAULT 'USD';
  END IF;

  -- Add enhanced liability fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'liability_type'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN liability_type text NOT NULL DEFAULT 'other'
      CHECK (liability_type = ANY (ARRAY['personal_loan', 'student_loan', 'auto_loan', 'mortgage', 'credit_card', 'bnpl', 'installment', 'medical_debt', 'tax_debt', 'business_loan', 'other']));
  END IF;

  -- Add priority
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'priority'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN priority text NOT NULL DEFAULT 'medium'
      CHECK (priority = ANY (ARRAY['low', 'medium', 'high', 'urgent']));
  END IF;

  -- Add status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'status'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN status text NOT NULL DEFAULT 'active'
      CHECK (status = ANY (ARRAY['active', 'paid_off', 'defaulted', 'restructured', 'closed']));
  END IF;
END $$;

-- Add account and category scoping fields to recurring_transactions (bills) table
DO $$
BEGIN
  -- Add activity scope
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'activity_scope'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN activity_scope text NOT NULL DEFAULT 'general'
      CHECK (activity_scope = ANY (ARRAY['general', 'account_specific', 'category_based']));
  END IF;

  -- Add account IDs array for multi-account bills
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'account_ids'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN account_ids uuid[] DEFAULT ARRAY[]::uuid[];
  END IF;

  -- Add target category for category-based bills
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recurring_transactions' AND column_name = 'target_category'
  ) THEN
    ALTER TABLE recurring_transactions ADD COLUMN target_category text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS goals_account_id_idx ON goals(account_id);
CREATE INDEX IF NOT EXISTS goals_activity_scope_idx ON goals(activity_scope);
CREATE INDEX IF NOT EXISTS goals_goal_type_idx ON goals(goal_type);
CREATE INDEX IF NOT EXISTS goals_status_idx ON goals(status);

CREATE INDEX IF NOT EXISTS budgets_account_id_idx ON budgets(account_id);
CREATE INDEX IF NOT EXISTS budgets_activity_scope_idx ON budgets(activity_scope);

CREATE INDEX IF NOT EXISTS liabilities_account_id_idx ON liabilities(account_id);
CREATE INDEX IF NOT EXISTS liabilities_activity_scope_idx ON liabilities(activity_scope);
CREATE INDEX IF NOT EXISTS liabilities_liability_type_idx ON liabilities(liability_type);
CREATE INDEX IF NOT EXISTS liabilities_status_idx ON liabilities(status);

CREATE INDEX IF NOT EXISTS recurring_transactions_activity_scope_idx ON recurring_transactions(activity_scope);
