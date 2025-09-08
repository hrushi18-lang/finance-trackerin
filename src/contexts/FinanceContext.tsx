import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { queryCache, invalidateUserData } from '../lib/query-cache';
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
  
  // Data refresh
  refreshData: () => Promise<void>;
  
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
  
  // Enhanced liability management functions
  modifyLiability: (id: string, modificationData: any) => Promise<void>;
  addLiabilityAccountLink: (link: { liabilityId: string; accountId: string; paymentPercentage: number; isPrimary?: boolean }) => Promise<void>;
  removeLiabilityAccountLink: (liabilityId: string, accountId: string) => Promise<void>;
  getLiabilityAccountLinks: (liabilityId: string) => any[];
  extendLiabilityTerm: (id: string, newTermMonths: number, reason?: string) => Promise<void>;
  shortenLiabilityTerm: (id: string, newTermMonths: number, reason?: string) => Promise<void>;
  changeLiabilityAmount: (id: string, newAmount: number, reason?: string) => Promise<void>;
  changeLiabilityDates: (id: string, dateChanges: { startDate?: Date; dueDate?: Date; nextPaymentDate?: Date }, reason?: string) => Promise<void>;
  payLiabilityFromMultipleAccounts: (liabilityId: string, payments: { accountId: string; amount: number; percentage?: number }[]) => Promise<void>;
  
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  addBill: (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  
  // Enhanced bill management functions
  addBillAccountLink: (link: Omit<BillAccountLink, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeBillAccountLink: (billId: string, accountId: string) => Promise<void>;
  updateBillStage: (billId: string, stage: 'pending' | 'paid' | 'moved' | 'failed' | 'stopped', reason?: string, movedToDate?: Date) => Promise<void>;
  handleBillCompletion: (billId: string, action: 'continue' | 'extend' | 'archive' | 'delete', newAmount?: number, newDueDate?: Date, reason?: string) => Promise<void>;
  createVariableAmountBill: (billData: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { minAmount: number; maxAmount: number }) => Promise<void>;
  createIncomeBill: (billData: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  payBillFromMultipleAccounts: (billId: string, payments: { accountId: string; amount: number; percentage?: number }[]) => Promise<void>;
  getBillAccountLinks: (billId: string) => BillAccountLink[];
  getBillStagingHistory: (billId: string) => BillStagingHistory[];
  
  addRecurringTransaction: (rt: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  
  transferBetweenAccounts: (fromAccountId: string, toAccountId: string, amount: number, description: string) => Promise<void>;
  // System helpers
  getGoalsVaultAccount: () => FinancialAccount | undefined;
  ensureGoalsVaultAccount: () => Promise<void>;
  createGoalsVaultAccount: (name?: string, currencyCode?: string) => Promise<FinancialAccount>;
  cleanupDuplicateGoalsVaults: () => Promise<void>;
  
  // Goal completion and management
  handleGoalCompletion: (goalId: string) => Promise<any>;
  handleGoalWithdrawal: (goalId: string, amount: number, destinationAccountId: string, reason?: string, notes?: string) => Promise<any>;
  extendGoal: (goalId: string, newTargetAmount: number, reason?: string) => Promise<any>;
  customizeGoal: (goalId: string, newTargetAmount: number, newTitle?: string, newDescription?: string, reason?: string) => Promise<any>;
  archiveGoal: (goalId: string, reason?: string) => Promise<any>;
  // High-level flows
  fundGoalFromAccount: (fromAccountId: string, goalId: string, amount: number, description?: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, sourceAccountId?: string, description?: string) => Promise<void>;
  withdrawGoalToAccount: (toAccountId: string, goalId: string, amount: number, description?: string) => Promise<void>;
  payBillFromAccount: (accountId: string, billId: string, amount?: number, description?: string) => Promise<void>;
  repayLiabilityFromAccount: (accountId: string, liabilityId: string, amount: number, description?: string) => Promise<void>;
  markBillAsPaid: (billId: string, paidDate?: Date) => Promise<void>;
  payBillFlexible: (billId: string, paymentData: {
    amount: number;
    accountId: string;
    description?: string;
    paymentType: 'full' | 'partial' | 'extra' | 'skip';
    skipReason?: string;
  }) => Promise<void>;
  skipBillPayment: (billId: string, reason?: string) => Promise<void>;
  getBillPaymentHistory: (billId: string) => Promise<any[]>;
  markRecurringTransactionAsPaid: (recurringTransactionId: string, paidDate?: Date) => Promise<void>;
  
  // Analytics functions
  getMonthlyTrends: (months: number) => Array<{ month: string; income: number; expenses: number; net: number }>;
  getCategoryBreakdown: (transactions: Transaction[]) => Array<{ category: string; amount: number; percentage: number }>;
  getNetWorthTrends: (months: number) => Array<{ month: string; netWorth: number }>;
  getSpendingPatterns: (transactions: Transaction[]) => Array<{ category: string; amount: number; count: number }>;
  getIncomeAnalysis: (transactions: Transaction[]) => Array<{ source: string; amount: number; percentage: number }>;
  getBudgetPerformance: () => Array<{ budget: string; spent: number; limit: number; percentage: number }>;
  
  // Transaction filtering helpers
  getAccountTransactions: (accountId: string) => Transaction[];
  getGoalTransactions: (goalId: string) => Transaction[];
  getBillTransactions: (billId: string) => Transaction[];
  getLiabilityTransactions: (liabilityId: string) => Transaction[];
  
  // User Categories CRUD operations
  addUserCategory: (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserCategory: (id: string, updates: Partial<UserCategory>) => Promise<void>;
  deleteUserCategory: (id: string) => Promise<void>;
  getUserCategoriesByType: (type: 'income' | 'expense' | 'bill' | 'goal' | 'liability' | 'budget' | 'account') => UserCategory[];
  
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
    if (!user) {
      console.log('FinanceContext - No user, skipping data load');
      return;
    }
    
    console.log('FinanceContext - Starting data load...');
    setLoading(true);
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('FinanceContext - Data load timeout, forcing loading to false');
      setLoading(false);
    }, 30000); // 30 second timeout
    
    try {
      // Load critical data first in parallel for faster initial render
      console.log('FinanceContext - Loading critical data...');
      await Promise.all([
        loadAccounts(),
        loadTransactions(),
        loadGoals(),
        loadUserCategories()
      ]);

      // Load secondary data in parallel after critical data
      console.log('FinanceContext - Loading secondary data...');
      await Promise.all([
        loadLiabilities(),
        loadBudgets(),
        loadBills(),
        loadRecurringTransactions()
      ]);

      // Load additional data in parallel
      console.log('FinanceContext - Loading additional data...');
      await Promise.all([
        loadBillAccountLinks(),
        loadBillStagingHistory(),
        loadBillCompletionTracking(),
        loadIncomeSource(),
        loadAccountTransfers(),
        loadBillReminders(),
        loadDebtPayments(),
        loadTransactionSplits(),
        loadFinancialInsights(),
        loadCalendarEvents()
      ]);

      // Clean up any duplicate Goals Vault accounts
      console.log('FinanceContext - Cleaning up duplicate vaults...');
      await cleanupDuplicateGoalsVaults();
      
      console.log('FinanceContext - Data load completed successfully');
    } catch (error) {
      console.error('FinanceContext - Error loading data:', error);
      // Add more specific error handling
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      clearTimeout(timeoutId);
      console.log('FinanceContext - Setting loading to false');
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!user) return;
    console.log('FinanceContext - Refreshing all data...');
    await loadAllData();
  };

  // Add a flag to prevent multiple simultaneous vault creation attempts
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [vaultChecked, setVaultChecked] = useState(false);

  const ensureGoalsVaultAccount = async () => {
    if (!user) return;
    
    // Prevent multiple calls if already checked
    if (vaultChecked) return;
    
    // First check if Goals Vault already exists in current accounts
    const existing = accounts.find(a => a.type === 'goals_vault');
    if (existing) {
      setVaultChecked(true);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isCreatingVault) return;
    
    setIsCreatingVault(true);
    setVaultChecked(true);

    try {
      // Check if Goals Vault exists in database to avoid duplicates
      const { data: existingVault, error: checkError } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'goals_vault')
        .single();

      if (existingVault && !checkError) {
        // Goals Vault exists in database, add it to local state
        const vaultAccount: FinancialAccount = {
          id: existingVault.id,
          userId: existingVault.user_id,
          name: existingVault.name,
          type: existingVault.type,
          balance: Number(existingVault.balance),
          isVisible: existingVault.is_visible,
          currencyCode: existingVault.currencycode,
          institution: existingVault.institution,
          platform: existingVault.platform,
          accountNumber: existingVault.account_number,
          createdAt: new Date(existingVault.created_at),
          updatedAt: new Date(existingVault.updated_at)
        } as FinancialAccount;

        setAccounts(prev => {
          // Check if it's already in the list to avoid duplicates
          const alreadyExists = prev.find(a => a.id === vaultAccount.id);
          if (alreadyExists) return prev;
          return [vaultAccount, ...prev];
        });
        return;
      }

      // Only create if it doesn't exist in database
      if (checkError && checkError.code === 'PGRST116') {
        // Use user's selected currency from onboarding/internationalization
        const savedCurrency = typeof window !== 'undefined' ? localStorage.getItem('finspire_currency') : null;
        const defaultCurrency = accounts[0]?.currencyCode || savedCurrency || 'USD';

        const { data, error } = await supabase
          .from('financial_accounts')
          .insert({
            user_id: user.id,
            name: 'Goals Vault',
            type: 'goals_vault',
            balance: 0,
            is_visible: true,
            currencycode: defaultCurrency
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
          currencyCode: data.currencycode,
          institution: data.institution,
          platform: data.platform,
          accountNumber: data.account_number,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        } as FinancialAccount;

        setAccounts(prev => {
          // Check if it's already in the list to avoid duplicates
          const alreadyExists = prev.find(a => a.id === newAccount.id);
          if (alreadyExists) return prev;
          return [newAccount, ...prev];
        });
      }
    } finally {
      setIsCreatingVault(false);
    }
  };

  const getGoalsVaultAccount = () => accounts.find(a => a.type === 'goals_vault');

  const createGoalsVaultAccount = async (name: string = 'Goals Vault', currencyCode: string = 'USD') => {
    if (!user) throw new Error('User not authenticated');
    
    // Check if Goals Vault already exists
    const existing = accounts.find(a => a.type === 'goals_vault');
    if (existing) {
      throw new Error('Goals Vault already exists');
    }

    // Check database for existing Goals Vault
    const { data: existingVault, error: checkError } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'goals_vault')
      .single();

    if (existingVault && !checkError) {
      // Goals Vault exists in database, add it to local state
      const vaultAccount: FinancialAccount = {
        id: existingVault.id,
        userId: existingVault.user_id,
        name: existingVault.name,
        type: existingVault.type,
        balance: Number(existingVault.balance),
        isVisible: existingVault.is_visible,
        currencyCode: existingVault.currencycode,
        institution: existingVault.institution,
        platform: existingVault.platform,
        accountNumber: existingVault.account_number,
        createdAt: new Date(existingVault.created_at),
        updatedAt: new Date(existingVault.updated_at)
      } as FinancialAccount;

      setAccounts(prev => {
        const alreadyExists = prev.find(a => a.id === vaultAccount.id);
        if (alreadyExists) return prev;
        return [vaultAccount, ...prev];
      });
      return vaultAccount;
    }

    const { data, error } = await supabase
      .from('financial_accounts')
      .insert({
        user_id: user.id,
        name: name,
        type: 'goals_vault',
        balance: 0,
        is_visible: true,
        currencycode: currencyCode
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create Goals Vault account:', error);
      throw error;
    }

    const newAccount: FinancialAccount = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      balance: Number(data.balance),
      isVisible: data.is_visible,
      currencyCode: data.currencycode,
      institution: data.institution,
      platform: data.platform,
      accountNumber: data.account_number,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    } as FinancialAccount;

    setAccounts(prev => [newAccount, ...prev]);
    return newAccount;
  };

  const cleanupDuplicateGoalsVaults = async () => {
    if (!user) return;

    try {
      // Get all Goals Vault accounts from database
      const { data: vaults, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'goals_vault')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching Goals Vault accounts:', error);
        return;
      }

      if (vaults && vaults.length > 1) {
        console.log(`Found ${vaults.length} Goals Vault accounts, cleaning up...`);
        
        // Keep the first one (oldest), delete the rest
        const vaultsToDelete = vaults.slice(1);
        
        for (const vault of vaultsToDelete) {
          const { error: deleteError } = await supabase
            .from('financial_accounts')
            .delete()
            .eq('id', vault.id);

          if (deleteError) {
            console.error(`Error deleting duplicate vault ${vault.id}:`, deleteError);
          } else {
            console.log(`Deleted duplicate Goals Vault: ${vault.name} (${vault.id})`);
          }
        }

        // Update local state to reflect changes
        setAccounts(prev => prev.filter(account => 
          !vaultsToDelete.some(vault => vault.id === account.id)
        ));
      }
    } catch (error) {
      console.error('Error cleaning up duplicate Goals Vault accounts:', error);
    }
  };

  const fundGoalFromAccount = async (fromAccountId: string, goalId: string, amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
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

  const contributeToGoal = async (goalId: string, amount: number, sourceAccountId?: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');

    // If no source account specified, use Goals Vault
    if (!sourceAccountId) {
      const vault = getGoalsVaultAccount();
      if (!vault) throw new Error('Goals Vault not available. Please create one first.');
      sourceAccountId = vault.id;
    }

    // Create transaction for the contribution
    const transaction = {
      type: 'expense' as const,
      amount: amount,
      category: 'Savings',
      description: description || `Contribution to ${goal.title}`,
      date: new Date(),
      userId: user.id,
      accountId: sourceAccountId,
      affectsBalance: true,
      status: 'completed' as const
    };

    await addTransaction(transaction);

    // Update goal current amount
    const newAmount = Math.min(Number(goal.currentAmount || 0) + Number(amount || 0), Number(goal.targetAmount || 0));
    await updateGoal(goalId, { currentAmount: newAmount });

    // If goal is linked to Goals Vault, transfer funds there
    if (goal.accountId) {
      const vault = getGoalsVaultAccount();
      if (vault && sourceAccountId !== vault.id) {
        await transferBetweenAccounts(sourceAccountId, vault.id, amount, `Goal: ${goal.title}`);
      }
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

    // If this bill is linked to a liability (EMI), update the liability
    if (bill.linkedLiabilityId) {
      const liability = liabilities.find(l => l.id === bill.linkedLiabilityId);
      if (liability) {
        const paymentAmount = Number(bill.amount) || 0;
        const currentRemaining = Number(liability.remainingAmount) || 0;
        const newRemaining = Math.max(0, currentRemaining - paymentAmount);
        
        await updateLiability(bill.linkedLiabilityId, {
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'paid_off' : liability.status
        });
      }
    }

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

  // Enhanced flexible bill payment system
  const payBillFlexible = async (
    billId: string, 
    paymentData: {
      amount: number;
      accountId: string;
      description?: string;
      paymentType: 'full' | 'partial' | 'extra' | 'skip';
      skipReason?: string;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    const paymentDate = new Date();
    const billAmount = Number(bill.amount) || 0;
    const paymentAmount = Number(paymentData.amount) || 0;

    // Handle skip payment
    if (paymentData.paymentType === 'skip') {
      await skipBillPayment(billId, paymentData.skipReason || 'Skipped by user');
      return;
    }

    // Create transaction for the payment
    if (paymentAmount > 0) {
      await addTransaction({
        type: 'expense',
        amount: paymentAmount,
        category: bill.category || 'Bills',
        description: paymentData.description || `Bill Payment: ${bill.title}`,
        date: paymentDate,
        accountId: paymentData.accountId,
        affectsBalance: true,
        status: 'completed'
      });
    }

    // Create bill instance record
    const billInstance = {
      bill_id: billId,
      user_id: user.id,
      due_date: bill.nextDueDate,
      amount: billAmount,
      actual_amount: paymentAmount,
      status: 'paid', // All payments are marked as 'paid' in bill_instances
      payment_method: 'manual',
      paid_date: paymentDate,
      paid_from_account_id: paymentData.accountId,
      failure_reason: paymentData.paymentType === 'partial' ? 'Partial payment made' : undefined
    };

    // Insert bill instance
    const { error: instanceError } = await supabase
      .from('bill_instances')
      .insert(billInstance);

    if (instanceError) {
      console.error('Error creating bill instance:', instanceError);
    }

    // Update bill based on payment type
    let nextDueDate = new Date(bill.nextDueDate);
    let billStatus = bill.status;

    switch (paymentData.paymentType) {
      case 'full':
        // Full payment - advance to next due date
        nextDueDate.setDate(nextDueDate.getDate() + (bill.frequency === 'weekly' ? 7 : bill.frequency === 'bi_weekly' ? 14 : bill.frequency === 'monthly' ? 30 : bill.frequency === 'quarterly' ? 90 : bill.frequency === 'semi_annual' ? 180 : bill.frequency === 'annual' ? 365 : 30));
        break;
      
      case 'partial':
        // Partial payment - keep same due date but mark as partially paid
        billStatus = 'active'; // Keep active for next payment
        break;
      
      case 'extra':
        // Extra payment - advance to next due date
        nextDueDate.setDate(nextDueDate.getDate() + (bill.frequency === 'weekly' ? 7 : bill.frequency === 'bi_weekly' ? 14 : bill.frequency === 'monthly' ? 30 : bill.frequency === 'quarterly' ? 90 : bill.frequency === 'semi_annual' ? 180 : bill.frequency === 'annual' ? 365 : 30));
        break;
    }

    // Update bill
    await updateBill(billId, {
      lastPaidDate: paymentDate,
      nextDueDate: nextDueDate,
      status: billStatus
    });

    // If this bill is linked to a liability (EMI), update the liability
    if (bill.linkedLiabilityId) {
      const liability = liabilities.find(l => l.id === bill.linkedLiabilityId);
      if (liability) {
        const currentRemaining = Number(liability.remainingAmount) || 0;
        const newRemaining = Math.max(0, currentRemaining - paymentAmount);
        
        await updateLiability(bill.linkedLiabilityId, {
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'paid_off' : liability.status
        });
      }
    }

    // Update recurring transaction if it exists
    const recurringBill = recurringTransactions.find(rt => rt.description === bill.title && rt.type === 'expense');
    if (recurringBill) {
      await updateRecurringTransaction(recurringBill.id, {
        isPaid: paymentData.paymentType === 'full' || paymentData.paymentType === 'extra',
        paidDate: paymentDate,
        nextDueDate: nextDueDate
      });
    }
  };

  // Skip bill payment
  const skipBillPayment = async (billId: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    const skipDate = new Date();

    // Create bill instance record for skipped payment
    const billInstance = {
      bill_id: billId,
      user_id: user.id,
      due_date: bill.nextDueDate,
      amount: bill.amount,
      actual_amount: 0,
      status: 'skipped',
      payment_method: 'manual',
      paid_date: skipDate,
      failure_reason: reason || 'Skipped by user'
    };

    // Insert bill instance
    const { error: instanceError } = await supabase
      .from('bill_instances')
      .insert(billInstance);

    if (instanceError) {
      console.error('Error creating bill instance:', instanceError);
    }

    // Update bill - advance to next due date
    const nextDueDate = new Date(bill.nextDueDate);
    nextDueDate.setDate(nextDueDate.getDate() + (bill.frequency === 'weekly' ? 7 : bill.frequency === 'bi_weekly' ? 14 : bill.frequency === 'monthly' ? 30 : bill.frequency === 'quarterly' ? 90 : bill.frequency === 'semi_annual' ? 180 : bill.frequency === 'annual' ? 365 : 30));

    await updateBill(billId, {
      nextDueDate: nextDueDate,
      status: 'active' // Keep active for next payment
    });
  };

  // Get bill payment history
  const getBillPaymentHistory = async (billId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('bill_instances')
      .select('*')
      .eq('bill_id', billId)
      .eq('user_id', user.id)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('Error fetching bill payment history:', error);
      return [];
    }

    return data || [];
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
    
    // Check cache first
    const cacheKey = queryCache.generateKey('financial_accounts', { user_id: user.id, is_visible: true });
    const cachedData = queryCache.get<FinancialAccount[]>(cacheKey);
    if (cachedData) {
      setAccounts(cachedData);
      return;
    }
    
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_visible', true) // Only load visible accounts for better performance
      .order('created_at', { ascending: false })
      .limit(100); // Limit to prevent large data loads

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
      currencyCode: account.currencycode,
      createdAt: new Date(account.created_at),
      updatedAt: new Date(account.updated_at),
      
      // Enhanced fields
      routingNumber: account.routing_number,
      cardLastFour: account.card_last_four,
      cardType: account.card_type,
      spendingLimit: account.spending_limit ? Number(account.spending_limit) : undefined,
      monthlyLimit: account.monthly_limit ? Number(account.monthly_limit) : undefined,
      dailyLimit: account.daily_limit ? Number(account.daily_limit) : undefined,
      isPrimary: account.is_primary,
      notes: account.notes,
      accountTypeCustom: account.account_type_custom,
      isLiability: account.is_liability,
      outstandingBalance: account.outstanding_balance ? Number(account.outstanding_balance) : undefined,
      creditLimit: account.credit_limit ? Number(account.credit_limit) : undefined,
      minimumDue: account.minimum_due ? Number(account.minimum_due) : undefined,
      dueDate: account.due_date ? new Date(account.due_date) : undefined,
      interestRate: account.interest_rate ? Number(account.interest_rate) : undefined,
      isBalanceHidden: account.is_balance_hidden,
      linkedBankAccountId: account.linked_bank_account_id,
      autoSync: account.auto_sync,
      lastSyncedAt: account.last_synced_at ? new Date(account.last_synced_at) : undefined,
      exchangeRate: account.exchange_rate ? Number(account.exchange_rate) : undefined,
      homeCurrency: account.home_currency,
      currency: account.currency,
      subtypeId: account.subtype_id,
      status: account.status,
      accountNumberMasked: account.account_number_masked,
      lastActivityDate: account.last_activity_date ? new Date(account.last_activity_date) : undefined,
      accountHolderName: account.account_holder_name,
      jointAccount: account.joint_account,
      accountAgeDays: account.account_age_days,
      riskLevel: account.risk_level,
      interestEarnedYtd: account.interest_earned_ytd ? Number(account.interest_earned_ytd) : undefined,
      feesPaidYtd: account.fees_paid_ytd ? Number(account.fees_paid_ytd) : undefined,
      averageMonthlyBalance: account.average_monthly_balance ? Number(account.average_monthly_balance) : undefined,
      accountHealthScore: account.account_health_score ? Number(account.account_health_score) : undefined,
      autoCategorize: account.auto_categorize,
      requireApproval: account.require_approval,
      maxDailyTransactions: account.max_daily_transactions,
      maxDailyAmount: account.max_daily_amount ? Number(account.max_daily_amount) : undefined,
      twoFactorEnabled: account.two_factor_enabled,
      biometricEnabled: account.biometric_enabled,
      accountNotes: account.account_notes,
      externalAccountId: account.external_account_id,
      institutionLogoUrl: account.institution_logo_url,
      accountColor: account.account_color,
      sortOrder: account.sort_order
    }));

    setAccounts(mappedAccounts);
    
    // Cache the results for 5 minutes
    queryCache.set(cacheKey, mappedAccounts, 5 * 60 * 1000);
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    // Load only recent transactions for better performance
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(500); // Limit to recent 500 transactions

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
      accountId: goal.account_id,
      goalType: goal.goal_type || 'general_savings',
      targetCategory: goal.target_category,
      periodType: goal.period_type || 'monthly',
      customPeriodDays: goal.custom_period_days,
      isRecurring: goal.is_recurring || false,
      recurringFrequency: goal.recurring_frequency,
      priority: goal.priority || 'medium',
      status: goal.status || 'active',
      createdAt: new Date(goal.created_at),
      updatedAt: new Date(goal.updated_at),
      // Activity scope and account linking
      activityScope: goal.activity_scope || 'general',
      linkedAccountsCount: goal.linked_accounts_count || 0,
      // New completion and management fields
      completionDate: goal.completion_date ? new Date(goal.completion_date) : undefined,
      withdrawalDate: goal.withdrawal_date ? new Date(goal.withdrawal_date) : undefined,
      withdrawalAmount: Number(goal.withdrawal_amount || 0),
      isWithdrawn: goal.is_withdrawn || false,
      completionAction: goal.completion_action || 'waiting',
      originalTargetAmount: goal.original_target_amount ? Number(goal.original_target_amount) : undefined,
      extendedTargetAmount: goal.extended_target_amount ? Number(goal.extended_target_amount) : undefined,
      completionNotes: goal.completion_notes
    }));

    setGoals(mappedGoals);
  };

  const loadLiabilities = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading liabilities:', error);
      return;
    }

    // Load account links for each liability
    const liabilitiesWithAccounts = await Promise.all((data || []).map(async (liability) => {
      const { data: accountLinks } = await supabase
        .from('activity_account_links')
        .select('account_id, is_primary')
        .eq('activity_type', 'liability')
        .eq('activity_id', liability.id)
        .eq('user_id', user.id);

      const accountIds = accountLinks?.map(link => link.account_id) || [];
      const targetCategory = liability.target_category;

      return {
        id: liability.id,
        userId: liability.user_id,
        name: liability.name,
        liabilityType: liability.liability_type,
        description: liability.description,
        liabilityStatus: liability.liability_status || 'existing',
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
        sendReminders: liability.send_reminders ?? true,
        reminderDays: liability.reminder_days ?? 7,
        paymentStrategy: liability.payment_strategy || 'equal',
        paymentAccounts: liability.payment_accounts || [],
        paymentPercentages: liability.payment_percentages || [],
        originalAmount: liability.original_amount,
        originalTermMonths: liability.original_term_months,
        originalStartDate: liability.original_start_date ? new Date(liability.original_start_date) : undefined,
        modificationCount: liability.modification_count || 0,
        lastModifiedDate: liability.last_modified_date ? new Date(liability.last_modified_date) : undefined,
        modificationReason: liability.modification_reason,
        typeSpecificData: liability.type_specific_data || {},
        currencyCode: liability.currency_code || 'USD',
        activityScope: liability.activity_scope || 'general',
        accountIds: accountIds,
        targetCategory: targetCategory,
        priority: liability.priority || 'medium',
        createdAt: new Date(liability.created_at),
        updatedAt: new Date(liability.updated_at)
      };
    }));

    setLiabilities(liabilitiesWithAccounts);
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
      billCategory: bill.bill_category || 'general_expense',
      targetCategory: bill.target_category,
      isRecurring: bill.is_recurring || false,
      paymentMethod: bill.payment_method,
      notes: bill.notes,
      priority: bill.priority || 'medium',
      status: bill.status || 'active',
      activityScope: bill.activity_scope || 'general',
      accountIds: [], // Will be loaded separately from activity_account_links
      linkedAccountsCount: bill.linked_accounts_count || 0,
      // New fields
      currencyCode: bill.currency_code || 'USD',
      isIncome: bill.is_income || false,
      billStage: bill.bill_stage || 'pending',
      movedToDate: bill.moved_to_date ? new Date(bill.moved_to_date) : undefined,
      stageReason: bill.stage_reason,
      isVariableAmount: bill.is_variable_amount || false,
      minAmount: bill.min_amount ? Number(bill.min_amount) : undefined,
      maxAmount: bill.max_amount ? Number(bill.max_amount) : undefined,
      completionAction: bill.completion_action || 'continue',
      completionDate: bill.completion_date ? new Date(bill.completion_date) : undefined,
      completionNotes: bill.completion_notes,
      originalAmount: bill.original_amount ? Number(bill.original_amount) : undefined,
      extendedAmount: bill.extended_amount ? Number(bill.extended_amount) : undefined,
      isArchived: bill.is_archived || false,
      archivedDate: bill.archived_date ? new Date(bill.archived_date) : undefined,
      archivedReason: bill.archived_reason,
      createdAt: new Date(bill.created_at),
      updatedAt: new Date(bill.updated_at)
    }));

    setBills(mappedBills);
  };

  const loadBillAccountLinks = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bill_account_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bill account links:', error);
      return;
    }

    const mappedLinks: BillAccountLink[] = (data || []).map(link => ({
      id: link.id,
      billId: link.bill_id,
      accountId: link.account_id,
      userId: link.user_id,
      isPrimary: link.is_primary,
      paymentPercentage: Number(link.payment_percentage),
      createdAt: new Date(link.created_at),
      updatedAt: new Date(link.updated_at)
    }));

    setBillAccountLinks(mappedLinks);
  };

  const loadBillStagingHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bill_staging_history')
      .select('*')
      .eq('user_id', user.id)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error loading bill staging history:', error);
      return;
    }

    const mappedHistory: BillStagingHistory[] = (data || []).map(history => ({
      id: history.id,
      billId: history.bill_id,
      userId: history.user_id,
      fromStage: history.from_stage,
      toStage: history.to_stage,
      stageReason: history.stage_reason,
      changedBy: history.changed_by,
      changedAt: new Date(history.changed_at),
      metadata: history.metadata
    }));

    setBillStagingHistory(mappedHistory);
  };

  const loadBillCompletionTracking = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bill_completion_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('completion_date', { ascending: false });

    if (error) {
      console.error('Error loading bill completion tracking:', error);
      return;
    }

    const mappedTracking: BillCompletionTracking[] = (data || []).map(tracking => ({
      id: tracking.id,
      billId: tracking.bill_id,
      userId: tracking.user_id,
      completionType: tracking.completion_type,
      completionDate: new Date(tracking.completion_date),
      completionReason: tracking.completion_reason,
      newAmount: tracking.new_amount ? Number(tracking.new_amount) : undefined,
      newDueDate: tracking.new_due_date ? new Date(tracking.new_due_date) : undefined,
      metadata: tracking.metadata
    }));

    setBillCompletionTracking(mappedTracking);
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

  const loadCalendarEvents = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error loading calendar events:', error);
      return;
    }

    // Calendar events are handled by the calendar component
    // This method is here for consistency and future use
    console.log('Calendar events loaded:', data?.length || 0);
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
        currencycode: accountData.currencyCode,
        
        // Enhanced fields
        routing_number: accountData.routingNumber,
        card_last_four: accountData.cardLastFour,
        card_type: accountData.cardType,
        spending_limit: accountData.spendingLimit,
        monthly_limit: accountData.monthlyLimit,
        daily_limit: accountData.dailyLimit,
        is_primary: accountData.isPrimary,
        notes: accountData.notes,
        account_type_custom: accountData.accountTypeCustom,
        is_liability: accountData.isLiability,
        outstanding_balance: accountData.outstandingBalance,
        credit_limit: accountData.creditLimit,
        minimum_due: accountData.minimumDue,
        due_date: accountData.dueDate?.toISOString().split('T')[0],
        interest_rate: accountData.interestRate,
        is_balance_hidden: accountData.isBalanceHidden,
        linked_bank_account_id: accountData.linkedBankAccountId,
        auto_sync: accountData.autoSync,
        last_synced_at: accountData.lastSyncedAt?.toISOString(),
        exchange_rate: accountData.exchangeRate,
        home_currency: accountData.homeCurrency,
        currency: accountData.currency,
        subtype_id: accountData.subtypeId,
        status: accountData.status,
        account_number_masked: accountData.accountNumberMasked,
        last_activity_date: accountData.lastActivityDate?.toISOString().split('T')[0],
        account_holder_name: accountData.accountHolderName,
        joint_account: accountData.jointAccount,
        account_age_days: accountData.accountAgeDays,
        risk_level: accountData.riskLevel,
        interest_earned_ytd: accountData.interestEarnedYtd,
        fees_paid_ytd: accountData.feesPaidYtd,
        average_monthly_balance: accountData.averageMonthlyBalance,
        account_health_score: accountData.accountHealthScore,
        auto_categorize: accountData.autoCategorize,
        require_approval: accountData.requireApproval,
        max_daily_transactions: accountData.maxDailyTransactions,
        max_daily_amount: accountData.maxDailyAmount,
        two_factor_enabled: accountData.twoFactorEnabled,
        biometric_enabled: accountData.biometricEnabled,
        account_notes: accountData.accountNotes,
        external_account_id: accountData.externalAccountId,
        institution_logo_url: accountData.institutionLogoUrl,
        account_color: accountData.accountColor,
        sort_order: accountData.sortOrder
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
      currencyCode: data.currencycode,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      
      // Enhanced fields
      routingNumber: data.routing_number,
      cardLastFour: data.card_last_four,
      cardType: data.card_type,
      spendingLimit: data.spending_limit ? Number(data.spending_limit) : undefined,
      monthlyLimit: data.monthly_limit ? Number(data.monthly_limit) : undefined,
      dailyLimit: data.daily_limit ? Number(data.daily_limit) : undefined,
      isPrimary: data.is_primary,
      notes: data.notes,
      accountTypeCustom: data.account_type_custom,
      isLiability: data.is_liability,
      outstandingBalance: data.outstanding_balance ? Number(data.outstanding_balance) : undefined,
      creditLimit: data.credit_limit ? Number(data.credit_limit) : undefined,
      minimumDue: data.minimum_due ? Number(data.minimum_due) : undefined,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      interestRate: data.interest_rate ? Number(data.interest_rate) : undefined,
      isBalanceHidden: data.is_balance_hidden,
      linkedBankAccountId: data.linked_bank_account_id,
      autoSync: data.auto_sync,
      lastSyncedAt: data.last_synced_at ? new Date(data.last_synced_at) : undefined,
      exchangeRate: data.exchange_rate ? Number(data.exchange_rate) : undefined,
      homeCurrency: data.home_currency,
      currency: data.currency,
      subtypeId: data.subtype_id,
      status: data.status,
      accountNumberMasked: data.account_number_masked,
      lastActivityDate: data.last_activity_date ? new Date(data.last_activity_date) : undefined,
      accountHolderName: data.account_holder_name,
      jointAccount: data.joint_account,
      accountAgeDays: data.account_age_days,
      riskLevel: data.risk_level,
      interestEarnedYtd: data.interest_earned_ytd ? Number(data.interest_earned_ytd) : undefined,
      feesPaidYtd: data.fees_paid_ytd ? Number(data.fees_paid_ytd) : undefined,
      averageMonthlyBalance: data.average_monthly_balance ? Number(data.average_monthly_balance) : undefined,
      accountHealthScore: data.account_health_score ? Number(data.account_health_score) : undefined,
      autoCategorize: data.auto_categorize,
      requireApproval: data.require_approval,
      maxDailyTransactions: data.max_daily_transactions,
      maxDailyAmount: data.max_daily_amount ? Number(data.max_daily_amount) : undefined,
      twoFactorEnabled: data.two_factor_enabled,
      biometricEnabled: data.biometric_enabled,
      accountNotes: data.account_notes,
      externalAccountId: data.external_account_id,
      institutionLogoUrl: data.institution_logo_url,
      accountColor: data.account_color,
      sortOrder: data.sort_order
    };

    setAccounts(prev => [newAccount, ...prev]);
    
    // Invalidate cache for accounts
    invalidateUserData(user.id);
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
        currencycode: updates.currencyCode
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...updates } : account
    ));
    
    // Invalidate cache for accounts
    invalidateUserData(user.id);
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
    
    // Invalidate cache for accounts
    invalidateUserData(user.id);
  };

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
        // Allow negative balances for credit cards and investment accounts
        if (account.type !== 'credit_card' && account.type !== 'investment') {
          if (account.balance < transactionData.amount) {
            throw new Error(`Insufficient funds. Account balance (${account.balance.toFixed(2)}) is less than transaction amount (${transactionData.amount.toFixed(2)})`);
          }
        }
      }
    }

    // Ensure date is properly formatted
    const dateString = transactionData.date instanceof Date 
      ? transactionData.date.toISOString().split('T')[0]
      : new Date(transactionData.date).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase transaction insert error:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

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
        category: goalData.category,
        // Add all missing fields
        account_id: goalData.accountId,
        goal_type: goalData.goalType,
        target_category: goalData.targetCategory,
        period_type: goalData.periodType,
        custom_period_days: goalData.customPeriodDays,
        is_recurring: goalData.isRecurring,
        recurring_frequency: goalData.recurringFrequency,
        priority: goalData.priority,
        status: goalData.status,
        activity_scope: goalData.activityScope || 'general',
        linked_accounts_count: goalData.linkedAccountsCount || 0
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
      accountId: data.account_id,
      goalType: data.goal_type || 'general_savings',
      targetCategory: data.target_category,
      periodType: data.period_type || 'monthly',
      customPeriodDays: data.custom_period_days,
      isRecurring: data.is_recurring || false,
      recurringFrequency: data.recurring_frequency,
      priority: data.priority || 'medium',
      status: data.status || 'active',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      // Add completion and management fields
      completionDate: data.completion_date ? new Date(data.completion_date) : undefined,
      withdrawalDate: data.withdrawal_date ? new Date(data.withdrawal_date) : undefined,
      withdrawalAmount: Number(data.withdrawal_amount || 0),
      isWithdrawn: data.is_withdrawn || false,
      completionAction: data.completion_action || 'waiting',
      originalTargetAmount: data.original_target_amount ? Number(data.original_target_amount) : undefined,
      extendedTargetAmount: data.extended_target_amount ? Number(data.extended_target_amount) : undefined,
      completionNotes: data.completion_notes
    };

    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    
    // Map all possible fields to database columns
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount;
    if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate.toISOString().split('T')[0];
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.accountId !== undefined) updateData.account_id = updates.accountId;
    if (updates.goalType !== undefined) updateData.goal_type = updates.goalType;
    if (updates.targetCategory !== undefined) updateData.target_category = updates.targetCategory;
    if (updates.periodType !== undefined) updateData.period_type = updates.periodType;
    if (updates.customPeriodDays !== undefined) updateData.custom_period_days = updates.customPeriodDays;
    if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
    if (updates.recurringFrequency !== undefined) updateData.recurring_frequency = updates.recurringFrequency;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.activityScope !== undefined) updateData.activity_scope = updates.activityScope;
    if (updates.linkedAccountsCount !== undefined) updateData.linked_accounts_count = updates.linkedAccountsCount;
    
    // Completion and management fields
    if (updates.completionDate !== undefined) updateData.completion_date = updates.completionDate?.toISOString();
    if (updates.withdrawalDate !== undefined) updateData.withdrawal_date = updates.withdrawalDate?.toISOString();
    if (updates.withdrawalAmount !== undefined) updateData.withdrawal_amount = updates.withdrawalAmount;
    if (updates.isWithdrawn !== undefined) updateData.is_withdrawn = updates.isWithdrawn;
    if (updates.completionAction !== undefined) updateData.completion_action = updates.completionAction;
    if (updates.originalTargetAmount !== undefined) updateData.original_target_amount = updates.originalTargetAmount;
    if (updates.extendedTargetAmount !== undefined) updateData.extended_target_amount = updates.extendedTargetAmount;
    if (updates.completionNotes !== undefined) updateData.completion_notes = updates.completionNotes;

    const { error } = await supabase
      .from('goals')
      .update(updateData)
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

  // Goal completion and management functions
  const handleGoalCompletion = async (goalId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase.rpc('handle_goal_completion', {
      p_goal_id: goalId
    });

    if (error) {
      console.error('Error handling goal completion:', error);
      throw error;
    }

    // Reload goals to get updated status
    await loadGoals();
    return data;
  };

  const handleGoalWithdrawal = async (goalId: string, amount: number, destinationAccountId: string, reason?: string, notes?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase.rpc('handle_goal_withdrawal', {
      p_goal_id: goalId,
      p_withdrawal_amount: amount,
      p_destination_account_id: destinationAccountId,
      p_withdrawal_reason: reason,
      p_notes: notes
    });

    if (error) {
      console.error('Error handling goal withdrawal:', error);
      throw error;
    }

    // Reload goals and accounts to get updated balances
    await Promise.all([loadGoals(), loadAccounts()]);
    return data;
  };

  const extendGoal = async (goalId: string, newTargetAmount: number, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase.rpc('extend_goal', {
      p_goal_id: goalId,
      p_new_target_amount: newTargetAmount,
      p_extension_reason: reason
    });

    if (error) {
      console.error('Error extending goal:', error);
      throw error;
    }

    // Reload goals to get updated target amount
    await loadGoals();
    return data;
  };

  const customizeGoal = async (goalId: string, newTargetAmount: number, newTitle?: string, newDescription?: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase.rpc('customize_goal', {
      p_goal_id: goalId,
      p_new_target_amount: newTargetAmount,
      p_new_title: newTitle,
      p_new_description: newDescription,
      p_customization_reason: reason
    });

    if (error) {
      console.error('Error customizing goal:', error);
      throw error;
    }

    // Reload goals to get updated details
    await loadGoals();
    return data;
  };

  const archiveGoal = async (goalId: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase.rpc('archive_goal', {
      p_goal_id: goalId,
      p_archive_reason: reason
    });

    if (error) {
      console.error('Error archiving goal:', error);
      throw error;
    }

    // Reload goals to get updated status
    await loadGoals();
    return data;
  };

  const deleteGoalSoft = async (goalId: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase.rpc('delete_goal', {
      p_goal_id: goalId,
      p_delete_reason: reason
    });

    if (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }

    // Reload goals to get updated status
    await loadGoals();
    return data;
  };

  const addLiability = async (liabilityData: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('liabilities')
      .insert({
        user_id: user.id,
        name: liabilityData.name,
        liability_type: liabilityData.liabilityType,
        description: liabilityData.description,
        liability_status: liabilityData.liabilityStatus || 'new',
        total_amount: liabilityData.totalAmount,
        remaining_amount: liabilityData.remainingAmount,
        interest_rate: liabilityData.interestRate,
        monthly_payment: liabilityData.monthlyPayment,
        minimum_payment: liabilityData.minimumPayment,
        payment_day: liabilityData.paymentDay,
        loan_term_months: liabilityData.loanTermMonths,
        remaining_term_months: liabilityData.remainingTermMonths,
        start_date: liabilityData.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
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
        bill_generation_day: liabilityData.billGenerationDay,
        send_reminders: liabilityData.sendReminders ?? true,
        reminder_days: liabilityData.reminderDays ?? 7,
        payment_strategy: liabilityData.paymentStrategy || 'equal',
        payment_accounts: liabilityData.paymentAccounts || [],
        payment_percentages: liabilityData.paymentPercentages || [],
        original_amount: liabilityData.originalAmount,
        original_term_months: liabilityData.originalTermMonths,
        original_start_date: liabilityData.originalStartDate?.toISOString().split('T')[0],
        modification_count: liabilityData.modificationCount || 0,
        last_modified_date: liabilityData.lastModifiedDate?.toISOString(),
        modification_reason: liabilityData.modificationReason,
        type_specific_data: liabilityData.typeSpecificData || {},
        currency_code: liabilityData.currencyCode || 'USD',
        activity_scope: liabilityData.activityScope || 'general',
        target_category: liabilityData.targetCategory,
        priority: liabilityData.priority || 'medium'
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
      liabilityStatus: data.liability_status || 'new',
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
      sendReminders: data.send_reminders ?? true,
      reminderDays: data.reminder_days ?? 7,
      paymentStrategy: data.payment_strategy || 'equal',
      paymentAccounts: data.payment_accounts || [],
      paymentPercentages: data.payment_percentages || [],
      originalAmount: data.original_amount,
      originalTermMonths: data.original_term_months,
      originalStartDate: data.original_start_date ? new Date(data.original_start_date) : undefined,
      modificationCount: data.modification_count || 0,
      lastModifiedDate: data.last_modified_date ? new Date(data.last_modified_date) : undefined,
      modificationReason: data.modification_reason,
      typeSpecificData: data.type_specific_data || {},
      currencyCode: data.currency_code || 'USD',
      activityScope: liabilityData.activityScope || 'general',
      accountIds: liabilityData.accountIds || [],
      targetCategory: liabilityData.targetCategory,
      priority: liabilityData.priority || 'medium',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setLiabilities(prev => [newLiability, ...prev]);

    // Create activity account links if account-specific
    if (liabilityData.activityScope === 'account_specific' && liabilityData.accountIds && liabilityData.accountIds.length > 0) {
      const accountLinks = liabilityData.accountIds.map((accountId, index) => ({
        activity_type: 'liability',
        activity_id: data.id,
        account_id: accountId,
        user_id: user.id,
        is_primary: index === 0
      }));

      await supabase
        .from('activity_account_links')
        .insert(accountLinks);
    }

    // Auto-generate bills if enabled
    if (liabilityData.autoGenerateBills && liabilityData.monthlyPayment && liabilityData.monthlyPayment > 0) {
      await createLiabilityBills(data.id, liabilityData, user.id);
    }

    // Create calendar events for liability payments
    await createLiabilityCalendarEvents(data.id, liabilityData, user.id);
  };

  // Helper function to create bills for liability
  const createLiabilityBills = async (liabilityId: string, liabilityData: any, userId: string) => {
    try {
      const billInsertData = {
        user_id: userId,
        title: `${liabilityData.name} Payment`,
        description: `Monthly payment for ${liabilityData.name}`,
        category: 'Debt Payment',
        bill_type: 'fixed',
        amount: liabilityData.monthlyPayment,
        frequency: 'monthly',
        due_date: new Date().toISOString().split('T')[0],
        next_due_date: new Date().toISOString().split('T')[0],
        default_account_id: liabilityData.defaultPaymentAccountId,
        auto_pay: false,
        linked_liability_id: liabilityId,
        is_emi: true,
        is_active: true,
        is_essential: true,
        reminder_days_before: 3,
        send_due_date_reminder: true,
        send_overdue_reminder: true,
        activity_scope: liabilityData.activityScope || 'general',
        target_category: liabilityData.targetCategory || 'debt_payment',
        linked_accounts_count: liabilityData.accountIds?.length || 0,
        priority: liabilityData.priority || 'high',
        status: 'active'
      };

      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert(billInsertData)
        .select()
        .single();

      if (billError) {
        console.error('Error creating liability bill:', billError);
        return;
      }

      // Create activity account links for the bill if account-specific
      if (liabilityData.activityScope === 'account_specific' && liabilityData.accountIds && liabilityData.accountIds.length > 0) {
        const accountLinks = liabilityData.accountIds.map((accountId: string, index: number) => ({
          activity_type: 'bill',
          activity_id: billData.id,
          account_id: accountId,
          user_id: userId,
          is_primary: index === 0
        }));

        await supabase
          .from('activity_account_links')
          .insert(accountLinks);
      }

      // Reload bills to update the UI
      await loadBills();
    } catch (error) {
      console.error('Error creating liability bills:', error);
    }
  };

  // Helper function to create calendar events for liability
  const createLiabilityCalendarEvents = async (liabilityId: string, liabilityData: any, userId: string) => {
    try {
      if (!liabilityData.monthlyPayment || liabilityData.monthlyPayment <= 0) return;

      const startDate = new Date(liabilityData.startDate || new Date());
      const paymentDay = liabilityData.paymentDay || 1;
      
      // Create events for the next 12 months
      for (let i = 0; i < 12; i++) {
        const eventDate = new Date(startDate);
        eventDate.setMonth(eventDate.getMonth() + i);
        eventDate.setDate(paymentDay);
        
        // Skip if the date is in the past
        if (eventDate < new Date()) continue;

        const eventData = {
          user_id: userId,
          event_type: 'debt_payment',
          title: `${liabilityData.name} Payment Due`,
          description: `Monthly payment of $${liabilityData.monthlyPayment} for ${liabilityData.name}`,
          event_date: eventDate.toISOString().split('T')[0],
          is_all_day: true,
          is_recurring: true,
          recurring_pattern: 'monthly',
          source_id: liabilityId,
          source_type: 'liability',
          priority: liabilityData.priority || 'high',
          is_completed: false
        };

        await supabase
          .from('calendar_events')
          .insert(eventData);
      }

      // Reload calendar events to update the UI
      await loadCalendarEvents();
    } catch (error) {
      console.error('Error creating liability calendar events:', error);
    }
  };

  const updateLiability = async (id: string, updates: Partial<EnhancedLiability>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('liabilities')
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
      .from('liabilities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setLiabilities(prev => prev.filter(liability => liability.id !== id));
  };

  // Enhanced liability management functions
  const modifyLiability = async (id: string, modificationData: any) => {
    if (!user) throw new Error('User not authenticated');

    // Record the modification
    const { error: modError } = await supabase
      .from('liability_modifications')
      .insert({
        user_id: user.id,
        liability_id: id,
        modification_type: modificationData.modificationType,
        old_value: modificationData.oldValue,
        new_value: modificationData.newValue,
        reason: modificationData.reason
      });

    if (modError) throw modError;

    // Update the liability
    const updateData: any = {
      last_modified_date: new Date().toISOString(),
      modification_reason: modificationData.reason
    };

    // Add specific changes based on modification type
    if (modificationData.newAmount !== undefined) {
      updateData.remaining_amount = modificationData.newAmount;
    }
    if (modificationData.newTermMonths !== undefined) {
      updateData.loan_term_months = modificationData.newTermMonths;
      updateData.remaining_term_months = modificationData.newTermMonths;
    }
    if (modificationData.newStartDate) {
      updateData.start_date = modificationData.newStartDate;
    }
    if (modificationData.newDueDate) {
      updateData.due_date = modificationData.newDueDate;
    }
    if (modificationData.newNextPaymentDate) {
      updateData.next_payment_date = modificationData.newNextPaymentDate;
    }
    if (modificationData.newInterestRate !== undefined) {
      updateData.interest_rate = modificationData.newInterestRate;
    }
    if (modificationData.newMonthlyPayment !== undefined) {
      updateData.monthly_payment = modificationData.newMonthlyPayment;
    }

    const { error } = await supabase
      .from('liabilities')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Reload liabilities to get updated data
    await loadLiabilities();
  };

  const addLiabilityAccountLink = async (link: { liabilityId: string; accountId: string; paymentPercentage: number; isPrimary?: boolean }) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('liability_account_links')
      .insert({
        user_id: user.id,
        liability_id: link.liabilityId,
        account_id: link.accountId,
        payment_percentage: link.paymentPercentage,
        is_primary: link.isPrimary || false
      });

    if (error) throw error;
  };

  const removeLiabilityAccountLink = async (liabilityId: string, accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('liability_account_links')
      .delete()
      .eq('liability_id', liabilityId)
      .eq('account_id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  const getLiabilityAccountLinks = (_liabilityId: string) => {
    // This would typically come from state, but for now return empty array
    return [];
  };

  const extendLiabilityTerm = async (id: string, newTermMonths: number, reason?: string) => {
    const liability = liabilities.find(l => l.id === id);
    if (!liability) throw new Error('Liability not found');

    await modifyLiability(id, {
      modificationType: 'term_change',
      oldValue: { loanTermMonths: liability.loanTermMonths },
      newValue: { loanTermMonths: newTermMonths },
      reason: reason || 'Term extended'
    });
  };

  const shortenLiabilityTerm = async (id: string, newTermMonths: number, reason?: string) => {
    const liability = liabilities.find(l => l.id === id);
    if (!liability) throw new Error('Liability not found');

    await modifyLiability(id, {
      modificationType: 'term_change',
      oldValue: { loanTermMonths: liability.loanTermMonths },
      newValue: { loanTermMonths: newTermMonths },
      reason: reason || 'Term shortened'
    });
  };

  const changeLiabilityAmount = async (id: string, newAmount: number, reason?: string) => {
    const liability = liabilities.find(l => l.id === id);
    if (!liability) throw new Error('Liability not found');

    await modifyLiability(id, {
      modificationType: 'amount_change',
      oldValue: { remainingAmount: liability.remainingAmount },
      newValue: { remainingAmount: newAmount },
      reason: reason || 'Amount changed'
    });
  };

  const changeLiabilityDates = async (id: string, dateChanges: { startDate?: Date; dueDate?: Date; nextPaymentDate?: Date }, reason?: string) => {
    const liability = liabilities.find(l => l.id === id);
    if (!liability) throw new Error('Liability not found');

    await modifyLiability(id, {
      modificationType: 'date_change',
      oldValue: { 
        startDate: liability.startDate, 
        dueDate: liability.dueDate, 
        nextPaymentDate: liability.nextPaymentDate 
      },
      newValue: dateChanges,
      reason: reason || 'Dates changed'
    });
  };

  const payLiabilityFromMultipleAccounts = async (liabilityId: string, payments: { accountId: string; amount: number; percentage?: number }[]) => {
    if (!user) throw new Error('User not authenticated');

    const liability = liabilities.find(l => l.id === liabilityId);
    if (!liability) throw new Error('Liability not found');

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Create transactions for each account payment
    for (const payment of payments) {
      const account = accounts.find(a => a.id === payment.accountId);
      if (!account) continue;

      // Create transaction
      const transactionData = {
        accountId: payment.accountId,
        amount: payment.amount,
        type: 'expense' as 'income' | 'expense',
        category: 'Debt Payment',
        description: `Payment to ${liability.name} from ${account.name}`,
        date: new Date(),
        status: 'completed' as 'pending' | 'completed' | 'cancelled',
        affectsBalance: true,
        linkedLiabilityId: liabilityId
      };

      await addTransaction(transactionData);
    }

    // Update liability remaining amount
    const newRemainingAmount = Math.max(0, liability.remainingAmount - totalAmount);
    await changeLiabilityAmount(liabilityId, newRemainingAmount, 'Payment from multiple accounts');

    // If fully paid, update status
    if (newRemainingAmount === 0) {
      await updateLiability(liabilityId, { 
        status: 'paid_off',
        isActive: false 
      });
    }
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
        send_overdue_reminder: billData.sendOverdueReminder,
        activity_scope: billData.activityScope || 'general',
        target_category: billData.targetCategory,
        linked_accounts_count: billData.accountIds?.length || 0,
        // Enhanced fields
        bill_category: billData.billCategory || 'general_expense',
        is_recurring: billData.isRecurring || false,
        notes: billData.notes,
        payment_method: billData.paymentMethod,
        priority: billData.priority || 'medium',
        status: billData.status || 'active',
        // New multi-currency support
        currency_code: billData.currencyCode || 'USD',
        // Income bills support
        is_income: billData.isIncome || false,
        // Bill staging support
        bill_stage: billData.billStage || 'pending',
        moved_to_date: billData.movedToDate?.toISOString().split('T')[0],
        stage_reason: billData.stageReason,
        // Variable amount support
        is_variable_amount: billData.isVariableAmount || false,
        min_amount: billData.minAmount,
        max_amount: billData.maxAmount,
        // Completion flow support
        completion_action: billData.completionAction || 'continue',
        completion_date: billData.completionDate?.toISOString().split('T')[0],
        completion_notes: billData.completionNotes,
        original_amount: billData.originalAmount,
        extended_amount: billData.extendedAmount,
        is_archived: billData.isArchived || false,
        archived_date: billData.archivedDate?.toISOString().split('T')[0],
        archived_reason: billData.archivedReason
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
      billCategory: data.bill_category || 'general_expense',
      targetCategory: data.target_category,
      isRecurring: data.is_recurring || false,
      paymentMethod: data.payment_method,
      notes: data.notes,
      priority: data.priority || 'medium',
      status: data.status || 'active',
      activityScope: data.activity_scope || 'general',
      accountIds: billData.accountIds || [],
      linkedAccountsCount: data.linked_accounts_count || 0,
      // New fields
      currencyCode: data.currency_code || 'USD',
      isIncome: data.is_income || false,
      billStage: data.bill_stage || 'pending',
      movedToDate: data.moved_to_date ? new Date(data.moved_to_date) : undefined,
      stageReason: data.stage_reason,
      isVariableAmount: data.is_variable_amount || false,
      minAmount: data.min_amount ? Number(data.min_amount) : undefined,
      maxAmount: data.max_amount ? Number(data.max_amount) : undefined,
      completionAction: data.completion_action || 'continue',
      completionDate: data.completion_date ? new Date(data.completion_date) : undefined,
      completionNotes: data.completion_notes,
      originalAmount: data.original_amount ? Number(data.original_amount) : undefined,
      extendedAmount: data.extended_amount ? Number(data.extended_amount) : undefined,
      isArchived: data.is_archived || false,
      archivedDate: data.archived_date ? new Date(data.archived_date) : undefined,
      archivedReason: data.archived_reason,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setBills(prev => [newBill, ...prev]);

    // Create activity account links if account-specific
    if (billData.activityScope === 'account_specific' && billData.accountIds && billData.accountIds.length > 0) {
      const accountLinks = billData.accountIds.map((accountId, index) => ({
        activity_type: 'bill',
        activity_id: data.id,
        account_id: accountId,
        user_id: user.id,
        is_primary: index === 0
      }));

      await supabase
        .from('activity_account_links')
        .insert(accountLinks);
    }
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
        send_overdue_reminder: updates.sendOverdueReminder,
        // Enhanced fields
        bill_category: updates.billCategory,
        is_recurring: updates.isRecurring,
        notes: updates.notes,
        payment_method: updates.paymentMethod,
        priority: updates.priority,
        status: updates.status,
        activity_scope: updates.activityScope,
        target_category: updates.targetCategory,
        linked_accounts_count: updates.accountIds?.length || updates.linkedAccountsCount,
        // New multi-currency support
        currency_code: updates.currencyCode,
        // Income bills support
        is_income: updates.isIncome,
        // Bill staging support
        bill_stage: updates.billStage,
        moved_to_date: updates.movedToDate?.toISOString().split('T')[0],
        stage_reason: updates.stageReason,
        // Variable amount support
        is_variable_amount: updates.isVariableAmount,
        min_amount: updates.minAmount,
        max_amount: updates.maxAmount,
        // Completion flow support
        completion_action: updates.completionAction,
        completion_date: updates.completionDate?.toISOString().split('T')[0],
        completion_notes: updates.completionNotes,
        original_amount: updates.originalAmount,
        extended_amount: updates.extendedAmount,
        is_archived: updates.isArchived,
        archived_date: updates.archivedDate?.toISOString().split('T')[0],
        archived_reason: updates.archivedReason
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

  // Enhanced bill management functions
  const addBillAccountLink = async (link: Omit<BillAccountLink, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bill_account_links')
      .insert({
        bill_id: link.billId,
        account_id: link.accountId,
        user_id: user.id,
        is_primary: link.isPrimary,
        payment_percentage: link.paymentPercentage
      })
      .select()
      .single();

    if (error) throw error;

    const newLink: BillAccountLink = {
      id: data.id,
      billId: data.bill_id,
      accountId: data.account_id,
      userId: data.user_id,
      isPrimary: data.is_primary,
      paymentPercentage: Number(data.payment_percentage),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setBillAccountLinks(prev => [...prev, newLink]);
  };

  const removeBillAccountLink = async (billId: string, accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bill_account_links')
      .delete()
      .eq('bill_id', billId)
      .eq('account_id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;

    setBillAccountLinks(prev => 
      prev.filter(link => !(link.billId === billId && link.accountId === accountId))
    );
  };

  const updateBillStage = async (billId: string, stage: 'pending' | 'paid' | 'moved' | 'failed' | 'stopped', reason?: string, movedToDate?: Date) => {
    if (!user) throw new Error('User not authenticated');

    // Get current bill stage for history
    const currentBill = bills.find(bill => bill.id === billId);
    if (!currentBill) throw new Error('Bill not found');

    // Update bill stage
    const { error: updateError } = await supabase
      .from('bills')
      .update({
        bill_stage: stage,
        moved_to_date: movedToDate?.toISOString().split('T')[0],
        stage_reason: reason
      })
      .eq('id', billId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Record staging history
    const { error: historyError } = await supabase
      .from('bill_staging_history')
      .insert({
        bill_id: billId,
        user_id: user.id,
        from_stage: currentBill.billStage,
        to_stage: stage,
        stage_reason: reason,
        changed_by: 'user'
      });

    if (historyError) throw historyError;

    // Update local state
    setBills(prev => prev.map(bill => 
      bill.id === billId 
        ? { 
            ...bill, 
            billStage: stage, 
            movedToDate, 
            stageReason: reason 
          } 
        : bill
    ));
  };

  const handleBillCompletion = async (billId: string, action: 'continue' | 'extend' | 'archive' | 'delete', newAmount?: number, newDueDate?: Date, reason?: string) => {
    if (!user) throw new Error('User not authenticated');

    const currentBill = bills.find(bill => bill.id === billId);
    if (!currentBill) throw new Error('Bill not found');

    let updateData: any = {
      completion_action: action,
      completion_date: new Date().toISOString().split('T')[0],
      completion_notes: reason
    };

    switch (action) {
      case 'extend':
        updateData.extended_amount = newAmount;
        updateData.next_due_date = newDueDate?.toISOString().split('T')[0];
        break;
      case 'archive':
        updateData.is_archived = true;
        updateData.archived_date = new Date().toISOString().split('T')[0];
        updateData.archived_reason = reason;
        break;
      case 'delete':
        // This will be handled by deleteBill function
        break;
    }

    if (action !== 'delete') {
      const { error: updateError } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', billId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    }

    // Record completion tracking
    const { error: trackingError } = await supabase
      .from('bill_completion_tracking')
      .insert({
        bill_id: billId,
        user_id: user.id,
        completion_type: action,
        completion_reason: reason,
        new_amount: newAmount,
        new_due_date: newDueDate?.toISOString().split('T')[0]
      });

    if (trackingError) throw trackingError;

    // Update local state
    setBills(prev => prev.map(bill => 
      bill.id === billId 
        ? { 
            ...bill, 
            completionAction: action,
            completionDate: new Date(),
            completionNotes: reason,
            extendedAmount: newAmount,
            nextDueDate: newDueDate || bill.nextDueDate,
            isArchived: action === 'archive' ? true : bill.isArchived,
            archivedDate: action === 'archive' ? new Date() : bill.archivedDate,
            archivedReason: action === 'archive' ? reason : bill.archivedReason
          } 
        : bill
    ));

    if (action === 'delete') {
      await deleteBill(billId);
    }
  };

  const createVariableAmountBill = async (billData: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { minAmount: number; maxAmount: number }) => {
    const variableBillData = {
      ...billData,
      isVariableAmount: true,
      minAmount: billData.minAmount,
      maxAmount: billData.maxAmount,
      amount: billData.minAmount // Use min amount as default
    };
    
    await addBill(variableBillData);
  };

  const createIncomeBill = async (billData: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const incomeBillData = {
      ...billData,
      isIncome: true,
      billType: 'fixed' as const
    };
    
    await addBill(incomeBillData);
  };

  const payBillFromMultipleAccounts = async (billId: string, payments: { accountId: string; amount: number; percentage?: number }[]) => {
    if (!user) throw new Error('User not authenticated');

    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    // Create transactions for each payment
    for (const payment of payments) {
      const transactionData = {
        accountId: payment.accountId,
        amount: bill.isIncome ? payment.amount : -payment.amount,
        description: `${bill.isIncome ? 'Income from' : 'Payment for'} ${bill.title}`,
        category: bill.category,
        type: (bill.isIncome ? 'income' : 'expense') as 'income' | 'expense',
        date: new Date(),
        status: 'completed' as const,
        affectsBalance: true
      };

      await addTransaction(transactionData);
    }

    // Update bill as paid
    await updateBillStage(billId, 'paid', 'Paid from multiple accounts');
  };

  const getBillAccountLinks = (billId: string) => {
    return billAccountLinks.filter(link => link.billId === billId);
  };

  const getBillStagingHistory = (billId: string) => {
    return billStagingHistory.filter(history => history.billId === billId);
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

  // Transaction filtering helpers
  const getAccountTransactions = (accountId: string) => {
    return transactions.filter(t => t.accountId === accountId);
  };

  const getGoalTransactions = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return [];
    
    return transactions.filter(t => {
      // Filter by account if goal is account-specific
      if (goal.goalType === 'account_specific' && goal.accountId) {
        return t.accountId === goal.accountId && t.type === 'income' && t.category === 'Goal Contribution';
      }
      // Filter by category for category-based goals
      if (goal.goalType === 'category_based' && goal.targetCategory) {
        return t.type === 'income' && t.category === goal.targetCategory;
      }
      // For general savings goals, look for goal-related transactions
      return t.type === 'income' && t.description.toLowerCase().includes(goal.title.toLowerCase());
    });
  };

  const getBillTransactions = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return [];
    
    return transactions.filter(t => {
      // Filter by account if bill is account-specific
      if (bill.billCategory === 'account_specific' && bill.defaultAccountId) {
        return t.accountId === bill.defaultAccountId && t.type === 'expense' && t.category === bill.category;
      }
      // Filter by category for category-based bills
      if (bill.billCategory === 'category_based' && bill.targetCategory) {
        return t.type === 'expense' && t.category === bill.targetCategory;
      }
      // For general expense bills, look for bill-related transactions
      return t.type === 'expense' && t.description.toLowerCase().includes(bill.title.toLowerCase());
    });
  };

  const getLiabilityTransactions = (liabilityId: string) => {
    const liability = liabilities.find(l => l.id === liabilityId);
    if (!liability) return [];
    
    return transactions.filter(t => 
      t.type === 'expense' && 
      t.description.toLowerCase().includes(liability.name.toLowerCase())
    );
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

  // User Categories CRUD Operations
  const addUserCategory = async (categoryData: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_categories')
      .insert({
        user_id: user.id,
        name: categoryData.name,
        type: categoryData.type,
        color: categoryData.color || '#6B7280',
        icon: categoryData.icon || 'Circle',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase user category insert error:', error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    const newCategory: UserCategory = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      color: data.color,
      icon: data.icon,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setUserCategories(prev => [newCategory, ...prev]);
  };

  const updateUserCategory = async (id: string, updates: Partial<UserCategory>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_categories')
      .update({
        name: updates.name,
        type: updates.type,
        color: updates.color,
        icon: updates.icon,
        is_active: true
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase user category update error:', error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    setUserCategories(prev => prev.map(category => 
      category.id === id ? { ...category, ...updates } : category
    ));
  };

  const deleteUserCategory = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase user category delete error:', error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    setUserCategories(prev => prev.filter(category => category.id !== id));
  };

  const getUserCategoriesByType = (type: 'income' | 'expense' | 'bill' | 'goal' | 'liability' | 'budget' | 'account') => {
    return userCategories.filter(category => category.type === type);
  };

  const value: FinanceContextType = {
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
    loading,
    refreshData,
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
    modifyLiability,
    addLiabilityAccountLink,
    removeLiabilityAccountLink,
    getLiabilityAccountLinks,
    extendLiabilityTerm,
    shortenLiabilityTerm,
    changeLiabilityAmount,
    changeLiabilityDates,
    payLiabilityFromMultipleAccounts,
    addBudget,
    updateBudget,
    deleteBudget,
    addBill,
    updateBill,
    deleteBill,
    addBillAccountLink,
    removeBillAccountLink,
    updateBillStage,
    handleBillCompletion,
    createVariableAmountBill,
    createIncomeBill,
    payBillFromMultipleAccounts,
    getBillAccountLinks,
    getBillStagingHistory,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    transferBetweenAccounts,
    getGoalsVaultAccount,
    ensureGoalsVaultAccount,
    createGoalsVaultAccount,
    cleanupDuplicateGoalsVaults,
    handleGoalCompletion,
    handleGoalWithdrawal,
    extendGoal,
    customizeGoal,
    archiveGoal,
    deleteGoalSoft,
    fundGoalFromAccount,
    contributeToGoal,
    withdrawGoalToAccount,
    payBillFromAccount,
    repayLiabilityFromAccount,
    markBillAsPaid,
    payBillFlexible,
    skipBillPayment,
    getBillPaymentHistory,
    markRecurringTransactionAsPaid,
    getMonthlyTrends,
    getCategoryBreakdown,
    getNetWorthTrends,
    getSpendingPatterns,
    getIncomeAnalysis,
    getBudgetPerformance,
    getAccountTransactions,
    getGoalTransactions,
    getBillTransactions,
    getLiabilityTransactions,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    getUserCategoriesByType,
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
