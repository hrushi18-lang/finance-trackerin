import React from 'react';
import { 
  // Income Icons
  Briefcase, 
  User, 
  Building2, 
  TrendingUp, 
  Home, 
  Gift, 
  RotateCcw, 
  CreditCard, 
  Percent, 
  PieChart, 
  DollarSign,
  
  // Expense Icons
  Utensils, 
  Car, 
  Zap, 
  Heart, 
  Film, 
  ShoppingBag, 
  BookOpen, 
  Plane, 
  Shield, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  Target, 
  ArrowRightLeft, 
  Minus,
  
  // Bill Icons
  Droplets, 
  Flame, 
  Wifi, 
  Phone, 
  Tv, 
  Banknote, 
  Users,
  
  // Goal Icons
  Clock, 
  Laptop, 
  Sofa,
  
  // Liability Icons
  GraduationCap, 
  ShoppingCart,
  
  // Budget Icons
  PiggyBank,
  
  // Account Icons
  Smartphone, 
  Wallet,
  
  // Fallback
  Circle
} from 'lucide-react';

interface LuxuryCategoryIconProps {
  category: string;
  size?: number;
  className?: string;
  variant?: 'default' | 'minimal' | 'luxury';
}

// Luxury icon mappings with premium design
const LUXURY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Income - Premium Green Tones
  'Salary': Briefcase,
  'Freelance': User,
  'Business Income': Building2,
  'Investment Returns': TrendingUp,
  'Rental Income': Home,
  'Gift Received': Gift,
  'Refund': RotateCcw,
  'Cashback': CreditCard,
  'Interest Earned': Percent,
  'Dividend': PieChart,
  'Other Income': DollarSign,
  
  // Expenses - Sophisticated Red/Orange Tones
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Housing': Home,
  'Utilities': Zap,
  'Healthcare': Heart,
  'Entertainment': Film,
  'Shopping': ShoppingBag,
  'Education': BookOpen,
  'Travel': Plane,
  'Insurance': Shield,
  'Taxes': FileText,
  'Personal Care': User,
  'Subscriptions': Calendar,
  'Gifts & Donations': Gift,
  'Emergency Fund': AlertTriangle,
  'Goal Funding': Target,
  'Bill Payment': CreditCard,
  'Debt Payment': CreditCard,
  'Transfer': ArrowRightLeft,
  'Other Expense': Minus,
  
  // Bills - Professional Blue Tones
  'Electricity': Zap,
  'Water': Droplets,
  'Gas': Flame,
  'Internet': Wifi,
  'Phone': Phone,
  'Cable/TV': Tv,
  'Rent': Home,
  'Mortgage': Building2,
  'Credit Card': CreditCard,
  'Loan Payment': Banknote,
  'Subscription': Calendar,
  'Membership': Users,
  'Tax': FileText,
  'Medical': Heart,
  'Other Bill': FileText,
  
  // Goals - Elegant Purple Tones
  'Vacation': Plane,
  'Home Purchase': Home,
  'Car Purchase': Car,
  'Wedding': Heart,
  'Retirement': Clock,
  'Debt Payoff': CreditCard,
  'Health': Heart,
  'Technology': Laptop,
  'Furniture': Sofa,
  'Other Goal': Target,
  
  // Liabilities - Warning Red Tones
  'Personal Loan': Banknote,
  'Student Loan': GraduationCap,
  'Auto Loan': Car,
  'Buy Now Pay Later': ShoppingCart,
  'Installment Plan': Calendar,
  'Medical Debt': Heart,
  'Tax Debt': FileText,
  'Business Loan': Building2,
  'Other Debt': CreditCard,
  
  // Budgets - Balanced Teal Tones
  'Savings': PiggyBank,
  'Other Budget': PieChart,
  
  // Accounts - Trustworthy Teal Tones
  'Primary Banking': Building2,
  'Credit': CreditCard,
  'Digital Wallet': Smartphone,
  'Cash': Banknote,
  'Goals Vault': Target,
  'Joint': Users,
  'Other Account': Wallet
};

// Luxury color palette for different category types
const LUXURY_COLORS = {
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

// Determine category type for color selection
const getCategoryType = (category: string): keyof typeof LUXURY_COLORS => {
  const incomeCategories = ['Salary', 'Freelance', 'Business Income', 'Investment Returns', 'Rental Income', 'Gift Received', 'Refund', 'Cashback', 'Interest Earned', 'Dividend', 'Other Income'];
  const expenseCategories = ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Travel', 'Insurance', 'Taxes', 'Personal Care', 'Subscriptions', 'Gifts & Donations', 'Emergency Fund', 'Goal Funding', 'Bill Payment', 'Debt Payment', 'Transfer', 'Other Expense'];
  const billCategories = ['Electricity', 'Water', 'Gas', 'Internet', 'Phone', 'Cable/TV', 'Rent', 'Mortgage', 'Credit Card', 'Loan Payment', 'Subscription', 'Membership', 'Tax', 'Medical', 'Other Bill'];
  const goalCategories = ['Vacation', 'Home Purchase', 'Car Purchase', 'Wedding', 'Retirement', 'Debt Payoff', 'Health', 'Technology', 'Furniture', 'Other Goal'];
  const liabilityCategories = ['Personal Loan', 'Student Loan', 'Auto Loan', 'Buy Now Pay Later', 'Installment Plan', 'Medical Debt', 'Tax Debt', 'Business Loan', 'Other Debt'];
  const budgetCategories = ['Savings', 'Other Budget'];
  const accountCategories = ['Primary Banking', 'Credit', 'Digital Wallet', 'Cash', 'Goals Vault', 'Joint', 'Other Account'];

  if (incomeCategories.includes(category)) return 'income';
  if (expenseCategories.includes(category)) return 'expense';
  if (billCategories.includes(category)) return 'bill';
  if (goalCategories.includes(category)) return 'goal';
  if (liabilityCategories.includes(category)) return 'liability';
  if (budgetCategories.includes(category)) return 'budget';
  if (accountCategories.includes(category)) return 'account';
  
  return 'expense'; // Default fallback
};

export const LuxuryCategoryIcon: React.FC<LuxuryCategoryIconProps> = ({
  category,
  size = 20,
  className = '',
  variant = 'luxury'
}) => {
  const IconComponent = LUXURY_ICON_MAP[category] || Circle;
  const categoryType = getCategoryType(category);
  const colors = LUXURY_COLORS[categoryType];

  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return {
          color: colors.primary,
          backgroundColor: 'transparent',
          borderRadius: '50%',
          padding: '4px',
          boxShadow: 'none'
        };
      case 'luxury':
        return {
          color: colors.primary,
          backgroundColor: colors.background,
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          border: `1px solid ${colors.background}`,
          transition: 'all 0.2s ease-in-out'
        };
      default:
        return {
          color: colors.primary,
          backgroundColor: colors.background,
          borderRadius: '8px',
          padding: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`luxury-category-icon ${className}`}
      style={styles}
      onMouseEnter={(e) => {
        if (variant === 'luxury') {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'luxury') {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
        }
      }}
    >
      <IconComponent size={size} />
    </div>
  );
};

// Utility function to get luxury colors for a category
export const getLuxuryCategoryColors = (category: string) => {
  const categoryType = getCategoryType(category);
  return LUXURY_COLORS[categoryType];
};

// Utility function to get the icon component for a category
export const getLuxuryCategoryIcon = (category: string) => {
  return LUXURY_ICON_MAP[category] || Circle;
};

export default LuxuryCategoryIcon;
