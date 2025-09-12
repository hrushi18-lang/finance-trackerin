-- Create unified financial_goals table for budgets, bills, and liabilities
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goal identification
  title text NOT NULL,
  description text,
  goal_type text NOT NULL CHECK (goal_type IN ('budget', 'bill', 'liability', 'savings_goal')),
  
  -- Financial details
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  currency_code text NOT NULL DEFAULT 'USD',
  
  -- Timing and scheduling
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  next_due_date date,
  period text CHECK (period IN ('weekly', 'bi_weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom', 'one_time')),
  custom_period_days integer,
  
  -- Status and lifecycle
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'due_today', 'paid', 'overdue', 'moved', 'stopped', 'archived', 'exceeded')),
  is_active boolean NOT NULL DEFAULT true,
  is_recurring boolean NOT NULL DEFAULT false,
  
  -- Categorization and scoping
  category text,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  activity_scope text CHECK (activity_scope IN ('general', 'account_specific', 'category_based')) DEFAULT 'general',
  
  -- Account and category linking
  account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL,
  account_ids uuid[],
  target_category text,
  
  -- Budget-specific fields
  budget_limit numeric(12,2),
  spent_amount numeric(12,2) DEFAULT 0,
  
  -- Bill-specific fields
  bill_frequency text,
  auto_pay boolean DEFAULT false,
  reminder_days_before integer DEFAULT 3,
  
  -- Liability-specific fields
  interest_rate numeric(5,2) DEFAULT 0,
  minimum_payment numeric(12,2),
  loan_term_months integer,
  remaining_term_months integer,
  
  -- Currency tracking
  original_amount numeric(12,2),
  original_currency text,
  exchange_rate_used numeric(10,4) DEFAULT 1.0,
  
  -- Metadata
  notes text,
  completion_notes text,
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_goal_type ON financial_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON financial_goals(status);
CREATE INDEX IF NOT EXISTS idx_financial_goals_due_date ON financial_goals(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_goals_category ON financial_goals(category);
CREATE INDEX IF NOT EXISTS idx_financial_goals_account_id ON financial_goals(account_id);

-- Create activity account links table for account-specific goals
CREATE TABLE IF NOT EXISTS public.activity_account_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('budget', 'bill', 'liability', 'goal')),
  activity_id uuid NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  payment_percentage numeric(5,2) DEFAULT 100.0,
  created_at timestamptz DEFAULT now()
);

-- Create index for activity account links
CREATE INDEX IF NOT EXISTS idx_activity_account_links_activity ON activity_account_links(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_account_links_account ON activity_account_links(account_id);
