import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
  FinancialAccount, 
  Transaction, 
  Goal, 
  EnhancedLiability, 
  Budget, 
  Bill,
  RecurringTransaction,
  IncomeSource,
  AccountTransfer,
  UserCategory,
  BillReminder,
  DebtPayment,
  TransactionSplit,
  FinancialInsight
} from '../types';

interface FinanceContextType {
  // Data
  accounts: FinancialAccount[];
  transactions: Transaction[];
  goals: Goal[];
  liabilities: EnhancedLiability[];
  budgets: Budget[];
  bills: Bill[];
  recurringTransactions: RecurringTransaction[];
  incomeSource: IncomeSource[];
  accountTransfers: AccountTransfer[];
  userCategories: UserCategory[];
  billReminders: BillReminder[];
  debtPayments: DebtPayment[];
  transactionSplits: TransactionSplit[];
  financialInsights: FinancialInsight[];
  
  // Loading states
  loading: boolean;
  
  // CRUD operations
  addAccount: (account: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<FinancialAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  addLiability: (liability: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLiability: (id: string, updates: Partial<EnhancedLiability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  addBill: (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  
  addRecurringTransaction: (rt: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  
  transferBetweenAccounts: (fromAccountId: string, toAccountId: string, amount: number, description: string) => Promise<void>;
  // System helpers
  getGoalsVaultAccount: () => FinancialAccount | undefined;
  ensureGoalsVaultAccount: () => Promise<void>;
  // High-level flows
  fundGoalFromAccount: (fromAccountId: string, goalId: string, amount: number, description?: string) => Promise<void>;
  withdrawGoalToAccount: (toAccountId: string, goalId: string, amount: number, description?: string) => Promise<void>;
  payBillFromAccount: (accountId: string, billId: string, amount?: number, description?: string) => Promise<void>;
  repayLiabilityFromAccount: (accountId: string, liabilityId: string, amount: number, description?: string) => Promise<void>;
  markBillAsPaid: (billId: string, paidDate?: Date) => Promise<void>;
  markRecurringTransactionAsPaid: (recurringTransactionId: string, paidDate?: Date) => Promise<void>;
  
  // Analytics functions
  getMonthlyTrends: (months: number) => Array<{ month: string; income: number; expenses: number; net: number }>;
  getCategoryBreakdown: (transactions: Transaction[]) => Array<{ category: string; amount: number; percentage: number }>;
  getNetWorthTrends: (months: number) => Array<{ month: string; netWorth: number }>;
  getSpendingPatterns: (transactions: Transaction[]) => Array<{ category: string; amount: number; count: number }>;
  getIncomeAnalysis: (transactions: Transaction[]) => Array<{ source: string; amount: number; percentage: number }>;
  getBudgetPerformance: () => Array<{ budget: string; spent: number; limit: number; percentage: number }>;
  
  // Statistics
  stats: {
    totalIncome: number;
    totalExpenses: number;
    totalLiabilities: number;
    totalSavings: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [liabilities, setLiabilities] = useState<EnhancedLiability[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [incomeSource, setIncomeSource] = useState<IncomeSource[]>([]);
  const [accountTransfers, setAccountTransfers] = useState<AccountTransfer[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [transactionSplits, setTransactionSplits] = useState<TransactionSplit[]>([]);
  const [financialInsights, setFinancialInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear data when user logs out
      setAccounts([]);
      setTransactions([]);
      setGoals([]);
      setLiabilities([]);
      setBudgets([]);
      setBills([]);
      setRecurringTransactions([]);
      setIncomeSource([]);
      setAccountTransfers([]);
      setUserCategories([]);
      setBillReminders([]);
      setDebtPayments([]);
      setTransactionSplits([]);
      setFinancialInsights([]);
      setLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadAccounts(),
        loadTransactions(),
        loadGoals(),
        loadLiabilities(),
        loadBudgets(),
        loadBills(),
        loadRecurringTransactions(),
        loadIncomeSource(),
        loadAccountTransfers(),
        loadUserCategories(),
        loadBillReminders(),
        loadDebtPayments(),
        loadTransactionSplits(),
        loadFinancialInsights()
      ]);
      // Ensure Goals Vault exists after accounts load
      await ensureGoalsVaultAccount();
    } catch (error) {
      console.error('Error loading data:', error);
      // Add more specific error handling
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  const ensureGoalsVaultAccount = async () => {
    if (!user) return;
    const existing = accounts.find(a => a.type === 'goals_vault');
    if (existing) return;

    // Use user's selected currency from onboarding/internationalization
    const savedCurrency = typeof window !== 'undefined' ? localStorage.getItem('finspire_currency') : null;
    const defaultCurrency = accounts[0]?.currency || savedCurrency || 'USD';

    const { data, error } = await supabase
      .from('financial_accounts')
      .insert({
        user_id: user.id,
        name: 'Goals Vault',
        type: 'goals_vault',
        balance: 0,
        is_visible: true,
        currency: defaultCurrency
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create Goals Vault account:', error);
      return;
    }

    const newAccount: FinancialAccount = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      balance: Number(data.balance),
      isVisible: data.is_visible,
      currency: data.currency,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    } as FinancialAccount;

    setAccounts(prev => [newAccount, ...prev]);
  };

  const getGoalsVaultAccount = () => accounts.find(a => a.type === 'goals_vault');

  const fundGoalFromAccount = async (fromAccountId: string, goalId: string, amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    await ensureGoalsVaultAccount();
    const vault = getGoalsVaultAccount();
    if (!vault) throw new Error('Goals Vault not available');

    // Move funds from source to vault
    await transferBetweenAccounts(fromAccountId, vault.id, amount, description || 'Goal Funding');

    // Update goal allocation
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newAmount = Math.min(Number(goal.currentAmount || 0) + Number(amount || 0), Number(goal.targetAmount || 0));
      await updateGoal(goalId, { currentAmount: newAmount });
    }
  };

  const withdrawGoalToAccount = async (toAccountId: string, goalId: string, amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    const vault = getGoalsVaultAccount();
    if (!vault) throw new Error('Goals Vault not available');

    // Move funds from vault to destination
    await transferBetweenAccounts(vault.id, toAccountId, amount, description || 'Goal Withdrawal');

    // Update goal allocation downwards
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newAmount = Math.max(0, Number(goal.currentAmount || 0) - Number(amount || 0));
      await updateGoal(goalId, { currentAmount: newAmount });
    }
  };

  const payBillFromAccount = async (accountId: string, billId: string, amount?: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');
    const payAmount = Number(amount ?? bill.amount);

    await addTransaction({
      type: 'expense',
      amount: payAmount,
      category: bill.category || 'Bills',
      description: description || `Bill Payment: ${bill.title}`,
      date: new Date(),
      accountId,
      affectsBalance: true,
      status: 'completed'
    });

    // Update bill schedule and mark as paid
    const nextDueDate = new Date(bill.nextDueDate);
    nextDueDate.setDate(nextDueDate.getDate() + (bill.frequency === 'weekly' ? 7 : bill.frequency === 'bi_weekly' ? 14 : bill.frequency === 'monthly' ? 30 : bill.frequency === 'quarterly' ? 90 : bill.frequency === 'semi_annual' ? 180 : bill.frequency === 'annual' ? 365 : 30));
    await updateBill(billId, { lastPaidDate: new Date(), nextDueDate });

    // Also update recurring transaction if it exists
    const recurringBill = recurringTransactions.find(rt => rt.description === bill.title && rt.type === 'expense');
    if (recurringBill) {
      await updateRecurringTransaction(recurringBill.id, { 
        isPaid: true, 
        paidDate: new Date(), 
        nextDueDate: nextDueDate 
      });
    }
  };

  const repayLiabilityFromAccount = async (accountId: string, liabilityId: string, amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    const liability = liabilities.find(l => l.id === liabilityId);
    if (!liability) throw new Error('Liability not found');

    await addTransaction({
      type: 'expense',
      amount: Number(amount),
      category: 'Liability Payment',
      description: description || `Payment: ${liability.name}`,
      date: new Date(),
      accountId,
      affectsBalance: true,
      status: 'completed'
    });

    const newRemaining = Math.max(0, Number(liability.remainingAmount || 0) - Number(amount || 0));
    await updateLiability(liabilityId, { remainingAmount: newRemaining, status: newRemaining === 0 ? 'paid_off' : liability.status });
  };

  const markBillAsPaid = async (billId: string, paidDate?: Date) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');
    
    const paymentDate = paidDate || new Date();
    
    // Update bill with payment info
    const nextDueDate = new Date(bill.nextDueDate);
    nextDueDate.setDate(nextDueDate.getDate() + (bill.frequency === 'weekly' ? 7 : bill.frequency === 'bi_weekly' ? 14 : bill.frequency === 'monthly' ? 30 : bill.frequency === 'quarterly' ? 90 : bill.frequency === 'semi_annual' ? 180 : bill.frequency === 'annual' ? 365 : 30));
    
    await updateBill(billId, { 
      lastPaidDate: paymentDate, 
      nextDueDate: nextDueDate 
    });

    // Also update recurring transaction if it exists
    const recurringBill = recurringTransactions.find(rt => rt.description === bill.title && rt.type === 'expense');
    if (recurringBill) {
      await updateRecurringTransaction(recurringBill.id, { 
        isPaid: true, 
        paidDate: paymentDate, 
        nextDueDate: nextDueDate 
      });
    }
  };

  const markRecurringTransactionAsPaid = async (recurringTransactionId: string, paidDate?: Date) => {
    if (!user) throw new Error('User not authenticated');
    const recurringTransaction = recurringTransactions.find(rt => rt.id === recurringTransactionId);
    if (!recurringTransaction) throw new Error('Recurring transaction not found');
    
    const paymentDate = paidDate || new Date();
    
    // Calculate next due date based on frequency
    const nextDueDate = new Date(recurringTransaction.nextOccurrenceDate);
    switch (recurringTransaction.frequency) {
      case 'daily':
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
    }
    
    await updateRecurringTransaction(recurringTransactionId, { 
      isPaid: true, 
      paidDate: paymentDate, 
      nextDueDate: nextDueDate,
      lastProcessedDate: paymentDate
    });
  };

  const loadAccounts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading accounts:', error);
      return;
    }

    const mappedAccounts: FinancialAccount[] = (data || []).map(account => ({
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      balance: Number(account.balance),
      institution: account.institution,
      platform: account.platform,
      accountNumber: account.account_number,
      isVisible: account.is_visible,
      currency: account.currency,
      createdAt: new Date(account.created_at),
      updatedAt: new Date(account.updated_at)
    }));

    setAccounts(mappedAccounts);
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    const mappedTransactions: Transaction[] = (data || []).map(transaction => ({
      id: transaction.id,
      userId: transaction.user_id,
      type: transaction.type,
      amount: Number(transaction.amount),
      category: transaction.category,
      description: transaction.description,
      date: new Date(transaction.date),
      accountId: transaction.account_id,
      affectsBalance: transaction.affects_balance,
      reason: transaction.reason,
      transferToAccountId: transaction.transfer_to_account_id,
      status: transaction.status,
      createdAt: new Date(transaction.created_at),
      updatedAt: new Date(transaction.updated_at)
    }));

    setTransactions(mappedTransactions);
  };

  const loadGoals = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading goals:', error);
      return;
    }

    const mappedGoals: Goal[] = (data || []).map(goal => ({
      id: goal.id,
      userId: goal.user_id,
      title: goal.title,
      description: goal.description,
      targetAmount: Number(goal.target_amount),
      currentAmount: Number(goal.current_amount || 0),
      targetDate: new Date(goal.target_date),
      category: goal.category,
      createdAt: new Date(goal.created_at),
      updatedAt: new Date(goal.updated_at)
    }));

    setGoals(mappedGoals);
  };

  const loadLiabilities = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('enhanced_liabilities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading liabilities:', error);
      return;
    }

    const mappedLiabilities: EnhancedLiability[] = (data || []).map(liability => ({
      id: liability.id,
      userId: liability.user_id,
      name: liability.name,
      liabilityType: liability.liability_type,
      description: liability.description,
      totalAmount: Number(liability.total_amount),
      remainingAmount: Number(liability.remaining_amount),
      interestRate: Number(liability.interest_rate || 0),
      monthlyPayment: Number(liability.monthly_payment || 0),
      minimumPayment: Number(liability.minimum_payment || 0),
      paymentDay: liability.payment_day,
      loanTermMonths: liability.loan_term_months,
      remainingTermMonths: liability.remaining_term_months,
      startDate: new Date(liability.start_date),
      dueDate: liability.due_date ? new Date(liability.due_date) : undefined,
      nextPaymentDate: liability.next_payment_date ? new Date(liability.next_payment_date) : undefined,
      linkedAssetId: liability.linked_asset_id,
      isSecured: liability.is_secured,
      disbursementAccountId: liability.disbursement_account_id,
      defaultPaymentAccountId: liability.default_payment_account_id,
      providesFunds: liability.provides_funds,
      affectsCreditScore: liability.affects_credit_score,
      status: liability.status,
      isActive: liability.is_active,
      autoGenerateBills: liability.auto_generate_bills,
      billGenerationDay: liability.bill_generation_day,
      createdAt: new Date(liability.created_at),
      updatedAt: new Date(liability.updated_at)
    }));

    setLiabilities(mappedLiabilities);
  };

  const loadBudgets = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading budgets:', error);
      return;
    }

    const mappedBudgets: Budget[] = (data || []).map(budget => ({
      id: budget.id,
      userId: budget.user_id,
      category: budget.category,
      amount: Number(budget.amount),
      spent: Number(budget.spent || 0),
      period: budget.period,
      createdAt: new Date(budget.created_at),
      updatedAt: new Date(budget.updated_at)
    }));

    setBudgets(mappedBudgets);
  };

  const loadBills = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bills:', error);
      return;
    }

    const mappedBills: Bill[] = (data || []).map(bill => ({
      id: bill.id,
      userId: bill.user_id,
      title: bill.title,
      description: bill.description,
      category: bill.category,
      billType: bill.bill_type,
      amount: Number(bill.amount),
      estimatedAmount: Number(bill.estimated_amount || 0),
      frequency: bill.frequency,
      customFrequencyDays: bill.custom_frequency_days,
      dueDate: new Date(bill.due_date),
      nextDueDate: new Date(bill.next_due_date),
      lastPaidDate: bill.last_paid_date ? new Date(bill.last_paid_date) : undefined,
      defaultAccountId: bill.default_account_id,
      autoPay: bill.auto_pay,
      linkedLiabilityId: bill.linked_liability_id,
      isEmi: bill.is_emi,
      isActive: bill.is_active,
      isEssential: bill.is_essential,
      reminderDaysBefore: bill.reminder_days_before,
      sendDueDateReminder: bill.send_due_date_reminder,
      sendOverdueReminder: bill.send_overdue_reminder,
      createdAt: new Date(bill.created_at),
      updatedAt: new Date(bill.updated_at)
    }));

    setBills(mappedBills);
  };

  const loadRecurringTransactions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading recurring transactions:', error);
      return;
    }

    const mappedRecurringTransactions: RecurringTransaction[] = (data || []).map(rt => ({
      id: rt.id,
      userId: rt.user_id,
      type: rt.type,
      amount: Number(rt.amount),
      category: rt.category,
      description: rt.description,
      frequency: rt.frequency,
      startDate: new Date(rt.start_date),
      endDate: rt.end_date ? new Date(rt.end_date) : undefined,
      nextOccurrenceDate: new Date(rt.next_occurrence_date),
      lastProcessedDate: rt.last_processed_date ? new Date(rt.last_processed_date) : undefined,
      isActive: rt.is_active,
      dayOfWeek: rt.day_of_week,
      dayOfMonth: rt.day_of_month,
      monthOfYear: rt.month_of_year,
      maxOccurrences: rt.max_occurrences,
      currentOccurrences: rt.current_occurrences,
      createdAt: new Date(rt.created_at),
      updatedAt: new Date(rt.updated_at)
    }));

    setRecurringTransactions(mappedRecurringTransactions);
  };

  const loadIncomeSource = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading income sources:', error);
      return;
    }

    const mappedIncomeSources: IncomeSource[] = (data || []).map(source => ({
      id: source.id,
      userId: source.user_id,
      name: source.name,
      type: source.type,
      amount: Number(source.amount),
      frequency: source.frequency,
      isActive: source.is_active,
      lastReceived: source.last_received ? new Date(source.last_received) : undefined,
      nextExpected: source.next_expected ? new Date(source.next_expected) : undefined,
      reliability: source.reliability,
      createdAt: new Date(source.created_at),
      updatedAt: new Date(source.updated_at)
    }));

    setIncomeSource(mappedIncomeSources);
  };

  const loadAccountTransfers = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('enhanced_account_transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading account transfers:', error);
      return;
    }

    const mappedTransfers: AccountTransfer[] = (data || []).map(transfer => ({
      id: transfer.id,
      userId: transfer.user_id,
      fromAccountId: transfer.from_account_id,
      toAccountId: transfer.to_account_id,
      amount: Number(transfer.amount),
      description: transfer.description,
      transferDate: new Date(transfer.transfer_date),
      fromTransactionId: transfer.from_transaction_id,
      toTransactionId: transfer.to_transaction_id,
      createdAt: new Date(transfer.created_at)
    }));

    setAccountTransfers(mappedTransfers);
  };

  const loadUserCategories = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('category_hierarchy')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading user categories:', error);
      return;
    }

    const mappedCategories: UserCategory[] = (data || []).map(category => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      parentId: category.parent_id,
      description: category.description,
      sortOrder: category.sort_order,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }));

    setUserCategories(mappedCategories);
  };

  const loadBillReminders = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bill_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error loading bill reminders:', error);
      return;
    }

    const mappedReminders: BillReminder[] = (data || []).map(reminder => ({
      id: reminder.id,
      userId: reminder.user_id,
      recurringTransactionId: reminder.recurring_transaction_id,
      dueDate: new Date(reminder.due_date),
      amount: Number(reminder.amount),
      status: reminder.status,
      reminderDays: reminder.reminder_days,
      paymentMethod: reminder.payment_method,
      priority: reminder.priority,
      createdAt: new Date(reminder.created_at),
      updatedAt: new Date(reminder.updated_at)
    }));

    setBillReminders(mappedReminders);
  };

  const loadDebtPayments = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('liability_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error loading debt payments:', error);
      return;
    }

    const mappedPayments: DebtPayment[] = (data || []).map(payment => ({
      id: payment.id,
      userId: payment.user_id,
      liabilityId: payment.liability_id,
      paymentAmount: Number(payment.amount),
      principalAmount: Number(payment.principal_amount),
      interestAmount: Number(payment.interest_amount),
      paymentDate: new Date(payment.payment_date),
      paymentMethod: payment.payment_method,
      transactionId: payment.transaction_id,
      createdAt: new Date(payment.created_at)
    }));

    setDebtPayments(mappedPayments);
  };

  const loadTransactionSplits = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transaction_splits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading transaction splits:', error);
      return;
    }

    const mappedSplits: TransactionSplit[] = (data || []).map(split => ({
      id: split.id,
      userId: split.user_id,
      parentTransactionId: split.parent_transaction_id,
      category: split.category,
      amount: Number(split.amount),
      description: split.description,
      createdAt: new Date(split.created_at)
    }));

    setTransactionSplits(mappedSplits);
  };

  const loadFinancialInsights = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('financial_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading financial insights:', error);
      return;
    }

    const mappedInsights: FinancialInsight[] = (data || []).map(insight => ({
      id: insight.id,
      userId: insight.user_id,
      insightType: insight.insight_type,
      title: insight.title,
      description: insight.description,
      impactLevel: insight.impact_level,
      isRead: insight.is_read,
      expiresAt: insight.expires_at ? new Date(insight.expires_at) : undefined,
      createdAt: new Date(insight.created_at)
    }));

    setFinancialInsights(mappedInsights);
  };

  // CRUD Operations
  const addAccount = async (accountData: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_accounts')
      .insert({
        user_id: user.id,
        name: accountData.name,
        type: accountData.type,
        balance: accountData.balance,
        institution: accountData.institution,
        platform: accountData.platform,
        account_number: accountData.accountNumber,
        is_visible: accountData.isVisible,
        currency: accountData.currency
      })
      .select()
      .single();

    if (error) throw error;

    const newAccount: FinancialAccount = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      balance: Number(data.balance),
      institution: data.institution,
      platform: data.platform,
      accountNumber: data.account_number,
      isVisible: data.is_visible,
      currency: data.currency,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setAccounts(prev => [newAccount, ...prev]);
  };

  const updateAccount = async (id: string, updates: Partial<FinancialAccount>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('financial_accounts')
      .update({
        name: updates.name,
        type: updates.type,
        balance: updates.balance,
        institution: updates.institution,
        platform: updates.platform,
        account_number: updates.accountNumber,
        is_visible: updates.isVisible,
        currency: updates.currency
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...updates } : account
    ));
  };

  const deleteAccount = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('financial_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.filter(account => account.id !== id));
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: transactionData.type,
        amount: transactionData.amount,
        category: transactionData.category,
        description: transactionData.description,
        date: transactionData.date.toISOString().split('T')[0],
        account_id: transactionData.accountId,
        affects_balance: transactionData.affectsBalance,
        reason: transactionData.reason,
        transfer_to_account_id: transactionData.transferToAccountId,
        status: transactionData.status || 'completed'
      })
      .select()
      .single();

    if (error) throw error;

    const newTransaction: Transaction = {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      amount: Number(data.amount),
      category: data.category,
      description: data.description,
      date: new Date(data.date),
      accountId: data.account_id,
      affectsBalance: data.affects_balance,
      reason: data.reason,
      transferToAccountId: data.transfer_to_account_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Update budget if this is an expense transaction
    if (newTransaction.type === 'expense') {
      try {
        // Find the budget for this category
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .eq('category', newTransaction.category)
          .maybeSingle();

        if (budgetError) {
          console.error('Error fetching budget for update:', budgetError);
        } else if (budgetData) {
          // Update the budget's spent amount
          const newSpentAmount = Number(budgetData.spent || 0) + newTransaction.amount;
          
          const { error: updateError } = await supabase
            .from('budgets')
            .update({ spent: newSpentAmount })
            .eq('id', budgetData.id);

          if (updateError) {
            console.error('Error updating budget spent amount:', updateError);
          } else {
            // Update local budget state
            setBudgets(prev => prev.map(budget => 
              budget.id === budgetData.id 
                ? { ...budget, spent: newSpentAmount }
                : budget
            ));
          }
        }
      } catch (budgetUpdateError) {
        console.error('Error in budget update process:', budgetUpdateError);
        // Don't throw error here to avoid breaking transaction creation
      }
    }

    // Reload accounts to reflect balance changes (handled by database triggers)
    await loadAccounts();
    
    return newTransaction;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('transactions')
      .update({
        type: updates.type,
        amount: updates.amount,
        category: updates.category,
        description: updates.description,
        date: updates.date?.toISOString().split('T')[0],
        account_id: updates.accountId,
        affects_balance: updates.affectsBalance,
        reason: updates.reason,
        transfer_to_account_id: updates.transferToAccountId,
        status: updates.status
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setTransactions(prev => prev.map(transaction => 
      transaction.id === id ? { ...transaction, ...updates } : transaction
    ));
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: goalData.title,
        description: goalData.description,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount,
        target_date: goalData.targetDate.toISOString().split('T')[0],
        category: goalData.category
      })
      .select()
      .single();

    if (error) throw error;

    const newGoal: Goal = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      targetAmount: Number(data.target_amount),
      currentAmount: Number(data.current_amount || 0),
      targetDate: new Date(data.target_date),
      category: data.category,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('goals')
      .update({
        title: updates.title,
        description: updates.description,
        target_amount: updates.targetAmount,
        current_amount: updates.currentAmount,
        target_date: updates.targetDate?.toISOString().split('T')[0],
        category: updates.category
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  };

  const deleteGoal = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const addLiability = async (liabilityData: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('enhanced_liabilities')
      .insert({
        user_id: user.id,
        name: liabilityData.name,
        liability_type: liabilityData.liabilityType,
        description: liabilityData.description,
        total_amount: liabilityData.totalAmount,
        remaining_amount: liabilityData.remainingAmount,
        interest_rate: liabilityData.interestRate,
        monthly_payment: liabilityData.monthlyPayment,
        minimum_payment: liabilityData.minimumPayment,
        payment_day: liabilityData.paymentDay,
        loan_term_months: liabilityData.loanTermMonths,
        remaining_term_months: liabilityData.remainingTermMonths,
        start_date: liabilityData.startDate.toISOString().split('T')[0],
        due_date: liabilityData.dueDate?.toISOString().split('T')[0],
        next_payment_date: liabilityData.nextPaymentDate?.toISOString().split('T')[0],
        linked_asset_id: liabilityData.linkedAssetId,
        is_secured: liabilityData.isSecured,
        disbursement_account_id: liabilityData.disbursementAccountId,
        default_payment_account_id: liabilityData.defaultPaymentAccountId,
        provides_funds: liabilityData.providesFunds,
        affects_credit_score: liabilityData.affectsCreditScore,
        status: liabilityData.status,
        is_active: liabilityData.isActive,
        auto_generate_bills: liabilityData.autoGenerateBills,
        bill_generation_day: liabilityData.billGenerationDay
      })
      .select()
      .single();

    if (error) throw error;

    const newLiability: EnhancedLiability = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      liabilityType: data.liability_type,
      description: data.description,
      totalAmount: Number(data.total_amount),
      remainingAmount: Number(data.remaining_amount),
      interestRate: Number(data.interest_rate || 0),
      monthlyPayment: Number(data.monthly_payment || 0),
      minimumPayment: Number(data.minimum_payment || 0),
      paymentDay: data.payment_day,
      loanTermMonths: data.loan_term_months,
      remainingTermMonths: data.remaining_term_months,
      startDate: new Date(data.start_date),
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : undefined,
      linkedAssetId: data.linked_asset_id,
      isSecured: data.is_secured,
      disbursementAccountId: data.disbursement_account_id,
      defaultPaymentAccountId: data.default_payment_account_id,
      providesFunds: data.provides_funds,
      affectsCreditScore: data.affects_credit_score,
      status: data.status,
      isActive: data.is_active,
      autoGenerateBills: data.auto_generate_bills,
      billGenerationDay: data.bill_generation_day,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setLiabilities(prev => [newLiability, ...prev]);
  };

  const updateLiability = async (id: string, updates: Partial<EnhancedLiability>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('enhanced_liabilities')
      .update({
        name: updates.name,
        liability_type: updates.liabilityType,
        description: updates.description,
        total_amount: updates.totalAmount,
        remaining_amount: updates.remainingAmount,
        interest_rate: updates.interestRate,
        monthly_payment: updates.monthlyPayment,
        minimum_payment: updates.minimumPayment,
        payment_day: updates.paymentDay,
        loan_term_months: updates.loanTermMonths,
        remaining_term_months: updates.remainingTermMonths,
        start_date: updates.startDate?.toISOString().split('T')[0],
        due_date: updates.dueDate?.toISOString().split('T')[0],
        next_payment_date: updates.nextPaymentDate?.toISOString().split('T')[0],
        linked_asset_id: updates.linkedAssetId,
        is_secured: updates.isSecured,
        disbursement_account_id: updates.disbursementAccountId,
        default_payment_account_id: updates.defaultPaymentAccountId,
        provides_funds: updates.providesFunds,
        affects_credit_score: updates.affectsCreditScore,
        status: updates.status,
        is_active: updates.isActive,
        auto_generate_bills: updates.autoGenerateBills,
        bill_generation_day: updates.billGenerationDay
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setLiabilities(prev => prev.map(liability => 
      liability.id === id ? { ...liability, ...updates } : liability
    ));
  };

  const deleteLiability = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('enhanced_liabilities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setLiabilities(prev => prev.filter(liability => liability.id !== id));
  };

  const addBudget = async (budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        category: budgetData.category,
        amount: budgetData.amount,
        spent: budgetData.spent,
        period: budgetData.period
      })
      .select()
      .single();

    if (error) throw error;

    const newBudget: Budget = {
      id: data.id,
      userId: data.user_id,
      category: data.category,
      amount: Number(data.amount),
      spent: Number(data.spent || 0),
      period: data.period,
      createdAt: new Date(data.created_at)
    };

    setBudgets(prev => [newBudget, ...prev]);
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('budgets')
      .update({
        category: updates.category,
        amount: updates.amount,
        spent: updates.spent,
        period: updates.period
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setBudgets(prev => prev.map(budget => 
      budget.id === id ? { ...budget, ...updates } : budget
    ));
  };

  const deleteBudget = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const addBill = async (billData: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bills')
      .insert({
        user_id: user.id,
        title: billData.title,
        description: billData.description,
        category: billData.category,
        bill_type: billData.billType,
        amount: billData.amount,
        estimated_amount: billData.estimatedAmount,
        frequency: billData.frequency,
        custom_frequency_days: billData.customFrequencyDays,
        due_date: billData.dueDate.toISOString().split('T')[0],
        next_due_date: billData.nextDueDate.toISOString().split('T')[0],
        last_paid_date: billData.lastPaidDate?.toISOString().split('T')[0],
        default_account_id: billData.defaultAccountId,
        auto_pay: billData.autoPay,
        linked_liability_id: billData.linkedLiabilityId,
        is_emi: billData.isEmi,
        is_active: billData.isActive,
        is_essential: billData.isEssential,
        reminder_days_before: billData.reminderDaysBefore,
        send_due_date_reminder: billData.sendDueDateReminder,
        send_overdue_reminder: billData.sendOverdueReminder
      })
      .select()
      .single();

    if (error) throw error;

    const newBill: Bill = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      category: data.category,
      billType: data.bill_type,
      amount: Number(data.amount),
      estimatedAmount: Number(data.estimated_amount || 0),
      frequency: data.frequency,
      customFrequencyDays: data.custom_frequency_days,
      dueDate: new Date(data.due_date),
      nextDueDate: new Date(data.next_due_date),
      lastPaidDate: data.last_paid_date ? new Date(data.last_paid_date) : undefined,
      defaultAccountId: data.default_account_id,
      autoPay: data.auto_pay,
      linkedLiabilityId: data.linked_liability_id,
      isEmi: data.is_emi,
      isActive: data.is_active,
      isEssential: data.is_essential,
      reminderDaysBefore: data.reminder_days_before,
      sendDueDateReminder: data.send_due_date_reminder,
      sendOverdueReminder: data.send_overdue_reminder,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setBills(prev => [newBill, ...prev]);
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bills')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        bill_type: updates.billType,
        amount: updates.amount,
        estimated_amount: updates.estimatedAmount,
        frequency: updates.frequency,
        custom_frequency_days: updates.customFrequencyDays,
        due_date: updates.dueDate?.toISOString().split('T')[0],
        next_due_date: updates.nextDueDate?.toISOString().split('T')[0],
        last_paid_date: updates.lastPaidDate?.toISOString().split('T')[0],
        default_account_id: updates.defaultAccountId,
        auto_pay: updates.autoPay,
        linked_liability_id: updates.linkedLiabilityId,
        is_emi: updates.isEmi,
        is_active: updates.isActive,
        is_essential: updates.isEssential,
        reminder_days_before: updates.reminderDaysBefore,
        send_due_date_reminder: updates.sendDueDateReminder,
        send_overdue_reminder: updates.sendOverdueReminder
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setBills(prev => prev.map(bill => 
      bill.id === id ? { ...bill, ...updates } : bill
    ));
  };

  const deleteBill = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setBills(prev => prev.filter(bill => bill.id !== id));
  };

  const addRecurringTransaction = async (rtData: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: user.id,
        type: rtData.type,
        amount: rtData.amount,
        category: rtData.category,
        description: rtData.description,
        frequency: rtData.frequency,
        start_date: rtData.startDate.toISOString().split('T')[0],
        end_date: rtData.endDate?.toISOString().split('T')[0],
        next_occurrence_date: rtData.nextOccurrenceDate.toISOString().split('T')[0],
        last_processed_date: rtData.lastProcessedDate?.toISOString().split('T')[0],
        is_active: rtData.isActive,
        day_of_week: rtData.dayOfWeek,
        day_of_month: rtData.dayOfMonth,
        month_of_year: rtData.monthOfYear,
        max_occurrences: rtData.maxOccurrences,
        current_occurrences: rtData.currentOccurrences
      })
      .select()
      .single();

    if (error) throw error;

    const newRecurringTransaction: RecurringTransaction = {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      amount: Number(data.amount),
      category: data.category,
      description: data.description,
      frequency: data.frequency,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      nextOccurrenceDate: new Date(data.next_occurrence_date),
      lastProcessedDate: data.last_processed_date ? new Date(data.last_processed_date) : undefined,
      isActive: data.is_active,
      dayOfWeek: data.day_of_week,
      dayOfMonth: data.day_of_month,
      monthOfYear: data.month_of_year,
      maxOccurrences: data.max_occurrences,
      currentOccurrences: data.current_occurrences,
      createdAt: new Date(data.created_at)
    };

    setRecurringTransactions(prev => [newRecurringTransaction, ...prev]);
  };

  const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransaction>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recurring_transactions')
      .update({
        type: updates.type,
        amount: updates.amount,
        category: updates.category,
        description: updates.description,
        frequency: updates.frequency,
        start_date: updates.startDate?.toISOString().split('T')[0],
        end_date: updates.endDate?.toISOString().split('T')[0],
        next_occurrence_date: updates.nextOccurrenceDate?.toISOString().split('T')[0],
        last_processed_date: updates.lastProcessedDate?.toISOString().split('T')[0],
        is_active: updates.isActive,
        day_of_week: updates.dayOfWeek,
        day_of_month: updates.dayOfMonth,
        month_of_year: updates.monthOfYear,
        max_occurrences: updates.maxOccurrences,
        current_occurrences: updates.currentOccurrences
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setRecurringTransactions(prev => prev.map(rt => 
      rt.id === id ? { ...rt, ...updates } : rt
    ));
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
  };

  const transferBetweenAccounts = async (fromAccountId: string, toAccountId: string, amount: number, description: string) => {
    if (!user) throw new Error('User not authenticated');

    // Get account details for currency information
    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error('Invalid account selection');
    }

    // Create paired transactions for the transfer
    const transferDate = new Date();
    
    // Create outgoing transaction (expense from source account)
    const outgoingTransaction = await addTransaction({
      type: 'expense',
      amount: amount,
      category: 'Transfer',
      description: `Transfer to ${toAccount.name}: ${description}`,
      date: transferDate,
      accountId: fromAccountId,
      affectsBalance: true,
      status: 'completed'
    });

    // Create incoming transaction (income to destination account)
    const incomingTransaction = await addTransaction({
      type: 'income',
      amount: amount,
      category: 'Transfer',
      description: `Transfer from ${fromAccount.name}: ${description}`,
      date: transferDate,
      accountId: toAccountId,
      affectsBalance: true,
      status: 'completed'
    });

    // Create transfer record for tracking
    const { data, error } = await supabase
      .from('enhanced_account_transfers')
      .insert({
        user_id: user.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: amount,
        from_currency: fromAccount.currencyCode,
        to_currency: toAccount.currencyCode,
        exchange_rate: 1.0, // Simplified for now
        converted_amount: amount,
        description: description,
        transfer_date: transferDate.toISOString().split('T')[0],
        status: 'completed',
        fees: 0,
        from_transaction_id: outgoingTransaction.id,
        to_transaction_id: incomingTransaction.id
      })
      .select()
      .single();

    if (error) throw error;

    const newTransfer: AccountTransfer = {
      id: data.id,
      userId: data.user_id,
      fromAccountId: data.from_account_id,
      toAccountId: data.to_account_id,
      amount: Number(data.amount),
      description: data.description,
      transferDate: new Date(data.transfer_date),
      fromTransactionId: data.from_transaction_id,
      toTransactionId: data.to_transaction_id,
      createdAt: new Date(data.created_at)
    };

    setAccountTransfers(prev => [newTransfer, ...prev]);

    // Reload accounts to reflect balance changes
    await loadAccounts();
  };

  // Analytics functions
  const getMonthlyTrends = (months: number) => {
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        net: income - expenses
      });
    }
    
    return trends;
  };

  const getCategoryBreakdown = (transactions: Transaction[]) => {
    const categoryMap = new Map<string, number>();
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    transactions.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });
    
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getNetWorthTrends = (months: number) => {
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );
      
      const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0) +
        monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0) -
        monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      
      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        netWorth
      });
    }
    
    return trends;
  };

  const getSpendingPatterns = (transactions: Transaction[]) => {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = categoryMap.get(t.category) || { amount: 0, count: 0 };
        categoryMap.set(t.category, {
          amount: current.amount + t.amount,
          count: current.count + 1
        });
      });
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getIncomeAnalysis = (transactions: Transaction[]) => {
    const sourceMap = new Map<string, number>();
    const total = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const current = sourceMap.get(t.category) || 0;
        sourceMap.set(t.category, current + t.amount);
      });
    
    return Array.from(sourceMap.entries())
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getBudgetPerformance = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthTransactions = transactions.filter(t => 
      t.date >= monthStart && t.date <= monthEnd
    );
    
    return budgets.map(budget => {
      const spent = monthTransactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        budget: budget.category,
        spent,
        limit: budget.amount,
        percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      };
    });
  };

  // Calculate statistics
  const stats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    totalLiabilities: liabilities.reduce((sum, l) => sum + l.remainingAmount, 0),
    totalSavings: accounts.reduce((sum, a) => sum + a.balance, 0),
    monthlyIncome: transactions
      .filter(t => t.type === 'income' && t.date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((sum, t) => sum + t.amount, 0),
    monthlyExpenses: transactions
      .filter(t => t.type === 'expense' && t.date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((sum, t) => sum + t.amount, 0)
  };

  const value: FinanceContextType = {
    accounts,
    transactions,
    goals,
    liabilities,
    budgets,
    bills,
    recurringTransactions,
    incomeSource,
    accountTransfers,
    userCategories,
    billReminders,
    debtPayments,
    transactionSplits,
    financialInsights,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    addLiability,
    updateLiability,
    deleteLiability,
    addBudget,
    updateBudget,
    deleteBudget,
    addBill,
    updateBill,
    deleteBill,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    transferBetweenAccounts,
    getGoalsVaultAccount,
    ensureGoalsVaultAccount,
    fundGoalFromAccount,
    withdrawGoalToAccount,
    payBillFromAccount,
    repayLiabilityFromAccount,
    markBillAsPaid,
    markRecurringTransactionAsPaid,
    getMonthlyTrends,
    getCategoryBreakdown,
    getNetWorthTrends,
    getSpendingPatterns,
    getIncomeAnalysis,
    getBudgetPerformance,
    stats
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};