-- Migration: Enhance Budget System with comprehensive fields
-- Date: 2025-10-12
-- Description: Add budget name, description, type, recurrence, alerts, and rollover features

DO $$
BEGIN
  -- Add budget name/title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'name'
  ) THEN
    ALTER TABLE budgets ADD COLUMN name text;
  END IF;

  -- Add budget description/notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'description'
  ) THEN
    ALTER TABLE budgets ADD COLUMN description text;
  END IF;

  -- Add budget type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'budget_type'
  ) THEN
    ALTER TABLE budgets ADD COLUMN budget_type text DEFAULT 'variable_expense'
      CHECK (budget_type IN (
        'fixed_expense', 'variable_expense', 'debt_repayment', 'savings',
        'goal_oriented', 'cash_envelope', 'income_allocation', 'zero_based',
        'rolling', 'custom'
      ));
  END IF;

  -- Add recurrence pattern
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'recurrence'
  ) THEN
    ALTER TABLE budgets ADD COLUMN recurrence text DEFAULT 'monthly'
      CHECK (recurrence IN (
        'once', 'daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'
      ));
  END IF;

  -- Add alert threshold (percentage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'alert_threshold'
  ) THEN
    ALTER TABLE budgets ADD COLUMN alert_threshold numeric DEFAULT 80
      CHECK (alert_threshold >= 0 AND alert_threshold <= 100);
  END IF;

  -- Add alert enabled flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'alert_enabled'
  ) THEN
    ALTER TABLE budgets ADD COLUMN alert_enabled boolean DEFAULT true;
  END IF;

  -- Add currency field (for budget-specific currency)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'currency'
  ) THEN
    ALTER TABLE budgets ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  -- Add rollover settings for rolling budgets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'allow_rollover'
  ) THEN
    ALTER TABLE budgets ADD COLUMN allow_rollover boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'rolled_over_amount'
  ) THEN
    ALTER TABLE budgets ADD COLUMN rolled_over_amount numeric DEFAULT 0;
  END IF;

END $$;

-- Create index for budget type queries
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(budget_type);

-- Create index for active budgets
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(user_id, is_active) 
  WHERE is_active = true;

-- Create index for budget alerts
CREATE INDEX IF NOT EXISTS idx_budgets_alerts ON budgets(user_id, alert_enabled, is_active)
  WHERE alert_enabled = true AND is_active = true;

-- Add comment to table
COMMENT ON TABLE budgets IS 'Comprehensive budget tracking with multiple types, recurrence, and rollover support';

-- Add comments to new columns
COMMENT ON COLUMN budgets.name IS 'Budget name/title (e.g., "October Grocery Budget")';
COMMENT ON COLUMN budgets.description IS 'Optional notes about the budget';
COMMENT ON COLUMN budgets.budget_type IS 'Type of budget (fixed_expense, variable_expense, savings, etc.)';
COMMENT ON COLUMN budgets.recurrence IS 'How often the budget recurs (once, daily, weekly, monthly, etc.)';
COMMENT ON COLUMN budgets.alert_threshold IS 'Percentage at which to trigger alerts (default 80%)';
COMMENT ON COLUMN budgets.alert_enabled IS 'Whether to send alerts when threshold is reached';
COMMENT ON COLUMN budgets.allow_rollover IS 'Whether unused budget carries over to next period';
COMMENT ON COLUMN budgets.rolled_over_amount IS 'Amount rolled over from previous period';

