-- Fix the is_active column issue in supported_currencies table

-- Check if the is_active column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'supported_currencies' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE supported_currencies ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    RAISE NOTICE 'Added is_active column to supported_currencies table';
  ELSE
    RAISE NOTICE 'is_active column already exists in supported_currencies table';
  END IF;
END $$;

-- Update existing records to have is_active = true (in case some are NULL)
UPDATE supported_currencies SET is_active = true WHERE is_active IS NULL;

-- Verify the fix
SELECT code, name, is_active FROM supported_currencies LIMIT 5;
