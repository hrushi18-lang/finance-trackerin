export interface User {
  id: string;
  email: string;
  // name: string; // Removed as per schema
  name: string;
  avatar?: string;
  createdAt: Date;
}
export interface FinancialAccount {
  id: string;
  name: string;
  type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment' | 'goals_vault';
  balance: number;
  institution: string | null;
  platform: string | null;
  accountNumber: string | null;
  isVisible: boolean; // Renamed from is_visible
  currency: string; // Renamed from currencycode
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'payment' | 'contribution';
  amount: number;
  category: string;
  // description: string; // Removed as per schema
  description: string;
  date: Date;
  userId: string;
  accountId?: string; // Linked to specific account
  affectsBalance: boolean; // Whether this affects account balance
  reason?: string; // Required when affectsBalance is false
  status: 'completed' | 'pending' | 'scheduled' | 'cancelled'; // Transaction status
  // transferToAccountId?: string; // Removed as per schema
  transferToAccountId?: string; // For cross-account transfers
  // recurringTransactionId?: string; // Removed as per schema
  recurringTransactionId?: string; // Link to parent recurring transaction
  // parentTransactionId?: string; // Removed as per schema
  parentTransactionId?: string; // Link to parent transaction (for split transactions)
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  isSplit?: boolean;
  splitGroupId?: string;
  // Detail page linking fields
  goal_id?: string; // Link to specific goal
  budget_id?: string; // Link to specific budget
  bill_id?: string; // Link to specific bill
  liability_id?: string; // Link to specific liability
  // Additional fields for detail pages
  account_name?: string; // Account name for display
  payment_method?: string; // Payment method used
  payment_type?: string; // Type of payment (regular, extra, etc.)
  interest_amount?: number; // Interest portion of payment
  createdAt?: Date;
  updatedAt?: Date;
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
  // Payment tracking for bills
  isPaid?: boolean; // Track if this recurring transaction (bill) is paid
  paidDate?: Date; // Track when it was paid
  nextDueDate?: Date; // For bills, track next due date
  isBill?: boolean; // Added as per schema
  paymentMethod?: string; // Added as per schema
  accountId?: string; // Added as per schema
  priority?: 'high' | 'medium' | 'low'; // Added as per schema
  reminderDays?: number; // Added as per schema
  autoProcess?: boolean; // Added as per schema
  autoCreate?: boolean; // Added as per schema
  notificationDays?: number; // Added as per schema
  status?: 'active' | 'paused' | 'cancelled'; // Added as per schema
  billType?: string; // Added as per schema
  autoPay?: boolean; // Added as per schema
  lastReminderSent?: Date; // Added as per schema
  smartReminders?: boolean; // Added as per schema
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  accountId?: string;
  createdAt: Date;
  updatedAt: Date;
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
  // userId: string; // Removed as per schema
  // createdAt: Date; // Removed as per schema
  // start_date: Date; // Removed as per schema
  // linkedPurchaseId?: string; // Removed as per schema
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
  // autoGenerateBills: boolean; // Removed as per schema
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

export interface Bill { // Renamed from Bill to EnhancedBill
  id: string;
  userId: string;
  title: string; // Renamed from title to name
  description?: string;
  category: string;
  billType: 'fixed' | 'variable' | 'one_time' | 'liability_linked';
  amount: number;
  estimatedAmount?: number;
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom' | 'one_time';
  customFrequencyDays?: number;
  dueDate: Date; // Renamed from due_date to dueDate
  nextDueDate: Date; // Renamed from next_due_date to nextDueDate
  lastPaidDate?: Date;
  defaultAccountId?: string; // Renamed from default_account_id to defaultAccountId
  autoPay: boolean; // Renamed from auto_pay to autoPay
  linkedLiabilityId?: string; // Renamed from linked_liability_id to linkedLiabilityId
  isEmi: boolean; // Renamed from is_emi to isEmi
  isActive: boolean; // Renamed from is_active to isActive
  isEssential: boolean; // Renamed from is_essential to isEssential
  reminderDaysBefore: number; // Renamed from reminder_days_before to reminderDaysBefore
  sendDueDateReminder: boolean; // Renamed from send_due_date_reminder to sendDueDateReminder
  sendOverdueReminder: boolean; // Renamed from send_overdue_reminder to sendOverdueReminder
  createdAt: Date;
  updatedAt: Date;
}

export interface BillInstance {
  id: string;
  billId: string;
  userId: string;
  dueDate: Date;
  amount: number; // Renamed from amount to amount
  actualAmount?: number; // Renamed from actual_amount to actualAmount
  status: 'pending' | 'paid' | 'failed' | 'skipped' | 'overdue';
  paymentMethod?: 'auto' | 'manual' | 'other_account'; // Renamed from payment_method to paymentMethod
  paidDate?: Date; // Renamed from paid_date to paidDate
  paidFromAccountId?: string; // Renamed from paid_from_account_id to paidFromAccountId
  transactionId?: string; // Renamed from transaction_id to transactionId
  failureReason?: string; // Renamed from failure_reason to failureReason
  retryCount: number; // Renamed from retry_count to retryCount
  maxRetries: number; // Renamed from max_retries to maxRetries
  lateFee: number; // Renamed from late_fee to lateFee
  penaltyApplied: boolean; // Renamed from penalty_applied to penaltyApplied
  createdAt: Date;
  updatedAt: Date;
}

export interface LiabilityPayment {
  id: string;
  liabilityId: string;
  userId: string; // Renamed from user_id to userId
  amount: number; // Renamed from amount to amount
  paymentDate: Date; // Renamed from payment_date to paymentDate
  paymentType: 'regular' | 'extra' | 'minimum' | 'full' | 'partial'; // Renamed from payment_type to paymentType
  principalAmount: number; // Renamed from principal_amount to principalAmount
  interestAmount: number; // Renamed from interest_amount to interestAmount
  feesAmount: number; // Renamed from fees_amount to feesAmount
  paidFromAccountId?: string; // Renamed from paid_from_account_id to paidFromAccountId
  transactionId?: string; // Renamed from transaction_id to transactionId
  billInstanceId?: string; // Renamed from bill_instance_id to billInstanceId
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string; // Renamed from title to title
  message: string; // Renamed from message to message
  notificationType: 'bill_reminder' | 'bill_overdue' | 'liability_due' | 'payment_failed' | 'payment_success' | 'bill_generated'; // Renamed from notification_type to notificationType
  billId?: string; // Renamed from bill_id to billId
  billInstanceId?: string; // Renamed from bill_instance_id to billInstanceId
  liabilityId?: string; // Renamed from liability_id to liabilityId
  scheduledFor: Date; // Renamed from scheduled_for to scheduledFor
  sentAt?: Date; // Renamed from sent_at to sentAt
  status: 'pending' | 'sent' | 'failed' | 'cancelled'; // Renamed from status to status
  sendEmail: boolean; // Renamed from send_email to sendEmail
  sendPush: boolean; // Renamed from send_push to sendPush
  sendSms: boolean; // Renamed from send_sms to sendSms
  createdAt: Date;
  updatedAt: Date;
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
  spent?: number;
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

// Rich split record used by FinanceContext
export interface TransactionSplit {
  id: string;
  userId: string;
  parentTransactionId: string;
  category: string;
  amount: number;
  description?: string;
  createdAt: Date;
}

export interface AccountTransfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  transferDate: Date;
  fromTransactionId?: string;
  toTransactionId?: string;
  createdAt: Date;
}

export interface BillReminder {
  id: string;
  userId: string;
  recurringTransactionId?: string;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'sent' | 'dismissed' | 'paid';
  reminderDays: number;
  paymentMethod?: string;
  priority?: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtPayment {
  id: string;
  userId: string;
  liabilityId: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  paymentDate: Date;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
}

export interface FinancialInsight {
  id: string;
  userId: string;
  insightType: string;
  title: string;
  description?: string;
  impactLevel?: 'low' | 'medium' | 'high';
  isRead: boolean;
  expiresAt?: Date;
  createdAt: Date;
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