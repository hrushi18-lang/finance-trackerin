-- Add liability_id column to transactions table
ALTER TABLE transactions
ADD COLUMN liability_id UUID REFERENCES liabilities(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_liability_id ON transactions(liability_id);
