/**
 * Finance Manager
 * Handles all financial data operations with offline support
 */

import { offlineStorage } from './offline-storage';
import { authManager } from './auth';
import { Database } from '../types/supabase';

// Type definitions
export type FinancialAccount = Database['public']['Tables']['financial_accounts']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type Budget = Database['public']['Tables']['budgets']['Row'];
export type Liability = Database['public']['Tables']['liabilities']['Row'];
export type Bill = Database['public']['Tables']['bills']['Row'];
export type RecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row'];

export interface CreateAccountData {
  name: string;
  type: FinancialAccount['type'];
  balance?: number;
  institution?: string;
  platform?: string;
  account_number?: string;
  currency?: string;
}

export interface CreateTransactionData {
  account_id: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  date?: string;
  transfer_to_account_id?: string;
  notes?: string;
}

export interface CreateGoalData {
  name: string;
  target_amount: number;
  target_date: string;
  category: string;
  description?: string;
  account_id?: string;
}

export interface CreateBudgetData {
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  account_id?: string;
}

export interface CreateLiabilityData {
  name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  due_date: string;
  account_id?: string;
}

export interface CreateBillData {
  title: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'one_time';
  due_date: string;
  description?: string;
  default_account_id?: string;
}

class FinanceManager {
  private userId: string | null = null;

  constructor() {
    // Subscribe to auth changes
    authManager.subscribe((authState) => {
      this.userId = authState.user?.id || null;
    });
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private ensureAuthenticated() {
    if (!this.userId) {
      throw new Error('User must be authenticated to perform this action');
    }
  }

  // Financial Accounts Management
  async createAccount(data: CreateAccountData): Promise<FinancialAccount> {
    this.ensureAuthenticated();

    const accountData = {
      user_id: this.userId!,
      name: data.name,
      type: data.type,
      balance: data.balance || 0,
      institution: data.institution || null,
      platform: data.platform || null,
      account_number: data.account_number || null,
      is_visible: true,
              currencycode: data.currency || 'USD'
    };

    return await offlineStorage.create<FinancialAccount>('financial_accounts', accountData);
  }

  async getAccounts(): Promise<FinancialAccount[]> {
    this.ensureAuthenticated();
    return await offlineStorage.getAll<FinancialAccount>('financial_accounts', this.userId!);
  }

  async updateAccount(id: string, updates: Partial<FinancialAccount>): Promise<FinancialAccount> {
    this.ensureAuthenticated();
    return await offlineStorage.update<FinancialAccount>('financial_accounts', id, updates);
  }

  async deleteAccount(id: string): Promise<void> {
    this.ensureAuthenticated();
    
    // Check if account has transactions
    const transactions = await this.getTransactions();
    const hasTransactions = transactions.some(t => t.account_id === id);
    
    if (hasTransactions) {
      throw new Error('Cannot delete account with existing transactions');
    }

    await offlineStorage.delete('financial_accounts', id);
  }

  // Transactions Management
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    this.ensureAuthenticated();

    const transactionData = {
      user_id: this.userId!,
      account_id: data.account_id,
      amount: data.amount,
      category: data.category,
      description: data.description,
      type: data.type,
      date: data.date || new Date().toISOString(),
      transfer_to_account_id: data.transfer_to_account_id || null,
      notes: data.notes || null,
      affects_balance: true,
      exchange_rate: 1,
      is_refund: false,
      is_split: false,
      status: 'completed' as const
    };

    const transaction = await offlineStorage.create<Transaction>('transactions', transactionData);

    // Update account balance if transaction affects balance
    if (transaction.affects_balance) {
      await this.updateAccountBalance(transaction.account_id, transaction.amount, transaction.type);
    }

    // If it's a transfer, create the corresponding transaction for the target account
    if (data.type === 'transfer' && data.transfer_to_account_id) {
      const transferTransaction = {
        ...transactionData,
        account_id: data.transfer_to_account_id,
        amount: data.amount,
        type: 'income' as const,
        description: `Transfer from ${data.description}`,
        transfer_to_account_id: data.account_id
      };

      const transfer = await offlineStorage.create<Transaction>('transactions', transferTransaction);
      await this.updateAccountBalance(transfer.account_id, transfer.amount, transfer.type);
    }

    return transaction;
  }

  async getTransactions(accountId?: string): Promise<Transaction[]> {
    this.ensureAuthenticated();
    const transactions = await offlineStorage.getAll<Transaction>('transactions', this.userId!);
    
    if (accountId) {
      return transactions.filter(t => t.account_id === accountId);
    }
    
    return transactions;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    this.ensureAuthenticated();
    return await offlineStorage.update<Transaction>('transactions', id, updates);
  }

  async deleteTransaction(id: string): Promise<void> {
    this.ensureAuthenticated();
    
    const transaction = await offlineStorage.getById<Transaction>('transactions', id);
    if (transaction) {
      // Reverse the account balance change
      if (transaction.affects_balance) {
        const reverseAmount = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        await this.updateAccountBalance(transaction.account_id, reverseAmount, transaction.type);
      }
    }

    await offlineStorage.delete('transactions', id);
  }

  private async updateAccountBalance(accountId: string, amount: number, type: 'income' | 'expense' | 'transfer') {
    const account = await offlineStorage.getById<FinancialAccount>('financial_accounts', accountId);
    if (!account) return;

    const balanceChange = type === 'income' ? amount : -amount;
    const newBalance = Math.max(0, account.balance + balanceChange);

    await offlineStorage.update<FinancialAccount>('financial_accounts', accountId, {
      balance: newBalance
    });
  }

  // Goals Management
  async createGoal(data: CreateGoalData): Promise<Goal> {
    this.ensureAuthenticated();

    const goalData = {
      user_id: this.userId!,
      category: data.category,
      target_amount: data.target_amount,
      target_date: data.target_date,
      description: data.description || null,
      account_id: data.account_id || null,
      current_amount: 0,
      is_archived: false
    };

    return await offlineStorage.create<Goal>('goals', goalData);
  }

  async getGoals(): Promise<Goal[]> {
    this.ensureAuthenticated();
    return await offlineStorage.getAll<Goal>('goals', this.userId!);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    this.ensureAuthenticated();
    return await offlineStorage.update<Goal>('goals', id, updates);
  }

  async deleteGoal(id: string): Promise<void> {
    this.ensureAuthenticated();
    await offlineStorage.delete('goals', id);
  }

  async addToGoal(goalId: string, amount: number, fromAccountId: string, description?: string): Promise<Transaction> {
    this.ensureAuthenticated();

    const goal = await offlineStorage.getById<Goal>('goals', goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Create transaction
    const transaction = await this.createTransaction({
      account_id: fromAccountId,
      amount: amount,
      category: 'Savings',
      description: description || `Contribution to ${goal.category} goal`,
      type: 'expense'
    });

    // Update goal
    const newCurrentAmount = (goal.current_amount || 0) + amount;
    await this.updateGoal(goalId, { current_amount: newCurrentAmount });

    return transaction;
  }

  async withdrawFromGoal(goalId: string, amount: number, toAccountId: string, description?: string): Promise<Transaction> {
    this.ensureAuthenticated();

    const goal = await offlineStorage.getById<Goal>('goals', goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    if ((goal.current_amount || 0) < amount) {
      throw new Error('Insufficient funds in goal');
    }

    // Create transaction
    const transaction = await this.createTransaction({
      account_id: toAccountId,
      amount: amount,
      category: 'Savings',
      description: description || `Withdrawal from ${goal.category} goal`,
      type: 'income'
    });

    // Update goal
    const newCurrentAmount = (goal.current_amount || 0) - amount;
    await this.updateGoal(goalId, { current_amount: newCurrentAmount });

    return transaction;
  }

  // Budgets Management
  async createBudget(data: CreateBudgetData): Promise<Budget> {
    this.ensureAuthenticated();

    const budgetData = {
      user_id: this.userId!,
      category: data.category,
      amount: data.amount,
      period: data.period,
      account_id: data.account_id || null,
      spent: 0
    };

    return await offlineStorage.create<Budget>('budgets', budgetData);
  }

  async getBudgets(): Promise<Budget[]> {
    this.ensureAuthenticated();
    return await offlineStorage.getAll<Budget>('budgets', this.userId!);
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    this.ensureAuthenticated();
    return await offlineStorage.update<Budget>('budgets', id, updates);
  }

  async deleteBudget(id: string): Promise<void> {
    this.ensureAuthenticated();
    await offlineStorage.delete('budgets', id);
  }

  // Liabilities Management
  async createLiability(data: CreateLiabilityData): Promise<Liability> {
    this.ensureAuthenticated();

    const liabilityData = {
      user_id: this.userId!,
      name: data.name,
      total_amount: data.total_amount,
      remaining_amount: data.remaining_amount,
      interest_rate: data.interest_rate,
      monthly_payment: data.monthly_payment,
      due_date: data.due_date,
      account_id: data.account_id || null,
      status: 'active' as const
    };

    return await offlineStorage.create<Liability>('liabilities', liabilityData);
  }

  async getLiabilities(): Promise<Liability[]> {
    this.ensureAuthenticated();
    return await offlineStorage.getAll<Liability>('liabilities', this.userId!);
  }

  async updateLiability(id: string, updates: Partial<Liability>): Promise<Liability> {
    this.ensureAuthenticated();
    return await offlineStorage.update<Liability>('liabilities', id, updates);
  }

  async deleteLiability(id: string): Promise<void> {
    this.ensureAuthenticated();
    await offlineStorage.delete('liabilities', id);
  }

  async makeLiabilityPayment(liabilityId: string, amount: number, fromAccountId: string, description?: string): Promise<Transaction> {
    this.ensureAuthenticated();

    const liability = await offlineStorage.getById<Liability>('liabilities', liabilityId);
    if (!liability) {
      throw new Error('Liability not found');
    }

    // Create transaction
    const transaction = await this.createTransaction({
      account_id: fromAccountId,
      amount: amount,
      category: 'Debt Payment',
      description: description || `Payment for ${liability.name}`,
      type: 'expense'
    });

    // Update liability
    const newRemainingAmount = Math.max(0, liability.remaining_amount - amount);
    const status = newRemainingAmount === 0 ? 'paid_off' as const : liability.status;
    
    await this.updateLiability(liabilityId, { 
      remaining_amount: newRemainingAmount,
      status 
    });

    return transaction;
  }

  // Bills Management
  async createBill(data: CreateBillData): Promise<Bill> {
    this.ensureAuthenticated();

    const billData = {
      user_id: this.userId!,
      title: data.title,
      amount: data.amount,
      category: data.category,
      frequency: data.frequency,
      due_date: data.due_date,
      next_due_date: data.due_date,
      description: data.description || null,
      default_account_id: data.default_account_id || null,
      bill_type: 'fixed' as const,
      auto_pay: false,
      is_emi: false,
      is_active: true,
      is_essential: false,
      reminder_days_before: 3,
      send_due_date_reminder: true,
      send_overdue_reminder: true
    };

    return await offlineStorage.create<Bill>('bills', billData);
  }

  async getBills(): Promise<Bill[]> {
    this.ensureAuthenticated();
    return await offlineStorage.getAll<Bill>('bills', this.userId!);
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill> {
    this.ensureAuthenticated();
    return await offlineStorage.update<Bill>('bills', id, updates);
  }

  async deleteBill(id: string): Promise<void> {
    this.ensureAuthenticated();
    await offlineStorage.delete('bills', id);
  }

  async payBill(billId: string, amount: number, fromAccountId: string, description?: string): Promise<Transaction> {
    this.ensureAuthenticated();

    const bill = await offlineStorage.getById<Bill>('bills', billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    // Create transaction
    const transaction = await this.createTransaction({
      account_id: fromAccountId,
      amount: amount,
      category: bill.category,
      description: description || `Payment for ${bill.title}`,
      type: 'expense'
    });

    // Update bill
    await this.updateBill(billId, { 
      last_paid_date: new Date().toISOString()
    });

    return transaction;
  }

  // Analytics and Reports
  async getNetWorth(): Promise<number> {
    const accounts = await this.getAccounts();
    return accounts.reduce((total, account) => {
      if (account.type === 'credit_card') {
        return total - account.balance; // Credit card balance is debt
      }
      return total + account.balance;
    }, 0);
  }

  async getMonthlyIncome(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await this.getTransactions();
    return transactions
      .filter(t => 
        t.type === 'income' && 
        new Date(t.date) >= startOfMonth && 
        new Date(t.date) <= endOfMonth
      )
      .reduce((total, t) => total + t.amount, 0);
  }

  async getMonthlyExpenses(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await this.getTransactions();
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        new Date(t.date) >= startOfMonth && 
        new Date(t.date) <= endOfMonth
      )
      .reduce((total, t) => total + t.amount, 0);
  }

  async getCategorySpending(month?: Date): Promise<Record<string, number>> {
    const targetMonth = month || new Date();
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

    const transactions = await this.getTransactions();
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= startOfMonth && 
      new Date(t.date) <= endOfMonth
    );

    return monthlyExpenses.reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  // Sync status
  getSyncStatus() {
    return offlineStorage.getSyncStatus();
  }

  async forceSync() {
    return await offlineStorage.forceSync();
  }
}

// Export singleton instance
export const financeManager = new FinanceManager();
export default financeManager;
