import { BillTypeCategory, BillStatus, BillFrequency, BillPriority, Bill } from '../types';

/**
 * Bill Type Category Information
 * Contains metadata about each bill type
 */
export const BILL_TYPE_INFO: Record<BillTypeCategory, {
  icon: string;
  label: string;
  description: string;
  color: string;
  examples: string[];
  isEssential: boolean;
}> = {
  recurring_utilities: {
    icon: '🏠',
    label: 'Recurring Utilities / Essential Bills',
    description: 'Monthly housing and utility payments',
    color: 'blue',
    examples: ['Rent/Mortgage', 'Electricity', 'Water', 'Gas', 'Internet', 'Mobile', 'Insurance'],
    isEssential: true
  },
  variable_usage: {
    icon: '📊',
    label: 'Variable / Usage-Based Bills',
    description: 'Bills that vary based on usage',
    color: 'purple',
    examples: ['Electricity Overages', 'Water Usage', 'Mobile Data', 'Gas Usage'],
    isEssential: true
  },
  credit_loan: {
    icon: '💳',
    label: 'Credit / Loan Payments',
    description: 'Credit card bills and loan repayments',
    color: 'red',
    examples: ['Credit Card Bill', 'Personal Loan', 'Auto Loan', 'Student Loan', 'Mortgage EMI'],
    isEssential: true
  },
  subscription: {
    icon: '📺',
    label: 'Subscription / Membership',
    description: 'Streaming services and memberships',
    color: 'green',
    examples: ['Netflix', 'Spotify', 'Gym Membership', 'Amazon Prime', 'Cloud Storage'],
    isEssential: false
  },
  one_time_misc: {
    icon: '🔧',
    label: 'One-Time / Miscellaneous',
    description: 'Non-recurring bills and expenses',
    color: 'gray',
    examples: ['Medical Bills', 'Car Repair', 'Home Maintenance', 'Shopping', 'Travel'],
    isEssential: false
  }
};

/**
 * Bill Status Information
 */
export const BILL_STATUS_INFO: Record<BillStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  pending: { label: 'Pending', color: 'yellow', icon: '⏳' },
  paid: { label: 'Paid', color: 'green', icon: '✅' },
  partially_paid: { label: 'Partially Paid', color: 'blue', icon: '⚡' },
  overdue: { label: 'Overdue', color: 'red', icon: '⚠️' },
  cancelled: { label: 'Cancelled', color: 'gray', icon: '❌' }
};

/**
 * Bill Frequency Information
 */
export const BILL_FREQUENCY_INFO: Record<BillFrequency, {
  label: string;
  days: number;
  description: string;
}> = {
  weekly: { label: 'Weekly', days: 7, description: 'Every week' },
  bi_weekly: { label: 'Bi-Weekly', days: 14, description: 'Every 2 weeks' },
  monthly: { label: 'Monthly', days: 30, description: 'Every month' },
  quarterly: { label: 'Quarterly', days: 90, description: 'Every 3 months' },
  semi_annual: { label: 'Semi-Annual', days: 180, description: 'Every 6 months' },
  annual: { label: 'Annual', days: 365, description: 'Every year' },
  custom: { label: 'Custom', days: 0, description: 'Custom frequency' },
  one_time: { label: 'One-Time', days: 0, description: 'Non-recurring' }
};

/**
 * Bill Priority Information
 */
export const BILL_PRIORITY_INFO: Record<BillPriority, {
  label: string;
  color: string;
  icon: string;
  urgency: number;
}> = {
  low: { label: 'Low Priority', color: 'gray', icon: '⚪', urgency: 1 },
  medium: { label: 'Medium Priority', color: 'blue', icon: '🔵', urgency: 2 },
  high: { label: 'High Priority', color: 'orange', icon: '🟠', urgency: 3 },
  critical: { label: 'Critical', color: 'red', icon: '🔴', urgency: 4 }
};

/**
 * Check if bill is overdue
 */
export function isBillOverdue(bill: Bill): boolean {
  const now = new Date();
  const dueDate = new Date(bill.dueDate);
  return now > dueDate && bill.status === 'pending';
}

/**
 * Get days until due
 */
export function getDaysUntilDue(bill: Bill): number {
  const now = new Date();
  const dueDate = new Date(bill.dueDate);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get bill urgency level based on days until due
 */
export function getBillUrgency(bill: Bill): {
  level: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  color: string;
} {
  if (isBillOverdue(bill)) {
    const daysOverdue = Math.abs(getDaysUntilDue(bill));
    return {
      level: 'critical',
      message: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}!`,
      color: 'red'
    };
  }

  const daysUntilDue = getDaysUntilDue(bill);
  
  if (daysUntilDue <= 3) {
    return {
      level: 'critical',
      message: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}!`,
      color: 'red'
    };
  } else if (daysUntilDue <= 7) {
    return {
      level: 'high',
      message: `Due in ${daysUntilDue} days`,
      color: 'orange'
    };
  } else if (daysUntilDue <= 14) {
    return {
      level: 'medium',
      message: `Due in ${daysUntilDue} days`,
      color: 'yellow'
    };
  } else {
    return {
      level: 'low',
      message: `Due in ${daysUntilDue} days`,
      color: 'green'
    };
  }
}

/**
 * Check if bill needs reminder
 */
export function needsReminder(bill: Bill): boolean {
  if (!bill.sendDueDateReminder || bill.status !== 'pending') {
    return false;
  }

  const now = new Date();
  const dueDate = new Date(bill.dueDate);
  const reminderDaysMs = bill.reminderDaysBefore * 24 * 60 * 60 * 1000;
  const reminderDate = new Date(dueDate.getTime() - reminderDaysMs);

  return now >= reminderDate && now < dueDate;
}

/**
 * Calculate remaining amount
 */
export function getRemainingAmount(bill: Bill): number {
  return Math.max(0, bill.amount - (bill.paidAmount || 0));
}

/**
 * Calculate payment progress percentage
 */
export function getPaymentProgress(bill: Bill): number {
  if (bill.amount === 0) return 0;
  const paid = bill.paidAmount || 0;
  return Math.min(Math.round((paid / bill.amount) * 100), 100);
}

/**
 * Get next occurrence date for recurring bills
 */
export function getNextOccurrence(bill: Bill): Date | null {
  if (!bill.isRecurring || bill.frequency === 'one_time') {
    return null;
  }

  const current = new Date(bill.nextDueDate);
  const frequencyInfo = BILL_FREQUENCY_INFO[bill.frequency];
  
  if (bill.frequency === 'custom' && bill.customFrequencyDays) {
    current.setDate(current.getDate() + bill.customFrequencyDays);
  } else {
    current.setDate(current.getDate() + frequencyInfo.days);
  }

  // Check if it's past end date
  if (bill.endDate && current > new Date(bill.endDate)) {
    return null;
  }

  return current;
}

/**
 * Format bill display name
 */
export function getBillDisplayName(bill: Bill): string {
  return bill.title;
}

/**
 * Get bill color based on type category
 */
export function getBillColor(billTypeCategory: BillTypeCategory): string {
  return BILL_TYPE_INFO[billTypeCategory].color;
}

/**
 * Get bill icon based on type category
 */
export function getBillIcon(billTypeCategory: BillTypeCategory): string {
  return BILL_TYPE_INFO[billTypeCategory].icon;
}

/**
 * Check if bill is essential
 */
export function isBillEssential(bill: Bill): boolean {
  if (bill.billTypeCategory) {
    return BILL_TYPE_INFO[bill.billTypeCategory].isEssential;
  }
  return bill.isEssential || false;
}

/**
 * Format frequency display text
 */
export function formatFrequency(frequency: BillFrequency): string {
  return BILL_FREQUENCY_INFO[frequency].label;
}

/**
 * Get bill status color
 */
export function getBillStatusColor(status: BillStatus): string {
  return BILL_STATUS_INFO[status].color;
}

/**
 * Get bill status icon
 */
export function getBillStatusIcon(status: BillStatus): string {
  return BILL_STATUS_INFO[status].icon;
}

/**
 * Calculate total monthly bill cost for recurring bills
 */
export function calculateMonthlyBillCost(bill: Bill): number {
  if (!bill.isRecurring || bill.frequency === 'one_time') {
    return 0;
  }

  const frequencyInfo = BILL_FREQUENCY_INFO[bill.frequency];
  const monthlyFactor = 30 / frequencyInfo.days;
  return bill.amount * monthlyFactor;
}

/**
 * Check if bill has attachments
 */
export function hasAttachments(bill: Bill): boolean {
  return (bill.attachmentUrls && bill.attachmentUrls.length > 0) || false;
}

/**
 * Sort bills by priority and due date
 */
export function sortBillsByUrgency(bills: Bill[]): Bill[] {
  return [...bills].sort((a, b) => {
    // First, sort by overdue status
    const aOverdue = isBillOverdue(a) ? 1 : 0;
    const bOverdue = isBillOverdue(b) ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    // Then by priority
    const aPriority = BILL_PRIORITY_INFO[a.priority].urgency;
    const bPriority = BILL_PRIORITY_INFO[b.priority].urgency;
    if (aPriority !== bPriority) return bPriority - aPriority;

    // Finally by due date (earliest first)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

/**
 * Get upcoming bills (due in next N days)
 */
export function getUpcomingBills(bills: Bill[], days: number = 7): Bill[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return bills.filter(bill => {
    if (bill.status !== 'pending') return false;
    const dueDate = new Date(bill.dueDate);
    return dueDate >= now && dueDate <= futureDate;
  });
}

/**
 * Get overdue bills
 */
export function getOverdueBills(bills: Bill[]): Bill[] {
  return bills.filter(bill => isBillOverdue(bill));
}

/**
 * Calculate total amount due
 */
export function getTotalAmountDue(bills: Bill[]): number {
  return bills
    .filter(bill => bill.status === 'pending' || bill.status === 'partially_paid')
    .reduce((total, bill) => total + getRemainingAmount(bill), 0);
}

