/**
 * Enhanced Liability Types
 * Comprehensive type definitions for the enhanced liability management system
 */

export interface EnhancedLiability {
  id: string;
  userId: string;
  name: string;
  liabilityType: LiabilityType;
  description?: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  minimumPayment: number;
  paymentDay: number;
  loanTermMonths?: number;
  remainingTermMonths?: number;
  startDate?: Date;
  dueDate?: Date;
  nextPaymentDate?: Date;
  linkedAssetId?: string;
  status: LiabilityStatus;
  isActive: boolean;
  priority: Priority;
  notes?: string;
  affectsCreditScore: boolean;
  isSecured: boolean;
  providesFunds: boolean;
  accountId?: string;
  disbursementAccountId?: string;
  defaultPaymentAccountId?: string;
  autoGenerateBills: boolean;
  billGenerationDay: number;
  activityScope: 'general' | 'account_specific' | 'category_based';
  accountIds: string[];
  targetCategory?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface LiabilityPaymentHistory {
  id: string;
  userId: string;
  liabilityId: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  paymentDate: Date;
  paymentMethod?: string;
  accountId?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiabilityAnalytics {
  id: string;
  userId: string;
  liabilityId: string;
  calculationDate: Date;
  totalPaid: number;
  totalInterestPaid: number;
  remainingBalance: number;
  monthsRemaining?: number;
  payoffDate?: Date;
  totalInterestRemaining: number;
  monthlyInterestAmount: number;
  debtToIncomeRatio?: number;
  creditUtilization?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiabilityBillLink {
  id: string;
  userId: string;
  liabilityId: string;
  recurringTransactionId: string;
  isPrimary: boolean;
  createdAt: Date;
}

export interface DebtStrategyRecommendation {
  id: string;
  userId: string;
  liabilityId?: string;
  strategyType: DebtStrategyType;
  title: string;
  description: string;
  potentialSavings?: number;
  timeToPayoffMonths?: number;
  monthlyPaymentIncrease?: number;
  isApplicable: boolean;
  priorityScore: number;
  createdAt: Date;
  expiresAt?: Date;
}

export type LiabilityType = 
  | 'personal_loan'
  | 'student_loan'
  | 'auto_loan'
  | 'mortgage'
  | 'credit_card'
  | 'bnpl'
  | 'installment'
  | 'medical_debt'
  | 'tax_debt'
  | 'business_loan'
  | 'other';

export type LiabilityStatus = 
  | 'active'
  | 'paid_off'
  | 'defaulted'
  | 'restructured'
  | 'closed'
  | 'archived';

export type Priority = 'high' | 'medium' | 'low';

export type DebtStrategyType = 
  | 'debt_snowball'
  | 'debt_avalanche'
  | 'debt_consolidation'
  | 'balance_transfer'
  | 'refinance'
  | 'payoff_acceleration';

export interface LiabilityFormData {
  name: string;
  liabilityType: LiabilityType;
  description?: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  minimumPayment: number;
  paymentDay: number;
  loanTermMonths?: number;
  remainingTermMonths?: number;
  startDate?: Date;
  dueDate?: Date;
  nextPaymentDate?: Date;
  linkedAssetId?: string;
  status: LiabilityStatus;
  isActive: boolean;
  priority: Priority;
  notes?: string;
  affectsCreditScore: boolean;
  isSecured: boolean;
  providesFunds: boolean;
  accountId?: string;
}

export interface PaymentFormData {
  liabilityId: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  paymentDate: Date;
  paymentMethod?: string;
  accountId?: string;
  notes?: string;
}

export interface LiabilityAnalyticsData {
  totalDebt: number;
  totalMonthlyPayments: number;
  averageInterestRate: number;
  totalInterestPaid: number;
  totalInterestRemaining: number;
  estimatedPayoffDate?: Date;
  debtToIncomeRatio?: number;
  creditUtilization?: number;
  liabilities: {
    id: string;
    name: string;
    remainingAmount: number;
    monthlyPayment: number;
    interestRate: number;
    payoffDate?: Date;
    priority: Priority;
  }[];
}

export interface DebtStrategyAnalysis {
  currentStrategy: string;
  recommendedStrategy: string;
  potentialSavings: number;
  timeToPayoff: number;
  monthlyPaymentIncrease: number;
  recommendations: DebtStrategyRecommendation[];
}

// Utility types for liability management
export interface LiabilitySummary {
  totalLiabilities: number;
  activeLiabilities: number;
  totalMonthlyPayments: number;
  averageInterestRate: number;
  nextPaymentDate?: Date;
  overduePayments: number;
}

export interface LiabilityFilters {
  status?: LiabilityStatus[];
  liabilityType?: LiabilityType[];
  priority?: Priority[];
  isActive?: boolean;
  affectsCreditScore?: boolean;
  isSecured?: boolean;
  providesFunds?: boolean;
}

export interface LiabilitySortOptions {
  field: 'name' | 'remainingAmount' | 'interestRate' | 'monthlyPayment' | 'nextPaymentDate' | 'priority';
  direction: 'asc' | 'desc';
}

// API response types
export interface LiabilityApiResponse {
  liability: EnhancedLiability;
  analytics: LiabilityAnalytics;
  paymentHistory: LiabilityPaymentHistory[];
  billLinks: LiabilityBillLink[];
  recommendations: DebtStrategyRecommendation[];
}

export interface LiabilitiesListResponse {
  liabilities: EnhancedLiability[];
  summary: LiabilitySummary;
  analytics: LiabilityAnalyticsData;
  strategies: DebtStrategyAnalysis;
}

// Form validation types
export interface LiabilityValidationErrors {
  name?: string;
  liabilityType?: string;
  totalAmount?: string;
  remainingAmount?: string;
  interestRate?: string;
  monthlyPayment?: string;
  minimumPayment?: string;
  paymentDay?: string;
  loanTermMonths?: string;
  remainingTermMonths?: string;
  startDate?: string;
  dueDate?: string;
  nextPaymentDate?: string;
  priority?: string;
}

export interface PaymentValidationErrors {
  paymentAmount?: string;
  principalAmount?: string;
  interestAmount?: string;
  paymentDate?: string;
  paymentMethod?: string;
  accountId?: string;
}

// Chart data types for analytics
export interface LiabilityChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface PaymentTrendData {
  month: string;
  totalPayments: number;
  principalPayments: number;
  interestPayments: number;
  remainingBalance: number;
}

export interface InterestAnalysisData {
  liabilityId: string;
  liabilityName: string;
  totalInterest: number;
  interestPaid: number;
  interestRemaining: number;
  monthlyInterest: number;
  interestPercentage: number;
}

// Export all types
export type {
  EnhancedLiability as Liability,
  LiabilityPaymentHistory as PaymentHistory,
  LiabilityAnalytics as Analytics,
  LiabilityBillLink as BillLink,
  DebtStrategyRecommendation as StrategyRecommendation,
  LiabilityFormData as FormData,
  PaymentFormData as PaymentData,
  LiabilityAnalyticsData as AnalyticsData,
  DebtStrategyAnalysis as StrategyAnalysis,
  LiabilitySummary as Summary,
  LiabilityFilters as Filters,
  LiabilitySortOptions as SortOptions,
  LiabilityApiResponse as ApiResponse,
  LiabilitiesListResponse as ListResponse,
  LiabilityValidationErrors as ValidationErrors,
  PaymentValidationErrors as PaymentValidationErrors,
  LiabilityChartData as ChartData,
  PaymentTrendData as TrendData,
  InterestAnalysisData as InterestData,
};
