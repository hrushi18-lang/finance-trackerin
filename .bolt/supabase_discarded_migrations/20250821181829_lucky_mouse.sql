@@ .. @@
 ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Users can read own accounts"
-  ON financial_accounts
-  FOR SELECT
-  TO authenticated
-  USING (auth.uid() = user_id);
-
-CREATE POLICY "Users can insert own accounts"
-  ON financial_accounts
-  FOR INSERT
-  TO authenticated
-  WITH CHECK (auth.uid() = user_id);
-
-CREATE POLICY "Users can update own accounts"
-  ON financial_accounts
-  FOR UPDATE
-  TO authenticated
-  USING (auth.uid() = user_id);
-
-CREATE POLICY "Users can delete own accounts"
-  ON financial_accounts
-  FOR DELETE
-  TO authenticated
-  USING (auth.uid() = user_id);
-
 CREATE POLICY "Users can read own insights"
   ON financial_insights
   FOR SELECT