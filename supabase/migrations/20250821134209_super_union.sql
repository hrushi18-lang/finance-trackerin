/*
  # Create Income Sources Table

  1. New Tables
    - `income_sources`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `name` (text)
      - `type` (text, income type enum)
      - `amount` (numeric)
      - `frequency` (text, frequency enum)
      - `is_active` (boolean)
      - `last_received` (date, optional)
      - `next_expected` (date, optional)
      - `reliability` (text, reliability enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `income_sources` table
    - Add policy for authenticated users to manage their own income sources

  3. Indexes
    - Index on user_id for efficient queries
    - Index on type and frequency for filtering
*/

CREATE TABLE IF NOT EXISTS income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('salary', 'freelance', 'business', 'investment', 'rental', 'other')),
  amount numeric NOT NULL CHECK (amount > 0),
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  is_active boolean NOT NULL DEFAULT true,
  last_received date,
  next_expected date,
  reliability text NOT NULL DEFAULT 'medium' CHECK (reliability IN ('high', 'medium', 'low')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own income sources"
  ON income_sources
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income sources"
  ON income_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income sources"
  ON income_sources
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income sources"
  ON income_sources
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX income_sources_user_id_idx ON income_sources(user_id);
CREATE INDEX income_sources_type_idx ON income_sources(type);
CREATE INDEX income_sources_frequency_idx ON income_sources(frequency);

-- Create trigger for updated_at
CREATE TRIGGER update_income_sources_updated_at
  BEFORE UPDATE ON income_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();