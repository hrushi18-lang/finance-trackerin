-- Fix currency columns migration
-- This migration fixes the column name mismatches and adds missing data

-- First, check if the is_active column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'supported_currencies' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE supported_currencies ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Update existing records to have is_active = true
UPDATE supported_currencies SET is_active = true WHERE is_active IS NULL;

-- Update the fallback currencies in the context to use decimal_places instead of decimal_digits
-- This is just a comment since the code needs to be updated separately
