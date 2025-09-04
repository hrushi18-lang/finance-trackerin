#!/usr/bin/env node

/**
 * Apply currencyCode migration to remote Supabase database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Applying currencyCode migration...');
    
    // Check if currencyCode column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'financial_accounts')
      .eq('column_name', 'currencyCode');
    
    if (checkError) {
      console.error('Error checking columns:', checkError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('currencyCode column already exists, skipping migration');
      return;
    }
    
    // Apply the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Rename the currency column to currencyCode
        ALTER TABLE financial_accounts 
        RENAME COLUMN currency TO currencyCode;
        
        -- Update the check constraint to use the new column name
        ALTER TABLE financial_accounts 
        DROP CONSTRAINT IF EXISTS financial_accounts_currency_check;
        
        -- Ensure the column has the correct default value
        ALTER TABLE financial_accounts 
        ALTER COLUMN currencyCode SET DEFAULT 'USD';
        
        -- Add a comment to the column for clarity
        COMMENT ON COLUMN financial_accounts.currencyCode IS 'Currency code for the account (e.g., USD, EUR, INR)';
      `
    });
    
    if (error) {
      console.error('Error applying migration:', error);
    } else {
      console.log('Migration applied successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
