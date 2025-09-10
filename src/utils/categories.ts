// Default categories for different financial entities
export const DEFAULT_CATEGORIES = {
  // Transaction categories
  TRANSACTION: {
    INCOME: [
      'Salary',
      'Freelance',
      'Business Income',
      'Investment Returns',
      'Rental Income',
      'Gift Received',
      'Refund',
      'Cashback',
      'Interest Earned',
      'Dividend',
      'Other Income'
    ],
    EXPENSE: [
      'Food & Dining',
      'Transportation',
      'Housing',
      'Utilities',
      'Healthcare',
      'Entertainment',
      'Shopping',
      'Education',
      'Travel',
      'Insurance',
      'Taxes',
      'Personal Care',
      'Subscriptions',
      'Gifts & Donations',
      'Emergency Fund',
      'Goal Funding',
      'Bill Payment',
      'Debt Payment',
      'Transfer',
      'Other Expense'
    ]
  },
  
  // Bill categories
  BILL: [
    'Electricity',
    'Water',
    'Gas',
    'Internet',
    'Phone',
    'Cable/TV',
    'Rent',
    'Mortgage',
    'Insurance',
    'Credit Card',
    'Loan Payment',
    'Subscription',
    'Membership',
    'Tax',
    'Medical',
    'Education',
    'Other Bill'
  ],
  
  // Goal categories
  GOAL: [
    'Emergency Fund',
    'Vacation',
    'Education',
    'Home Purchase',
    'Car Purchase',
    'Wedding',
    'Retirement',
    'Investment',
    'Debt Payoff',
    'Business',
    'Health',
    'Technology',
    'Furniture',
    'Travel',
    'Gift',
    'Other Goal'
  ],
  
  // Liability categories
  LIABILITY: [
    'Personal Loan',
    'Student Loan',
    'Auto Loan',
    'Mortgage',
    'Credit Card',
    'Buy Now Pay Later',
    'Installment Plan',
    'Medical Debt',
    'Tax Debt',
    'Business Loan',
    'Other Debt'
  ],
  
  // Budget categories
  BUDGET: [
    'Food & Dining',
    'Transportation',
    'Housing',
    'Utilities',
    'Healthcare',
    'Entertainment',
    'Shopping',
    'Education',
    'Travel',
    'Insurance',
    'Personal Care',
    'Subscriptions',
    'Gifts & Donations',
    'Emergency Fund',
    'Savings',
    'Debt Payment',
    'Other Budget'
  ],
  
  // Account categories (for grouping)
  ACCOUNT: [
    'Primary Banking',
    'Savings',
    'Investment',
    'Credit',
    'Digital Wallet',
    'Cash',
    'Goals Vault',
    'Business',
    'Joint',
    'Other Account'
  ]
};

// Category colors for UI - using unique keys only
export const CATEGORY_COLORS = {
  // Income colors (greens)
  'Salary': '#10B981',
  'Freelance': '#059669',
  'Business Income': '#047857',
  'Investment Returns': '#065F46',
  'Rental Income': '#064E3B',
  'Gift Received': '#022C22',
  'Refund': '#10B981',
  'Cashback': '#059669',
  'Interest Earned': '#047857',
  'Dividend': '#065F46',
  'Other Income': '#064E3B',
  
  // Expense colors (reds/oranges)
  'Food & Dining': '#EF4444',
  'Transportation': '#F97316',
  'Housing': '#DC2626',
  'Utilities': '#EA580C',
  'Healthcare': '#B91C1C',
  'Entertainment': '#C2410C',
  'Shopping': '#991B1B',
  'Education': '#9A3412',
  'Travel': '#7F1D1D',
  'Insurance': '#92400E',
  'Taxes': '#78350F',
  'Personal Care': '#451A03',
  'Subscriptions': '#EF4444',
  'Gifts & Donations': '#F97316',
  'Emergency Fund': '#DC2626',
  'Goal Funding': '#EA580C',
  'Bill Payment': '#B91C1C',
  'Debt Payment': '#C2410C',
  'Transfer': '#991B1B',
  'Other Expense': '#9A3412',
  
  // Bill colors (blues)
  'Electricity': '#3B82F6',
  'Water': '#2563EB',
  'Gas': '#1D4ED8',
  'Internet': '#1E40AF',
  'Phone': '#1E3A8A',
  'Cable/TV': '#172554',
  'Rent': '#3B82F6',
  'Mortgage': '#2563EB',
  'Loan Payment': '#1E3A8A',
  'Subscription': '#172554',
  'Membership': '#3B82F6',
  'Tax': '#2563EB',
  'Medical': '#1D4ED8',
  'Other Bill': '#1E3A8A',
  
  // Goal colors (purples)
  'Vacation': '#7C3AED',
  'Home Purchase': '#5B21B6',
  'Car Purchase': '#4C1D95',
  'Wedding': '#3B0764',
  'Retirement': '#8B5CF6',
  'Investment': '#7C3AED',
  'Debt Payoff': '#6D28D9',
  'Business': '#5B21B6',
  'Health': '#4C1D95',
  'Technology': '#3B0764',
  'Furniture': '#8B5CF6',
  'Gift': '#6D28D9',
  'Other Goal': '#5B21B6',
  
  // Liability colors (reds)
  'Personal Loan': '#EF4444',
  'Student Loan': '#DC2626',
  'Auto Loan': '#B91C1C',
  'Buy Now Pay Later': '#EF4444',
  'Installment Plan': '#DC2626',
  'Medical Debt': '#B91C1C',
  'Tax Debt': '#991B1B',
  'Business Loan': '#7F1D1D',
  'Other Debt': '#EF4444',
  
  // Budget colors (mixed)
  'Savings Budget': '#B45309',
  'Other Budget': '#78350F',
  
  // Account colors (teals)
  'Primary Banking': '#14B8A6',
  'Savings Account': '#0D9488',
  'Investment Account': '#0F766E',
  'Credit': '#115E59',
  'Digital Wallet': '#134E4A',
  'Cash': '#042F2E',
  'Goals Vault': '#14B8A6',
  'Business Account': '#0D9488',
  'Joint': '#0F766E',
  'Other Account': '#115E59'
};

// Get category color
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280';
};

// Get default categories for a type
export const getDefaultCategories = (type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account') => {
  switch (type) {
    case 'transaction':
      return [...DEFAULT_CATEGORIES.TRANSACTION.INCOME, ...DEFAULT_CATEGORIES.TRANSACTION.EXPENSE];
    case 'bill':
      return DEFAULT_CATEGORIES.BILL;
    case 'goal':
      return DEFAULT_CATEGORIES.GOAL;
    case 'liability':
      return DEFAULT_CATEGORIES.LIABILITY;
    case 'budget':
      return DEFAULT_CATEGORIES.BUDGET;
    case 'account':
      return DEFAULT_CATEGORIES.ACCOUNT;
    default:
      return [];
  }
};

// Validate category
export const isValidCategory = (category: string, type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account'): boolean => {
  const defaultCategories = getDefaultCategories(type);
  return defaultCategories.includes(category);
};

// Get category icon (using Lucide React icons) - using unique keys only
export const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    // Income
    'Salary': 'Briefcase',
    'Freelance': 'User',
    'Business Income': 'Building2',
    'Investment Returns': 'TrendingUp',
    'Rental Income': 'Home',
    'Gift Received': 'Gift',
    'Refund': 'RotateCcw',
    'Cashback': 'CreditCard',
    'Interest Earned': 'Percent',
    'Dividend': 'PieChart',
    'Other Income': 'DollarSign',
    
    // Expenses
    'Food & Dining': 'Utensils',
    'Transportation': 'Car',
    'Housing': 'Home',
    'Utilities': 'Zap',
    'Healthcare': 'Heart',
    'Entertainment': 'Film',
    'Shopping': 'ShoppingBag',
    'Education': 'BookOpen',
    'Travel': 'Plane',
    'Insurance': 'Shield',
    'Taxes': 'FileText',
    'Personal Care': 'User',
    'Subscriptions': 'Calendar',
    'Gifts & Donations': 'Gift',
    'Emergency Fund': 'AlertTriangle',
    'Goal Funding': 'Target',
    'Bill Payment': 'CreditCard',
    'Debt Payment': 'CreditCard',
    'Transfer': 'ArrowRightLeft',
    'Other Expense': 'Minus',
    
    // Bills
    'Electricity': 'Zap',
    'Water': 'Droplets',
    'Gas': 'Flame',
    'Internet': 'Wifi',
    'Phone': 'Phone',
    'Cable/TV': 'Tv',
    'Rent': 'Home',
    'Mortgage': 'Building2',
    'Credit Card': 'CreditCard',
    'Loan Payment': 'Banknote',
    'Subscription': 'Calendar',
    'Membership': 'Users',
    'Tax': 'FileText',
    'Medical': 'Heart',
    'Other Bill': 'FileText',
    
    // Goals
    'Vacation': 'Plane',
    'Home Purchase': 'Home',
    'Car Purchase': 'Car',
    'Wedding': 'Heart',
    'Retirement': 'Clock',
    'Investment': 'TrendingUp',
    'Debt Payoff': 'CreditCard',
    'Business': 'Building2',
    'Health': 'Heart',
    'Technology': 'Laptop',
    'Furniture': 'Sofa',
    'Gift': 'Gift',
    'Other Goal': 'Target',
    
    // Liabilities
    'Personal Loan': 'Banknote',
    'Student Loan': 'GraduationCap',
    'Auto Loan': 'Car',
    'Buy Now Pay Later': 'ShoppingCart',
    'Installment Plan': 'Calendar',
    'Medical Debt': 'Heart',
    'Tax Debt': 'FileText',
    'Business Loan': 'Building2',
    'Other Debt': 'CreditCard',
    
    // Budgets
    'Savings Budget': 'PiggyBank',
    'Other Budget': 'PieChart',
    
    // Accounts
    'Primary Banking': 'Building2',
    'Savings Account': 'PiggyBank',
    'Investment Account': 'TrendingUp',
    'Credit': 'CreditCard',
    'Digital Wallet': 'Smartphone',
    'Cash': 'Banknote',
    'Goals Vault': 'Target',
    'Business Account': 'Building2',
    'Joint': 'Users',
    'Other Account': 'Wallet'
  };
  
  return iconMap[category] || 'Circle';
};

// Category management utilities
export const addCustomCategory = (category: string, type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account'): void => {
  const key = `custom_categories_${type}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  if (!existing.includes(category)) {
    existing.push(category);
    localStorage.setItem(key, JSON.stringify(existing));
  }
};

export const getCustomCategories = (type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account'): string[] => {
  const key = `custom_categories_${type}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const getAllCategories = (type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account'): string[] => {
  const defaultCategories = getDefaultCategories(type);
  const customCategories = getCustomCategories(type);
  return [...defaultCategories, ...customCategories];
};

export const removeCustomCategory = (category: string, type: 'transaction' | 'bill' | 'goal' | 'liability' | 'budget' | 'account'): void => {
  const key = `custom_categories_${type}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const filtered = existing.filter((c: string) => c !== category);
  localStorage.setItem(key, JSON.stringify(filtered));
};

// Luxury icon system integration
export const getLuxuryCategoryIcon = (category: string): string => {
  return getCategoryIcon(category);
};

// Get luxury category colors
export const getLuxuryCategoryColors = (category: string) => {
  const categoryType = getCategoryType(category);
  const luxuryColors = {
    // Income - Premium Greens
    income: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#047857',
      background: '#ECFDF5'
    },
    // Expenses - Sophisticated Reds/Oranges
    expense: {
      primary: '#EF4444',
      secondary: '#DC2626',
      accent: '#B91C1C',
      background: '#FEF2F2'
    },
    // Bills - Professional Blues
    bill: {
      primary: '#3B82F6',
      secondary: '#2563EB',
      accent: '#1D4ED8',
      background: '#EFF6FF'
    },
    // Goals - Elegant Purples
    goal: {
      primary: '#7C3AED',
      secondary: '#5B21B6',
      accent: '#4C1D95',
      background: '#F3E8FF'
    },
    // Liabilities - Warning Reds
    liability: {
      primary: '#EF4444',
      secondary: '#DC2626',
      accent: '#B91C1C',
      background: '#FEF2F2'
    },
    // Budgets - Balanced Teals
    budget: {
      primary: '#14B8A6',
      secondary: '#0D9488',
      accent: '#0F766E',
      background: '#F0FDFA'
    },
    // Accounts - Trustworthy Teals
    account: {
      primary: '#14B8A6',
      secondary: '#0D9488',
      accent: '#0F766E',
      background: '#F0FDFA'
    }
  };
  
  return luxuryColors[categoryType] || luxuryColors.expense;
};

// Determine category type for color selection
const getCategoryType = (category: string): 'income' | 'expense' | 'bill' | 'goal' | 'liability' | 'budget' | 'account' => {
  const incomeCategories = ['Salary', 'Freelance', 'Business Income', 'Investment Returns', 'Rental Income', 'Gift Received', 'Refund', 'Cashback', 'Interest Earned', 'Dividend', 'Other Income'];
  const expenseCategories = ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Travel', 'Insurance', 'Taxes', 'Personal Care', 'Subscriptions', 'Gifts & Donations', 'Emergency Fund', 'Goal Funding', 'Bill Payment', 'Debt Payment', 'Transfer', 'Other Expense'];
  const billCategories = ['Electricity', 'Water', 'Gas', 'Internet', 'Phone', 'Cable/TV', 'Rent', 'Mortgage', 'Credit Card', 'Loan Payment', 'Subscription', 'Membership', 'Tax', 'Medical', 'Other Bill'];
  const goalCategories = ['Emergency Fund', 'Vacation', 'Education', 'Home Purchase', 'Car Purchase', 'Wedding', 'Retirement', 'Investment', 'Debt Payoff', 'Business', 'Health', 'Technology', 'Furniture', 'Travel', 'Gift', 'Other Goal'];
  const liabilityCategories = ['Personal Loan', 'Student Loan', 'Auto Loan', 'Mortgage', 'Credit Card', 'Buy Now Pay Later', 'Installment Plan', 'Medical Debt', 'Tax Debt', 'Business Loan', 'Other Debt'];
  const budgetCategories = ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Travel', 'Insurance', 'Personal Care', 'Subscriptions', 'Gifts & Donations', 'Emergency Fund', 'Savings', 'Debt Payment', 'Other Budget'];
  const accountCategories = ['Primary Banking', 'Savings', 'Investment', 'Credit', 'Digital Wallet', 'Cash', 'Goals Vault', 'Business', 'Joint', 'Other Account'];

  if (incomeCategories.includes(category)) return 'income';
  if (expenseCategories.includes(category)) return 'expense';
  if (billCategories.includes(category)) return 'bill';
  if (goalCategories.includes(category)) return 'goal';
  if (liabilityCategories.includes(category)) return 'liability';
  if (budgetCategories.includes(category)) return 'budget';
  if (accountCategories.includes(category)) return 'account';
  
  return 'expense'; // Default fallback
};
