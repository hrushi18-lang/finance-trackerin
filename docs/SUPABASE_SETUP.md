# Supabase Database Setup Guide

## Overview
This guide will help you set up access to your existing Supabase database and create the necessary tables and columns for the Finance Tracker application.

## Current Database Status
- **Supabase URL**: `https://qbskidyauxehvswgckrv.supabase.co`
- **Environment**: Configured in `.env` file
- **Migrations**: 21 migration files available
- **Latest Schema**: Comprehensive financial management system

## Database Schema Analysis

### Existing Tables (from latest migration)
1. **Core Tables**:
   - `profiles` - User profiles
   - `financial_accounts` - Multi-account management
   - `transactions` - Enhanced transaction tracking
   - `goals` - Financial goals
   - `bills` - Bill management
   - `liabilities` - Debt tracking
   - `budgets` - Budget management

2. **Enhanced Tables**:
   - `income_sources` - Multiple income streams
   - `account_transfers` - Cross-account transfers
   - `category_budgets` - Category-specific budgets
   - `bill_reminders` - Smart bill tracking
   - `debt_payments` - Debt payment tracking
   - `transaction_splits` - Split transactions
   - `financial_insights` - AI-generated insights

3. **Supporting Tables**:
   - `user_categories` - Custom categories
   - `recurring_transactions` - Recurring payments
   - `notifications` - User notifications
   - `assets` - Asset tracking

## Setup Steps

### 1. Verify Supabase Connection
```bash
# Check if your Supabase project is accessible
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://qbskidyauxehvswgckrv.supabase.co/rest/v1/"
```

### 2. Apply Database Migrations
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref qbskidyauxehvswgckrv

# Apply all migrations
supabase db push
```

### 3. Verify Database Schema
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### 4. Test Database Access
```javascript
// Test connection in your app
import { supabase } from './src/lib/supabase';

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

## Required Database Updates

### 1. Fix Currency Column Issue
The database uses `currency` but the code expects `currencycode`. Run this migration:

```sql
-- Fix currency column name mismatch
ALTER TABLE financial_accounts RENAME COLUMN currency TO currencycode;
```

### 2. Add Missing Account Types
```sql
-- Add goals_vault account type
ALTER TABLE financial_accounts 
DROP CONSTRAINT IF EXISTS financial_accounts_type_check;

ALTER TABLE financial_accounts 
ADD CONSTRAINT financial_accounts_type_check 
CHECK (type = ANY (ARRAY[
  'bank_savings', 'bank_current', 'bank_student', 
  'digital_wallet', 'cash', 'credit_card', 'investment', 'goals_vault'
]));
```

### 3. Add Enhanced Goal Fields
```sql
-- Add enhanced goal fields
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'general_savings';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_category text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS period_type text DEFAULT 'monthly';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS custom_period_days integer;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS recurring_frequency text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES financial_accounts(id);
```

### 4. Add Enhanced Bill Fields
```sql
-- Add enhanced bill fields
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_category text DEFAULT 'general_expense';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS target_category text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
```

## Database Security

### Row Level Security (RLS)
All tables have RLS enabled with policies for:
- Users can only access their own data
- Proper authentication checks
- Secure data isolation

### API Keys
- **Anon Key**: For client-side operations
- **Service Role Key**: For server-side operations (keep secret)

## Testing Database Operations

### 1. Test Account Creation
```javascript
const createAccount = async () => {
  const { data, error } = await supabase
    .from('financial_accounts')
    .insert({
      name: 'Test Account',
      type: 'bank_savings',
      balance: 1000,
      currencycode: 'USD'
    });
  
  if (error) console.error('Error:', error);
  else console.log('Account created:', data);
};
```

### 2. Test Transaction Creation
```javascript
const createTransaction = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type: 'expense',
      amount: 50,
      category: 'Food',
      description: 'Lunch',
      affects_balance: true,
      status: 'completed'
    });
  
  if (error) console.error('Error:', error);
  else console.log('Transaction created:', data);
};
```

## Troubleshooting

### Common Issues
1. **Connection Refused**: Check if Supabase project is active
2. **RLS Policy Errors**: Ensure user is authenticated
3. **Column Not Found**: Run missing migrations
4. **Permission Denied**: Check API key permissions

### Debug Commands
```bash
# Check Supabase status
supabase status

# View logs
supabase logs

# Reset database (careful!)
supabase db reset
```

## Next Steps
1. Apply all migrations
2. Test database connection
3. Verify all tables exist
4. Test CRUD operations
5. Set up monitoring and alerts

## Support
- Supabase Documentation: https://supabase.com/docs
- Community Forum: https://github.com/supabase/supabase/discussions
- Discord: https://discord.supabase.com
