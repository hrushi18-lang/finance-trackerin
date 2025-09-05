/*
  # Fix Critical Database Schema Errors
  
  This migration fixes multiple critical issues found in the database schema:
  
  1. Fix table references from 'users' to 'profiles'
  2. Add missing uuid_generate_v4() function
  3. Fix RLS policies to use proper authentication
  4. Add missing columns and constraints
  5. Fix foreign key references
*/

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create uuid_generate_v4() function if it doesn't exist
CREATE OR REPLACE FUNCTION uuid_generate_v4()
RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Fix enhanced_liabilities table references
DO $$
BEGIN
  -- Check if the table exists and has wrong references
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_liabilities') THEN
    -- Drop and recreate foreign key constraints with correct references
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'enhanced_liabilities_user_id_fkey' 
               AND table_name = 'enhanced_liabilities') THEN
      ALTER TABLE enhanced_liabilities DROP CONSTRAINT enhanced_liabilities_user_id_fkey;
    END IF;
    
    -- Add correct foreign key constraint
    ALTER TABLE enhanced_liabilities 
    ADD CONSTRAINT enhanced_liabilities_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix assets table references
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'assets_user_id_fkey' 
               AND table_name = 'assets') THEN
      ALTER TABLE assets DROP CONSTRAINT assets_user_id_fkey;
    END IF;
    
    ALTER TABLE assets 
    ADD CONSTRAINT assets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix bills table references
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bills') THEN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'bills_user_id_fkey' 
               AND table_name = 'bills') THEN
      ALTER TABLE bills DROP CONSTRAINT bills_user_id_fkey;
    END IF;
    
    ALTER TABLE bills 
    ADD CONSTRAINT bills_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix bill_instances table references
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bill_instances') THEN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'bill_instances_user_id_fkey' 
               AND table_name = 'bill_instances') THEN
      ALTER TABLE bill_instances DROP CONSTRAINT bill_instances_user_id_fkey;
    END IF;
    
    ALTER TABLE bill_instances 
    ADD CONSTRAINT bill_instances_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix liability_payments table references
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liability_payments') THEN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'liability_payments_user_id_fkey' 
               AND table_name = 'liability_payments') THEN
      ALTER TABLE liability_payments DROP CONSTRAINT liability_payments_user_id_fkey;
    END IF;
    
    ALTER TABLE liability_payments 
    ADD CONSTRAINT liability_payments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix notifications table references
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'notifications_user_id_fkey' 
               AND table_name = 'notifications') THEN
      ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
    END IF;
    
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing columns to existing tables
DO $$
BEGIN
  -- Add missing columns to transactions table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    -- Add user_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
      ALTER TABLE transactions ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add type column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'type') THEN
      ALTER TABLE transactions ADD COLUMN type text NOT NULL DEFAULT 'expense' 
      CHECK (type IN ('income', 'expense', 'transfer'));
    END IF;
  END IF;
  
  -- Add missing columns to goals table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
    -- Add target_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'goals' AND column_name = 'target_amount') THEN
      ALTER TABLE goals ADD COLUMN target_amount numeric NOT NULL DEFAULT 0;
    END IF;
    
    -- Add is_archived if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'goals' AND column_name = 'is_archived') THEN
      ALTER TABLE goals ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
  
  -- Add missing columns to liabilities table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liabilities') THEN
    -- Add name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'liabilities' AND column_name = 'name') THEN
      ALTER TABLE liabilities ADD COLUMN name text NOT NULL DEFAULT 'Liability';
    END IF;
    
    -- Add total_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'liabilities' AND column_name = 'total_amount') THEN
      ALTER TABLE liabilities ADD COLUMN total_amount numeric NOT NULL DEFAULT 0;
    END IF;
    
    -- Add remaining_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'liabilities' AND column_name = 'remaining_amount') THEN
      ALTER TABLE liabilities ADD COLUMN remaining_amount numeric NOT NULL DEFAULT 0;
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'liabilities' AND column_name = 'status') THEN
      ALTER TABLE liabilities ADD COLUMN status text NOT NULL DEFAULT 'active' 
      CHECK (status IN ('active', 'paid_off', 'defaulted', 'restructured', 'closed'));
    END IF;
  END IF;
  
  -- Add missing columns to budgets table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') THEN
    -- Add spent if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budgets' AND column_name = 'spent') THEN
      ALTER TABLE budgets ADD COLUMN spent numeric DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Fix RLS policies to use proper authentication
DO $$
BEGIN
  -- Fix enhanced_liabilities policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_liabilities') THEN
    DROP POLICY IF EXISTS "Users can view their own enhanced liabilities" ON enhanced_liabilities;
    DROP POLICY IF EXISTS "Users can insert their own enhanced liabilities" ON enhanced_liabilities;
    DROP POLICY IF EXISTS "Users can update their own enhanced liabilities" ON enhanced_liabilities;
    DROP POLICY IF EXISTS "Users can delete their own enhanced liabilities" ON enhanced_liabilities;
    
    CREATE POLICY "Users can read own enhanced liabilities"
      ON enhanced_liabilities FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own enhanced liabilities"
      ON enhanced_liabilities FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own enhanced liabilities"
      ON enhanced_liabilities FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own enhanced liabilities"
      ON enhanced_liabilities FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  -- Fix assets policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
    DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
    DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
    DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
    DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;
    
    CREATE POLICY "Users can read own assets"
      ON assets FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own assets"
      ON assets FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own assets"
      ON assets FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own assets"
      ON assets FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  -- Fix bills policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bills') THEN
    DROP POLICY IF EXISTS "Users can view their own bills" ON bills;
    DROP POLICY IF EXISTS "Users can insert their own bills" ON bills;
    DROP POLICY IF EXISTS "Users can update their own bills" ON bills;
    DROP POLICY IF EXISTS "Users can delete their own bills" ON bills;
    
    CREATE POLICY "Users can read own bills"
      ON bills FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own bills"
      ON bills FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own bills"
      ON bills FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own bills"
      ON bills FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  -- Fix bill_instances policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bill_instances') THEN
    DROP POLICY IF EXISTS "Users can view their own bill instances" ON bill_instances;
    DROP POLICY IF EXISTS "Users can insert their own bill instances" ON bill_instances;
    DROP POLICY IF EXISTS "Users can update their own bill instances" ON bill_instances;
    DROP POLICY IF EXISTS "Users can delete their own bill instances" ON bill_instances;
    
    CREATE POLICY "Users can read own bill instances"
      ON bill_instances FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own bill instances"
      ON bill_instances FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own bill instances"
      ON bill_instances FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own bill instances"
      ON bill_instances FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  -- Fix liability_payments policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liability_payments') THEN
    DROP POLICY IF EXISTS "Users can view their own liability payments" ON liability_payments;
    DROP POLICY IF EXISTS "Users can insert their own liability payments" ON liability_payments;
    DROP POLICY IF EXISTS "Users can update their own liability payments" ON liability_payments;
    DROP POLICY IF EXISTS "Users can delete their own liability payments" ON liability_payments;
    
    CREATE POLICY "Users can read own liability payments"
      ON liability_payments FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own liability payments"
      ON liability_payments FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own liability payments"
      ON liability_payments FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own liability payments"
      ON liability_payments FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  -- Fix notifications policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
    
    CREATE POLICY "Users can read own notifications"
      ON notifications FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own notifications"
      ON notifications FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own notifications"
      ON notifications FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own notifications"
      ON notifications FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create missing update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add missing triggers for updated_at columns
DO $$
BEGIN
  -- Add trigger for enhanced_liabilities if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_liabilities') THEN
    DROP TRIGGER IF EXISTS update_enhanced_liabilities_updated_at ON enhanced_liabilities;
    CREATE TRIGGER update_enhanced_liabilities_updated_at
      BEFORE UPDATE ON enhanced_liabilities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Add trigger for assets if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
    DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
    CREATE TRIGGER update_assets_updated_at
      BEFORE UPDATE ON assets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Add trigger for bills if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bills') THEN
    DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
    CREATE TRIGGER update_bills_updated_at
      BEFORE UPDATE ON bills
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Add trigger for bill_instances if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bill_instances') THEN
    DROP TRIGGER IF EXISTS update_bill_instances_updated_at ON bill_instances;
    CREATE TRIGGER update_bill_instances_updated_at
      BEFORE UPDATE ON bill_instances
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Add trigger for liability_payments if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liability_payments') THEN
    DROP TRIGGER IF EXISTS update_liability_payments_updated_at ON liability_payments;
    CREATE TRIGGER update_liability_payments_updated_at
      BEFORE UPDATE ON liability_payments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Add trigger for notifications if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
    CREATE TRIGGER update_notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
  -- Create indexes for enhanced_liabilities if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_liabilities') THEN
    CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_user_id ON enhanced_liabilities(user_id);
    CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_type ON enhanced_liabilities(liability_type);
    CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_status ON enhanced_liabilities(status);
    CREATE INDEX IF NOT EXISTS idx_enhanced_liabilities_next_payment ON enhanced_liabilities(next_payment_date);
  END IF;
  
  -- Create indexes for assets if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
    CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
    CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
    CREATE INDEX IF NOT EXISTS idx_assets_active ON assets(is_active);
  END IF;
  
  -- Create indexes for bills if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bills') THEN
    CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
    CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(bill_type);
    CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
    CREATE INDEX IF NOT EXISTS idx_bills_next_due_date ON bills(next_due_date);
    CREATE INDEX IF NOT EXISTS idx_bills_active ON bills(is_active);
  END IF;
  
  -- Create indexes for bill_instances if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bill_instances') THEN
    CREATE INDEX IF NOT EXISTS idx_bill_instances_user_id ON bill_instances(user_id);
    CREATE INDEX IF NOT EXISTS idx_bill_instances_bill_id ON bill_instances(bill_id);
    CREATE INDEX IF NOT EXISTS idx_bill_instances_status ON bill_instances(status);
    CREATE INDEX IF NOT EXISTS idx_bill_instances_due_date ON bill_instances(due_date);
  END IF;
  
  -- Create indexes for liability_payments if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liability_payments') THEN
    CREATE INDEX IF NOT EXISTS idx_liability_payments_user_id ON liability_payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_liability_payments_liability_id ON liability_payments(liability_id);
    CREATE INDEX IF NOT EXISTS idx_liability_payments_date ON liability_payments(payment_date);
  END IF;
  
  -- Create indexes for notifications if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
  END IF;
END $$;
