/*
  # Fix Account Balance History RLS Policies

  1. Security
    - Add policy for authenticated users to insert their own balance history
    - Add policy for authenticated users to read their own balance history
    - Add policy for authenticated users to update their own balance history

  2. Changes
    - Enable proper RLS policies for account_balance_history table
    - Ensure users can manage their own balance tracking data
*/

-- Add RLS policies for account_balance_history table
CREATE POLICY "Users can insert their own balance history"
  ON account_balance_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT id FROM financial_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own balance history"
  ON account_balance_history
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM financial_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own balance history"
  ON account_balance_history
  FOR UPDATE
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM financial_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT id FROM financial_accounts WHERE user_id = auth.uid()
    )
  );