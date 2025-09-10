/*
  # Fix Balance Constraints Migration
  
  This migration fixes the balance constraint to allow negative balances
  for credit cards and investment accounts, and fixes the IP address
  constraint in audit logs.
*/

-- Drop the existing balance constraint
ALTER TABLE financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_balance_check;

-- Add a new constraint that allows negative balances for credit cards and investment accounts
ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_balance_check 
  CHECK (
    (type IN ('credit_card', 'investment') AND balance IS NOT NULL) OR
    (type NOT IN ('credit_card', 'investment') AND balance >= 0)
  );

-- Fix the audit_logs table to allow NULL ip_address
ALTER TABLE audit_logs ALTER COLUMN ip_address DROP NOT NULL;

-- Update the constraint to allow NULL or valid IP addresses
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_ip_address_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_ip_address_check 
  CHECK (
    ip_address IS NULL OR 
    ip_address ~ '^(\d{1,3}\.){3}\d{1,3}$' OR
    ip_address ~ '^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$'
  );
