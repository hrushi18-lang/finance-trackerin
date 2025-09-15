import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { queryCache, invalidateUserData } from '../lib/query-cache';
import { sendGoalProgressUpdate, sendSpendingAlert, sendBudgetWarning } from '../services/notificationService';
import { getCurrencyInfo } from '../utils/currency-converter';
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
import { CreateAccountData } from '../lib/finance-manager';
import { currencyService } from '../services/currencyService';
import { BillLiabilityService } from '../services/billLiabilityService';
import { simpleCurrencyService } from '../services/simpleCurrencyService';
import { CurrencyExecutionRequest, CurrencyExecutionResult } from '../services/currencyExecutionEngine';

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode: string): string => {
  const currencyInfo = getCurrencyInfo(currencyCode);
  return currencyInfo?.symbol || '$';
};

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
  
  // CRUD operations
  addAccount: (account: CreateAccountData) => Promise<void>;
  updateAccount: (id: string, updates: Partial<FinancialAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  
  // Account Management Features
  duplicateAccount: (accountId: string) => Promise<void>;
  archiveAccount: (accountId: string) => Promise<void>;
  restoreAccount: (accountId: string) => Promise<void>;
  softDeleteAccount: (accountId: string) => Promise<void>;
  toggleAccountVisibility: (accountId: string) => Promise<void>;
  toggleAccountPin: (accountId: string) => Promise<void>;
  transferBetweenAccountsComplex: (transferData: Omit<AccountTransfer, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  getAccountSummary: (accountId: string) => Promise<any>;
  getAccountTransfers: (accountId: string) => Promise<AccountTransfer[]>;
  getAccountAnalytics: (accountId: string, periodStart: Date, periodEnd: Date) => Promise<any>;
  
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // New Currency Execution Methods
  executeCurrencyTransaction: (request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeBillPayment: (billId: string, request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeLiabilityPayment: (liabilityId: string, request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeGoalContribution: (goalId: string, request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeBudgetSpending: (budgetId: string, request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  
  // Creation methods with currency conversion
  executeGoalCreation: (request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeBudgetCreation: (request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeBillCreation: (request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeLiabilityCreation: (request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  executeAccountCreation: (request: CurrencyExecutionRequest) => Promise<CurrencyExecutionResult>;
  
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Goal>;
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
  
  addBill: (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Bill>;
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
  createGoalsVaultAccount: (name?: string, currencycode?: string) => Promise<FinancialAccount>;
  cleanupDuplicateGoalsVaults: () => Promise<void>;
  
  // Dual currency functions
  updateAccountBalance: (accountId: string, amount: number, type: 'income' | 'expense' | 'transfer') => Promise<void>;
  convertAccountToDisplayCurrency: (accountId: string, displayCurrency: string, exchangeRate: number) => Promise<void>;
  updateAllAccountConversions: (displayCurrency: string) => Promise<void>;
  
  // Goal completion and management
  handleGoalCompletion: (goalId: string) => Promise<any>;
  handleGoalWithdrawal: (goalId: string, amount: number, destinationAccountId: string, reason?: string, notes?: string) => Promise<any>;
  extendGoal: (goalId: string, newTargetAmount: number, reason?: string) => Promise<any>;
  customizeGoal: (goalId: string, newTargetAmount: number, newTitle?: string, newDescription?: string, reason?: string) => Promise<any>;
  archiveGoal: (goalId: string, reason?: string) => Promise<any>;
  
  // Receipt generation
  generatePaymentReceipt: (paymentData: any) => void;
  showReceipt: boolean;
  currentReceipt: any;
  hideReceipt: () => void;
  // High-level flows
  fundGoalFromAccount: (fromAccountId: string, goalId: string, amount: number, description?: string) => Promise<Transaction>;
  contributeToGoal: (goalId: string, amount: number, sourceAccountId?: string, description?: string) => Promise<Transaction>;
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
  pauseBill: (billId: string, reason?: string) => Promise<void>;
  resumeBill: (billId: string) => Promise<void>;
  completeBill: (billId: string, reason?: string) => Promise<void>;
  cancelBill: (billId: string, reason?: string) => Promise<void>;
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
  
  // Currency helper
  getUserCurrency: () => string;
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
  
  // Receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

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
      // Load critical data first in parallel for faster initial render
      await Promise.all([
        loadAccounts(),
        loadTransactions(),
        loadGoals(),
        loadUserCategories()
      ]);

      // Load secondary data in parallel after critical data
      await Promise.all([
        loadLiabilities(),
        loadBudgets(),
        loadBills(),
        loadRecurringTransactions()
      ]);

      // Load additional data in parallel
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
        // loadCalendarEvents() // Commented out until calendar events state is properly implemented
      ]);

      // Clean up any duplicate Goals Vault accounts
      await cleanupDuplicateGoalsVaults();
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
          currencycode: existingVault.currencycode,
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
        const defaultCurrency = getUserCurrency();

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
          currencycode: data.currencycode,
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

  // Helper function to get user's selected currency
  const getUserCurrency = () => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('finspire_currency');
      return savedCurrency || 'USD';
    }
    return 'USD';
  };

  const createGoalsVaultAccount = async (name: string = 'Goals Vault', currencycode: string = getUserCurrency()) => {
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
        currencycode: existingVault.currencycode,
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
        currencycode: currencycode
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
      currencycode: data.currencycode,
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

        // Reload accounts to reflect changes
        await loadAccounts();
      }
    } catch (error) {
      console.error('Error cleaning up duplicate Goals Vault accounts:', error);
    }
  };

  const fundGoalFromAccount = async (fromAccountId: string, goalId: string, amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Validate inputs
    if (!fromAccountId) throw new Error('Source account is required');
    if (!goalId) throw new Error('Goal ID is required');
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
    
    const sourceAccount = accounts.find(acc => acc.id === fromAccountId);
    if (!sourceAccount) throw new Error('Source account not found');
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    
    // Check if source account has sufficient balance
    if (sourceAccount.balance < amount) {
      throw new Error(`Insufficient funds. Available: $${sourceAccount.balance.toFixed(2)}, Required: $${amount.toFixed(2)}`);
    }

    try {
      // Create a transaction directly from the source account to track the goal payment
      const transaction = await addTransaction({
        type: 'expense',
        amount: amount,
        category: 'Savings',
        description: description || `Goal payment: ${goal.title}`,
        accountId: fromAccountId,
        date: new Date(),
        goalId: goalId,
        affectsBalance: true,
        status: 'completed'
      });

      // Update goal current amount
      const newAmount = Math.min(Number(goal.currentAmount || 0) + Number(amount), Number(goal.targetAmount || 0));
      await updateGoal(goalId, { currentAmount: newAmount });

      return transaction;
    } catch (error) {
      console.error('Error funding goal:', error);
      throw new Error(`Failed to fund goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const contributeToGoal = async (goalId: string, amount: number, sourceAccountId?: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Validate inputs
    if (!goalId) throw new Error('Goal ID is required');
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');

    // If no source account specified, use the first available account with sufficient balance
    if (!sourceAccountId) {
      const availableAccount = accounts.find(acc => acc.balance >= amount);
      if (!availableAccount) {
        throw new Error('No accounts with sufficient balance available. Please add funds to an account first.');
      }
      sourceAccountId = availableAccount.id;
    }

    const sourceAccount = accounts.find(acc => acc.id === sourceAccountId);
    if (!sourceAccount) throw new Error('Source account not found');
    
    // Check if source account has sufficient balance
    if (sourceAccount.balance < amount) {
      throw new Error(`Insufficient funds. Available: $${sourceAccount.balance.toFixed(2)}, Required: $${amount.toFixed(2)}`);
    }

    // Update goal current amount
    const newAmount = Math.min(Number(goal.currentAmount || 0) + Number(amount || 0), Number(goal.targetAmount || 0));
    await updateGoal(goalId, { currentAmount: newAmount });
    
    // Send notification for goal progress
    sendGoalProgressUpdate(goal.title, newAmount, goal.targetAmount);

    // Create transaction for goal contribution
    let transaction;
    if (goal.accountId) {
      const vault = getGoalsVaultAccount();
      if (vault && sourceAccountId !== vault.id) {
        await transferBetweenAccounts(sourceAccountId, vault.id, amount, `Goal: ${goal.title}`);
        // Create a transaction record for the contribution
        transaction = await addTransaction({
          type: 'expense',
          amount: amount,
          category: 'Savings',
          description: description || `Contribution to ${goal.title}`,
          date: new Date(),
          accountId: sourceAccountId,
          affectsBalance: true,
          status: 'completed',
          goalId: goalId
        });
      } else {
        // If transferring to same vault or no vault, create direct transaction
        transaction = await addTransaction({
          type: 'expense',
          amount: amount,
          category: 'Savings',
          description: description || `Contribution to ${goal.title}`,
          date: new Date(),
          accountId: sourceAccountId,
          affectsBalance: true,
          status: 'completed',
          goalId: goalId,
          // Currency fields
          currencycode: getUserCurrency(),
          originalAmount: amount,
          originalCurrency: getUserCurrency(),
          exchangeRateUsed: 1.0,
          // Payment source tracking
          paymentSource: 'goal_contribution',
          sourceEntityId: goalId,
          sourceEntityType: 'goal',
          deductFromBalance: true,
          paymentContext: 'goal_funding'
        } as any);
      }
    } else {
      // If goal is not linked to vault, create direct transaction
      transaction = await addTransaction({
        type: 'expense',
        amount: amount,
        category: 'Savings',
        description: description || `Contribution to ${goal.title}`,
        date: new Date(),
        accountId: sourceAccountId,
        affectsBalance: true,
        status: 'completed',
        goalId: goalId,
        // Currency fields
        currencycode: getUserCurrency(),
        originalAmount: amount,
        originalCurrency: getUserCurrency(),
        exchangeRateUsed: 1.0,
        // Payment source tracking
        paymentSource: 'goal_contribution',
        sourceEntityId: goalId,
        sourceEntityType: 'goal',
        deductFromBalance: true,
        paymentContext: 'goal_funding'
      } as any);
    }

    return transaction;
  };

  const withdrawGoalToAccount = async (toAccountId: string, goalId: string, amount: number, description?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Ensure Goals Vault exists before attempting transfer
    await ensureGoalsVaultAccount();
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
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    const transaction = await addTransaction({
      type: 'expense',
      amount: payAmount,
      category: bill.category || 'Bills',
      description: description || `Bill Payment: ${bill.title}`,
      date: new Date(),
      accountId,
      affectsBalance: true,
      status: 'completed',
      billId: billId,
      // Currency fields
      currencycode: getUserCurrency(),
      originalAmount: payAmount,
      originalCurrency: getUserCurrency(),
      exchangeRateUsed: 1.0,
      // Payment source tracking
      paymentSource: 'bill_payment',
      sourceEntityId: billId,
      sourceEntityType: 'bill',
      deductFromBalance: true,
      paymentContext: 'bill_payment'
    } as any);

    // Update bill schedule and mark as paid
    const nextDueDate = new Date(bill.nextDueDate);
    nextDueDate.setDate(nextDueDate.getDate() + (bill.frequency === 'weekly' ? 7 : bill.frequency === 'bi_weekly' ? 14 : bill.frequency === 'monthly' ? 30 : bill.frequency === 'quarterly' ? 90 : bill.frequency === 'semi_annual' ? 180 : bill.frequency === 'annual' ? 365 : 30));
    await updateBill(billId, { 
      lastPaidDate: new Date(), 
      nextDueDate,
      billStage: 'paid',
      status: bill.frequency === 'one_time' ? 'completed' : 'active'
    });

    // Generate receipt
    generatePaymentReceipt({
      id: transaction.id,
      amount: payAmount,
      currency: account.currency || getUserCurrency(),
      description: description || `Bill Payment: ${bill.title}`,
      accountName: account.name,
      paymentType: 'bill_payment',
      sourceEntity: {
        type: 'bill',
        name: bill.title
      },
      timestamp: new Date(),
      status: 'completed',
      reference: `BILL-${billId.slice(-8)}`,
      notes: `Payment for ${bill.title}`
    });
    
    // Send spending alert for bill payment
    sendSpendingAlert(`Bill paid: ${bill.title}`, payAmount, bill.category || 'Bills');

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

    // Get account and liability currencies for proper conversion
    const account = accounts.find(acc => acc.id === accountId);
    const accountCurrency = account?.currencycode || getUserCurrency();
    const liabilityCurrency = liability.currencyCode || getUserCurrency();
    
    // Use the BillLiabilityService for consistent multi-currency handling
    const transactionData = await BillLiabilityService.createLiabilityPaymentTransaction(
      Number(amount),
      accountId,
      accountCurrency,
      liabilityCurrency,
      liability.name,
      liabilityId,
      description
    );

    await addTransaction(transactionData as any);

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
      nextDueDate: nextDueDate,
      billStage: 'paid',
      status: bill.frequency === 'one_time' ? 'completed' : 'active'
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

    // Create transaction for the payment with multi-currency support
    if (paymentAmount > 0) {
      // Get account currency for proper conversion
      const account = accounts.find(acc => acc.id === paymentData.accountId);
      const accountCurrency = account?.currencycode || getUserCurrency();
      const billCurrency = bill.currencycode || getUserCurrency();
      
      // Use the BillLiabilityService for consistent multi-currency handling
      const transactionData = await BillLiabilityService.createBillPaymentTransaction(
        paymentAmount,
        paymentData.accountId,
        accountCurrency,
        billCurrency,
        bill.title,
        billId,
        paymentData.description
      );

      await addTransaction(transactionData as any);
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

    // Record staging history for payment
    const { error: historyError } = await supabase
      .from('bill_staging_history')
      .insert({
        bill_id: billId,
        user_id: user.id,
        from_stage: bill.billStage || 'pending',
        to_stage: paymentData.paymentType === 'full' ? 'paid' : 'partial',
        stage_reason: `Payment: ${paymentData.paymentType} - ${paymentData.description || 'Bill payment'}`,
        changed_by: 'user'
      });

    if (historyError) {
      console.error('Error recording bill staging history:', historyError);
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

    // Record staging history for skip
    const { error: historyError } = await supabase
      .from('bill_staging_history')
      .insert({
        bill_id: billId,
        user_id: user.id,
        from_stage: bill.billStage || 'pending',
        to_stage: 'skipped',
        stage_reason: `Skipped: ${reason || 'Skipped by user'}`,
        changed_by: 'user'
      });

    if (historyError) {
      console.error('Error recording bill staging history:', historyError);
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

  // Pause bill
  const pauseBill = async (billId: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    await updateBill(billId, {
      status: 'paused',
      billStage: 'stopped',
      stageReason: reason || 'Paused by user'
    });

    // Record staging history
    await supabase
      .from('bill_staging_history')
      .insert({
        bill_id: billId,
        user_id: user.id,
        from_stage: bill.billStage || 'pending',
        to_stage: 'stopped',
        stage_reason: reason || 'Paused by user',
        changed_by: 'user'
      });
  };

  // Resume bill
  const resumeBill = async (billId: string) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    await updateBill(billId, {
      status: 'active',
      billStage: 'pending',
      stageReason: 'Resumed by user'
    });

    // Record staging history
    await supabase
      .from('bill_staging_history')
      .insert({
        bill_id: billId,
        user_id: user.id,
        from_stage: bill.billStage || 'stopped',
        to_stage: 'pending',
        stage_reason: 'Resumed by user',
        changed_by: 'user'
      });
  };

  // Complete bill
  const completeBill = async (billId: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    await updateBill(billId, {
      status: 'completed',
      billStage: 'paid',
      stageReason: reason || 'Completed by user',
      completionDate: new Date()
    });

    // Record staging history
    await supabase
      .from('bill_staging_history')
      .insert({
        bill_id: billId,
        user_id: user.id,
        from_stage: bill.billStage || 'pending',
        to_stage: 'paid',
        stage_reason: reason || 'Completed by user',
        changed_by: 'user'
      });
  };

  // Cancel bill
  const cancelBill = async (billId: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated');
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    await updateBill(billId, {
      status: 'cancelled',
      billStage: 'stopped',
      stageReason: reason || 'Cancelled by user'
    });

    // Record staging history
    await supabase
      .from('bill_staging_history')
      .insert({
        bill_id: billId,
        user_id: user.id,
        from_stage: bill.billStage || 'pending',
        to_stage: 'stopped',
        stage_reason: reason || 'Cancelled by user',
        changed_by: 'user'
      });
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
    
    // Get user profile for primary currency
    const { data: profileData } = await supabase
      .from('profiles')
      .select('primary_currency')
      .eq('user_id', user.id)
      .single();
    
    const primaryCurrency = profileData?.primary_currency || 'USD';
    
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
      balance: Number(account.balance) || 0, // This should be the converted balance for display
      institution: account.institution,
      platform: account.platform,
      accountNumber: account.account_number,
      isVisible: account.is_visible,
      currencycode: account.currency || account.currencycode,
      createdAt: new Date(account.created_at),
      updatedAt: new Date(account.updated_at),
      
      // Dual currency support - properly map database fields
      original_balance: Number(account.native_amount) || Number(account.balance) || 0,
      converted_balance: Number(account.converted_amount) || Number(account.balance) || 0,
      // Fix: If converted_currency is missing but we have converted_amount, use primary currency
      display_currency: account.converted_currency || (account.converted_amount ? primaryCurrency : (account.currency || 'USD')),
      exchangeRateUsed: Number(account.exchange_rate) || 1.0,
      lastConversionDate: account.last_conversion_date ? new Date(account.last_conversion_date) : undefined,
      conversionSource: account.rate_source,
      
      // Native currency fields
      native_amount: Number(account.native_amount) || Number(account.balance) || 0,
      native_currency: account.native_currency || account.currency || 'USD',
      native_symbol: account.native_symbol || '$',
      converted_amount: Number(account.converted_amount) || Number(account.balance) || 0,
      // Fix: If converted_currency is missing but we have converted_amount, use primary currency
      converted_currency: account.converted_currency || (account.converted_amount ? primaryCurrency : (account.currency || 'USD')),
      converted_symbol: account.converted_symbol || '$',
      exchange_rate: Number(account.exchange_rate) || 1.0,
      conversion_metadata: account.conversion_metadata,
      rate_source: account.rate_source,
      last_conversion_date: account.last_conversion_date ? new Date(account.last_conversion_date) : undefined,
      
      // Enhanced fields
      routingNumber: account.routing_number,
      cardLastFour: account.card_last_four,
      cardType: account.card_type,
      spendingLimit: Number(account.spending_limit) || undefined,
      monthlyLimit: Number(account.monthly_limit) || undefined,
      dailyLimit: Number(account.daily_limit) || undefined,
      isPrimary: account.is_primary,
      notes: account.notes,
      accountTypeCustom: account.account_type_custom,
      isLiability: account.is_liability,
      outstandingBalance: Number(account.outstanding_balance) || undefined,
      creditLimit: Number(account.credit_limit) || undefined,
      minimumDue: Number(account.minimum_due) || undefined,
      dueDate: account.due_date ? new Date(account.due_date) : undefined,
      interestRate: Number(account.interest_rate) || undefined,
      isBalanceHidden: account.is_balance_hidden,
      linkedBankAccountId: account.linked_bank_account_id,
      autoSync: account.auto_sync,
      lastSyncedAt: account.last_synced_at ? new Date(account.last_synced_at) : undefined,
      exchangeRate: Number(account.exchange_rate) || undefined,
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
    
    // Fix accounts with missing converted_currency data
    await fixAccountsWithMissingCurrencyData(mappedAccounts);
  };

  // Fix accounts with missing converted_currency data
  const fixAccountsWithMissingCurrencyData = async (accounts: FinancialAccount[]) => {
    if (!user) return;
    
    // Get primary currency from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('primary_currency')
      .eq('user_id', user.id)
      .single();
    
    const primaryCurrency = profileData?.primary_currency || 'USD';
    
    // Find accounts that have converted_amount but missing converted_currency
    const accountsToFix = accounts.filter(account => 
      account.converted_amount && 
      account.converted_amount !== account.balance && 
      (!account.converted_currency || account.converted_currency === account.currencycode)
    );
    
    if (accountsToFix.length === 0) return;
    
    console.log(`Fixing ${accountsToFix.length} accounts with missing converted_currency data`);
    
    // Update each account
    for (const account of accountsToFix) {
      try {
        const { error } = await supabase
          .from('financial_accounts')
          .update({
            converted_currency: primaryCurrency,
            converted_symbol: getCurrencyInfo(primaryCurrency)?.symbol || '$',
            last_conversion_date: new Date()
          })
          .eq('id', account.id);
        
        if (error) {
          console.error(`Error fixing account ${account.id}:`, error);
        } else {
          console.log(`Fixed account ${account.name} - set converted_currency to ${primaryCurrency}`);
        }
      } catch (error) {
        console.error(`Error fixing account ${account.id}:`, error);
      }
    }
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
      amount: Number(transaction.amount) || 0,
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
      targetAmount: Number(goal.target_amount) || 0,
      currentAmount: Number(goal.current_amount) || 0,
      targetDate: new Date(goal.target_date),
      category: goal.category,
      accountId: goal.account_id,
      goalType: goal.goal_type || 'general_savings',
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
      accountIds: goal.account_ids || [],
      targetCategory: goal.target_category,
      currencycode: goal.currency_code || getUserCurrency(),
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
        totalAmount: Number(liability.total_amount) || 0,
        remainingAmount: Number(liability.remaining_amount) || 0,
        interestRate: Number(liability.interest_rate) || 0,
        monthlyPayment: Number(liability.monthly_payment) || 0,
        minimumPayment: Number(liability.minimum_payment) || 0,
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
        currencyCode: liability.currency_code || getUserCurrency(),
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
      amount: Number(budget.amount) || 0,
      spent: Number(budget.spent) || 0,
      period: budget.period,
      // Add scoping fields
      accountId: budget.account_id,
      activityScope: budget.activity_scope || 'general',
      accountIds: budget.account_ids || [],
      targetCategory: budget.target_category,
      currencycode: budget.currency_code || getUserCurrency(),
      startDate: budget.start_date ? new Date(budget.start_date) : new Date(),
      endDate: budget.end_date ? new Date(budget.end_date) : undefined,
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
      billType: bill.bill_type || 'fixed',
      amount: Number(bill.amount) || 0,
      estimatedAmount: Number(bill.estimated_amount) || Number(bill.amount) || 0,
      frequency: bill.frequency,
      customFrequencyDays: bill.custom_frequency_days,
      dueDate: new Date(bill.due_date),
      nextDueDate: new Date(bill.next_due_date),
      lastPaidDate: bill.last_paid_date ? new Date(bill.last_paid_date) : undefined,
      defaultAccountId: bill.default_account_id,
      autoPay: bill.auto_pay || false,
      linkedLiabilityId: bill.linked_liability_id,
      isEmi: bill.is_emi || false,
      isActive: bill.is_active,
      isEssential: bill.is_essential || false,
      reminderDaysBefore: bill.reminder_days_before || 3,
      sendDueDateReminder: bill.send_due_date_reminder || false,
      sendOverdueReminder: bill.send_overdue_reminder || false,
      billCategory: bill.bill_category || 'general',
      targetCategory: bill.target_category,
      isRecurring: bill.is_recurring || false,
      paymentMethod: bill.payment_method || 'bank_transfer',
      notes: bill.notes || '',
      priority: bill.priority || 'medium',
      status: bill.status || 'active',
      activityScope: bill.activity_scope || 'general',
      accountIds: [],
      linkedAccountsCount: bill.linked_accounts_count || 0,
      // New fields
      currencycode: bill.currency_code || getUserCurrency(),
      isIncome: bill.is_income || false,
      billStage: bill.bill_stage || 'pending',
      movedToDate: bill.moved_to_date ? new Date(bill.moved_to_date) : undefined,
      stageReason: bill.stage_reason,
      isVariableAmount: bill.is_variable_amount || false,
      minAmount: bill.min_amount,
      maxAmount: bill.max_amount,
      completionAction: bill.completion_action || 'continue',
      completionDate: bill.completion_date ? new Date(bill.completion_date) : undefined,
      completionNotes: bill.completion_notes,
      originalAmount: bill.original_amount,
      extendedAmount: bill.extended_amount,
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
      createdAt: new Date(transfer.created_at),
      // Add missing required fields with defaults
      fromCurrency: getUserCurrency(),
      toCurrency: getUserCurrency(),
      transferType: 'manual',
      status: 'completed'
    }));

    setAccountTransfers(mappedTransfers);
  };

  const loadUserCategories = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

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

  // const loadCalendarEvents = async () => {
  //   if (!user) return;
  //   
  //   const { data, error } = await supabase
  //     .from('calendar_events')
  //     .select('*')
  //     .eq('user_id', user.id)
  //     .order('event_date', { ascending: true });

  //   if (error) {
  //     console.error('Error loading calendar events:', error);
  //     return;
  //   }

  //   // Calendar events are handled by the calendar component
  //   // This method is here for consistency and future use
  //   console.log('Calendar events loaded:', data?.length || 0);
  // };

  // CRUD Operations
  const addAccount = async (accountData: CreateAccountData) => {
    if (!user) throw new Error('User not authenticated');

    // Get primary currency from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('primary_currency')
      .eq('user_id', user.id)
      .single();

    const primaryCurrency = profileData?.primary_currency || 'USD';
    const accountCurrency = accountData.currency || primaryCurrency;

    // Use currency service to process account creation
    const conversionData = currencyService.processAccountCreation(
      accountCurrency,
      accountData.balance || 0,
      primaryCurrency
    );

    const { data, error } = await supabase
      .from('financial_accounts')
      .insert({
        user_id: user.id,
        name: accountData.name,
        type: accountData.type === 'goals_vault' ? 'investment' : accountData.type, // Map goals_vault to investment
        balance: conversionData.convertedAmount, // Store converted balance as main balance
        institution: accountData.institution,
        platform: accountData.platform,
        account_number: accountData.account_number,
        is_visible: true, // Default to visible
        currency: accountCurrency, // Store original currency
        currencycode: accountCurrency, // Legacy field
        
        // Dual currency storage - store both native and converted amounts
        native_amount: conversionData.nativeAmount,
        native_currency: conversionData.nativeCurrency,
        native_symbol: conversionData.nativeSymbol,
        converted_amount: conversionData.convertedAmount,
        converted_currency: conversionData.convertedCurrency,
        converted_symbol: conversionData.convertedSymbol,
        exchange_rate: conversionData.exchangeRate,
        conversion_metadata: {
          needs_conversion: conversionData.needsConversion,
          last_updated: new Date().toISOString(),
          source: 'account_creation'
        },
        rate_source: conversionData.rateSource || 'api',
        last_conversion_date: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    const newAccount: FinancialAccount = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type === 'investment' && accountData.type === 'goals_vault' ? 'goals_vault' : data.type, // Map back to goals_vault if needed
      balance: Number(accountData.balance || 0), // Use original balance as the main balance
      institution: data.institution,
      platform: data.platform,
      accountNumber: data.account_number,
      isVisible: data.is_visible,
      currencycode: data.currency, // Use original currency
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      
      // Store conversion data in metadata for now
      metadata: {
        native_balance: conversionData.nativeAmount,
        native_currency: conversionData.nativeCurrency,
        native_symbol: conversionData.nativeSymbol,
        converted_balance: conversionData.convertedAmount,
        converted_currency: conversionData.convertedCurrency,
        converted_symbol: conversionData.convertedSymbol,
        exchange_rate: conversionData.exchangeRate,
        last_conversion_date: new Date().toISOString(),
        needs_conversion: conversionData.needsConversion
      },
      
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
        currencycode: updates.currencycode,
        // Dual currency fields
        original_balance: updates.original_balance,
        converted_balance: updates.converted_balance,
        display_currency: updates.display_currency,
        exchange_rate_used: updates.exchange_rate_used,
        last_conversion_date: updates.lastConversionDate?.toISOString(),
        conversion_source: updates.conversionSource
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

  // Dual currency functions
  const updateAccountBalance = async (accountId: string, amount: number, type: 'income' | 'expense' | 'transfer') => {
    if (!user) throw new Error('User not authenticated');
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) throw new Error('Account not found');

    const newBalance = type === 'income' ? account.balance + amount : account.balance - amount;
    const newOriginalBalance = type === 'income' ? (account.original_balance || account.balance) + amount : (account.original_balance || account.balance) - amount;
    
    // Update both original and converted balances
    await updateAccount(accountId, {
      balance: newBalance,
      original_balance: newOriginalBalance,
      converted_balance: newBalance, // For now, assume same currency
      lastConversionDate: new Date(),
      conversionSource: 'manual'
    });
  };

  const convertAccountToDisplayCurrency = async (accountId: string, displayCurrency: string, exchangeRate: number) => {
    if (!user) throw new Error('User not authenticated');
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) throw new Error('Account not found');

    const convertedBalance = (account.original_balance || account.balance) * exchangeRate;
    
    await updateAccount(accountId, {
      display_currency: displayCurrency,
      converted_balance: convertedBalance,
      exchange_rate_used: exchangeRate,
      lastConversionDate: new Date(),
      conversionSource: 'api'
    });
  };

  const updateAllAccountConversions = async (displayCurrency: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // This would typically use the currency conversion context
    // For now, we'll update all accounts to use the same display currency
    for (const account of accounts) {
      if (account.currencycode !== displayCurrency) {
        // In a real implementation, you'd get the exchange rate from the currency service
        const exchangeRate = 1.0; // Placeholder - should get from currency service
        await convertAccountToDisplayCurrency(account.id, displayCurrency, exchangeRate);
      }
    }
  };

  // Account Management Features
  const duplicateAccount = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) throw new Error('Account not found');

    const duplicateData = {
      ...account,
      name: `${account.name} (Copy)`,
      balance: 0, // Start with zero balance
      id: undefined,
      userId: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };

    await addAccount(duplicateData);
  };

  const archiveAccount = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('financial_accounts')
      .update({
        is_archived: true,
        is_visible: false,
        status: 'closed'
      })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, isArchived: true, isVisible: false, status: 'closed' }
        : account
    ));
    
    invalidateUserData(user.id);
  };

  const restoreAccount = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('financial_accounts')
      .update({
        is_archived: false,
        is_visible: true,
        status: 'active',
        deleted_at: null
      })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, isArchived: false, isVisible: true, status: 'active', deletedAt: undefined }
        : account
    ));
    
    invalidateUserData(user.id);
  };

  const softDeleteAccount = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('financial_accounts')
      .update({
        deleted_at: new Date().toISOString(),
        is_archived: true,
        is_visible: false,
        status: 'closed'
      })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { 
            ...account, 
            deletedAt: new Date(), 
            isArchived: true, 
            isVisible: false, 
            status: 'closed' 
          }
        : account
    ));
    
    invalidateUserData(user.id);
  };

  const toggleAccountVisibility = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) throw new Error('Account not found');

    const { error } = await supabase
      .from('financial_accounts')
      .update({
        is_visible: !account.isVisible
      })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, isVisible: !acc.isVisible }
        : acc
    ));
    
    invalidateUserData(user.id);
  };

  const toggleAccountPin = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) throw new Error('Account not found');

    const { error } = await supabase
      .from('financial_accounts')
      .update({
        is_primary: !account.isPrimary
      })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) throw error;

    setAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, isPrimary: !acc.isPrimary }
        : acc
    ));
    
    invalidateUserData(user.id);
  };

  // Wrapper function for the interface signature
  const transferBetweenAccounts = async (fromAccountId: string, toAccountId: string, amount: number, description: string) => {
    if (!user) throw new Error('User not authenticated');

    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    const toAccount = accounts.find(acc => acc.id === toAccountId);

    if (!fromAccount || !toAccount) throw new Error('Account not found');

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('account_transfers')
      .insert({
        user_id: user.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: amount,
        description: description,
        transfer_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (transferError) throw transferError;

    // Create transactions for both accounts
    // Outgoing transaction (expense from source account)
    await addTransaction({
      type: 'expense',
      amount: amount,
      category: 'Transfer',
      description: `${description} (to ${toAccount.name})`,
      date: new Date(),
      accountId: fromAccountId,
      affectsBalance: true,
      status: 'completed',
      transferToAccountId: toAccountId,
      // Currency fields
      currencycode: getUserCurrency(),
      originalAmount: amount,
      originalCurrency: getUserCurrency(),
      exchangeRateUsed: 1.0,
      // Payment source tracking
      paymentSource: 'account_transfer',
      sourceEntityId: transfer.id,
      sourceEntityType: 'transfer',
      deductFromBalance: true,
      paymentContext: 'account_transfer'
    } as any);

    // Incoming transaction (income to destination account)
    await addTransaction({
      type: 'income',
      amount: amount,
      category: 'Transfer',
      description: `${description} (from ${fromAccount.name})`,
      date: new Date(),
      accountId: toAccountId,
      affectsBalance: true,
      status: 'completed',
      transferToAccountId: fromAccountId,
      // Currency fields
      currencycode: getUserCurrency(),
      originalAmount: amount,
      originalCurrency: getUserCurrency(),
      exchangeRateUsed: 1.0,
      // Payment source tracking
      paymentSource: 'account_transfer',
      sourceEntityId: transfer.id,
      sourceEntityType: 'transfer',
      deductFromBalance: false,
      paymentContext: 'account_transfer'
    } as any);

    // Add transfer to state
    setAccountTransfers(prev => [transfer, ...prev]);
    
    invalidateUserData(user.id);
  };

  // Internal function for complex transfers
  const transferBetweenAccountsComplex = async (transferData: Omit<AccountTransfer, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('account_transfers')
      .insert({
        user_id: user.id,
        from_account_id: transferData.fromAccountId,
        to_account_id: transferData.toAccountId,
        amount: transferData.amount,
        description: transferData.description,
        transfer_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (transferError) throw transferError;

    // Update account balances
    const fromAccount = accounts.find(acc => acc.id === transferData.fromAccountId);
    const toAccount = accounts.find(acc => acc.id === transferData.toAccountId);

    if (!fromAccount || !toAccount) throw new Error('Account not found');

    // Update from account (debit)
    await updateAccount(transferData.fromAccountId, {
      balance: fromAccount.balance - transferData.amount
    });

    // Update to account (credit)
    await updateAccount(transferData.toAccountId, {
      balance: toAccount.balance + (transferData.convertedAmount || transferData.amount)
    });

    // Add transfer to state
    setAccountTransfers(prev => [transfer, ...prev]);
    
    invalidateUserData(user.id);
  };

  const getAccountSummary = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('get_account_summary', { account_uuid: accountId });

    if (error) throw error;
    return data;
  };

  const getAccountTransfers = async (accountId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('account_transfers')
      .select('*')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const getAccountAnalytics = async (accountId: string, periodStart: Date, periodEnd: Date) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('account_analytics')
      .select('*')
      .eq('account_id', accountId)
      .gte('period_start', periodStart.toISOString().split('T')[0])
      .lte('period_end', periodEnd.toISOString().split('T')[0])
      .order('period_start', { ascending: false });

    if (error) throw error;
    return data;
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    // Enhanced validation with detailed error messages
    const missingFields = [];
    
    if (!transactionData.type) missingFields.push('type');
    if (!transactionData.amount || transactionData.amount <= 0) missingFields.push('amount');
    if (!transactionData.accountId) missingFields.push('accountId');
    if (!transactionData.description) missingFields.push('description');
    if (!transactionData.category) missingFields.push('category');
    if (!transactionData.date) missingFields.push('date');
    if (transactionData.affectsBalance === undefined) missingFields.push('affectsBalance');
    if (!transactionData.status) missingFields.push('status');
    
    if (missingFields.length > 0) {
      console.error('Missing required transaction fields:', missingFields);
      console.error('Transaction data received:', transactionData);
      throw new Error(`Missing required transaction fields: ${missingFields.join(', ')}`);
    }

    // Get primary currency from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('primary_currency')
      .eq('user_id', user.id)
      .single();

    const primaryCurrency = profileData?.primary_currency || 'USD';
    const account = accounts.find(acc => acc.id === transactionData.accountId);
    const accountCurrency = account?.currencycode || primaryCurrency;
    
    // Extract currency information from transaction data
    let nativeAmount = (transactionData as any).native_amount || transactionData.amount;
    let nativeCurrency = (transactionData as any).native_currency || (transactionData as any).currencycode || accountCurrency;
    let nativeSymbol = (transactionData as any).native_symbol || getCurrencyInfo(nativeCurrency)?.symbol || '$';
    
    // Convert to account currency (not primary currency)
    let convertedAmount = (transactionData as any).converted_amount || transactionData.amount;
    let convertedCurrency = accountCurrency; // Always convert to account currency
    let convertedSymbol = getCurrencyInfo(convertedCurrency)?.symbol || '$';
    let exchangeRate = (transactionData as any).exchange_rate || 1.0;
    let exchangeRateUsed = (transactionData as any).exchange_rate_used || 1.0;
    let conversionSource = (transactionData as any).conversion_source || 'manual';

    // If no multi-currency data provided, calculate conversion to account currency
    if (!(transactionData as any).native_amount && nativeCurrency !== convertedCurrency) {
      try {
        console.log(`🔄 Converting to account currency: ${nativeAmount} ${nativeCurrency} → ${convertedCurrency}`);
        exchangeRate = simpleCurrencyService.getRate(nativeCurrency, convertedCurrency);
        convertedAmount = nativeAmount * exchangeRate;
        exchangeRateUsed = exchangeRate;
        conversionSource = 'api';
        console.log(`✅ Account conversion: ${nativeAmount} ${nativeCurrency} = ${convertedAmount.toFixed(2)} ${convertedCurrency} (rate: ${exchangeRate.toFixed(4)})`);
      } catch (error) {
        console.error('Failed to get exchange rate, using fallback:', error);
        // Use fallback rates
        const fallbackRates: { [key: string]: number } = {
          'USD': 1.0, 'EUR': 0.87, 'GBP': 0.76, 'INR': 88.22, 'JPY': 152.0,
          'CAD': 1.38, 'AUD': 1.55, 'CHF': 0.89, 'CNY': 7.15, 'SGD': 1.37
        };
        exchangeRate = (fallbackRates[convertedCurrency] || 1.0) / (fallbackRates[nativeCurrency] || 1.0);
        convertedAmount = nativeAmount * exchangeRate;
        exchangeRateUsed = exchangeRate;
        conversionSource = 'fallback';
        console.log(`⚠️ Fallback conversion: ${nativeAmount} ${nativeCurrency} = ${convertedAmount.toFixed(2)} ${convertedCurrency} (rate: ${exchangeRate.toFixed(4)})`);
      }
    }

    // Calculate primary currency amount for reporting
    let primaryAmount = convertedAmount;
    let primaryCurrencyCode = primaryCurrency;
    if (convertedCurrency !== primaryCurrencyCode) {
      try {
        const primaryRate = simpleCurrencyService.getRate(convertedCurrency, primaryCurrencyCode);
        primaryAmount = convertedAmount * primaryRate;
        console.log(`📊 Primary conversion: ${convertedAmount.toFixed(2)} ${convertedCurrency} = ${primaryAmount.toFixed(2)} ${primaryCurrencyCode} (rate: ${primaryRate.toFixed(4)})`);
      } catch (error) {
        console.warn('Failed to convert to primary currency, using converted amount:', error);
        primaryAmount = convertedAmount;
        primaryCurrencyCode = convertedCurrency;
      }
    }

    // Check for sufficient funds for expense transactions using live converted amount
    if (transactionData.type === 'expense' && transactionData.affectsBalance !== false) {
      if (account) {
        // Allow negative balances for credit cards and investment accounts
        if (account.type !== 'credit_card' && account.type !== 'investment') {
          // Use live converted amount for balance check
          const finalAmount = convertedAmount; // This now uses live rates
          if (account.balance < finalAmount) {
            throw new Error(`Insufficient funds. Account balance (${account.balance.toFixed(2)} ${account.currencycode}) is less than transaction amount (${finalAmount.toFixed(2)} ${convertedCurrency})`);
          }
          console.log(`💰 Balance check: ${account.balance.toFixed(2)} ${account.currencycode} >= ${finalAmount.toFixed(2)} ${convertedCurrency} ✅`);
        }
      } else {
        throw new Error('Account not found');
      }
    }

    // Validate transfer logic
    if ((transactionData.type === 'expense' || transactionData.type === 'income') && transactionData.transferToAccountId) {
      const targetAccount = accounts.find(acc => acc.id === transactionData.transferToAccountId);
      if (!targetAccount) {
        throw new Error('Target account not found');
      }
      if (transactionData.accountId === transactionData.transferToAccountId) {
        throw new Error('Cannot transfer to the same account');
      }
    }

    // Ensure date is properly formatted
    const dateString = transactionData.date instanceof Date 
      ? transactionData.date.toISOString().split('T')[0]
      : new Date(transactionData.date).toISOString().split('T')[0];

    // Use the safe insert function with correct currency conversion
    const { data, error } = await supabase.rpc('safe_insert_transaction_with_conversion', {
      p_user_id: user.id,
      p_type: transactionData.type,
      p_amount: convertedAmount, // Use converted amount (in account currency) for account balance
      p_category: transactionData.category || 'Uncategorized',
      p_description: transactionData.description || '',
      p_date: dateString,
      p_account_id: transactionData.accountId,
      p_currency_code: convertedCurrency, // Use account currency (not primary currency)
      p_affects_balance: transactionData.affectsBalance ?? true,
      p_reason: transactionData.reason || null,
      p_transfer_to_account_id: transactionData.transferToAccountId || null,
      p_status: transactionData.status || 'completed',
      p_goal_id: (transactionData as any).goalId || null,
      p_bill_id: (transactionData as any).billId || null,
      p_liability_id: (transactionData as any).liabilityId || null,
      p_notes: (transactionData as any).notes || null,
      // Multi-currency fields
      p_native_amount: nativeAmount,
      p_native_currency: nativeCurrency,
      p_native_symbol: nativeSymbol,
      p_converted_amount: convertedAmount,
      p_converted_currency: convertedCurrency,
      p_converted_symbol: convertedSymbol,
      p_exchange_rate: exchangeRate, // Exchange rate from native to account currency
      p_exchange_rate_used: exchangeRateUsed, // Exchange rate used
      p_conversion_source: conversionSource, // Conversion source
      // Primary currency fields for reporting
      p_primary_amount: primaryAmount,
      p_primary_currency: primaryCurrencyCode
    });

    if (error) {
      console.error('Supabase transaction insert error:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    // Get the created transaction
    const { data: createdTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching created transaction:', fetchError);
      throw new Error(`Failed to fetch created transaction: ${fetchError.message}`);
    }

    const newTransaction: Transaction = {
      id: createdTransaction.id,
      userId: createdTransaction.user_id,
      type: createdTransaction.type,
      amount: Number(convertedAmount), // Use converted amount for display
      category: createdTransaction.category,
      description: createdTransaction.description,
      date: new Date(createdTransaction.date),
      accountId: createdTransaction.account_id,
      affectsBalance: createdTransaction.affects_balance,
      reason: createdTransaction.reason,
      transferToAccountId: createdTransaction.transfer_to_account_id,
      status: createdTransaction.status,
      createdAt: new Date(createdTransaction.created_at),
      updatedAt: new Date(createdTransaction.updated_at),
      // Currency information
      currencycode: convertedCurrency, // Use account currency
      originalAmount: nativeAmount,
      originalCurrency: nativeCurrency,
      exchange_rate_used: exchangeRateUsed
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Update account balance based on transaction type
    if (newTransaction.affectsBalance !== false) {
      setAccounts(prev => prev.map(account => {
        if (account.id === newTransaction.accountId) {
          // Calculate balance change in account currency
          const balanceChange = newTransaction.type === 'income' 
            ? convertedAmount 
            : -convertedAmount;
          
          const newBalance = (account.balance || 0) + balanceChange;
          
          console.log(`💰 Account balance update: ${account.balance?.toFixed(2)} ${convertedCurrency} + ${balanceChange.toFixed(2)} = ${newBalance.toFixed(2)} ${convertedCurrency}`);
          
          return {
            ...account,
            balance: newBalance,
            last_conversion_date: new Date()
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

  // New Currency Execution Methods
  const executeCurrencyTransaction = async (request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update the execution engine with current accounts
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      // Create new engine instance with current data
      const engine = new (await import('../services/currencyExecutionEngine')).CurrencyExecutionEngine(
        accountBalances,
        'USD', // Primary currency
        user?.id || null // User ID for database logging
      );

      // Execute the transaction
      const result = await engine.execute(request);

      if (result.success) {
        // Update account balance
        const balanceOperation = request.operation === 'transfer' ? 'deduct' : request.operation;
        engine.updateAccountBalance(request.accountId, result.accountAmount, balanceOperation as 'add' | 'deduct');

        // Create transaction record
        const transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          type: request.operation === 'deduct' ? 'expense' : 'income',
          amount: result.accountAmount,
          description: request.description,
          category: 'General',
          date: new Date(),
          accountId: request.accountId,
          affectsBalance: true,
          status: 'completed',
          currencycode: result.accountCurrency,
          // Multi-currency data
          original_amount: result.auditData.originalAmount,
          original_currency: result.auditData.originalCurrency,
          exchange_rate_used: result.exchangeRate || 1
        };

        // Add the transaction
        await addTransaction(transactionData);

        // Update local state
        setAccounts(prev => prev.map(acc => 
          acc.id === request.accountId 
            ? { 
                ...acc, 
                balance: acc.balance + (request.operation === 'add' ? result.accountAmount : -result.accountAmount)
              }
            : acc
        ));
      }

      return result;
    } catch (error: any) {
      console.error('Currency execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeBillPayment = async (billId: string, request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Execute the currency transaction
      const result = await executeCurrencyTransaction(request);

      if (result.success) {
        // Update bill status - mark as completed and set last paid date
        setBills(prev => prev.map(bill => 
          bill.id === billId 
            ? { ...bill, status: 'completed', lastPaidDate: new Date() }
            : bill
        ));
      }

      return result;
    } catch (error: any) {
      console.error('Bill payment execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeLiabilityPayment = async (liabilityId: string, request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Execute the currency transaction
      const result = await executeCurrencyTransaction(request);

      if (result.success) {
        // Update liability balance
        const liability = liabilities.find(l => l.id === liabilityId);
        if (liability) {
          const newRemainingAmount = Math.max(0, liability.remainingAmount - result.accountAmount);
          
          // Update liability remaining amount in local state
          
          // Update local state
          setLiabilities(prev => prev.map(l => 
            l.id === liabilityId 
              ? { ...l, remainingAmount: newRemainingAmount }
              : l
          ));
        }
      }

      return result;
    } catch (error: any) {
      console.error('Liability payment execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeGoalContribution = async (goalId: string, request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Execute the currency transaction
      const result = await executeCurrencyTransaction(request);

      if (result.success) {
        // Update goal progress
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
          const newCurrentAmount = goal.currentAmount + result.primaryAmount;
          
          // Update goal progress in local state
          
          // Update local state
          setGoals(prev => prev.map(g => 
            g.id === goalId 
              ? { ...g, currentAmount: newCurrentAmount }
              : g
          ));
        }
      }

      return result;
    } catch (error: any) {
      console.error('Goal contribution execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeBudgetSpending = async (budgetId: string, request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Execute the currency transaction
      const result = await executeCurrencyTransaction(request);

      if (result.success) {
        // Update budget spending
        const budget = budgets.find(b => b.id === budgetId);
        if (budget) {
          const newSpentAmount = (budget.spent || 0) + result.primaryAmount;
          
          // Update budget in database
          const { error } = await supabase
            .from('budgets')
            .update({ spent: newSpentAmount })
            .eq('id', budgetId);
          
          if (error) throw error;
          
          // Update local state
          setBudgets(prev => prev.map(b => 
            b.id === budgetId 
              ? { ...b, spent: newSpentAmount }
              : b
          ));
        }
      }

      return result;
    } catch (error: any) {
      console.error('Budget spending execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeGoalCreation = async (request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update the execution engine with current accounts
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      // Create new engine instance with current data
      const engine = new (await import('../services/currencyExecutionEngine')).CurrencyExecutionEngine(
        accountBalances,
        'USD', // Primary currency
        user?.id || null // User ID for database logging
      );

      // Execute goal creation
      const result = await engine.executeGoalCreation(request);

      if (result.success) {
        // Create goal with converted amounts
        const goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          title: request.goalName!,
          targetAmount: result.primaryAmount, // Use primary currency amount
          currentAmount: 0,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          category: request.category || 'General',
          priority: 'medium',
          status: 'active',
          description: request.description,
          currencycode: result.primaryCurrency,
          goalType: 'general_savings',
          periodType: 'yearly',
          isRecurring: false,
          withdrawalAmount: 0,
          isWithdrawn: false,
          completionAction: 'waiting',
          // Multi-currency data
          original_currency: result.auditData.originalCurrency,
          exchange_rate_used: result.exchangeRate || 1
        };

        // Add the goal
        await addGoal(goalData);
      }

      return result;
    } catch (error: any) {
      console.error('Goal creation execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeBudgetCreation = async (request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update the execution engine with current accounts
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      // Create new engine instance with current data
      const engine = new (await import('../services/currencyExecutionEngine')).CurrencyExecutionEngine(
        accountBalances,
        'USD', // Primary currency
        user?.id || null // User ID for database logging
      );

      // Execute budget creation
      const result = await engine.executeBudgetCreation(request);

      if (result.success) {
        // Create budget with converted amounts
        const budgetData = {
          name: request.budgetName!,
          amount: result.primaryAmount, // Use primary currency amount
          spentAmount: 0,
          category: request.category || 'General',
          period: request.budgetPeriod || 'monthly',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          // Multi-currency data
          native_amount: result.auditData.originalAmount,
          native_currency: result.auditData.originalCurrency,
          converted_amount: result.primaryAmount,
          converted_currency: result.primaryCurrency,
          exchange_rate: result.exchangeRate || 1,
          conversion_source: result.conversionSource || 'manual'
        };

        // Add the budget
        const { data, error } = await supabase
          .from('budgets')
          .insert([budgetData])
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setBudgets(prev => [...prev, data]);
      }

      return result;
    } catch (error: any) {
      console.error('Budget creation execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeBillCreation = async (request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update the execution engine with current accounts
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      // Create new engine instance with current data
      const engine = new (await import('../services/currencyExecutionEngine')).CurrencyExecutionEngine(
        accountBalances,
        'USD', // Primary currency
        user?.id || null // User ID for database logging
      );

      // Execute bill creation
      const result = await engine.executeBillCreation(request);

      if (result.success) {
        // Create bill with converted amounts
        const billData = {
          title: request.billName!,
          amount: result.primaryAmount, // Use primary currency amount
          currency: result.primaryCurrency,
          dueDate: request.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending',
          category: request.category || 'General',
          description: request.description,
          // Multi-currency data
          native_amount: result.auditData.originalAmount,
          native_currency: result.auditData.originalCurrency,
          converted_amount: result.primaryAmount,
          converted_currency: result.primaryCurrency,
          exchange_rate: result.exchangeRate || 1,
          conversion_source: result.conversionSource || 'manual'
        };

        // Add the bill
        const { data, error } = await supabase
          .from('bills')
          .insert([billData])
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setBills(prev => [...prev, data]);
      }

      return result;
    } catch (error: any) {
      console.error('Bill creation execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeLiabilityCreation = async (request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update the execution engine with current accounts
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      // Create new engine instance with current data
      const engine = new (await import('../services/currencyExecutionEngine')).CurrencyExecutionEngine(
        accountBalances,
        'USD', // Primary currency
        user?.id || null // User ID for database logging
      );

      // Execute liability creation
      const result = await engine.executeLiabilityCreation(request);

      if (result.success) {
        // Create liability with converted amounts
        const liabilityData = {
          name: request.liabilityName!,
          totalAmount: result.primaryAmount, // Use primary currency amount
          remainingAmount: result.primaryAmount,
          currency: result.primaryCurrency,
          type: request.liabilityType || 'loan',
          status: 'active',
          description: request.description,
          // Multi-currency data
          native_amount: result.auditData.originalAmount,
          native_currency: result.auditData.originalCurrency,
          converted_amount: result.primaryAmount,
          converted_currency: result.primaryCurrency,
          exchange_rate: result.exchangeRate || 1,
          conversion_source: result.conversionSource || 'manual'
        };

        // Add the liability
        const { data, error } = await supabase
          .from('enhanced_liabilities')
          .insert([liabilityData])
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setLiabilities(prev => [...prev, data]);
      }

      return result;
    } catch (error: any) {
      console.error('Liability creation execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
  };

  const executeAccountCreation = async (request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update the execution engine with current accounts
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      // Create new engine instance with current data
      const engine = new (await import('../services/currencyExecutionEngine')).CurrencyExecutionEngine(
        accountBalances,
        'USD', // Primary currency
        user?.id || null // User ID for database logging
      );

      // Execute account creation
      const result = await engine.executeAccountCreation(request);

      if (result.success) {
        // Create account with converted amounts
        const accountData: CreateAccountData = {
          name: request.accountName!,
          type: request.accountType! as 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment' | 'goals_vault',
          balance: result.accountAmount, // Use account currency amount
          currency: result.accountCurrency
        };

        // Add the account
        await addAccount(accountData);
      }

      return result;
    } catch (error: any) {
      console.error('Account creation execution failed:', error);
      return {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: 'USD',
        error: error.message,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };
    }
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

    // Validate required fields
    if (!goalData.title || goalData.title.trim().length === 0) {
      throw new Error('Goal title is required');
    }
    if (!goalData.targetAmount || goalData.targetAmount <= 0) {
      throw new Error('Target amount must be greater than 0');
    }
    if (!goalData.targetDate || goalData.targetDate <= new Date()) {
      throw new Error('Target date must be in the future');
    }

    // Get currency information
    const goalCurrency = (goalData as any).currencycode || getUserCurrency();
    const primaryCurrency = getUserCurrency();
    const needsConversion = goalCurrency !== primaryCurrency;
    
    // Calculate currency conversion if needed
    let convertedTargetAmount = goalData.targetAmount;
    let exchangeRate = 1.0;
    
    if (needsConversion) {
      // Import currency conversion function
      const { convertCurrency } = await import('../utils/currency-converter');
      exchangeRate = await convertCurrency(1, goalCurrency, primaryCurrency, primaryCurrency) || 1.0;
      convertedTargetAmount = goalData.targetAmount * exchangeRate;
    }

    try {
      // Use the safe insert function
      const { data, error } = await supabase.rpc('frontend_add_goal', {
        p_user_id: user.id,
        p_title: goalData.title,
        p_description: goalData.description || '',
        p_target_amount: convertedTargetAmount,
        p_target_date: goalData.targetDate.toISOString().split('T')[0],
        p_category: goalData.category,
        p_currency_code: goalCurrency,
        p_account_id: goalData.accountId || null,
        p_goal_type: goalData.goalType || 'general_savings',
        p_target_category: goalData.targetCategory || null,
        p_period_type: goalData.periodType || 'monthly',
        p_custom_period_days: goalData.customPeriodDays || null,
        p_is_recurring: goalData.isRecurring || false,
        p_recurring_frequency: goalData.recurringFrequency || (goalData.isRecurring ? 'monthly' : null),
        p_priority: goalData.priority || 'medium',
        p_status: goalData.status || 'active'
      });

      if (error) {
        console.error('Database error creating goal:', error);
        if (error.code === '23505') {
          throw new Error('A goal with this title already exists. Please choose a different title.');
        } else if (error.code === '23503') {
          throw new Error('Invalid account reference. Please select a valid account.');
        } else if (error.code === '23514') {
          throw new Error('Invalid data provided. Please check your input values.');
        } else {
          throw new Error(`Failed to create goal: ${error.message}`);
        }
      }

      // Get the created goal
      const { data: createdGoal, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Error fetching created goal:', fetchError);
        throw new Error(`Failed to fetch created goal: ${fetchError.message}`);
      }

      const newGoal: Goal = {
        id: createdGoal.id,
        userId: createdGoal.user_id,
        title: createdGoal.title,
        description: createdGoal.description,
        targetAmount: Number(createdGoal.target_amount),
        currentAmount: Number(createdGoal.current_amount || 0),
        targetDate: new Date(createdGoal.target_date),
        category: createdGoal.category,
        accountId: createdGoal.account_id,
        goalType: createdGoal.goal_type || 'general_savings',
        targetCategory: createdGoal.target_category,
        periodType: createdGoal.period_type || 'monthly',
        customPeriodDays: createdGoal.custom_period_days,
        isRecurring: createdGoal.is_recurring || false,
        recurringFrequency: createdGoal.recurring_frequency,
        priority: createdGoal.priority || 'medium',
        status: createdGoal.status || 'active',
        createdAt: new Date(createdGoal.created_at),
        updatedAt: new Date(createdGoal.updated_at),
        // Add completion and management fields
      completionDate: createdGoal.completion_date ? new Date(createdGoal.completion_date) : undefined,
      withdrawalDate: createdGoal.withdrawal_date ? new Date(createdGoal.withdrawal_date) : undefined,
      withdrawalAmount: Number(createdGoal.withdrawal_amount || 0),
      isWithdrawn: createdGoal.is_withdrawn || false,
      completionAction: createdGoal.completion_action || 'waiting',
      originalTargetAmount: createdGoal.original_target_amount ? Number(createdGoal.original_target_amount) : undefined,
      extendedTargetAmount: createdGoal.extended_target_amount ? Number(createdGoal.extended_target_amount) : undefined,
      completionNotes: createdGoal.completion_notes,
      currencycode: createdGoal.currency_code || primaryCurrency,
      // Currency conversion fields
      original_currency: createdGoal.original_currency || goalCurrency,
      exchange_rate_used: createdGoal.exchange_rate_used || exchangeRate,
      original_current_amount: createdGoal.original_current_amount ? Number(createdGoal.original_current_amount) : undefined
    };

    setGoals(prev => [newGoal, ...prev]);

    // Create account links for account-specific goals
    if (goalData.activityScope === 'account_specific' && (goalData as any).accountIds && (goalData as any).accountIds.length > 0) {
      const accountLinks = (goalData as any).accountIds.map((accountId: any, index: number) => ({
        activity_type: 'goal',
        activity_id: data.id,
        account_id: accountId,
        user_id: user.id,
        is_primary: index === 0
      }));

      await supabase
        .from('activity_account_links')
        .insert(accountLinks);
    }

    return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
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

  // Map liability type to the correct type field value
  const mapLiabilityTypeToType = (liabilityType: string): string => {
    const typeMapping: { [key: string]: string } = {
      'credit_card': 'credit_card',
      'personal_loan': 'loan',
      'student_loan': 'loan',
      'education_loan': 'loan',
      'auto_loan': 'loan',
      'home_loan': 'mortgage',
      'mortgage': 'mortgage',
      'bnpl': 'purchase',
      'family_debt': 'loan',
      'gold_loan': 'loan',
      'utility_debt': 'other',
      'tax_debt': 'other',
      'international_debt': 'other',
      'business_loan': 'loan',
      'medical_debt': 'other',
      'installment': 'purchase'
    };
    return typeMapping[liabilityType] || 'other';
  };

  const addLiability = async (liabilityData: Omit<EnhancedLiability, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    // Get currency information
    const liabilityCurrency = (liabilityData as any).currencycode || getUserCurrency();
    const primaryCurrency = getUserCurrency();
    const needsConversion = liabilityCurrency !== primaryCurrency;
    
    // Calculate currency conversion if needed
    let convertedTotalAmount = liabilityData.totalAmount;
    let convertedRemainingAmount = liabilityData.remainingAmount;
    let convertedMonthlyPayment = liabilityData.monthlyPayment;
    let convertedMinimumPayment = liabilityData.minimumPayment;
    let exchangeRate = 1.0;
    
    if (needsConversion) {
      try {
        // Use live exchange rate service
        exchangeRate = simpleCurrencyService.getRate(liabilityCurrency, primaryCurrency);
        convertedTotalAmount = liabilityData.totalAmount * exchangeRate;
        convertedRemainingAmount = liabilityData.remainingAmount * exchangeRate;
        convertedMonthlyPayment = liabilityData.monthlyPayment * exchangeRate;
        convertedMinimumPayment = liabilityData.minimumPayment * exchangeRate;
        console.log(`✅ Live conversion for liability: ${liabilityData.totalAmount} ${liabilityCurrency} = ${convertedTotalAmount.toFixed(2)} ${primaryCurrency} (rate: ${exchangeRate.toFixed(4)})`);
      } catch (error) {
        console.error('Failed to get live exchange rate, using fallback:', error);
        // Fallback to hardcoded rates
        const fallbackRates: { [key: string]: number } = {
          'USD': 1.0, 'EUR': 0.87, 'GBP': 0.76, 'INR': 88.22, 'JPY': 152.0,
          'CAD': 1.38, 'AUD': 1.55, 'CHF': 0.89, 'CNY': 7.15, 'SGD': 1.37
        };
        exchangeRate = (fallbackRates[primaryCurrency] || 1.0) / (fallbackRates[liabilityCurrency] || 1.0);
        convertedTotalAmount = liabilityData.totalAmount * exchangeRate;
        convertedRemainingAmount = liabilityData.remainingAmount * exchangeRate;
        convertedMonthlyPayment = liabilityData.monthlyPayment * exchangeRate;
        convertedMinimumPayment = liabilityData.minimumPayment * exchangeRate;
        console.log(`⚠️ Fallback conversion for liability: ${liabilityData.totalAmount} ${liabilityCurrency} = ${convertedTotalAmount.toFixed(2)} ${primaryCurrency} (rate: ${exchangeRate.toFixed(4)})`);
      }
    }

    const { data, error } = await supabase
      .from('liabilities')
      .insert({
        user_id: user.id,
        name: liabilityData.name,
        type: mapLiabilityTypeToType(liabilityData.liabilityType),
        liability_type: liabilityData.liabilityType,
        notes: liabilityData.description,
        liability_status: liabilityData.liabilityStatus || 'new',
        total_amount: convertedTotalAmount, // Store in primary currency
        remaining_amount: convertedRemainingAmount, // Store in primary currency
        interest_rate: liabilityData.interestRate,
        monthly_payment: convertedMonthlyPayment, // Store in primary currency
        minimum_payment: convertedMinimumPayment, // Store in primary currency
        payment_day: liabilityData.paymentDay,
        loan_term_months: liabilityData.loanTermMonths,
        remaining_term_months: liabilityData.remainingTermMonths,
        start_date: liabilityData.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: liabilityData.dueDate?.toISOString().split('T')[0] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year from now
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
        original_amount: liabilityData.originalAmount || liabilityData.original_amount || liabilityData.totalAmount,
        original_term_months: liabilityData.originalTermMonths,
        original_start_date: liabilityData.originalStartDate?.toISOString().split('T')[0],
        modification_count: liabilityData.modificationCount || 0,
        last_modified_date: liabilityData.lastModifiedDate?.toISOString(),
        modification_reason: liabilityData.modificationReason,
        type_specific_data: liabilityData.typeSpecificData || {},
        currency_code: primaryCurrency, // Store primary currency
        activity_scope: liabilityData.activityScope || 'general',
        priority: liabilityData.priority || 'medium',
        // Currency tracking fields
        original_currency: liabilityCurrency, // Store original currency
        exchange_rate_used: exchangeRate,
        // Multi-currency fields
        native_currency: liabilityCurrency,
        native_amount: liabilityData.totalAmount,
        native_symbol: getCurrencySymbol(liabilityCurrency),
        converted_amount: convertedTotalAmount,
        converted_currency: primaryCurrency,
        converted_symbol: getCurrencySymbol(primaryCurrency),
        exchange_rate: exchangeRate,
        conversion_source: needsConversion ? 'api' : 'manual',
        last_conversion_date: new Date().toISOString()
      })
      .select('*');

    if (error) throw error;

    // Handle both single object and array responses
    const dbResponse = Array.isArray(data) ? data[0] : data;

    const newLiability: EnhancedLiability = {
      id: dbResponse.id,
      userId: dbResponse.user_id,
      name: dbResponse.name,
      liabilityType: dbResponse.liability_type,
      description: dbResponse.description,
      liabilityStatus: dbResponse.liability_status || 'new',
      totalAmount: Number(dbResponse.total_amount),
      remainingAmount: Number(dbResponse.remaining_amount),
      interestRate: Number(dbResponse.interest_rate || 0),
      monthlyPayment: Number(dbResponse.monthly_payment || 0),
      minimumPayment: Number(dbResponse.minimum_payment || 0),
      paymentDay: dbResponse.payment_day,
      loanTermMonths: dbResponse.loan_term_months,
      remainingTermMonths: dbResponse.remaining_term_months,
      startDate: new Date(dbResponse.start_date),
      dueDate: dbResponse.due_date ? new Date(dbResponse.due_date) : undefined,
      nextPaymentDate: dbResponse.next_payment_date ? new Date(dbResponse.next_payment_date) : undefined,
      linkedAssetId: dbResponse.linked_asset_id,
      isSecured: dbResponse.is_secured,
      disbursementAccountId: dbResponse.disbursement_account_id,
      defaultPaymentAccountId: dbResponse.default_payment_account_id,
      providesFunds: dbResponse.provides_funds,
      affectsCreditScore: dbResponse.affects_credit_score,
      status: dbResponse.status,
      isActive: dbResponse.is_active,
      autoGenerateBills: dbResponse.auto_generate_bills,
      billGenerationDay: dbResponse.bill_generation_day,
      sendReminders: dbResponse.send_reminders ?? true,
      reminderDays: dbResponse.reminder_days ?? 7,
      paymentStrategy: dbResponse.payment_strategy || 'equal',
      paymentAccounts: dbResponse.payment_accounts || [],
      paymentPercentages: dbResponse.payment_percentages || [],
      originalAmount: dbResponse.original_amount,
      originalTermMonths: dbResponse.original_term_months,
      originalStartDate: dbResponse.original_start_date ? new Date(dbResponse.original_start_date) : undefined,
      modificationCount: dbResponse.modification_count || 0,
      lastModifiedDate: dbResponse.last_modified_date ? new Date(dbResponse.last_modified_date) : undefined,
      modificationReason: dbResponse.modification_reason,
      typeSpecificData: dbResponse.type_specific_data || {},
      currencyCode: dbResponse.currency_code || getUserCurrency(),
      activityScope: dbResponse.activity_scope || 'general',
      accountIds: dbResponse.payment_accounts || [],
      targetCategory: dbResponse.target_category,
      priority: dbResponse.priority || 'medium',
      createdAt: new Date(dbResponse.created_at),
      updatedAt: new Date(dbResponse.updated_at)
    };

    setLiabilities(prev => [newLiability, ...prev]);

    // Create activity account links if account-specific
    if (liabilityData.activityScope === 'account_specific' && liabilityData.accountIds && liabilityData.accountIds.length > 0) {
      const accountLinks = liabilityData.accountIds.map((accountId, index) => ({
        activity_type: 'liability',
        activity_id: dbResponse.id,
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
      await createLiabilityBills(dbResponse.id, liabilityData, user.id);
    }

    // Create calendar events for liability payments
    await createLiabilityCalendarEvents(dbResponse.id, liabilityData, user.id);
  };

  // Helper function to create bills for liability
  const createLiabilityBills = async (liabilityId: string, liabilityInfo: any, userId: string) => {
    try {
      const billInsertData = {
        user_id: userId,
        title: `${liabilityInfo.name} Payment`,
        description: `Monthly payment for ${liabilityInfo.name}`,
        category: 'Debt Payment',
        bill_type: 'fixed',
        amount: liabilityInfo.monthlyPayment,
        frequency: 'monthly',
        due_date: new Date().toISOString().split('T')[0],
        next_due_date: new Date().toISOString().split('T')[0],
        default_account_id: liabilityInfo.defaultPaymentAccountId,
        auto_pay: false,
        linked_liability_id: liabilityId,
        is_emi: true,
        is_active: true,
        is_essential: true,
        reminder_days_before: 3,
        send_due_date_reminder: true,
        send_overdue_reminder: true,
        activity_scope: liabilityInfo.activityScope || 'general',
        target_category: liabilityInfo.targetCategory || 'debt_payment',
        linked_accounts_count: liabilityInfo.accountIds?.length || 0,
        priority: liabilityInfo.priority || 'high',
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
      if (liabilityInfo.activityScope === 'account_specific' && liabilityInfo.accountIds && liabilityInfo.accountIds.length > 0) {
        const accountLinks = liabilityInfo.accountIds.map((accountId: string, index: number) => ({
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
  const createLiabilityCalendarEvents = async (liabilityId: string, liabilityInfo: any, userId: string) => {
    try {
      if (!liabilityInfo.monthlyPayment || liabilityInfo.monthlyPayment <= 0) return;

      const startDate = new Date(liabilityInfo.startDate || new Date());
      const paymentDay = liabilityInfo.paymentDay || 1;
      
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
          title: `${liabilityInfo.name} Payment Due`,
          description: `Monthly payment of $${liabilityInfo.monthlyPayment} for ${liabilityInfo.name}`,
          event_date: eventDate.toISOString().split('T')[0],
          is_all_day: true,
          is_recurring: true,
          recurring_pattern: 'monthly',
          source_id: liabilityId,
          source_type: 'liability',
          priority: liabilityInfo.priority || 'high',
          is_completed: false
        };

        await supabase
          .from('calendar_events')
          .insert(eventData);
      }

      // Calendar events will be loaded when needed
      // await loadCalendarEvents();
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

    // Get currency information
    const budgetCurrency = (budgetData as any).currencycode || getUserCurrency();
    const primaryCurrency = getUserCurrency();
    const needsConversion = budgetCurrency !== primaryCurrency;
    
    // Calculate currency conversion if needed
    let convertedAmount = budgetData.amount;
    let exchangeRate = 1.0;
    
    if (needsConversion) {
      // Import currency conversion function
      const { convertCurrency } = await import('../utils/currency-converter');
      exchangeRate = await convertCurrency(1, budgetCurrency, primaryCurrency, primaryCurrency) || 1.0;
      convertedAmount = budgetData.amount * exchangeRate;
    }

    try {
      // Use the safe insert function
      const { data, error } = await supabase.rpc('frontend_add_budget', {
        p_user_id: user.id,
        p_category: budgetData.category,
        p_amount: convertedAmount,
        p_period: budgetData.period,
        p_activity_scope: budgetData.activityScope || 'general',
        p_linked_accounts_count: 0
      });

      if (error) {
        console.error('Database error creating budget:', error);
        throw new Error(`Failed to create budget: ${error.message}`);
      }

      // Get the created budget
      const { data: createdBudget, error: fetchError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Error fetching created budget:', fetchError);
        throw new Error(`Failed to fetch created budget: ${fetchError.message}`);
      }

      const newBudget: Budget = {
        id: createdBudget.id,
        userId: createdBudget.user_id,
        category: createdBudget.category,
        amount: Number(createdBudget.amount),
        spent: Number(createdBudget.spent || 0),
        period: createdBudget.period,
        createdAt: new Date(createdBudget.created_at),
        updatedAt: new Date(createdBudget.updated_at),
        activityScope: createdBudget.activity_scope || 'general'
      };

      setBudgets(prev => [...prev, newBudget]);
      await invalidateUserData(user.id);
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
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
    
    // Check for budget warnings
    const updatedBudget = { ...budgets.find(b => b.id === id), ...updates };
    if (updatedBudget && updatedBudget.amount && updatedBudget.spent) {
      const spentPercentage = (updatedBudget.spent / updatedBudget.amount) * 100;
      if (spentPercentage >= 80) {
        sendBudgetWarning(updatedBudget.category || 'Unknown', updatedBudget.spent, updatedBudget.amount);
      }
    }
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

    // Validate required fields
    if (!billData.title || billData.title.trim().length === 0) {
      throw new Error('Bill title is required');
    }
    if (!billData.amount || billData.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (!billData.dueDate || billData.dueDate <= new Date()) {
      throw new Error('Due date must be in the future');
    }

    // Get currency information
    const billCurrency = (billData as any).currencycode || getUserCurrency();
    const primaryCurrency = getUserCurrency();
    const needsConversion = billCurrency !== primaryCurrency;
    
    // Calculate currency conversion if needed
    let convertedAmount = billData.amount;
    let exchangeRate = 1.0;
    let conversionSource = 'manual';
    
    if (needsConversion) {
      try {
        // Use live exchange rate service for September 2025
        exchangeRate = simpleCurrencyService.getRate(billCurrency, primaryCurrency);
      convertedAmount = billData.amount * exchangeRate;
        conversionSource = 'api';
      } catch (error) {
        console.error('Failed to get live exchange rate, using fallback:', error);
        // Fallback to hardcoded rates
        const fallbackRates: { [key: string]: number } = {
          'USD': 1.0, 'EUR': 0.87, 'GBP': 0.76, 'INR': 88.22, 'JPY': 152.0,
          'CAD': 1.38, 'AUD': 1.55, 'CHF': 0.89, 'CNY': 7.15, 'SGD': 1.37
        };
        exchangeRate = (fallbackRates[primaryCurrency] || 1.0) / (fallbackRates[billCurrency] || 1.0);
        convertedAmount = billData.amount * exchangeRate;
        conversionSource = 'fallback';
      }
    }

    try {
      // Use the safe insert function
      const { data, error } = await supabase.rpc('frontend_add_bill', {
        p_user_id: user.id,
        p_title: billData.title,
        p_category: billData.category,
        p_bill_type: billData.billType || 'fixed',
        p_amount: convertedAmount,
        p_frequency: billData.frequency,
        p_due_date: billData.dueDate.toISOString().split('T')[0],
        p_next_due_date: billData.nextDueDate.toISOString().split('T')[0],
        p_currency_code: billCurrency,
        p_default_account_id: billData.defaultAccountId || null,
        p_description: billData.description || null,
        p_estimated_amount: billData.estimatedAmount || null,
        p_custom_frequency_days: billData.customFrequencyDays || null,
        p_last_paid_date: billData.lastPaidDate?.toISOString().split('T')[0] || null,
        p_auto_pay: billData.autoPay || false,
        p_linked_liability_id: billData.linkedLiabilityId || null,
        p_is_emi: billData.isEmi || false,
        p_is_essential: billData.isEssential || false,
        p_reminder_days_before: billData.reminderDaysBefore || 3,
        p_send_due_date_reminder: billData.sendDueDateReminder || false,
        p_send_overdue_reminder: billData.sendOverdueReminder || false,
        // Multi-currency fields
        p_native_amount: billData.amount,
        p_native_currency: billCurrency,
        p_converted_amount: convertedAmount,
        p_converted_currency: primaryCurrency,
        p_exchange_rate: exchangeRate,
        p_conversion_source: conversionSource,
        p_last_conversion_date: new Date().toISOString()
      });

      if (error) {
        console.error('Database error creating bill:', error);
        throw new Error(`Failed to create bill: ${error.message}`);
      }

      // Get the created bill
      const { data: createdBill, error: fetchError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Error fetching created bill:', fetchError);
        throw new Error(`Failed to fetch created bill: ${fetchError.message}`);
      }

      const newBill: Bill = {
        id: createdBill.id,
        userId: createdBill.user_id,
        title: createdBill.title,
        description: createdBill.description,
        category: createdBill.category,
        billType: createdBill.bill_type,
        amount: Number(createdBill.amount),
        estimatedAmount: createdBill.estimated_amount ? Number(createdBill.estimated_amount) : undefined,
        frequency: createdBill.frequency,
        customFrequencyDays: createdBill.custom_frequency_days,
        dueDate: new Date(createdBill.due_date),
        nextDueDate: new Date(createdBill.next_due_date),
        lastPaidDate: createdBill.last_paid_date ? new Date(createdBill.last_paid_date) : undefined,
        defaultAccountId: createdBill.default_account_id,
        autoPay: createdBill.auto_pay || false,
        linkedLiabilityId: createdBill.linked_liability_id,
        isEmi: createdBill.is_emi || false,
        isActive: createdBill.is_active,
        isEssential: createdBill.is_essential || false,
        reminderDaysBefore: createdBill.reminder_days_before || 3,
        sendDueDateReminder: createdBill.send_due_date_reminder || false,
        sendOverdueReminder: createdBill.send_overdue_reminder || false,
        billCategory: createdBill.bill_category || 'general',
        targetCategory: createdBill.target_category,
        isRecurring: createdBill.is_recurring || false,
        paymentMethod: createdBill.payment_method || 'bank_transfer',
        notes: createdBill.notes || '',
        priority: createdBill.priority || 'medium',
        status: createdBill.status || 'active',
        activityScope: createdBill.activity_scope || 'general',
        accountIds: [], // Will be loaded separately from activity_account_links
        linkedAccountsCount: createdBill.linked_accounts_count || 0,
        // New fields
        currencycode: createdBill.currency_code || getUserCurrency(),
        isIncome: createdBill.is_income || false,
        billStage: createdBill.bill_stage || 'pending',
        movedToDate: createdBill.moved_to_date ? new Date(createdBill.moved_to_date) : undefined,
        stageReason: createdBill.stage_reason,
        isVariableAmount: createdBill.is_variable_amount || false,
        minAmount: createdBill.min_amount ? Number(createdBill.min_amount) : undefined,
        maxAmount: createdBill.max_amount ? Number(createdBill.max_amount) : undefined,
        completionAction: createdBill.completion_action || 'continue',
        completionDate: createdBill.completion_date ? new Date(createdBill.completion_date) : undefined,
        completionNotes: createdBill.completion_notes,
        originalAmount: createdBill.original_amount ? Number(createdBill.original_amount) : undefined,
        extendedAmount: createdBill.extended_amount ? Number(createdBill.extended_amount) : undefined,
        isArchived: createdBill.is_archived || false,
        archivedDate: createdBill.archived_date ? new Date(createdBill.archived_date) : undefined,
        archivedReason: createdBill.archived_reason,
        createdAt: new Date(createdBill.created_at),
        updatedAt: new Date(createdBill.updated_at)
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

      return newBill;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
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
        currency_code: updates.currencycode,
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

  // Receipt functions
  const generatePaymentReceipt = (paymentData: any) => {
    setCurrentReceipt(paymentData);
    setShowReceipt(true);
  };

  const hideReceipt = () => {
    setShowReceipt(false);
    setCurrentReceipt(null);
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
    addAccount,
    updateAccount,
    deleteAccount,
    duplicateAccount,
    archiveAccount,
    restoreAccount,
    softDeleteAccount,
    toggleAccountVisibility,
    toggleAccountPin,
    getAccountSummary,
    getAccountTransfers,
    getAccountAnalytics,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // New Currency Execution Methods
    executeCurrencyTransaction,
    executeBillPayment,
    executeLiabilityPayment,
    executeGoalContribution,
    executeBudgetSpending,
    
    // Creation methods with currency conversion
    executeGoalCreation,
    executeBudgetCreation,
    executeBillCreation,
    executeLiabilityCreation,
    executeAccountCreation,
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
    transferBetweenAccountsComplex,
    getGoalsVaultAccount,
    ensureGoalsVaultAccount,
    createGoalsVaultAccount,
    cleanupDuplicateGoalsVaults,
    updateAccountBalance,
    convertAccountToDisplayCurrency,
    updateAllAccountConversions,
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
    pauseBill,
    resumeBill,
    completeBill,
    cancelBill,
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
    stats,
    
    // Receipt functions
    generatePaymentReceipt,
    showReceipt,
    currentReceipt,
    hideReceipt,
    
    // Currency helper
    getUserCurrency
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

// Safe version of useFinance that doesn't throw errors
export const useFinanceSafe = () => {
  const context = useContext(FinanceContext);
  return context;
};
