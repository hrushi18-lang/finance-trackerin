-- Add goal_id column to transactions table for unified financial goals
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES financial_goals(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions(goal_id);
