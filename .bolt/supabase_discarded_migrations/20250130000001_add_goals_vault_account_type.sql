-- Add goals_vault to the financial_accounts type constraint
-- This allows the creation of goals vault accounts for goal management

-- First, drop the existing constraint
ALTER TABLE financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_type_check;

-- Add the new constraint with goals_vault included
ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_type_check 
CHECK (type = ANY (ARRAY[
  'bank_savings'::text, 
  'bank_current'::text, 
  'bank_student'::text, 
  'digital_wallet'::text, 
  'cash'::text, 
  'credit_card'::text, 
  'investment'::text,
  'goals_vault'::text
]));
