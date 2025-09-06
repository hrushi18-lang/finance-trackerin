/**
 * Apply Enhanced Liabilities Migration
 * This script applies the database migration for enhanced liability features
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://qbskidyauxehvswgckrv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlVCNnc3WEJRWkFnenlVSE9VQ0FzY2V9.bsRujcOiFI-5CN8-18guQLape444V-LV4mIk59a3S5I'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration SQL
const migrationSQL = `
-- Enhanced Liabilities System Migration
-- This migration adds comprehensive liability management features including:
-- 1. Enhanced liability fields for better tracking
-- 2. Bill linking capabilities
-- 3. Analytics and reporting features
-- 4. Payment history and scheduling
-- 5. Debt strategy tools

-- First, let's enhance the existing liabilities table with new fields
DO $$
BEGIN
  -- Add liability type field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'liability_type'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN liability_type text NOT NULL DEFAULT 'other' CHECK (liability_type = ANY (ARRAY[
      'personal_loan', 'student_loan', 'auto_loan', 'mortgage', 'credit_card', 'bnpl', 'installment', 'medical_debt', 'tax_debt', 'business_loan', 'other'
    ]));
  END IF;

  -- Add total amount field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0);
  END IF;

  -- Add minimum payment field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'minimum_payment'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN minimum_payment numeric NOT NULL DEFAULT 0 CHECK (minimum_payment >= 0);
  END IF;

  -- Add payment day field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'payment_day'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN payment_day integer NOT NULL DEFAULT 1 CHECK (payment_day >= 1 AND payment_day <= 31);
  END IF;

  -- Add loan term in months
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'loan_term_months'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN loan_term_months integer;
  END IF;

  -- Add remaining term in months
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'remaining_term_months'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN remaining_term_months integer;
  END IF;

  -- Add start date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN start_date date;
  END IF;

  -- Add next payment date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'next_payment_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN next_payment_date date;
  END IF;

  -- Add linked asset ID for secured loans
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'linked_asset_id'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN linked_asset_id uuid;
  END IF;

  -- Add status field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'status'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY[
      'active', 'paid_off', 'defaulted', 'restructured', 'closed', 'archived'
    ]));
  END IF;

  -- Add is active flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;

  -- Add priority field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'priority'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY[
      'high', 'medium', 'low'
    ]));
  END IF;

  -- Add notes field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'notes'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN notes text;
  END IF;

  -- Add credit impact field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'affects_credit_score'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN affects_credit_score boolean NOT NULL DEFAULT true;
  END IF;

  -- Add secured loan flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'is_secured'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN is_secured boolean NOT NULL DEFAULT false;
  END IF;

  -- Add provides funds flag (for credit lines)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'provides_funds'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN provides_funds boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create liability payment history table
CREATE TABLE IF NOT EXISTS liability_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liability_id uuid NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
  payment_amount numeric NOT NULL CHECK (payment_amount > 0),
  principal_amount numeric NOT NULL CHECK (principal_amount >= 0),
  interest_amount numeric NOT NULL CHECK (interest_amount >= 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create liability analytics table for storing calculated metrics
CREATE TABLE IF NOT EXISTS liability_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liability_id uuid NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
  calculation_date date NOT NULL DEFAULT CURRENT_DATE,
  total_paid numeric NOT NULL DEFAULT 0,
  total_interest_paid numeric NOT NULL DEFAULT 0,
  remaining_balance numeric NOT NULL DEFAULT 0,
  months_remaining integer,
  payoff_date date,
  total_interest_remaining numeric NOT NULL DEFAULT 0,
  monthly_interest_amount numeric NOT NULL DEFAULT 0,
  debt_to_income_ratio numeric,
  credit_utilization numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, liability_id, calculation_date)
);

-- Create liability bill linking table
CREATE TABLE IF NOT EXISTS liability_bill_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liability_id uuid NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
  recurring_transaction_id uuid NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(liability_id, recurring_transaction_id)
);

-- Create debt strategy recommendations table
CREATE TABLE IF NOT EXISTS debt_strategy_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liability_id uuid REFERENCES liabilities(id) ON DELETE CASCADE,
  strategy_type text NOT NULL CHECK (strategy_type = ANY (ARRAY[
    'debt_snowball', 'debt_avalanche', 'debt_consolidation', 'balance_transfer', 'refinance', 'payoff_acceleration'
  ])),
  title text NOT NULL,
  description text NOT NULL,
  potential_savings numeric,
  time_to_payoff_months integer,
  monthly_payment_increase numeric,
  is_applicable boolean NOT NULL DEFAULT true,
  priority_score integer NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS liabilities_liability_type_idx ON liabilities(liability_type);
CREATE INDEX IF NOT EXISTS liabilities_status_idx ON liabilities(status);
CREATE INDEX IF NOT EXISTS liabilities_is_active_idx ON liabilities(is_active);
CREATE INDEX IF NOT EXISTS liabilities_priority_idx ON liabilities(priority);
CREATE INDEX IF NOT EXISTS liabilities_next_payment_date_idx ON liabilities(next_payment_date);
CREATE INDEX IF NOT EXISTS liability_payment_history_liability_id_idx ON liability_payment_history(liability_id);
CREATE INDEX IF NOT EXISTS liability_payment_history_payment_date_idx ON liability_payment_history(payment_date);
CREATE INDEX IF NOT EXISTS liability_analytics_liability_id_idx ON liability_analytics(liability_id);
CREATE INDEX IF NOT EXISTS liability_analytics_calculation_date_idx ON liability_analytics(calculation_date);
CREATE INDEX IF NOT EXISTS liability_bill_links_liability_id_idx ON liability_bill_links(liability_id);
CREATE INDEX IF NOT EXISTS debt_strategy_recommendations_user_id_idx ON debt_strategy_recommendations(user_id);
CREATE INDEX IF NOT EXISTS debt_strategy_recommendations_liability_id_idx ON debt_strategy_recommendations(liability_id);

-- Enable RLS on new tables
ALTER TABLE liability_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE liability_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE liability_bill_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_strategy_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for liability_payment_history
CREATE POLICY "Users can read own liability payment history"
  ON liability_payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liability payment history"
  ON liability_payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liability payment history"
  ON liability_payment_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own liability payment history"
  ON liability_payment_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for liability_analytics
CREATE POLICY "Users can read own liability analytics"
  ON liability_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liability analytics"
  ON liability_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liability analytics"
  ON liability_analytics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for liability_bill_links
CREATE POLICY "Users can read own liability bill links"
  ON liability_bill_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liability bill links"
  ON liability_bill_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liability bill links"
  ON liability_bill_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own liability bill links"
  ON liability_bill_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for debt_strategy_recommendations
CREATE POLICY "Users can read own debt strategy recommendations"
  ON debt_strategy_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debt strategy recommendations"
  ON debt_strategy_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debt strategy recommendations"
  ON debt_strategy_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debt strategy recommendations"
  ON debt_strategy_recommendations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
`;

async function applyMigration() {
  try {
    console.log('🚀 Starting Enhanced Liabilities Migration...');
    
    // Split the migration into smaller chunks to avoid timeout
    const chunks = migrationSQL.split(';').filter(chunk => chunk.trim().length > 0);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim() + ';';
      if (chunk.length > 10) { // Skip empty chunks
        console.log(`📝 Executing chunk ${i + 1}/${chunks.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: chunk 
        });
        
        if (error) {
          console.error(`❌ Error in chunk ${i + 1}:`, error);
          // Continue with next chunk
        } else {
          console.log(`✅ Chunk ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applyMigration();
