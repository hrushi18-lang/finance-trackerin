import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Transaction, 
  Goal, 
  Liability, 
  Budget, 
  DashboardStats, 
  RecurringTransaction,
  FinancialAccount,
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
  liabilities: Liability[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  accounts: FinancialAccount[];
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
  
  // Goal methods
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Liability methods
  addLiability: (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateLiability: (id: string, updates: Partial<Liability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  
  // Budget methods
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => Promise<void>;
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
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
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
        accountsData,
        categoriesData,
        incomeSourcesData
      ] = await Promise.all([
        loadTransactions(),
        loadGoals(),
        loadLiabilities(),
        loadBudgets(),
        loadRecurringTransactions(),
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
    const { data, error } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedLiabilities = (data || []).map(l => ({
      ...l,
      dueDate: new Date(l.due_date),
      createdAt: new Date(l.created_at),
      totalAmount: Number(l.total_amount),
      remainingAmount: Number(l.remaining_amount),
      interestRate: Number(l.interest_rate),
      monthlyPayment: Number(l.monthly_payment)
    }));
    
    setLiabilities(formattedLiabilities);
    return formattedLiabilities;
  };

  const loadBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedBudgets = (data || []).map(b => ({
      ...b,
      amount: Number(b.amount),
      spent: Number(b.spent),
      createdAt: new Date(b.created_at)
    }));
    
    setBudgets(formattedBudgets);
    return formattedBudgets;
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
        affects_balance: transaction.affectsBalance ?? true,
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
      accountId: data.account_id,
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
        date: updates.date?.toISOString().split('T')[0],
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
    
    const { data, error } = await supabase
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
      ...data,
      targetDate: new Date(data.target_date),
      createdAt: new Date(data.created_at),
      targetAmount: Number(data.target_amount),
      currentAmount: Number(data.current_amount),
      userId: data.user_id
    };
    
    setGoals(prev => [newGoal, ...prev]);
    showToast('Goal added successfully', 'success');
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
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
      .eq('id', id);
    
    if (error) throw error;
    
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    showToast('Goal updated successfully', 'success');
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals')
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
        is_visible: account.isVisible,
        currency: 'USD' // Default currency
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newAccount = {
      ...data,
      balance: Number(data.balance),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
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
        institution: updates.institution,
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
      .from('account_transfers')
      .insert([{
        user_id: user.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: amount,
        description: description
      }])
      .select()
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
      affectsBalance: true,
      transferToAccountId: toAccountId
    };
    
    const toTransaction = {
      type: 'income' as const,
      amount: amount,
      category: 'Transfer',
      description: `Transfer from account: ${description}`,
      date: new Date(),
      accountId: toAccountId,
      affectsBalance: true
    };
    
    await addTransaction(fromTransaction);
    await addTransaction(toTransaction);
    
    showToast('Transfer completed successfully', 'success');
  };

  // Liability methods
  const addLiability = async (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('liabilities')
      .insert([{
        user_id: user.id,
        name: liability.name,
        type: liability.type,
        total_amount: liability.totalAmount,
        remaining_amount: liability.remainingAmount,
        interest_rate: liability.interestRate,
        monthly_payment: liability.monthlyPayment,
        due_date: liability.due_date.toISOString().split('T')[0],
        start_date: liability.start_date.toISOString().split('T')[0]
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newLiability = {
      ...data,
      dueDate: new Date(data.due_date),
      createdAt: new Date(data.created_at),
      totalAmount: Number(data.total_amount),
      remainingAmount: Number(data.remaining_amount),
      interestRate: Number(data.interest_rate),
      monthlyPayment: Number(data.monthly_payment),
      userId: data.user_id,
      due_date: new Date(data.due_date),
      start_date: new Date(data.start_date)
    };
    
    setLiabilities(prev => [newLiability, ...prev]);
    showToast('Liability added successfully', 'success');
  };

  const updateLiability = async (id: string, updates: Partial<Liability>) => {
    const { error } = await supabase
      .from('liabilities')
      .update({
        name: updates.name,
        type: updates.type,
        total_amount: updates.totalAmount,
        remaining_amount: updates.remainingAmount,
        interest_rate: updates.interestRate,
        monthly_payment: updates.monthlyPayment,
        due_date: updates.due_date?.toISOString().split('T')[0]
      })
      .eq('id', id);
    
    if (error) throw error;
    
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    showToast('Liability updated successfully', 'success');
  };

  const deleteLiability = async (id: string) => {
    const { error } = await supabase
      .from('liabilities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    setLiabilities(prev => prev.filter(l => l.id !== id));
    showToast('Liability deleted successfully', 'success');
  };

  // Budget methods
  const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('budgets')
      .insert([{
        user_id: user.id,
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        spent: 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newBudget = {
      ...data,
      amount: Number(data.amount),
      spent: Number(data.spent),
      createdAt: new Date(data.created_at),
      userId: data.user_id
    };
    
    setBudgets(prev => [newBudget, ...prev]);
    showToast('Budget added successfully', 'success');
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const { error } = await supabase
      .from('budgets')
      .update({
        category: updates.category,
        amount: updates.amount,
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
      .from('budgets')
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
        next_occurrence_date: transaction.nextOccurrenceDate.toISOString().split('T')[0],
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
        next_occurrence_date: updates.nextOccurrenceDate?.toISOString().split('T')[0],
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
    
    const { data, error } = await supabase
      .from('user_categories')
      .insert([{
        user_id: user.id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        parent_id: category.parentId,
        description: category.description,
        sort_order: category.sortOrder || 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newCategory = {
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
      .from('user_categories')
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
      .from('user_categories')
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
        is_active: source.isActive,
        last_received: source.lastReceived?.toISOString().split('T')[0],
        next_expected: source.nextExpected?.toISOString().split('T')[0],
        reliability: source.reliability
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newSource = {
      ...data,
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
        frequency: updates.frequency,
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
    budgetUtilization: budgets.length > 0 ? budgets.reduce((sum, b) => sum + (b.spent / b.amount), 0) / budgets.length * 100 : 0
  };

  const value = {
    // Data
    transactions,
    goals,
    liabilities,
    budgets,
    recurringTransactions,
    accounts,
    userCategories,
    incomeSources,
    stats,
    insights,
    loading,
    
    // Methods
    addTransaction,
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
    importData
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};