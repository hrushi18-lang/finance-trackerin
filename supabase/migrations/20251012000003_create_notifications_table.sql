-- Migration: Create Notifications Table
-- Date: 2025-10-12
-- Description: Track all notifications sent to users for bills and budgets

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  type text NOT NULL CHECK (type IN ('bill_reminder', 'bill_overdue', 'budget_alert', 'budget_exceeded')),
  entity_id text NOT NULL, -- ID of the bill or budget (stored as text for flexibility)
  entity_type text NOT NULL CHECK (entity_type IN ('bill', 'budget')),
  
  -- Message and metadata
  message text NOT NULL,
  threshold numeric, -- For budget alerts (percentage)
  days_before_due integer, -- For bill reminders
  amount numeric, -- Amount at time of notification
  status text, -- Status at time of notification
  
  -- Tracking
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz, -- When user read the notification
  dismissed_at timestamptz, -- When user dismissed the notification
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_undismissed ON notifications(user_id, is_dismissed) WHERE is_dismissed = false;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE notifications IS 'Tracks all notifications sent to users for bills and budgets';
COMMENT ON COLUMN notifications.type IS 'Type of notification (bill_reminder, bill_overdue, budget_alert, budget_exceeded)';
COMMENT ON COLUMN notifications.entity_id IS 'ID of the related bill or budget';
COMMENT ON COLUMN notifications.entity_type IS 'Type of entity (bill or budget)';
COMMENT ON COLUMN notifications.message IS 'Notification message shown to user';
COMMENT ON COLUMN notifications.threshold IS 'Budget threshold percentage that triggered the alert';
COMMENT ON COLUMN notifications.days_before_due IS 'Days before due date (positive) or days overdue (negative)';
COMMENT ON COLUMN notifications.amount IS 'Amount at the time notification was sent';
COMMENT ON COLUMN notifications.status IS 'Status of the entity at time of notification';
COMMENT ON COLUMN notifications.sent_at IS 'When the notification was sent';
COMMENT ON COLUMN notifications.read_at IS 'When user marked notification as read';
COMMENT ON COLUMN notifications.dismissed_at IS 'When user dismissed the notification';

