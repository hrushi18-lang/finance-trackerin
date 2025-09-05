-- Prevent duplicate Goals Vault accounts
-- This migration adds a unique constraint to ensure only one Goals Vault per user

-- First, clean up any existing duplicates
WITH duplicate_vaults AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM financial_accounts 
  WHERE type = 'goals_vault'
)
DELETE FROM financial_accounts 
WHERE id IN (
  SELECT id FROM duplicate_vaults WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE financial_accounts 
ADD CONSTRAINT unique_goals_vault_per_user 
UNIQUE (user_id, type) 
WHERE type = 'goals_vault';

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_goals_vault_per_user ON financial_accounts IS 
'Ensures only one Goals Vault account per user to prevent duplicates';
