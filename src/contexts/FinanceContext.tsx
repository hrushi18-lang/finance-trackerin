import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Transaction, 
  Goal, 
  Liability, 
  Budget,
  DashboardStats, 
  RecurringTransaction,
  FinancialAccount,
  EnhancedLiability,
  UserCategory,
  IncomeSource,
  SplitTransaction,
  DebtRepaymentStrategy
} from '../types';
import { supabase, logQueryPerformance } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';
import { useCurrencyConversion } from './CurrencyConversionContext';

interface FinanceContextType {
  // Data
  transactions: Transaction[];
  goals: Goal[];
  liabilities: EnhancedLiability[]; // Changed to EnhancedLiability
  budgets: Budget[]; // Changed to CategoryBudget
  recurringTransactions: RecurringTransaction[];
  accounts: FinancialAccount[];
  bills: Bill[]; // Added bills
  userCategories: UserCategory[];
  incomeSources: IncomeSource[];
  stats: DashboardStats;
  insights: any[];
  loading: boolean;
  
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addSplitTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>, splits: SplitTransaction[]) => Promise<void>;
  searchTransactions: (query: string) => Transaction[];
  addLiabilityPayment: (payment: any) => Promise<void>; // Added for liability payments
  
  // Goal methods
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Liability methods (now using EnhancedLiability)
  addLiability: (liability: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLiability: (id: string, updates: Partial<EnhancedLiability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  
  // Enhanced liability methods
  addEnhancedLiability: (liability: any) => Promise<void>;
  updateEnhancedLiability: (id: string, updates: any) => Promise<void>;
  deleteEnhancedLiability: (id: string) => Promise<void>;
  
  // Bill methods
  addBill: (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  payBill: (billId: string, accountId: string, amount?: number) => Promise<void>;
  
  // Asset methods
  addAsset: (asset: any) => Promise<void>;
  updateAsset: (id: string, updates: any) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  
  // Budget methods
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => Promise<void>; // Changed to CategoryBudget
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Recurring transaction methods
  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  processRecurringTransactions: () => Promise<void>;
  
  // Account methods
  addAccount: (account: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currency'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<FinancialAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  transferBetweenAccounts: (fromAccountId: string, toAccountId: string, amount: number, description: string) => Promise<void>;
  
  // Category methods
  addUserCategory: (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserCategory: (id: string, updates: Partial<UserCategory>) => Promise<void>;
  deleteUserCategory: (id: string) => Promise<void>;
  
  // Income source methods
  addIncomeSource: (source: Omit<IncomeSource, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;
  
  // Analytics methods
  getMonthlyTrends: (months: number) => any[];
  getCategoryBreakdown: () => any[];
  getNetWorthTrends: () => any[];
  getSpendingPatterns: (transactions: Transaction[]) => any[];
  getIncomeAnalysis: (transactions: Transaction[]) => any[];
  getBudgetPerformance: () => any[];
  calculateDebtRepaymentStrategy: (strategy: 'snowball' | 'avalanche', extraPayment: number) => DebtRepaymentStrategy;
  getFinancialForecast: () => Promise<any>;
  refreshInsights: () => Promise<void>;
  exportData: (format: 'json' | 'csv') => Promise<string>;
  importData: (data: string, format: 'json' | 'csv') => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { convertAmount } = useCurrencyConversion();
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [liabilities, setLiabilities] = useState<EnhancedLiability[]>([]); // Changed to EnhancedLiability
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [bills, setBills] = useState<Bill[]>([]); // Added bills state
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear data when user logs out
      setTransactions([]);
      setGoals([]);
      setLiabilities([]);
      setBudgets([]);
      setRecurringTransactions([]);
      setBills([]); // Clear bills
      setAccounts([]);
      setUserCategories([]);
      setIncomeSources([]);
      setInsights([]);
      setLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading all financial data for user:', user.id);
      
      // Load all data in parallel for better performance
      const [
        transactionsData,
        goalsData,
        liabilitiesData,
        budgetsData,
        recurringData,
        billsData, // Added billsData
        accountsData,
        categoriesData,
        incomeSourcesData
      ] = await Promise.all([
        loadTransactions(),
        loadGoals(),
        loadLiabilities(),
        loadBudgets(),
        loadRecurringTransactions(),
        loadBills(), // Added loadBills
        loadAccounts(),
        loadUserCategories(),
        loadIncomeSources()
      ]);

      console.log('✅ All financial data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading financial data:', error);
      showToast('Failed to load financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load functions
  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    const formattedTransactions = (data || []).map(t => ({
      ...t,
      date: new Date(t.date),
      createdAt: new Date(t.created_at)
    }));
    
    setTransactions(formattedTransactions);
    return formattedTransactions;
  };

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedGoals = (data || []).map(g => ({
      ...g,
      targetDate: new Date(g.target_date),
      createdAt: new Date(g.created_at),
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount)
    }));
    
    setGoals(formattedGoals);
    return formattedGoals;
  };

  const loadLiabilities = async () => {
    // Changed to enhanced_liabilities
    const { data, error } = await supabase
      .from('enhanced_liabilities')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedLiabilities: EnhancedLiability[] = (data || []).map(l => ({
      id: l.id,
      userId: l.user_id,
      name: l.name,
      liabilityType: l.liability_type as EnhancedLiability['liabilityType'],
      description: l.description || undefined,
      totalAmount: Number(l.total_amount),
      remainingAmount: Number(l.remaining_amount),
      interestRate: Number(l.interest_rate),
      monthlyPayment: l.monthly_payment ? Number(l.monthly_payment) : undefined,
      minimumPayment: l.minimum_payment ? Number(l.minimum_payment) : undefined,
      paymentDay: l.payment_day,
      loanTermMonths: l.loan_term_months || undefined,
      remainingTermMonths: l.remaining_term_months || undefined,
      startDate: new Date(l.start_date),
      dueDate: l.due_date ? new Date(l.due_date) : undefined,
      nextPaymentDate: l.next_payment_date ? new Date(l.next_payment_date) : undefined,
      linkedAssetId: l.linked_asset_id || undefined,
      isSecured: l.is_secured,
      disbursementAccountId: l.disbursement_account_id || undefined,
      defaultPaymentAccountId: l.default_payment_account_id || undefined,
      providesFunds: l.provides_funds,
      affectsCreditScore: l.affects_credit_score,
      status: l.status as EnhancedLiability['status'],
      isActive: l.is_active,
      autoGenerateBills: l.auto_generate_bills,
      billGenerationDay: l.bill_generation_day,
      createdAt: new Date(l.created_at),
      updatedAt: new Date(l.updated_at)
    }));
    
    setLiabilities(formattedLiabilities);
    return formattedLiabilities;
  };

  const loadBudgets = async () => {
    // Changed to category_budgets
    const { data, error } = await supabase
      .from('category_budgets')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedBudgets: Budget[] = (data || []).map(b => ({
      id: b.id,
      userId: b.user_id,
      categoryId: b.category_id,
      amount: Number(b.amount),
      period: b.period as Budget['period'],
      alertThreshold: b.alert_threshold,
      rolloverUnused: b.rollover_unused,
      createdAt: new Date(b.created_at),
      updatedAt: new Date(b.updated_at),
      // Spent is not directly in category_budgets, needs to be calculated or fetched separately
      spent: 0 // Placeholder, needs actual calculation
    }));
    
    setBudgets(formattedBudgets);
    return formattedBudgets;
  };

  const loadBills = async () => {
    // Added loadBills
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedBills: Bill[] = (data || []).map(b => ({
      ...b,
      dueDate: new Date(b.due_date),
      nextDueDate: new Date(b.next_due_date),
      lastPaidDate: b.last_paid_date ? new Date(b.last_paid_date) : undefined,
      createdAt: new Date(b.created_at),
      updatedAt: new Date(b.updated_at),
      amount: Number(b.amount),
      estimatedAmount: b.estimated_amount ? Number(b.estimated_amount) : undefined,
      customFrequencyDays: b.custom_frequency_days || undefined,
      reminderDaysBefore: b.reminder_days_before,
      sendDueDateReminder: b.send_due_date_reminder,
      sendOverdueReminder: b.send_overdue_reminder,
      autoPay: b.auto_pay,
      isEmi: b.is_emi,
      isEssential: b.is_essential,
      isActive: b.is_active,
      userId: b.user_id,
      title: b.title,
      billType: b.bill_type as Bill['billType'],
      frequency: b.frequency as Bill['frequency'],
      defaultAccountId: b.default_account_id || undefined,
      linkedLiabilityId: b.linked_liability_id || undefined
    }));
    
    setBills(formattedBills);
    return formattedBills;
  };

  const loadRecurringTransactions = async () => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedRecurring = (data || []).map(r => ({
      ...r,
      startDate: new Date(r.start_date),
      endDate: r.end_date ? new Date(r.end_date) : undefined,
      nextOccurrenceDate: new Date(r.next_occurrence_date),
      lastProcessedDate: r.last_processed_date ? new Date(r.last_processed_date) : undefined,
      isBill: r.is_bill,
      paymentMethod: r.payment_method || undefined,
      accountId: r.account_id || undefined,
      priority: r.priority as RecurringTransaction['priority'],
      reminderDays: r.reminder_days,
      autoProcess: r.auto_process,
      autoCreate: r.auto_create,
      notificationDays: r.notification_days,
      status: r.status as RecurringTransaction['status'],
      isBill: r.is_bill,
      paymentMethod: r.payment_method || undefined,
      accountId: r.account_id || undefined,
      priority: r.priority as RecurringTransaction['priority'],
      reminderDays: r.reminder_days,
      autoProcess: r.auto_process,
      autoCreate: r.auto_create,
notificationDays: r.notification_days,
      status: r.status as RecurringTransaction['status'],
      createdAt: new Date(r.created_at),
      amount: Number(r.amount)
    }));
    
    setRecurringTransactions(formattedRecurring);
    return formattedRecurring;
  };

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedAccounts = (data || []).map(a => ({
      ...a,
      balance: Number(a.balance),
      createdAt: new Date(a.created_at),
      updatedAt: new Date(a.updated_at),
      userId: a.user_id,
      isVisible: a.is_visible
    }));
    
    setAccounts(formattedAccounts);
    return formattedAccounts;
  };

  const loadUserCategories = async () => {
    const { data, error } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_id', user!.id)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    const formattedCategories = (data || []).map(c => ({
      ...c,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
      userId: c.user_id,
      parentId: c.parent_id
    }));
    
    setUserCategories(formattedCategories);
    return formattedCategories;
  };

  const loadIncomeSources = async () => {
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedSources = (data || []).map(s => ({
      ...s,
      amount: Number(s.amount),
      lastReceived: s.last_received ? new Date(s.last_received) : undefined,
      nextExpected: s.next_expected ? new Date(s.next_expected) : undefined,
      createdAt: new Date(s.created_at),
      userId: s.user_id,
      isActive: s.is_active
    }));
    
    setIncomeSources(formattedSources);
    return formattedSources;
  };

  // Transaction methods
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date.toISOString().split('T')[0],
        account_id: transaction.accountId,
        affects_balance: transaction.affectsBalance,
        original_amount: transaction.originalAmount,
        original_currency: transaction.originalCurrency,
        exchange_rate: transaction.exchangeRate,
        reason: transaction.reason,
        transfer_to_account_id: transaction.transferToAccountId,
        status: 'completed'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newTransaction = {
      ...data,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
      userId: data.user_id,
      accountId: data.account_id || undefined,
      originalAmount: data.original_amount || undefined,
      originalCurrency: data.original_currency || undefined,
      exchangeRate: data.exchange_rate || undefined,
      affectsBalance: data.affects_balance,
      transferToAccountId: data.transfer_to_account_id
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    await loadAccounts(); // Refresh account balances
    showToast('Transaction added successfully', 'success');
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { error } = await supabase
      .from('transactions')
      .update({
        type: updates.type,
        amount: updates.amount,
        category: updates.category,
        description: updates.description,
        date: updates.date ? updates.date.toISOString().split('T')[0] : undefined,
        original_amount: updates.originalAmount,
        original_currency: updates.originalCurrency,
        exchange_rate: updates.exchangeRate,
        account_id: updates.accountId,
        affects_balance: updates.affectsBalance,
        reason: updates.reason,
        transfer_to_account_id: updates.transferToAccountId
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await loadAccounts(); // Refresh account balances
    showToast('Transaction updated successfully', 'success');
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setTransactions(prev => prev.filter(t => t.id !== id));
    await loadAccounts(); // Refresh account balances
    showToast('Transaction deleted successfully', 'success');
  };

  const addSplitTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>, splits: SplitTransaction[]) => {
    if (!user) throw new Error('User not authenticated');
    
    // First create the main transaction
    const { data: mainTransaction, error: mainError } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        type: transaction.type,
        amount: transaction.amount,
        category: 'Split Transaction',
        description: transaction.description,
        date: transaction.date.toISOString().split('T')[0],
        account_id: transaction.accountId,
        affects_balance: transaction.affectsBalance ?? true
      }])
      .select()
      .single();
    
    if (mainError) throw mainError;
    
    // Then create the split records
    const splitInserts = splits.map(split => ({
      user_id: user.id,
      parent_transaction_id: mainTransaction.id,
      category: split.category,
      amount: split.amount,
      description: split.description
    }));
    
    const { error: splitError } = await supabase
      .from('transaction_splits')
      .insert(splitInserts);
    
    if (splitError) throw splitError;
    
    await loadTransactions();
    await loadAccounts();
    showToast('Split transaction added successfully', 'success');
  };

  const addLiabilityPayment = async (payment: any) => {
    // Added for liability payments
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('liability_payments')
      .insert([{
        liability_id: payment.liabilityId,
        user_id: user.id,
        amount: payment.amount,
        payment_date: payment.paymentDate.toISOString().split('T')[0],
        payment_type: payment.paymentType,
        principal_amount: payment.principalAmount,
        interest_amount: payment.interestAmount,
        fees_amount: payment.feesAmount,
        paid_from_account_id: payment.paidFromAccountId,
        transaction_id: payment.transactionId,
        bill_instance_id: payment.billInstanceId,
        description: payment.description
      }]);
    if (error) throw error;
    showToast('Liability payment recorded successfully', 'success');
  };
  const searchTransactions = (query: string): Transaction[] => {
    if (!query.trim()) return transactions;
    
    const lowerQuery = query.toLowerCase();
    return transactions.filter(t => 
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  };

  // Goal methods
  const addGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase // Changed to goals table
      .from('goals')
      .insert([{
        user_id: user.id,
        title: goal.title,
        description: goal.description,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        target_date: goal.targetDate.toISOString().split('T')[0],
        category: goal.category
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newGoal = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description || '',
      targetAmount: Number(data.target_amount),
      currentAmount: Number(data.current_amount || 0),
      targetDate: new Date(data.target_date),
      category: data.category,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
      userId: data.user_id
    };
    
    setGoals(prev => [newGoal, ...prev]);
    showToast('Goal added successfully', 'success');
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { error } = await supabase
      .from('goals') // Changed to goals table
      .update({
        title: updates.title,
        description: updates.description,
        target_amount: updates.targetAmount,
        current_amount: updates.currentAmount, // Changed to current_amount
        target_date: updates.targetDate?.toISOString().split('T')[0],
        category: updates.category
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    showToast('Goal updated successfully', 'success');
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals') // Changed to goals table
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setGoals(prev => prev.filter(g => g.id !== id));
    showToast('Goal deleted successfully', 'success');
  };

  // Account methods
  const addAccount = async (account: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currency'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_accounts')
      .insert([{
        user_id: user.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        institution: account.institution,
        platform: account.platform,
        is_visible: account.isVisible, // Changed to is_visible
        currency: 'USD' // Default currency
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newAccount = {
      ...data,
      balance: Number(data.balance),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at), // Changed to updated_at
      userId: data.user_id,
      isVisible: data.is_visible
    };
    
    setAccounts(prev => [newAccount, ...prev]);
    showToast('Account added successfully', 'success');
  };

  const updateAccount = async (id: string, updates: Partial<FinancialAccount>) => {
    const { error } = await supabase
      .from('financial_accounts')
      .update({
        name: updates.name,
        type: updates.type,
        balance: updates.balance,
        institution: updates.institution, // Changed to institution
        platform: updates.platform,
        is_visible: updates.isVisible
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    showToast('Account updated successfully', 'success');
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from('financial_accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setAccounts(prev => prev.filter(a => a.id !== id));
    showToast('Account deleted successfully', 'success');
  };

  const transferBetweenAccounts = async (fromAccountId: string, toAccountId: string, amount: number, description: string) => {
    if (!user) throw new Error('User not authenticated');

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('enhanced_account_transfers') // Changed to enhanced_account_transfers
      .insert([{
        user_id: user.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: amount,
        description: description
      }])
      .select(`
        id, from_account_id, to_account_id, amount, description, transfer_date,
        from_currency, to_currency, exchange_rate, converted_amount, status, fees, reference_number, created_at, updated_at
      `)
      .single();
    
    if (transferError) throw transferError;
    
    // Create two transactions (expense from source, income to destination)
    const fromTransaction = {
      type: 'expense' as const,
      amount: amount,
      category: 'Transfer',
      description: `Transfer to account: ${description}`,
      date: new Date(),
      accountId: fromAccountId,
      affectsBalance: true, // Changed to affectsBalance
      transferToAccountId: toAccountId
    };
    
    const toTransaction = {
      type: 'income' as const,
      amount: amount,
      category: 'Transfer',
      description: `Transfer from account: ${description}`,
      date: new Date(),
      accountId: toAccountId, // Changed to accountId
      affectsBalance: true
    };
    
    await addTransaction(fromTransaction);
    await addTransaction(toTransaction);
    
    showToast('Transfer completed successfully', 'success');
  };

  // Liability methods
  const addLiability = async (liability: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('enhanced_liabilities') // Changed to enhanced_liabilities
      .insert([{
        user_id: user.id,
        name: liability.name,
        liability_type: liability.liabilityType,
        description: liability.description,
        total_amount: liability.totalAmount,
        remaining_amount: liability.remainingAmount,
        interest_rate: liability.interestRate,
        monthly_payment: liability.monthlyPayment || null,
        minimum_payment: liability.minimumPayment || null,
        payment_day: liability.paymentDay,
        loan_term_months: liability.loanTermMonths || null,
        remaining_term_months: liability.remainingTermMonths || null,
        start_date: liability.startDate.toISOString().split('T')[0],
        due_date: liability.dueDate ? liability.dueDate.toISOString().split('T')[0] : null,
        next_payment_date: liability.nextPaymentDate ? liability.nextPaymentDate.toISOString().split('T')[0] : null,
        linked_asset_id: liability.linkedAssetId || null,
        is_secured: liability.isSecured,
        disbursement_account_id: liability.disbursementAccountId || null,
        default_payment_account_id: liability.defaultPaymentAccountId || null,
        provides_funds: liability.providesFunds,
        affects_credit_score: liability.affectsCreditScore,
        status: liability.status,
        is_active: liability.isActive,
        auto_generate_bills: liability.autoGenerateBills,
        bill_generation_day: liability.billGenerationDay
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newLiability: EnhancedLiability = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      liabilityType: data.liability_type as EnhancedLiability['liabilityType'],
      description: data.description || undefined,
      totalAmount: Number(data.total_amount),
      remainingAmount: Number(data.remaining_amount),
      interestRate: Number(data.interest_rate),
      monthlyPayment: data.monthly_payment ? Number(data.monthly_payment) : undefined,
      minimumPayment: data.minimum_payment ? Number(data.minimum_payment) : undefined,
      paymentDay: data.payment_day,
      loanTermMonths: data.loan_term_months || undefined,
      remainingTermMonths: data.remaining_term_months || undefined,
      startDate: new Date(data.start_date),
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : undefined,
      linkedAssetId: data.linked_asset_id || undefined,
      isSecured: data.is_secured,
      disbursementAccountId: data.disbursement_account_id || undefined,
      defaultPaymentAccountId: data.default_payment_account_id || undefined,
      providesFunds: data.provides_funds,
      affectsCreditScore: data.affects_credit_score,
      status: data.status as EnhancedLiability['status'],
      isActive: data.is_active,
      autoGenerateBills: data.auto_generate_bills,
      billGenerationDay: data.bill_generation_day,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
    
    setLiabilities(prev => [newLiability, ...prev]);
    showToast('Liability added successfully', 'success');
  };

  const updateLiability = async (id: string, updates: Partial<EnhancedLiability>) => {
    const { error } = await supabase
      .from('enhanced_liabilities') // Changed to enhanced_liabilities
      .update({
        name: updates.name,
        liability_type: updates.liabilityType,
        description: updates.description,
        total_amount: updates.totalAmount,
        remaining_amount: updates.remainingAmount,
        interest_rate: updates.interestRate,
        monthly_payment: updates.monthlyPayment, // Changed to monthly_payment
        minimum_payment: updates.minimumPayment,
        payment_day: updates.paymentDay,
        loan_term_months: updates.loanTermMonths,
        remaining_term_months: updates.remainingTermMonths,
        start_date: updates.startDate ? updates.startDate.toISOString().split('T')[0] : undefined,
        due_date: updates.dueDate ? updates.dueDate.toISOString().split('T')[0] : undefined,
        next_payment_date: updates.nextPaymentDate ? updates.nextPaymentDate.toISOString().split('T')[0] : undefined,
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
      .eq('id', id);
    
    if (error) throw error;
    
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    showToast('Liability updated successfully', 'success');
  };

  const deleteLiability = async (id: string) => {
    const { error } = await supabase
      .from('enhanced_liabilities') // Changed to enhanced_liabilities
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setLiabilities(prev => prev.filter(l => l.id !== id));
    showToast('Liability deleted successfully', 'success');
  };

  // Enhanced liability methods
  const addEnhancedLiability = async (liability: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('enhanced_liabilities')
      .insert([{
        user_id: user.id,
        name: liability.name, // Changed to name
        liability_type: liability.liabilityType,
        description: liability.description,
        total_amount: liability.totalAmount,
        remaining_amount: liability.remainingAmount,
        interest_rate: liability.interestRate,
        monthly_payment: liability.monthlyPayment,
        minimum_payment: liability.minimumPayment,
        payment_day: liability.paymentDay,
        loan_term_months: liability.loanTermMonths, // Changed to loan_term_months
        remaining_term_months: liability.remainingTermMonths,
        start_date: liability.startDate.toISOString().split('T')[0],
        due_date: liability.dueDate?.toISOString().split('T')[0],
        next_payment_date: liability.nextPaymentDate?.toISOString().split('T')[0],
        linked_asset_id: liability.linkedAssetId,
        is_secured: liability.isSecured,
        disbursement_account_id: liability.disbursementAccountId,
        default_payment_account_id: liability.defaultPaymentAccountId,
        provides_funds: liability.providesFunds,
        affects_credit_score: liability.affectsCreditScore, // Changed to affects_credit_score
        auto_generate_bills: liability.autoGenerateBills,
        bill_generation_day: liability.billGenerationDay
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newEnhancedLiability: EnhancedLiability = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      liabilityType: data.liability_type as EnhancedLiability['liabilityType'],
      description: data.description || undefined,
      totalAmount: Number(data.total_amount),
      remainingAmount: Number(data.remaining_amount),
      interestRate: Number(data.interest_rate),
      monthlyPayment: data.monthly_payment ? Number(data.monthly_payment) : undefined,
      minimumPayment: data.minimum_payment ? Number(data.minimum_payment) : undefined,
      paymentDay: data.payment_day,
      loanTermMonths: data.loan_term_months || undefined,
      remainingTermMonths: data.remaining_term_months || undefined,
      startDate: new Date(data.start_date),
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : undefined,
      linkedAssetId: data.linked_asset_id || undefined,
      isSecured: data.is_secured,
      disbursementAccountId: data.disbursement_account_id || undefined,
      defaultPaymentAccountId: data.default_payment_account_id || undefined,
      providesFunds: data.provides_funds,
      affectsCreditScore: data.affects_credit_score,
      status: data.status as EnhancedLiability['status'],
      isActive: data.is_active,
      autoGenerateBills: data.auto_generate_bills,
      billGenerationDay: data.bill_generation_day,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
    
    setLiabilities(prev => [newEnhancedLiability, ...prev]);
    showToast('Enhanced liability added successfully', 'success');
  };

  const updateEnhancedLiability = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('enhanced_liabilities')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    
    showToast('Enhanced liability updated successfully', 'success');
  };

  const deleteEnhancedLiability = async (id: string) => {
    const { error } = await supabase
      .from('enhanced_liabilities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    showToast('Enhanced liability deleted successfully', 'success');
  };

  // Bill methods
  const addBill = async (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('bills')
      .insert([{
        user_id: user.id,
        title: bill.title, // Changed to title
        description: bill.description,
        category: bill.category,
        bill_type: bill.billType,
        amount: bill.amount,
        estimated_amount: bill.estimatedAmount,
        frequency: bill.frequency,
        custom_frequency_days: bill.customFrequencyDays, // Changed to custom_frequency_days
        due_date: bill.dueDate.toISOString().split('T')[0], // Changed to due_date
        next_due_date: bill.nextDueDate.toISOString().split('T')[0], // Changed to next_due_date
        default_account_id: bill.defaultAccountId,
        auto_pay: bill.autoPay,
        linked_liability_id: bill.linkedLiabilityId,
        is_emi: bill.isEmi, // Changed to is_emi
        is_essential: bill.isEssential,
        reminder_days_before: bill.reminderDaysBefore,
        send_due_date_reminder: bill.sendDueDateReminder,
        send_overdue_reminder: bill.sendOverdueReminder
      }])
      .select()
      .single();
    
    if (error) throw error;

    const newBill: Bill = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description || undefined,
      category: data.category,
      billType: data.bill_type as Bill['billType'],
      amount: Number(data.amount),
      estimatedAmount: data.estimated_amount ? Number(data.estimated_amount) : undefined,
      frequency: data.frequency as Bill['frequency'],
      customFrequencyDays: data.custom_frequency_days || undefined,
      dueDate: new Date(data.due_date),
      nextDueDate: new Date(data.next_due_date),
      lastPaidDate: data.last_paid_date ? new Date(data.last_paid_date) : undefined,
      defaultAccountId: data.default_account_id || undefined,
      autoPay: data.auto_pay,
      linkedLiabilityId: data.linked_liability_id || undefined,
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
    showToast('Bill added successfully', 'success');
  };

  const updateBill = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('bills')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    setBills(prev => prev.map(b => b.id === id ? {
      ...b,
      title: updates.title || b.title,
      description: updates.description || b.description,
      category: updates.category || b.category,
      billType: updates.billType || b.billType,
      amount: updates.amount || b.amount,
      frequency: updates.frequency || b.frequency,
      dueDate: updates.dueDate || b.dueDate,
      nextDueDate: updates.nextDueDate || b.nextDueDate,
    } : b));
    
    if (error) throw error;
    
    showToast('Bill updated successfully', 'success');
  };

  const deleteBill = async (id: string) => {
    const { error } = await supabase
      .from('bills') // Changed to bills
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    showToast('Bill deleted successfully', 'success');
  };

  const payBill = async (billId: string, accountId: string, amount?: number) => {
    if (!user) throw new Error('User not authenticated');

    // Get bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();
    
    if (billError) throw billError;

    const paymentAmount = amount || bill.amount;
    
    // Create payment transaction
    await addTransaction({
      type: 'expense',
      amount: paymentAmount,
      category: bill.category,
      description: `Bill payment: ${bill.title}`,
      date: new Date(),
      accountId: accountId,
      affectsBalance: true
    });

    // Create bill instance record
    const { error: instanceError } = await supabase
      .from('bill_instances')
      .insert([{
        bill_id: billId,
        user_id: user.id,
        due_date: bill.next_due_date,
        amount: paymentAmount,
        actual_amount: paymentAmount,
        status: 'paid',
        payment_method: 'manual',
        paid_date: new Date().toISOString(),
        paid_from_account_id: accountId
      }]);
    
    if (instanceError) throw instanceError; // Changed to instanceError
    
    // Update next due date
    const nextDueDate = new Date(bill.next_due_date);
    switch (bill.frequency) {
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'bi_weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 14);
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        break;
      case 'semi_annual':
        nextDueDate.setMonth(nextDueDate.getMonth() + 6);
        break;
      case 'annual':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
    }

    await supabase
      .from('bills')
      .update({
        next_due_date: nextDueDate.toISOString().split('T')[0],
        last_paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', billId);
    
    showToast('Bill paid successfully', 'success');
  };

  // Asset methods
  const addAsset = async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('assets')
      .insert([{
        user_id: user.id,
        name: asset.name,
        asset_type: asset.assetType,
        description: asset.description,
        purchase_value: asset.purchaseValue,
        current_value: asset.currentValue,
        depreciation_rate: asset.depreciationRate, // Changed to depreciation_rate
        purchase_date: asset.purchaseDate.toISOString().split('T')[0]
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    showToast('Asset added successfully', 'success');
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    const { error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    
    showToast('Asset updated successfully', 'success');
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    showToast('Asset deleted successfully', 'success');
  };

  // Budget methods
  const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => { // Changed to CategoryBudget
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('category_budgets') // Changed to category_budgets
      .insert([{
        user_id: user.id,
        category_id: budget.categoryId, // Changed to category_id
        alert_threshold: budget.alertThreshold,
        amount: budget.amount,
        period: budget.period,
        spent: 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newBudget = {
      id: data.id,
      userId: data.user_id,
      categoryId: data.category_id,
      amount: Number(data.amount),
      period: data.period as Budget['period'],
      alertThreshold: data.alert_threshold,
      userId: data.user_id
    };
    
    setBudgets(prev => [newBudget, ...prev]);
    showToast('Budget added successfully', 'success');
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const { error } = await supabase
      .from('category_budgets') // Changed to category_budgets
      .update({
        category_id: updates.categoryId, // Changed to category_id
        alert_threshold: updates.alertThreshold,
        amount: updates.amount,
        period: updates.period,
        spent: updates.spent,
        period: updates.period
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    showToast('Budget updated successfully', 'success');
  };

  const deleteBudget = async (id: string) => {
    const { error } = await supabase
      .from('category_budgets') // Changed to category_budgets
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setBudgets(prev => prev.filter(b => b.id !== id));
    showToast('Budget deleted successfully', 'success');
  };

  // Recurring transaction methods
  const addRecurringTransaction = async (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert([{
        user_id: user.id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        frequency: transaction.frequency,
        start_date: transaction.startDate.toISOString().split('T')[0],
        end_date: transaction.endDate?.toISOString().split('T')[0],
        next_occurrence_date: transaction.nextOccurrenceDate.toISOString().split('T')[0], // Changed to next_occurrence_date
        is_bill: transaction.isBill,
        payment_method: transaction.paymentMethod,
        account_id: transaction.accountId,
        priority: transaction.priority,
        reminder_days: transaction.reminderDays,
        auto_process: transaction.autoProcess,
        auto_create: transaction.autoCreate,
        notification_days: transaction.notificationDays,
        status: transaction.status,
        is_active: transaction.isActive,
        day_of_week: transaction.dayOfWeek,
        day_of_month: transaction.dayOfMonth,
        month_of_year: transaction.monthOfYear,
        max_occurrences: transaction.maxOccurrences,
        current_occurrences: transaction.currentOccurrences
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newRecurring = {
      ...data,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      nextOccurrenceDate: new Date(data.next_occurrence_date),
      lastProcessedDate: data.last_processed_date ? new Date(data.last_processed_date) : undefined,
      createdAt: new Date(data.created_at),
      amount: Number(data.amount),
      userId: data.user_id,
      isActive: data.is_active,
      dayOfWeek: data.day_of_week,
      dayOfMonth: data.day_of_month,
      monthOfYear: data.month_of_year,
      maxOccurrences: data.max_occurrences,
      currentOccurrences: data.current_occurrences
    };
    
    setRecurringTransactions(prev => [newRecurring, ...prev]);
    showToast('Recurring transaction added successfully', 'success');
  };

  const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransaction>) => {
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
        next_occurrence_date: updates.nextOccurrenceDate?.toISOString().split('T')[0], // Changed to next_occurrence_date
        is_bill: updates.isBill,
        payment_method: updates.paymentMethod,
        account_id: updates.accountId,
        priority: updates.priority,
        reminder_days: updates.reminderDays,
        auto_process: updates.autoProcess,
        auto_create: updates.autoCreate,
        notification_days: updates.notificationDays,
        status: updates.status,
        is_active: updates.isActive,
        day_of_week: updates.dayOfWeek,
        day_of_month: updates.dayOfMonth,
        month_of_year: updates.monthOfYear,
        max_occurrences: updates.maxOccurrences,
        current_occurrences: updates.currentOccurrences
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setRecurringTransactions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    showToast('Recurring transaction updated successfully', 'success');
  };

  const deleteRecurringTransaction = async (id: string) => {
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    showToast('Recurring transaction deleted successfully', 'success');
  };

  const processRecurringTransactions = async () => {
    // This would process due recurring transactions
    // Implementation would check for due transactions and create them
    showToast('Recurring transactions processed', 'success');
  };

  // User category methods
  const addUserCategory = async (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase // Changed to category_hierarchy
      .from('user_categories')
      .insert([{
        user_id: user.id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        parent_id: category.parentId, // Changed to parent_id
        description: category.description,
        sort_order: category.sortOrder || 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newCategory: UserCategory = {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      userId: data.user_id,
      parentId: data.parent_id,
      sortOrder: data.sort_order
    };
    
    setUserCategories(prev => [newCategory, ...prev]);
    showToast('Category added successfully', 'success');
  };

  const updateUserCategory = async (id: string, updates: Partial<UserCategory>) => {
    const { error } = await supabase
      .from('category_hierarchy') // Changed to category_hierarchy
      .update({
        name: updates.name,
        type: updates.type,
        icon: updates.icon,
        color: updates.color,
        parent_id: updates.parentId,
        description: updates.description,
        sort_order: updates.sortOrder
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setUserCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    showToast('Category updated successfully', 'success');
  };

  const deleteUserCategory = async (id: string) => {
    const { error } = await supabase
      .from('category_hierarchy') // Changed to category_hierarchy
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setUserCategories(prev => prev.filter(c => c.id !== id));
    showToast('Category deleted successfully', 'success');
  };

  // Income source methods
  const addIncomeSource = async (source: Omit<IncomeSource, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('income_sources')
      .insert([{
        user_id: user.id,
        name: source.name,
        type: source.type,
        amount: source.amount,
        frequency: source.frequency,
        is_active: source.isActive, // Changed to is_active
        last_received: source.lastReceived?.toISOString().split('T')[0],
        next_expected: source.nextExpected?.toISOString().split('T')[0],
        reliability: source.reliability
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newSource = {
      id: data.id,
      amount: Number(data.amount),
      lastReceived: data.last_received ? new Date(data.last_received) : undefined,
      nextExpected: data.next_expected ? new Date(data.next_expected) : undefined,
      createdAt: new Date(data.created_at),
      userId: data.user_id,
      isActive: data.is_active
    };
    
    setIncomeSources(prev => [newSource, ...prev]);
    showToast('Income source added successfully', 'success');
  };

  const updateIncomeSource = async (id: string, updates: Partial<IncomeSource>) => {
    const { error } = await supabase
      .from('income_sources')
      .update({
        name: updates.name,
        type: updates.type,
        amount: updates.amount,
        frequency: updates.frequency, // Changed to frequency
        is_active: updates.isActive,
        last_received: updates.lastReceived?.toISOString().split('T')[0],
        next_expected: updates.nextExpected?.toISOString().split('T')[0],
        reliability: updates.reliability
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setIncomeSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    showToast('Income source updated successfully', 'success');
  };

  const deleteIncomeSource = async (id: string) => {
    const { error } = await supabase
      .from('income_sources')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setIncomeSources(prev => prev.filter(s => s.id !== id));
    showToast('Income source deleted successfully', 'success');
  };

  // Analytics methods
  const getMonthlyTrends = (months: number) => {
    // Implementation for monthly trends
    return [];
  };

  const getCategoryBreakdown = () => {
    // Implementation for category breakdown
    return [];
  };

  const getNetWorthTrends = () => {
    // Implementation for net worth trends
    return [];
  };

  const getSpendingPatterns = (transactions: Transaction[]) => {
    // Implementation for spending patterns
    return [];
  };

  const getIncomeAnalysis = (transactions: Transaction[]) => {
    // Implementation for income analysis
    return [];
  };

  const getBudgetPerformance = () => {
    // Implementation for budget performance
    return [];
  };

  const calculateDebtRepaymentStrategy = (strategy: 'snowball' | 'avalanche', extraPayment: number): DebtRepaymentStrategy => {
    // Implementation for debt repayment strategy
    return {
      totalMonths: 0,
      totalInterestPaid: 0,
      totalPaid: 0,
      payoffDate: new Date(),
      debtPlans: []
    };
  };

  const getFinancialForecast = async () => {
    // Implementation for financial forecast
    return {};
  };

  const refreshInsights = async () => {
    // Implementation for refreshing insights
  };

  const exportData = async (format: 'json' | 'csv'): Promise<string> => {
    // Implementation for data export
    return '';
  };

  const importData = async (data: string, format: 'json' | 'csv') => {
    // Implementation for data import
  };

  // Calculate stats
  const stats: DashboardStats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    totalSavings: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    totalLiabilities: liabilities.reduce((sum, l) => sum + l.remainingAmount, 0),
    monthlyIncome: transactions.filter(t => t.type === 'income' && t.date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, t) => sum + t.amount, 0),
    monthlyExpenses: transactions.filter(t => t.type === 'expense' && t.date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, t) => sum + t.amount, 0),
    // Budget utilization needs to be re-calculated based on category_budgets
    budgetUtilization: budgets.length > 0 ? budgets.reduce((sum, b) => sum + (b.spent / b.amount), 0) / budgets.length * 100 : 0
  };

  const value = {
    // Data
    transactions,
    goals,
    liabilities,
    budgets,
    recurringTransactions,
    bills, // Added bills
    accounts,
    userCategories,
    incomeSources,
    stats,
    insights,
    loading,
    
    // Methods
    addTransaction,
    addLiabilityPayment, // Added for liability payments
    updateTransaction,
    deleteTransaction,
    addSplitTransaction,
    searchTransactions,
    addGoal,
    updateGoal,
    deleteGoal,
    addLiability,
    updateLiability,
    deleteLiability,
    addBudget,
    updateBudget,
    deleteBudget,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processRecurringTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    getMonthlyTrends,
    getCategoryBreakdown,
    getNetWorthTrends,
    getSpendingPatterns,
    getIncomeAnalysis,
    getBudgetPerformance,
    calculateDebtRepaymentStrategy,
    getFinancialForecast,
    refreshInsights,
    exportData,
    importData,
    addEnhancedLiability,
    updateEnhancedLiability,
    deleteEnhancedLiability,
    addBill,
    updateBill,
    deleteBill,
    payBill,
    addAsset,
    updateAsset,
    deleteAsset
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};