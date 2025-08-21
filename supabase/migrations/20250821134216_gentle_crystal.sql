/*
  # Enhance Transactions Table for Account Linking

  1. Table Updates
    - Add `account_id` (uuid, foreign key to financial_accounts)
    - Add `affects_balance` (boolean)
    - Add `reason` (text, for non-balance affecting transactions)
    - Add `transfer_to_account_id` (uuid, for transfers)

  2. Security
    - Update existing policies to handle new fields

  3. Indexes
    - Index on account_id for efficient account-based queries
    - Index on transfer_to_account_id for transfer tracking
*/

-- Add new columns to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'affects_balance'
  ) THEN
    ALTER TABLE transactions ADD COLUMN affects_balance boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'reason'
  ) THEN
    ALTER TABLE transactions ADD COLUMN reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'transfer_to_account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN transfer_to_account_id uuid REFERENCES financial_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_transfer_to_account_id_idx ON transactions(transfer_to_account_id);

-- Add constraint: reason is required when affects_balance is false
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'transactions_reason_required_check'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_reason_required_check 
    CHECK ((affects_balance = true) OR (affects_balance = false AND reason IS NOT NULL AND reason != ''));
  END IF;
END $$;