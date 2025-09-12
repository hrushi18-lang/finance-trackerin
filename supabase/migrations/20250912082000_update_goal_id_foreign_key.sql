-- Update goal_id foreign key to point to financial_goals table
-- First drop the existing foreign key constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_goal_id_fkey;

-- Add new foreign key constraint pointing to financial_goals
ALTER TABLE transactions 
ADD CONSTRAINT transactions_goal_id_fkey 
FOREIGN KEY (goal_id) REFERENCES financial_goals(id) ON DELETE SET NULL;
