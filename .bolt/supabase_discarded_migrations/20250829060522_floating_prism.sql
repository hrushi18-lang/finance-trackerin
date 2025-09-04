@@ .. @@
 -- RLS Policies for Enhanced Liabilities
 ALTER TABLE enhanced_liabilities ENABLE ROW LEVEL SECURITY;
 
-DROP POLICY IF EXISTS "Users can view their own enhanced liabilities" ON enhanced_liabilities;
-CREATE POLICY "Users can view their own enhanced liabilities"
+DROP POLICY IF EXISTS "Users can read own enhanced liabilities" ON enhanced_liabilities;
+CREATE POLICY "Users can read own enhanced liabilities"
   ON enhanced_liabilities
   FOR SELECT
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can insert their own enhanced liabilities" ON enhanced_liabilities;
-CREATE POLICY "Users can insert their own enhanced liabilities"
+DROP POLICY IF EXISTS "Users can insert own enhanced liabilities" ON enhanced_liabilities;
+CREATE POLICY "Users can insert own enhanced liabilities"
   ON enhanced_liabilities
   FOR INSERT
-  TO public
-  WITH CHECK (uid() = user_id);
+  TO authenticated
+  WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can update their own enhanced liabilities" ON enhanced_liabilities;
-CREATE POLICY "Users can update their own enhanced liabilities"
+DROP POLICY IF EXISTS "Users can update own enhanced liabilities" ON enhanced_liabilities;
+CREATE POLICY "Users can update own enhanced liabilities"
   ON enhanced_liabilities
   FOR UPDATE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can delete their own enhanced liabilities" ON enhanced_liabilities;
-CREATE POLICY "Users can delete their own enhanced liabilities"
+DROP POLICY IF EXISTS "Users can delete own enhanced liabilities" ON enhanced_liabilities;
+CREATE POLICY "Users can delete own enhanced liabilities"
   ON enhanced_liabilities
   FOR DELETE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
 -- RLS Policies for Bills
 ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
 
-DROP POLICY IF EXISTS "Users can view their own bills" ON bills;
-CREATE POLICY "Users can view their own bills"
+DROP POLICY IF EXISTS "Users can read own bills" ON bills;
+CREATE POLICY "Users can read own bills"
   ON bills
   FOR SELECT
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can insert their own bills" ON bills;
-CREATE POLICY "Users can insert their own bills"
+DROP POLICY IF EXISTS "Users can insert own bills" ON bills;
+CREATE POLICY "Users can insert own bills"
   ON bills
   FOR INSERT
-  TO public
-  WITH CHECK (uid() = user_id);
+  TO authenticated
+  WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can update their own bills" ON bills;
-CREATE POLICY "Users can update their own bills"
+DROP POLICY IF EXISTS "Users can update own bills" ON bills;
+CREATE POLICY "Users can update own bills"
   ON bills
   FOR UPDATE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can delete their own bills" ON bills;
-CREATE POLICY "Users can delete their own bills"
+DROP POLICY IF EXISTS "Users can delete own bills" ON bills;
+CREATE POLICY "Users can delete own bills"
   ON bills
   FOR DELETE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
 -- RLS Policies for Bill Instances
 ALTER TABLE bill_instances ENABLE ROW LEVEL SECURITY;
 
-DROP POLICY IF EXISTS "Users can view their own bill instances" ON bill_instances;
-CREATE POLICY "Users can view their own bill instances"
+DROP POLICY IF EXISTS "Users can read own bill instances" ON bill_instances;
+CREATE POLICY "Users can read own bill instances"
   ON bill_instances
   FOR SELECT
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can insert their own bill instances" ON bill_instances;
-CREATE POLICY "Users can insert their own bill instances"
+DROP POLICY IF EXISTS "Users can insert own bill instances" ON bill_instances;
+CREATE POLICY "Users can insert own bill instances"
   ON bill_instances
   FOR INSERT
-  TO public
-  WITH CHECK (uid() = user_id);
+  TO authenticated
+  WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can update their own bill instances" ON bill_instances;
-CREATE POLICY "Users can update their own bill instances"
+DROP POLICY IF EXISTS "Users can update own bill instances" ON bill_instances;
+CREATE POLICY "Users can update own bill instances"
   ON bill_instances
   FOR UPDATE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can delete their own bill instances" ON bill_instances;
-CREATE POLICY "Users can delete their own bill instances"
+DROP POLICY IF EXISTS "Users can delete own bill instances" ON bill_instances;
+CREATE POLICY "Users can delete own bill instances"
   ON bill_instances
   FOR DELETE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
 -- RLS Policies for Liability Payments
 ALTER TABLE liability_payments ENABLE ROW LEVEL SECURITY;
 
-DROP POLICY IF EXISTS "Users can view their own liability payments" ON liability_payments;
-CREATE POLICY "Users can view their own liability payments"
+DROP POLICY IF EXISTS "Users can read own liability payments" ON liability_payments;
+CREATE POLICY "Users can read own liability payments"
   ON liability_payments
   FOR SELECT
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can insert their own liability payments" ON liability_payments;
-CREATE POLICY "Users can insert their own liability payments"
+DROP POLICY IF EXISTS "Users can insert own liability payments" ON liability_payments;
+CREATE POLICY "Users can insert own liability payments"
   ON liability_payments
   FOR INSERT
-  TO public
-  WITH CHECK (uid() = user_id);
+  TO authenticated
+  WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can update their own liability payments" ON liability_payments;
-CREATE POLICY "Users can update their own liability payments"
+DROP POLICY IF EXISTS "Users can update own liability payments" ON liability_payments;
+CREATE POLICY "Users can update own liability payments"
   ON liability_payments
   FOR UPDATE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can delete their own liability payments" ON liability_payments;
-CREATE POLICY "Users can delete their own liability payments"
+DROP POLICY IF EXISTS "Users can delete own liability payments" ON liability_payments;
+CREATE POLICY "Users can delete own liability payments"
   ON liability_payments
   FOR DELETE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
 -- RLS Policies for Assets
 ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
 
-DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
-CREATE POLICY "Users can view their own assets"
+DROP POLICY IF EXISTS "Users can read own assets" ON assets;
+CREATE POLICY "Users can read own assets"
   ON assets
   FOR SELECT
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
-CREATE POLICY "Users can insert their own assets"
+DROP POLICY IF EXISTS "Users can insert own assets" ON assets;
+CREATE POLICY "Users can insert own assets"
   ON assets
   FOR INSERT
-  TO public
-  WITH CHECK (uid() = user_id);
+  TO authenticated
+  WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
-CREATE POLICY "Users can update their own assets"
+DROP POLICY IF EXISTS "Users can update own assets" ON assets;
+CREATE POLICY "Users can update own assets"
   ON assets
   FOR UPDATE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;
-CREATE POLICY "Users can delete their own assets"
+DROP POLICY IF EXISTS "Users can delete own assets" ON assets;
+CREATE POLICY "Users can delete own assets"
   ON assets
   FOR DELETE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
 -- RLS Policies for Notifications
 ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
 
-DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
-CREATE POLICY "Users can view their own notifications"
+DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
+CREATE POLICY "Users can read own notifications"
   ON notifications
   FOR SELECT
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
-CREATE POLICY "Users can insert their own notifications"
+DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
+CREATE POLICY "Users can insert own notifications"
   ON notifications
   FOR INSERT
-  TO public
-  WITH CHECK (uid() = user_id);
+  TO authenticated
+  WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
-CREATE POLICY "Users can update their own notifications"
+DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
+CREATE POLICY "Users can update own notifications"
   ON notifications
   FOR UPDATE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
-CREATE POLICY "Users can delete their own notifications"
+DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
+CREATE POLICY "Users can delete own notifications"
   ON notifications
   FOR DELETE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
 -- Fix existing account_balance_history RLS
-DROP POLICY IF EXISTS "Users can view their balance history" ON account_balance_history;
-CREATE POLICY "Users can view their balance history"
+DROP POLICY IF EXISTS "Users can read own balance history" ON account_balance_history;
+CREATE POLICY "Users can read own balance history"
   ON account_balance_history
   FOR SELECT
-  TO public
-  USING (uid() IN ( SELECT financial_accounts.user_id
+  TO authenticated
+  USING (auth.uid() IN ( SELECT financial_accounts.user_id
    FROM financial_accounts
   WHERE (financial_accounts.id = account_balance_history.account_id)));
 
-DROP POLICY IF EXISTS "Users can insert balance history" ON account_balance_history;
-CREATE POLICY "Users can insert balance history"
+DROP POLICY IF EXISTS "Users can insert own balance history" ON account_balance_history;
+CREATE POLICY "Users can insert own balance history"
   ON account_balance_history
   FOR INSERT
-  TO public
-  WITH CHECK (uid() IN ( SELECT financial_accounts.user_id
+  TO authenticated
+  WITH CHECK (auth.uid() IN ( SELECT financial_accounts.user_id
    FROM financial_accounts
   WHERE (financial_accounts.id = account_balance_history.account_id)));
 
 -- Update existing table policies to use auth.uid() and authenticated
-DROP POLICY IF EXISTS "Users can read own accounts" ON financial_accounts;
-CREATE POLICY "Users can read own accounts"
+DROP POLICY IF EXISTS "Users can read own financial accounts" ON financial_accounts;
+CREATE POLICY "Users can read own financial accounts"
   ON financial_accounts
   FOR SELECT
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can insert own accounts" ON financial_accounts;
-CREATE POLICY "Users can insert own accounts"
+DROP POLICY IF EXISTS "Users can insert own financial accounts" ON financial_accounts;
+CREATE POLICY "Users can insert own financial accounts"
   ON financial_accounts
   FOR INSERT
-  TO public
-  WITH CHECK (uid() = user_id);
+  TO authenticated
+  WITH CHECK (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can update own accounts" ON financial_accounts;
-CREATE POLICY "Users can update own accounts"
+DROP POLICY IF EXISTS "Users can update own financial accounts" ON financial_accounts;
+CREATE POLICY "Users can update own financial accounts"
   ON financial_accounts
   FOR UPDATE
-  TO public
-  USING (uid() = user_id);
+  TO authenticated
+  USING (auth.uid() = user_id);
 
-DROP POLICY IF EXISTS "Users can delete own accounts" ON financial_accounts;
-CREATE POLICY "Users can delete own accounts"
  ON financial_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add triggers for enhanced_account_transfers to update account balances
-- This ensures that account balances are automatically updated when transfers are made

-- Function to update account balance when transfers are created
CREATE OR REPLACE FUNCTION update_account_balance_from_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the from account balance (subtract amount)
  UPDATE financial_accounts 
  SET balance = balance - NEW.amount 
  WHERE id = NEW.from_account_id;
  
  -- Update the to account balance (add amount)
  UPDATE financial_accounts 
  SET balance = balance + NEW.converted_amount 
  WHERE id = NEW.to_account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for account balance updates from transfers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_account_balance_from_transfer_trigger'
  ) THEN
    CREATE TRIGGER update_account_balance_from_transfer_trigger
      AFTER INSERT ON enhanced_account_transfers
      FOR EACH ROW EXECUTE FUNCTION update_account_balance_from_transfer();
  END IF;
END $$;

-- Function to update account balance when transfers are updated
CREATE OR REPLACE FUNCTION update_account_balance_from_transfer_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an update, we need to reverse the old transfer and apply the new one
  IF TG_OP = 'UPDATE' THEN
    -- Reverse the old transfer
    UPDATE financial_accounts 
    SET balance = balance + OLD.amount 
    WHERE id = OLD.from_account_id;
    
    UPDATE financial_accounts 
    SET balance = balance - OLD.converted_amount 
    WHERE id = OLD.to_account_id;
    
    -- Apply the new transfer
    UPDATE financial_accounts 
    SET balance = balance - NEW.amount 
    WHERE id = NEW.from_account_id;
    
    UPDATE financial_accounts 
    SET balance = balance + NEW.converted_amount 
    WHERE id = NEW.to_account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for account balance updates when transfers are updated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_account_balance_from_transfer_update_trigger'
  ) THEN
    CREATE TRIGGER update_account_balance_from_transfer_update_trigger
      AFTER UPDATE ON enhanced_account_transfers
      FOR EACH ROW EXECUTE FUNCTION update_account_balance_from_transfer_update();
  END IF;
END $$;

-- Function to update account balance when transfers are deleted
CREATE OR REPLACE FUNCTION update_account_balance_from_transfer_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reverse the transfer
  UPDATE financial_accounts 
  SET balance = balance + OLD.amount 
  WHERE id = OLD.from_account_id;
  
  UPDATE financial_accounts 
  SET balance = balance - OLD.converted_amount 
  WHERE id = OLD.to_account_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for account balance updates when transfers are deleted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_account_balance_from_transfer_delete_trigger'
  ) THEN
    CREATE TRIGGER update_account_balance_from_transfer_delete_trigger
      AFTER DELETE ON enhanced_account_transfers
      FOR EACH ROW EXECUTE FUNCTION update_account_balance_from_transfer_delete();
  END IF;
END $$;