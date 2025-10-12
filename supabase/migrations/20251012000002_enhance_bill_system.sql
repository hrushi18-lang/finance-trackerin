-- Migration: Enhance Bill System with comprehensive fields
-- Date: 2025-10-12
-- Description: Add bill tracking, attachments, payment details, and enhanced categorization

DO $$
BEGIN
  -- Add bill type category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'bill_type_category'
  ) THEN
    ALTER TABLE bills ADD COLUMN bill_type_category text DEFAULT 'recurring_utilities'
      CHECK (bill_type_category IN (
        'recurring_utilities', 'variable_usage', 'credit_loan', 'subscription', 'one_time_misc'
      ));
  END IF;

  -- Add bill date (issued date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'bill_date'
  ) THEN
    ALTER TABLE bills ADD COLUMN bill_date date;
  END IF;

  -- Add reminder date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'reminder_date'
  ) THEN
    ALTER TABLE bills ADD COLUMN reminder_date date;
  END IF;

  -- Add payment method
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE bills ADD COLUMN payment_method text;
  END IF;

  -- Add currency field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'currency'
  ) THEN
    ALTER TABLE bills ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  -- Add end date for recurring bills
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE bills ADD COLUMN end_date date;
  END IF;

  -- Add attachment URLs (array of strings)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'attachment_urls'
  ) THEN
    ALTER TABLE bills ADD COLUMN attachment_urls text[];
  END IF;

  -- Add attachment names (array of strings)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'attachment_names'
  ) THEN
    ALTER TABLE bills ADD COLUMN attachment_names text[];
  END IF;

  -- Add status field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'status'
  ) THEN
    ALTER TABLE bills ADD COLUMN status text DEFAULT 'pending'
      CHECK (status IN ('pending', 'paid', 'partially_paid', 'overdue', 'cancelled'));
  END IF;

  -- Add paid amount (for partial payments)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE bills ADD COLUMN paid_amount numeric DEFAULT 0;
  END IF;

  -- Update priority field to include 'critical'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'priority'
  ) THEN
    ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_priority_check;
    ALTER TABLE bills ADD CONSTRAINT bills_priority_check 
      CHECK (priority IN ('low', 'medium', 'high', 'critical'));
  END IF;

END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(user_id, status) WHERE status = 'pending' OR status = 'overdue';
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(user_id, due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bills_type_category ON bills(bill_type_category);
CREATE INDEX IF NOT EXISTS idx_bills_auto_pay ON bills(user_id, auto_pay) WHERE auto_pay = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_bills_reminder ON bills(user_id, reminder_date) WHERE is_active = true;

-- Add comments to new columns
COMMENT ON COLUMN bills.bill_type_category IS 'Category of bill (recurring_utilities, variable_usage, credit_loan, subscription, one_time_misc)';
COMMENT ON COLUMN bills.bill_date IS 'Date when bill was issued/created';
COMMENT ON COLUMN bills.reminder_date IS 'Specific date to send reminder (optional, calculated from due_date - reminder_days_before)';
COMMENT ON COLUMN bills.payment_method IS 'Description of payment method';
COMMENT ON COLUMN bills.currency IS 'Currency code for the bill amount';
COMMENT ON COLUMN bills.end_date IS 'When recurring bill subscription ends';
COMMENT ON COLUMN bills.attachment_urls IS 'Array of URLs to uploaded invoices, PDFs, or images';
COMMENT ON COLUMN bills.attachment_names IS 'Array of original file names for attachments';
COMMENT ON COLUMN bills.status IS 'Current status of the bill (pending, paid, partially_paid, overdue, cancelled)';
COMMENT ON COLUMN bills.paid_amount IS 'Amount paid so far (for partial payments)';

