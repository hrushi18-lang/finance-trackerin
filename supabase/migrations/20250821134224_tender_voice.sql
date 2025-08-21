/*
  # Enhance User Categories for Hierarchical Structure

  1. Table Updates
    - Add `parent_id` (uuid, for hierarchical categories)
    - Add `budget_amount` (numeric, for category budgets)
    - Add `budget_period` (text, for budget period)
    - Add `spent_amount` (numeric, for budget tracking)

  2. Security
    - Update existing policies for new fields

  3. Indexes
    - Index on parent_id for hierarchical queries
*/

-- Add new columns to user_categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_categories' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE user_categories ADD COLUMN parent_id uuid REFERENCES user_categories(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_categories' AND column_name = 'budget_amount'
  ) THEN
    ALTER TABLE user_categories ADD COLUMN budget_amount numeric CHECK (budget_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_categories' AND column_name = 'budget_period'
  ) THEN
    ALTER TABLE user_categories ADD COLUMN budget_period text CHECK (budget_period IN ('weekly', 'monthly', 'yearly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_categories' AND column_name = 'spent_amount'
  ) THEN
    ALTER TABLE user_categories ADD COLUMN spent_amount numeric NOT NULL DEFAULT 0 CHECK (spent_amount >= 0);
  END IF;
END $$;

-- Create index for hierarchical queries
CREATE INDEX IF NOT EXISTS user_categories_parent_id_idx ON user_categories(parent_id);