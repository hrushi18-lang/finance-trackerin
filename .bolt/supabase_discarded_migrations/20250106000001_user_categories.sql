-- Create user_categories table for custom categories
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'bill', 'goal', 'liability', 'budget', 'account')),
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50) DEFAULT 'Circle',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_categories_type ON user_categories(type);
CREATE INDEX IF NOT EXISTS idx_user_categories_active ON user_categories(is_active);

-- Enable RLS
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own categories" ON user_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON user_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON user_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON user_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_categories_updated_at
  BEFORE UPDATE ON user_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_user_categories_updated_at();

-- Insert some default categories for existing users
INSERT INTO user_categories (user_id, name, type, color, icon)
SELECT 
  u.id,
  'Custom Income',
  'income',
  '#10B981',
  'DollarSign'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_categories uc 
  WHERE uc.user_id = u.id AND uc.name = 'Custom Income' AND uc.type = 'income'
);

INSERT INTO user_categories (user_id, name, type, color, icon)
SELECT 
  u.id,
  'Custom Expense',
  'expense',
  '#EF4444',
  'Minus'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_categories uc 
  WHERE uc.user_id = u.id AND uc.name = 'Custom Expense' AND uc.type = 'expense'
);
