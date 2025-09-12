/**
 * Credit Card Bills - Type Definitions
 * Comprehensive type definitions for the credit card bill management system
 */

export interface CreditCardBillCycle {
  id: string;
  userId: string;
  creditCardAccountId: string;
  
  // Cycle Information
  cycleStartDate: Date;
  cycleEndDate: Date;
  statementDate: Date;
  dueDate: Date;
  
  // Billing Information
  openingBalance: number;
  closingBalance: number;
  totalCharges: number;
  totalPayments: number;
  totalCredits: number;
  interestCharged: number;
  feesCharged: number;
  
  // Payment Information
  minimumDue: number;
  fullBalanceDue: number;
  amountPaid: number;
  remainingBalance: number;
  
  // Status and Lifecycle
  cycleStatus: 'unbilled' | 'billed' | 'partially_paid' | 'paid_full' | 'paid_minimum' | 'overdue' | 'carried_forward' | 'closed' | 'disputed';
  paymentStatus: 'pending' | 'paid_full' | 'paid_minimum' | 'paid_partial' | 'overdue' | 'disputed';
  
  // Currency Support
  currencyCode: string;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRateUsed?: number;
  
  // Metadata
  isImported: boolean;
  importSource?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCardBillPayment {
  id: string;
  userId: string;
  billCycleId: string;
  transactionId?: string;
  
  // Payment Details
  paymentAmount: number;
  paymentType: 'full' | 'minimum' | 'partial' | 'overpayment';
  paymentMethod?: string;
  paymentDate: Date;
  
  // Source Account
  sourceAccountId?: string;
  
  // Currency Support
  currencyCode: string;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRateUsed?: number;
  
  // Metadata
  notes?: string;
  createdAt: Date;
}

export interface CreditCardSettings {
  id: string;
  userId: string;
  creditCardAccountId: string;
  
  // Billing Cycle Settings
  billingCycleStartDay: number; // 1-31
  billingCycleEndDay: number; // 1-31
  dueDateDaysAfterStatement: number; // 1-60
  
  // Payment Settings
  minimumDuePercentage: number; // 0-100
  autoPayEnabled: boolean;
  autoPayAmountType: 'minimum' | 'full' | 'custom';
  autoPayCustomAmount?: number;
  autoPaySourceAccountId?: string;
  
  // Notification Settings
  reminderDaysBeforeDue: number[]; // e.g., [7, 3, 1]
  sendSpendingAlerts: boolean;
  spendingAlertThresholds: number[]; // e.g., [50, 75, 90] (percentages)
  sendOverdueAlerts: boolean;
  
  // Currency Settings
  primaryCurrency: string;
  displayCurrency: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCardBillFormData {
  // Account Selection
  creditCardAccountId: string;
  
  // Cycle Settings
  billingCycleStartDay: number;
  billingCycleEndDay: number;
  dueDateDaysAfterStatement: number;
  
  // Payment Settings
  minimumDuePercentage: number;
  autoPayEnabled: boolean;
  autoPayAmountType: 'minimum' | 'full' | 'custom';
  autoPayCustomAmount?: number;
  autoPaySourceAccountId?: string;
  
  // Notification Settings
  reminderDaysBeforeDue: number[];
  sendSpendingAlerts: boolean;
  spendingAlertThresholds: number[];
  sendOverdueAlerts: boolean;
  
  // Currency Settings
  primaryCurrency: string;
  displayCurrency: string;
}

export interface CreditCardPaymentFormData {
  billCycleId: string;
  paymentAmount: number;
  paymentType: 'full' | 'minimum' | 'partial' | 'overpayment';
  paymentMethod?: string;
  sourceAccountId: string;
  notes?: string;
}

export interface CreditCardBillAnalytics {
  totalOutstandingBalance: number;
  totalMinimumDue: number;
  totalFullBalanceDue: number;
  averageMonthlySpending: number;
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    minimumOnlyPayments: number;
    fullPayments: number;
  };
  interestRisk: {
    totalCarriedForward: number;
    estimatedInterest: number;
    monthsWithCarryForward: number;
  };
  spendingPatterns: {
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      spending: number;
      payments: number;
    }>;
  };
}

export interface CreditCardBillNotification {
  id: string;
  userId: string;
  billCycleId: string;
  type: 'spending_alert' | 'due_reminder' | 'overdue_alert' | 'payment_confirmation' | 'cycle_generated';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: Date;
  scheduledFor?: Date;
}

export interface MidCycleImportData {
  creditCardAccountId: string;
  currentOutstandingBalance: number;
  nextDueDate: Date;
  billingCycleStartDay: number;
  billingCycleEndDay: number;
  minimumDuePercentage: number;
  currencyCode: string;
  notes?: string;
}

export interface CreditCardBillSummary {
  accountId: string;
  accountName: string;
  currentCycle: CreditCardBillCycle | null;
  upcomingDue: {
    amount: number;
    dueDate: Date;
    daysUntilDue: number;
  } | null;
  totalOutstanding: number;
  creditUtilization: number; // percentage
  paymentStatus: 'current' | 'upcoming' | 'overdue';
  lastPaymentDate?: Date;
  nextCycleDate?: Date;
}

// Enhanced Bill interface with credit card specific fields
export interface CreditCardBill extends Bill {
  isCreditCardBill: boolean;
  creditCardAccountId?: string;
  billCycleId?: string;
  minimumDue?: number;
  fullBalanceDue?: number;
  paymentType?: 'full' | 'minimum' | 'partial' | 'overpayment';
  carryForwardAmount?: number;
  interestCharged?: number;
  feesCharged?: number;
}

// Utility types for credit card bill management
export type CreditCardBillStatus = CreditCardBillCycle['cycleStatus'];
export type CreditCardPaymentStatus = CreditCardBillCycle['paymentStatus'];
export type CreditCardPaymentType = CreditCardBillPayment['paymentType'];

// Constants for credit card bill management
export const CREDIT_CARD_BILL_STATUSES = {
  UNBILLED: 'unbilled',
  BILLED: 'billed',
  PARTIALLY_PAID: 'partially_paid',
  PAID_FULL: 'paid_full',
  PAID_MINIMUM: 'paid_minimum',
  OVERDUE: 'overdue',
  CARRIED_FORWARD: 'carried_forward',
  CLOSED: 'closed',
  DISPUTED: 'disputed'
} as const;

export const CREDIT_CARD_PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID_FULL: 'paid_full',
  PAID_MINIMUM: 'paid_minimum',
  PAID_PARTIAL: 'paid_partial',
  OVERDUE: 'overdue',
  DISPUTED: 'disputed'
} as const;

export const CREDIT_CARD_PAYMENT_TYPES = {
  FULL: 'full',
  MINIMUM: 'minimum',
  PARTIAL: 'partial',
  OVERPAYMENT: 'overpayment'
} as const;

export const DEFAULT_CREDIT_CARD_SETTINGS: Partial<CreditCardSettings> = {
  billingCycleStartDay: 1,
  billingCycleEndDay: 30,
  dueDateDaysAfterStatement: 15,
  minimumDuePercentage: 5.0,
  autoPayEnabled: false,
  autoPayAmountType: 'minimum',
  reminderDaysBeforeDue: [7, 3, 1],
  sendSpendingAlerts: true,
  spendingAlertThresholds: [50, 75, 90],
  sendOverdueAlerts: true,
  primaryCurrency: 'USD',
  displayCurrency: 'USD'
};
