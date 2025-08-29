export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}
export interface FinancialAccount {
  id: string;
  name: string;
  type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment';
  balance: number;
  institution?: string;
  platform?: string;
  isVisible: boolean;
  currency: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  userId: string;
  accountId?: string; // Linked to specific account
  affectsBalance: boolean; // Whether this affects account balance
  reason?: string; // Required when affectsBalance is false
  transferToAccountId?: string; // For cross-account transfers
  recurringTransactionId?: string; // Link to parent recurring transaction
  parentTransactionId?: string; // Link to parent transaction (for split transactions)
}

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date; // Optional end date
  nextOccurrenceDate: Date;
  lastProcessedDate?: Date; // Track when it was last processed
  isActive: boolean;
  userId: string;
  createdAt: Date;
  // Advanced options
  dayOfWeek?: number; // For weekly (0-6, Sunday=0)
  dayOfMonth?: number; // For monthly (1-31)
  monthOfYear?: number; // For yearly (1-12)
  maxOccurrences?: number; // Optional limit on total occurrences
  currentOccurrences: number; // Track how many times it has occurred
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  userId: string;
  createdAt: Date;
  accountId?: string;
}

export interface Liability {
  id: string;
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'purchase' | 'other';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  due_date: Date;
  userId: string;
  createdAt: Date;
  start_date: Date;
  linkedPurchaseId?: string;
  accountId?: string;
}

export interface EnhancedLiability {
  id: string;
  userId: string;
  name: string;
  liabilityType: 'personal_loan' | 'student_loan' | 'auto_loan' | 'mortgage' | 'credit_card' | 'bnpl' | 'installment' | 'other';
  description?: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment?: number;
  minimumPayment?: number;
  paymentDay: number;
  loanTermMonths?: number;
  remainingTermMonths?: number;
  startDate: Date;
  dueDate?: Date;
  nextPaymentDate?: Date;
  linkedAssetId?: string;
  isSecured: boolean;
  disbursementAccountId?: string;
  defaultPaymentAccountId?: string;
  providesFunds: boolean;
  affectsCreditScore: boolean;
  status: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'closed';
  isActive: boolean;
  autoGenerateBills: boolean;
  billGenerationDay: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  userId: string;
  name: string;
  assetType: string;
  description?: string;
  purchaseValue: number;
  currentValue: number;
  depreciationRate: number;
  purchaseDate: Date;
  lastValuationDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  billType: 'fixed' | 'variable' | 'one_time' | 'liability_linked';
  amount: number;
  estimatedAmount?: number;
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom' | 'one_time';
  customFrequencyDays?: number;
  dueDate: Date;
  nextDueDate: Date;
  lastPaidDate?: Date;
  defaultAccountId?: string;
  autoPay: boolean;
  linkedLiabilityId?: string;
  isEmi: boolean;
  isActive: boolean;
  isEssential: boolean;
  reminderDaysBefore: number;
  sendDueDateReminder: boolean;
  sendOverdueReminder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillInstance {
  id: string;
  billId: string;
  userId: string;
  dueDate: Date;
  amount: number;
  actualAmount?: number;
  status: 'pending' | 'paid' | 'failed' | 'skipped' | 'overdue';
  paymentMethod?: 'auto' | 'manual' | 'other_account';
  paidDate?: Date;
  paidFromAccountId?: string;
  transactionId?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  lateFee: number;
  penaltyApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiabilityPayment {
  id: string;
  liabilityId: string;
  userId: string;
  amount: number;
  paymentDate: Date;
  paymentType: 'regular' | 'extra' | 'minimum' | 'full' | 'partial';
  principalAmount: number;
  interestAmount: number;
  feesAmount: number;
  paidFromAccountId?: string;
  transactionId?: string;
  billInstanceId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: 'bill_reminder' | 'bill_overdue' | 'liability_due' | 'payment_failed' | 'payment_success' | 'bill_generated';
  billId?: string;
  billInstanceId?: string;
  liabilityId?: string;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sendEmail: boolean;
  sendPush: boolean;
  sendSms: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  userId: string;
  accountId?: string; // Link budgets to specific accounts
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
  userId: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  budgetUtilization: number;
}

export interface UserCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeSource {
  id: string;
  name: string;
  type: 'salary' | 'freelance' | 'business' | 'investment' | 'rental' | 'other';
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  lastReceived?: Date;
  nextExpected?: Date;
  reliability: 'high' | 'medium' | 'low';
  userId: string;
  createdAt: Date;
}

export interface SplitTransaction {
  category: string;
  amount: number;
  description: string;
}

export interface DebtPaymentPlan {
  id: string;
  name: string;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  payoffDate: Date;
  totalInterest: number;
  payments: Array<{
    date: Date;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }>;
}

export interface DebtRepaymentStrategy {
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffDate: Date;
  debtPlans: DebtPaymentPlan[];
}