/*
  # Fix Account Balance History RLS Policies

  1. Security Updates
    - Add RLS policies for account_balance_history table
    - Allow users to insert and read their own balance history
    - Handle existing policies gracefully

  2. Policy Management
    - Use IF NOT EXISTS equivalent for policies
    - Drop and recreate if needed to avoid conflicts
*/

-- First, drop the policy if it exists to avoid conflicts
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can insert their balance history" ON account_balance_history;
  DROP POLICY IF EXISTS "Users can view their balance history" ON account_balance_history;
  DROP POLICY IF EXISTS "Users can read own accounts" ON financial_accounts;
EXCEPTION
  WHEN undefined_object THEN
    -- Policy doesn't exist, continue
    NULL;
END $$;

-- Create the account balance history policies
CREATE POLICY "Users can insert their balance history"
  ON account_balance_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT id FROM financial_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their balance history"
  ON account_balance_history
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM financial_accounts WHERE user_id = auth.uid()
    )
  );

-- Recreate the financial accounts policy if needed
CREATE POLICY "Users can read own accounts"
  ON financial_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled on account_balance_history
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;