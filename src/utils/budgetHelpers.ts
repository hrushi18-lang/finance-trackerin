import { BudgetType, BudgetRecurrence, Budget } from '../types';

/**
 * Budget Type Information
 * Contains metadata about each budget type
 */
export const BUDGET_TYPE_INFO: Record<BudgetType, {
  icon: string;
  label: string;
  description: string;
  color: string;
  category: 'expense' | 'savings' | 'advanced';
}> = {
  fixed_expense: {
    icon: '🏠',
    label: 'Fixed Expense Budget',
    description: 'Regular recurring bills (rent, utilities, subscriptions)',
    color: 'blue',
    category: 'expense'
  },
  variable_expense: {
    icon: '📊',
    label: 'Variable Expense Budget',
    description: 'Fluctuating costs (groceries, dining, entertainment)',
    color: 'purple',
    category: 'expense'
  },
  debt_repayment: {
    icon: '💳',
    label: 'Debt Repayment Budget',
    description: 'Paying off loans or credit cards',
    color: 'red',
    category: 'expense'
  },
  savings: {
    icon: '🏦',
    label: 'Savings Budget',
    description: 'Emergency fund or general savings',
    color: 'green',
    category: 'savings'
  },
  goal_oriented: {
    icon: '🎯',
    label: 'Goal-Oriented Budget',
    description: 'Targeted spending for specific goals',
    color: 'yellow',
    category: 'savings'
  },
  cash_envelope: {
    icon: '💰',
    label: 'Cash Envelope Budget',
    description: 'Divide money into category envelopes',
    color: 'amber',
    category: 'advanced'
  },
  income_allocation: {
    icon: '📈',
    label: 'Income Allocation Budget',
    description: 'Percentage-based (e.g., 50/30/20 rule)',
    color: 'teal',
    category: 'advanced'
  },
  zero_based: {
    icon: '🎲',
    label: 'Zero-Based Budget',
    description: 'Every dollar is allocated',
    color: 'indigo',
    category: 'advanced'
  },
  rolling: {
    icon: '🔄',
    label: 'Rolling Budget',
    description: 'Unused budget carries over',
    color: 'emerald',
    category: 'advanced'
  },
  custom: {
    icon: '⚙️',
    label: 'Custom Budget',
    description: 'User-defined budget type',
    color: 'gray',
    category: 'advanced'
  }
};

/**
 * Recurrence Information
 */
export const RECURRENCE_INFO: Record<BudgetRecurrence, {
  label: string;
  days: number;
  description: string;
}> = {
  once: { label: 'One-Time', days: 0, description: 'Non-recurring budget' },
  daily: { label: 'Daily', days: 1, description: 'Resets every day' },
  weekly: { label: 'Weekly', days: 7, description: 'Resets every week' },
  'bi-weekly': { label: 'Bi-Weekly', days: 14, description: 'Every two weeks' },
  monthly: { label: 'Monthly', days: 30, description: 'Most common choice' },
  quarterly: { label: 'Quarterly', days: 90, description: 'Every 3 months' },
  yearly: { label: 'Yearly', days: 365, description: 'Annual planning' }
};

/**
 * Calculate budget progress percentage
 */
export function calculateBudgetProgress(spent: number, amount: number): number {
  if (amount === 0) return 0;
  return Math.min(Math.round((spent / amount) * 100), 100);
}

/**
 * Get budget status based on progress
 */
export function getBudgetStatus(spent: number, amount: number, alertThreshold: number = 80): {
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  color: string;
  message: string;
} {
  const progress = calculateBudgetProgress(spent, amount);
  
  if (progress >= 100) {
    return {
      status: 'exceeded',
      color: 'red',
      message: 'Budget exceeded!'
    };
  } else if (progress >= alertThreshold) {
    return {
      status: 'danger',
      color: 'orange',
      message: `${progress}% used - approaching limit!`
    };
  } else if (progress >= alertThreshold * 0.75) {
    return {
      status: 'warning',
      color: 'yellow',
      message: `${progress}% used`
    };
  } else {
    return {
      status: 'safe',
      color: 'green',
      message: `${progress}% used`
    };
  }
}

/**
 * Calculate remaining budget amount
 */
export function calculateRemainingBudget(budget: Budget): number {
  return Math.max(0, budget.amount - (budget.spent || 0));
}

/**
 * Check if budget is active
 */
export function isBudgetActive(budget: Budget): boolean {
  if (!budget.is_active || budget.status !== 'active') {
    return false;
  }
  
  const now = new Date();
  const startDate = budget.startDate ? new Date(budget.startDate) : null;
  const endDate = budget.endDate ? new Date(budget.endDate) : null;
  
  if (startDate && now < startDate) {
    return false;
  }
  
  if (endDate && now > endDate) {
    return false;
  }
  
  return true;
}

/**
 * Check if budget should trigger an alert
 */
export function shouldTriggerAlert(budget: Budget): boolean {
  if (!budget.alertEnabled || !isBudgetActive(budget)) {
    return false;
  }
  
  const progress = calculateBudgetProgress(budget.spent || 0, budget.amount);
  return progress >= (budget.alertThreshold || 80);
}

/**
 * Get next reset date based on recurrence
 */
export function getNextResetDate(budget: Budget): Date | null {
  if (budget.recurrence === 'once') {
    return null;
  }
  
  const startDate = budget.startDate ? new Date(budget.startDate) : new Date();
  const now = new Date();
  
  const recurrenceInfo = RECURRENCE_INFO[budget.recurrence || 'monthly'];
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const cyclesSinceStart = Math.floor(daysSinceStart / recurrenceInfo.days);
  const nextReset = new Date(startDate);
  nextReset.setDate(nextReset.getDate() + (cyclesSinceStart + 1) * recurrenceInfo.days);
  
  return nextReset;
}

/**
 * Format budget name with fallback
 */
export function getBudgetDisplayName(budget: Budget): string {
  if (budget.name) {
    return budget.name;
  }
  return `${budget.category} Budget`;
}

/**
 * Get budget type category
 */
export function getBudgetTypeCategory(budgetType: BudgetType): 'expense' | 'savings' | 'advanced' {
  return BUDGET_TYPE_INFO[budgetType].category;
}

/**
 * Calculate rollover amount for rolling budgets
 */
export function calculateRolloverAmount(budget: Budget): number {
  if (!budget.allowRollover || budget.budgetType !== 'rolling') {
    return 0;
  }
  
  const remaining = calculateRemainingBudget(budget);
  return remaining > 0 ? remaining : 0;
}

/**
 * Get budget color based on type
 */
export function getBudgetColor(budgetType: BudgetType): string {
  return BUDGET_TYPE_INFO[budgetType].color;
}

/**
 * Format recurrence display text
 */
export function formatRecurrence(recurrence: BudgetRecurrence): string {
  return RECURRENCE_INFO[recurrence].label;
}

/**
 * Check if budget needs rollover processing
 */
export function needsRolloverProcessing(budget: Budget): boolean {
  if (!budget.allowRollover || budget.budgetType !== 'rolling') {
    return false;
  }
  
  const nextReset = getNextResetDate(budget);
  if (!nextReset) {
    return false;
  }
  
  const now = new Date();
  return now >= nextReset && calculateRemainingBudget(budget) > 0;
}

