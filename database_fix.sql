-- ============================================
-- DATABASE FIX SCRIPT
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Add is_active column to supported_currencies table
ALTER TABLE supported_currencies 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Step 2: Update existing records to have is_active = true
UPDATE supported_currencies 
SET is_active = true 
WHERE is_active IS NULL;

-- Step 3: Verify the fix
SELECT 
    code, 
    name, 
    symbol, 
    is_active,
    decimal_places
FROM supported_currencies 
ORDER BY code;

-- Step 4: Check if the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'supported_currencies' 
ORDER BY ordinal_position;
