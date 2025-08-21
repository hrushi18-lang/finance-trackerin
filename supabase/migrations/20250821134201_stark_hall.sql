/*
  # Create Financial Accounts Table

  1. New Tables
    - `financial_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `name` (text)
      - `type` (text, account type enum)
      - `balance` (numeric)
      - `institution` (text, optional)
      - `platform` (text, optional)
      - `is_visible` (boolean)
      - `currency` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `financial_accounts` table
    - Add policy for authenticated users to manage their own accounts

  3. Indexes
    - Index on user_id for efficient queries
    - Index on type for filtering
*/

CREATE TABLE IF NOT EXISTS financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank_savings', 'bank_current', 'bank_student', 'digital_wallet', 'cash', 'credit_card', 'investment')),
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  institution text,
  platform text,
  is_visible boolean NOT NULL DEFAULT true,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own accounts"
  ON financial_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON financial_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON financial_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON financial_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX financial_accounts_user_id_idx ON financial_accounts(user_id);
CREATE INDEX financial_accounts_type_idx ON financial_accounts(type);

-- Create trigger for updated_at
CREATE TRIGGER update_financial_accounts_updated_at
  BEFORE UPDATE ON financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();