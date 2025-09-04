/*
  # Fix Account Balance History RLS Policies

  1. Security Updates
    - Drop existing policies if they exist to avoid conflicts
    - Add proper RLS policies for account_balance_history table
    - Ensure users can manage their own balance history records

  2. Policy Changes
    - Users can insert balance history for their own accounts
    - Users can view balance history for their own accounts
    - Safe policy recreation using DROP IF EXISTS approach
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can view their balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can read own accounts" ON financial_accounts;

-- Create policies for account_balance_history table
CREATE POLICY "Users can insert balance history"
  ON account_balance_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uid() IN (
      SELECT financial_accounts.user_id
      FROM financial_accounts
      WHERE financial_accounts.id = account_balance_history.account_id
    )
  );

CREATE POLICY "Users can view their balance history"
  ON account_balance_history
  FOR SELECT
  TO authenticated
  USING (
    uid() IN (
      SELECT financial_accounts.user_id
      FROM financial_accounts
      WHERE financial_accounts.id = account_balance_history.account_id
    )
  );

-- Recreate financial_accounts policy if needed
CREATE POLICY "Users can read own accounts"
  ON financial_accounts
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);