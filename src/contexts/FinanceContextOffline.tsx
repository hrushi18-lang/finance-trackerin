/**
 * Enhanced FinanceContext with Offline Storage Support
 * This version integrates with offlineStorage for proper offline functionality
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { offlineStorage } from '../lib/offline-storage';
import { 
  FinancialAccount, 
  Transaction, 
  Goal, 
  EnhancedLiability, 
  Budget, 
  Bill,
  BillAccountLink,
  BillStagingHistory,
  BillCompletionTracking,
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
  billAccountLinks: BillAccountLink[];
  billStagingHistory: BillStagingHistory[];
  billCompletionTracking: BillCompletionTracking[];
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
  isOffline: boolean;
  syncStatus: {
    lastSync: string | null;
    pendingChanges: number;
    lastError: string | null;
  };
  
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
  deleteGoalSoft: (goalId: string, reason?: string) => Promise<any>;
  
  addLiability: (liability: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLiability: (id: string, updates: Partial<EnhancedLiability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  addBill: (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  
  addUserCategory: (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserCategory: (id: string, updates: Partial<UserCategory>) => Promise<void>;
  deleteUserCategory: (id: string) => Promise<void>;
  
  // Sync operations
  forceSync: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  
  // Computed values
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
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
  const [billAccountLinks, setBillAccountLinks] = useState<BillAccountLink[]>([]);
  const [billStagingHistory, setBillStagingHistory] = useState<BillStagingHistory[]>([]);
  const [billCompletionTracking, setBillCompletionTracking] = useState<BillCompletionTracking[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [incomeSource, setIncomeSource] = useState<IncomeSource[]>([]);
  const [accountTransfers, setAccountTransfers] = useState<AccountTransfer[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [transactionSplits, setTransactionSplits] = useState<TransactionSplit[]>([]);
  const [financialInsights, setFinancialInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Load all data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear all data when user logs out
      setAccounts([]);
      setTransactions([]);
      setGoals([]);
      setLiabilities([]);
      setBudgets([]);
      setBills([]);
      setBillAccountLinks([]);
      setBillStagingHistory([]);
      setBillCompletionTracking([]);
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

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger sync when coming back online
      forceSync();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load all data from offline storage first (faster)
      const [
        accountsData,
        transactionsData,
        goalsData,
        liabilitiesData,
        budgetsData,
        billsData,
        userCategoriesData
      ] = await Promise.all([
        offlineStorage.getAll<FinancialAccount>('financial_accounts', user.id),
        offlineStorage.getAll<Transaction>('transactions', user.id),
        offlineStorage.getAll<Goal>('goals', user.id),
        offlineStorage.getAll<EnhancedLiability>('enhanced_liabilities', user.id),
        offlineStorage.getAll<Budget>('budgets', user.id),
        offlineStorage.getAll<Bill>('bills', user.id),
        offlineStorage.getAll<UserCategory>('user_categories', user.id)
      ]);

      // Convert database format to app format
      setAccounts(accountsData.map(convertAccountFromDB));
      setTransactions(transactionsData.map(convertTransactionFromDB));
      setGoals(goalsData.map(convertGoalFromDB));
      setLiabilities(liabilitiesData.map(convertLiabilityFromDB));
      setBudgets(budgetsData.map(convertBudgetFromDB));
      setBills(billsData.map(convertBillFromDB));
      setUserCategories(userCategoriesData.map(convertUserCategoryFromDB));

      // If online, also sync with Supabase
      if (navigator.onLine) {
        await syncWithSupabase();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSupabase = async () => {
    if (!user || !navigator.onLine) return;

    try {
      // Sync accounts
      const { data: accountsData } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', user.id);
      
      if (accountsData) {
        const convertedAccounts = accountsData.map(convertAccountFromDB);
        setAccounts(convertedAccounts);
        // Save to offline storage
        for (const account of convertedAccounts) {
          await offlineStorage.create('financial_accounts', convertAccountToDB(account));
        }
      }

      // Sync transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (transactionsData) {
        const convertedTransactions = transactionsData.map(convertTransactionFromDB);
        setTransactions(convertedTransactions);
        // Save to offline storage
        for (const transaction of convertedTransactions) {
          await offlineStorage.create('transactions', convertTransactionToDB(transaction));
        }
      }

      // Sync goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);
      
      if (goalsData) {
        const convertedGoals = goalsData.map(convertGoalFromDB);
        setGoals(convertedGoals);
        // Save to offline storage
        for (const goal of convertedGoals) {
          await offlineStorage.create('goals', convertGoalToDB(goal));
        }
      }

      // Sync other data similarly...
      
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  };

  // Transaction operations with offline support
  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    // Validate required fields
    if (!transactionData.type || !transactionData.amount || !transactionData.accountId) {
      throw new Error('Missing required transaction fields');
    }

    // Check for sufficient funds for expense transactions
    if (transactionData.type === 'expense' && transactionData.affectsBalance !== false) {
      const account = accounts.find(acc => acc.id === transactionData.accountId);
      if (account) {
        if (account.type !== 'credit_card' && account.type !== 'investment') {
          if (account.balance < transactionData.amount) {
            throw new Error(`Insufficient funds. Account balance (${account.balance.toFixed(2)}) is less than transaction amount (${transactionData.amount.toFixed(2)})`);
          }
        }
      }
    }

    // Convert date to string format for database
    const dateString = transactionData.date instanceof Date 
      ? transactionData.date.toISOString().split('T')[0]
      : new Date(transactionData.date).toISOString().split('T')[0];

    // Prepare transaction data for storage
    const transactionToStore = {
      user_id: user.id,
      type: transactionData.type,
      amount: transactionData.amount,
      category: transactionData.category || 'Uncategorized',
      description: transactionData.description || '',
      date: dateString,
      account_id: transactionData.accountId,
      affects_balance: transactionData.affectsBalance ?? true,
      reason: transactionData.reason || null,
      transfer_to_account_id: transactionData.transferToAccountId || null,
      status: transactionData.status || 'completed'
    };

    try {
      // Use offline storage (handles both online and offline scenarios)
      const storedTransaction = await offlineStorage.create('transactions', transactionToStore);
      
      // Convert stored data back to Transaction type
      const newTransaction: Transaction = {
        id: storedTransaction.id,
        userId: storedTransaction.user_id,
        type: storedTransaction.type,
        amount: Number(storedTransaction.amount),
        category: storedTransaction.category,
        description: storedTransaction.description,
        date: new Date(storedTransaction.date),
        accountId: storedTransaction.account_id,
        affectsBalance: storedTransaction.affects_balance,
        reason: storedTransaction.reason,
        transferToAccountId: storedTransaction.transfer_to_account_id,
        status: storedTransaction.status,
        createdAt: new Date(storedTransaction.created_at),
        updatedAt: new Date(storedTransaction.updated_at)
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Update account balance based on transaction type
      if (newTransaction.affectsBalance !== false) {
        setAccounts(prev => prev.map(account => {
          if (account.id === newTransaction.accountId) {
            const balanceChange = newTransaction.type === 'income' 
              ? newTransaction.amount 
              : -newTransaction.amount;
            return {
              ...account,
              balance: account.balance + balanceChange
            };
          }
          return account;
        }));
      }

      // Update budget if this is an expense transaction
      if (newTransaction.type === 'expense' && newTransaction.affectsBalance !== false) {
        setBudgets(prev => prev.map(budget => {
          if (budget.category === newTransaction.category) {
            return {
              ...budget,
              spent: budget.spent + newTransaction.amount
            };
          }
          return budget;
        }));
      }

      return newTransaction;
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Goal operations with offline support
  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const goalToStore = {
      user_id: user.id,
      title: goalData.title,
      description: goalData.description,
      target_amount: goalData.targetAmount,
      current_amount: goalData.currentAmount,
      target_date: goalData.targetDate?.toISOString().split('T')[0] || null,
      category: goalData.category,
      priority: goalData.priority,
      status: goalData.status,
      is_active: goalData.isActive ?? true
    };

    try {
      const storedGoal = await offlineStorage.create('goals', goalToStore);
      
      const newGoal: Goal = {
        id: storedGoal.id,
        userId: storedGoal.user_id,
        title: storedGoal.title,
        description: storedGoal.description,
        targetAmount: Number(storedGoal.target_amount),
        currentAmount: Number(storedGoal.current_amount),
        targetDate: storedGoal.target_date ? new Date(storedGoal.target_date) : undefined,
        category: storedGoal.category,
        priority: storedGoal.priority,
        status: storedGoal.status,
        isActive: storedGoal.is_active,
        createdAt: new Date(storedGoal.created_at),
        updatedAt: new Date(storedGoal.updated_at)
      };

      setGoals(prev => [newGoal, ...prev]);
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw new Error(`Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Account operations with offline support
  const addAccount = async (accountData: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const accountToStore = {
      user_id: user.id,
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance,
      currency: accountData.currency,
      description: accountData.description || '',
      is_active: accountData.isActive ?? true
    };

    try {
      const storedAccount = await offlineStorage.create('financial_accounts', accountToStore);
      
      const newAccount: FinancialAccount = {
        id: storedAccount.id,
        userId: storedAccount.user_id,
        name: storedAccount.name,
        type: storedAccount.type,
        balance: Number(storedAccount.balance),
        currency: storedAccount.currency,
        description: storedAccount.description,
        isActive: storedAccount.is_active,
        createdAt: new Date(storedAccount.created_at),
        updatedAt: new Date(storedAccount.updated_at)
      };

      setAccounts(prev => [newAccount, ...prev]);
    } catch (error) {
      console.error('Failed to create account:', error);
      throw new Error(`Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // User Category operations with offline support
  const addUserCategory = async (categoryData: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const categoryToStore = {
      user_id: user.id,
      name: categoryData.name,
      type: categoryData.type,
      color: categoryData.color || '#3B82F6',
      icon: categoryData.icon || 'tag',
      is_active: categoryData.isActive ?? true
    };

    try {
      const storedCategory = await offlineStorage.create('user_categories', categoryToStore);
      
      const newCategory: UserCategory = {
        id: storedCategory.id,
        userId: storedCategory.user_id,
        name: storedCategory.name,
        type: storedCategory.type,
        color: storedCategory.color,
        icon: storedCategory.icon,
        isActive: storedCategory.is_active,
        createdAt: new Date(storedCategory.created_at),
        updatedAt: new Date(storedCategory.updated_at)
      };

      setUserCategories(prev => [newCategory, ...prev]);
    } catch (error) {
      console.error('Failed to create category:', error);
      throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Sync operations
  const forceSync = async () => {
    if (!navigator.onLine) return;
    await offlineStorage.forceSync();
    await syncWithSupabase();
  };

  const clearOfflineData = async () => {
    await offlineStorage.clearLocalData();
    loadAllData();
  };

  // Computed values
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.affectsBalance !== false)
    .filter(t => {
      const now = new Date();
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.affectsBalance !== false)
    .filter(t => {
      const now = new Date();
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Sync status
  const syncStatus = offlineStorage.getSyncStatus();

  const value: FinanceContextType = {
    // Data
    accounts,
    transactions,
    goals,
    liabilities,
    budgets,
    bills,
    billAccountLinks,
    billStagingHistory,
    billCompletionTracking,
    recurringTransactions,
    incomeSource,
    accountTransfers,
    userCategories,
    billReminders,
    debtPayments,
    transactionSplits,
    financialInsights,
    
    // Loading states
    loading,
    isOffline,
    syncStatus,
    
    // CRUD operations
    addAccount,
    updateAccount: async () => {}, // TODO: Implement
    deleteAccount: async () => {}, // TODO: Implement
    
    addTransaction,
    updateTransaction: async () => {}, // TODO: Implement
    deleteTransaction: async () => {}, // TODO: Implement
    
    addGoal,
    updateGoal: async () => {}, // TODO: Implement
    deleteGoal: async () => {}, // TODO: Implement
    deleteGoalSoft: async () => {}, // TODO: Implement
    
    addLiability: async () => {}, // TODO: Implement
    updateLiability: async () => {}, // TODO: Implement
    deleteLiability: async () => {}, // TODO: Implement
    
    addBudget: async () => {}, // TODO: Implement
    updateBudget: async () => {}, // TODO: Implement
    deleteBudget: async () => {}, // TODO: Implement
    
    addBill: async () => {}, // TODO: Implement
    updateBill: async () => {}, // TODO: Implement
    deleteBill: async () => {}, // TODO: Implement
    
    addUserCategory,
    updateUserCategory: async () => {}, // TODO: Implement
    deleteUserCategory: async () => {}, // TODO: Implement
    
    // Sync operations
    forceSync,
    clearOfflineData,
    
    // Computed values
    totalBalance,
    monthlyIncome,
    monthlyExpenses
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

// Helper functions to convert between database and app formats
const convertAccountFromDB = (dbAccount: any): FinancialAccount => ({
  id: dbAccount.id,
  userId: dbAccount.user_id,
  name: dbAccount.name,
  type: dbAccount.type,
  balance: Number(dbAccount.balance),
  currency: dbAccount.currency,
  description: dbAccount.description,
  isActive: dbAccount.is_active,
  createdAt: new Date(dbAccount.created_at),
  updatedAt: new Date(dbAccount.updated_at)
});

const convertAccountToDB = (account: FinancialAccount) => ({
  id: account.id,
  user_id: account.userId,
  name: account.name,
  type: account.type,
  balance: account.balance,
  currency: account.currency,
  description: account.description,
  is_active: account.isActive,
  created_at: account.createdAt.toISOString(),
  updated_at: account.updatedAt.toISOString()
});

const convertTransactionFromDB = (dbTransaction: any): Transaction => ({
  id: dbTransaction.id,
  userId: dbTransaction.user_id,
  type: dbTransaction.type,
  amount: Number(dbTransaction.amount),
  category: dbTransaction.category,
  description: dbTransaction.description,
  date: new Date(dbTransaction.date),
  accountId: dbTransaction.account_id,
  affectsBalance: dbTransaction.affects_balance,
  reason: dbTransaction.reason,
  transferToAccountId: dbTransaction.transfer_to_account_id,
  status: dbTransaction.status,
  createdAt: new Date(dbTransaction.created_at),
  updatedAt: new Date(dbTransaction.updated_at)
});

const convertTransactionToDB = (transaction: Transaction) => ({
  id: transaction.id,
  user_id: transaction.userId,
  type: transaction.type,
  amount: transaction.amount,
  category: transaction.category,
  description: transaction.description,
  date: transaction.date.toISOString().split('T')[0],
  account_id: transaction.accountId,
  affects_balance: transaction.affectsBalance,
  reason: transaction.reason,
  transfer_to_account_id: transaction.transferToAccountId,
  status: transaction.status,
  created_at: transaction.createdAt.toISOString(),
  updated_at: transaction.updatedAt.toISOString()
});

const convertGoalFromDB = (dbGoal: any): Goal => ({
  id: dbGoal.id,
  userId: dbGoal.user_id,
  title: dbGoal.title,
  description: dbGoal.description,
  targetAmount: Number(dbGoal.target_amount),
  currentAmount: Number(dbGoal.current_amount),
  targetDate: dbGoal.target_date ? new Date(dbGoal.target_date) : undefined,
  category: dbGoal.category,
  priority: dbGoal.priority,
  status: dbGoal.status,
  isActive: dbGoal.is_active,
  createdAt: new Date(dbGoal.created_at),
  updatedAt: new Date(dbGoal.updated_at)
});

const convertGoalToDB = (goal: Goal) => ({
  id: goal.id,
  user_id: goal.userId,
  title: goal.title,
  description: goal.description,
  target_amount: goal.targetAmount,
  current_amount: goal.currentAmount,
  target_date: goal.targetDate?.toISOString().split('T')[0] || null,
  category: goal.category,
  priority: goal.priority,
  status: goal.status,
  is_active: goal.isActive,
  created_at: goal.createdAt.toISOString(),
  updated_at: goal.updatedAt.toISOString()
});

const convertLiabilityFromDB = (dbLiability: any): EnhancedLiability => ({
  id: dbLiability.id,
  userId: dbLiability.user_id,
  name: dbLiability.name,
  type: dbLiability.type,
  totalAmount: Number(dbLiability.total_amount),
  remainingAmount: Number(dbLiability.remaining_amount),
  interestRate: Number(dbLiability.interest_rate),
  minimumPayment: Number(dbLiability.minimum_payment),
  dueDate: dbLiability.due_date ? new Date(dbLiability.due_date) : undefined,
  description: dbLiability.description,
  isActive: dbLiability.is_active,
  createdAt: new Date(dbLiability.created_at),
  updatedAt: new Date(dbLiability.updated_at)
});

const convertLiabilityToDB = (liability: EnhancedLiability) => ({
  id: liability.id,
  user_id: liability.userId,
  name: liability.name,
  type: liability.type,
  total_amount: liability.totalAmount,
  remaining_amount: liability.remainingAmount,
  interest_rate: liability.interestRate,
  minimum_payment: liability.minimumPayment,
  due_date: liability.dueDate?.toISOString().split('T')[0] || null,
  description: liability.description,
  is_active: liability.isActive,
  created_at: liability.createdAt.toISOString(),
  updated_at: liability.updatedAt.toISOString()
});

const convertBudgetFromDB = (dbBudget: any): Budget => ({
  id: dbBudget.id,
  userId: dbBudget.user_id,
  category: dbBudget.category,
  amount: Number(dbBudget.amount),
  spent: Number(dbBudget.spent),
  period: dbBudget.period,
  startDate: new Date(dbBudget.start_date),
  endDate: new Date(dbBudget.end_date),
  isActive: dbBudget.is_active,
  createdAt: new Date(dbBudget.created_at),
  updatedAt: new Date(dbBudget.updated_at)
});

const convertBudgetToDB = (budget: Budget) => ({
  id: budget.id,
  user_id: budget.userId,
  category: budget.category,
  amount: budget.amount,
  spent: budget.spent,
  period: budget.period,
  start_date: budget.startDate.toISOString().split('T')[0],
  end_date: budget.endDate.toISOString().split('T')[0],
  is_active: budget.isActive,
  created_at: budget.createdAt.toISOString(),
  updated_at: budget.updatedAt.toISOString()
});

const convertBillFromDB = (dbBill: any): Bill => ({
  id: dbBill.id,
  userId: dbBill.user_id,
  name: dbBill.name,
  amount: Number(dbBill.amount),
  dueDate: new Date(dbBill.due_date),
  frequency: dbBill.frequency,
  category: dbBill.category,
  description: dbBill.description,
  isActive: dbBill.is_active,
  createdAt: new Date(dbBill.created_at),
  updatedAt: new Date(dbBill.updated_at)
});

const convertBillToDB = (bill: Bill) => ({
  id: bill.id,
  user_id: bill.userId,
  name: bill.name,
  amount: bill.amount,
  due_date: bill.dueDate.toISOString().split('T')[0],
  frequency: bill.frequency,
  category: bill.category,
  description: bill.description,
  is_active: bill.isActive,
  created_at: bill.createdAt.toISOString(),
  updated_at: bill.updatedAt.toISOString()
});

const convertUserCategoryFromDB = (dbCategory: any): UserCategory => ({
  id: dbCategory.id,
  userId: dbCategory.user_id,
  name: dbCategory.name,
  type: dbCategory.type,
  color: dbCategory.color,
  icon: dbCategory.icon,
  isActive: dbCategory.is_active,
  createdAt: new Date(dbCategory.created_at),
  updatedAt: new Date(dbCategory.updated_at)
});

const convertUserCategoryToDB = (category: UserCategory) => ({
  id: category.id,
  user_id: category.userId,
  name: category.name,
  type: category.type,
  color: category.color,
  icon: category.icon,
  is_active: category.isActive,
  created_at: category.createdAt.toISOString(),
  updated_at: category.updatedAt.toISOString()
});

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export default FinanceContext;
