-- Fix balance constraints and audit logs
DO $$
BEGIN
    -- Remove the existing balance check constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'financial_accounts_balance_check'
    ) THEN
        ALTER TABLE financial_accounts DROP CONSTRAINT financial_accounts_balance_check;
    END IF;

    -- Add a new, more flexible balance check constraint
    ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_balance_check
    CHECK (
        (type = 'credit_card' OR type = 'investment') OR balance >= 0
    );

    -- Allow NULL for ip_address in audit_logs
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'ip_address' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE audit_logs ALTER COLUMN ip_address DROP NOT NULL;
    END IF;
END $$;
