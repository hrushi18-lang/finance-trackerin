-- Prevent duplicate Goals Vault accounts
-- This migration adds a unique constraint to ensure only one Goals Vault per user

-- First, clean up any existing duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, COUNT(*) as cnt
        FROM financial_accounts 
        WHERE type = 'goals_vault'
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- If duplicates exist, keep only the oldest one for each user
    IF duplicate_count > 0 THEN
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
        
        RAISE NOTICE 'Cleaned up % duplicate Goals Vault accounts', duplicate_count;
    END IF;
END $$;

-- Add unique constraint to prevent future duplicates
-- Note: We'll use a partial unique index instead of a constraint with WHERE clause
CREATE UNIQUE INDEX IF NOT EXISTS unique_goals_vault_per_user 
ON financial_accounts (user_id) 
WHERE type = 'goals_vault';

-- Add comment explaining the index
COMMENT ON INDEX unique_goals_vault_per_user IS 
'Ensures only one Goals Vault account per user to prevent duplicates';
