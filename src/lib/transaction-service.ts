import { supabase } from './supabase';
import { exchangeRateService } from './exchange-rate-service';

export interface Transaction {
  id?: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  account_id: string;
  currency_code: string;
  original_amount?: number;
  original_currency?: string;
  exchange_rate?: number;
  exchange_rate_used?: number;
  affects_balance: boolean;
  status: 'completed' | 'pending' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface CrossCurrencyTransaction {
  fromTransaction: Transaction;
  toTransaction: Transaction;
  exchangeRate: number;
  exchangeRateUsed: number;
}

class TransactionService {
  // Create a single currency transaction
  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      // Update account balance
      await this.updateAccountBalance(transaction.account_id, transaction.amount, transaction.type);

      return data as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Create a cross-currency transaction (transfer between accounts with different currencies)
  async createCrossCurrencyTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    description: string,
    userId: string
  ): Promise<CrossCurrencyTransaction> {
    try {
      // Get current exchange rate
      const exchangeRate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
      if (!exchangeRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      const convertedAmount = amount * exchangeRate;

      // Create debit transaction
      const fromTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        type: 'expense',
        amount: -amount, // Negative for debit
        category: 'Transfer',
        description: `Transfer to ${toCurrency} account: ${description}`,
        date: new Date().toISOString().split('T')[0],
        account_id: fromAccountId,
        currency_code: fromCurrency,
        original_amount: amount,
        original_currency: fromCurrency,
        exchange_rate: exchangeRate,
        exchange_rate_used: exchangeRate,
        affects_balance: true,
        status: 'completed'
      };

      // Create credit transaction
      const toTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        type: 'income',
        amount: convertedAmount, // Positive for credit
        category: 'Transfer',
        description: `Transfer from ${fromCurrency} account: ${description}`,
        date: new Date().toISOString().split('T')[0],
        account_id: toAccountId,
        currency_code: toCurrency,
        original_amount: amount,
        original_currency: fromCurrency,
        exchange_rate: exchangeRate,
        exchange_rate_used: exchangeRate,
        affects_balance: true,
        status: 'completed'
      };

      // Create both transactions
      const [fromResult, toResult] = await Promise.all([
        this.createTransaction(fromTransaction),
        this.createTransaction(toTransaction)
      ]);

      // Link the transactions
      await this.linkTransactions(fromResult.id!, toResult.id!);

      return {
        fromTransaction: fromResult,
        toTransaction: toResult,
        exchangeRate,
        exchangeRateUsed: exchangeRate
      };
    } catch (error) {
      console.error('Error creating cross-currency transaction:', error);
      throw error;
    }
  }

  // Link two transactions (for cross-currency transfers)
  private async linkTransactions(fromTransactionId: string, toTransactionId: string): Promise<void> {
    try {
      await supabase
        .from('transactions')
        .update({ 
          transfer_to_account_id: toTransactionId,
          parent_transaction_id: fromTransactionId
        })
        .eq('id', fromTransactionId);

      await supabase
        .from('transactions')
        .update({ 
          parent_transaction_id: fromTransactionId
        })
        .eq('id', toTransactionId);
    } catch (error) {
      console.error('Error linking transactions:', error);
      throw error;
    }
  }

  // Update account balance
  private async updateAccountBalance(accountId: string, amount: number, type: 'income' | 'expense'): Promise<void> {
    try {
      // Get current account balance
      const { data: account, error: accountError } = await supabase
        .from('financial_accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      // Calculate new balance
      const newBalance = account.balance + amount;

      // Update account balance
      const { error: updateError } = await supabase
        .from('financial_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (updateError) throw updateError;

      // Record balance change in history
      await this.recordBalanceChange(accountId, newBalance, amount, 'transaction');
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }

  // Record balance change in history
  private async recordBalanceChange(
    accountId: string, 
    newBalance: number, 
    changeAmount: number, 
    reason: string,
    transactionId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('account_balance_history')
        .insert({
          account_id: accountId,
          balance: newBalance,
          change_amount: changeAmount,
          change_reason: reason,
          transaction_id: transactionId
        });
    } catch (error) {
      console.error('Error recording balance change:', error);
      // Don't throw error for history recording failure
    }
  }

  // Get transactions for an account
  async getAccountTransactions(accountId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Transaction[];
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      throw error;
    }
  }

  // Get all transactions for a user
  async getUserTransactions(userId: string, limit: number = 100): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Transaction[];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  }

  // Convert transaction amount to primary currency
  async convertTransactionToPrimary(
    transaction: Transaction, 
    primaryCurrency: string
  ): Promise<number | null> {
    try {
      if (transaction.currency_code === primaryCurrency) {
        return transaction.amount;
      }

      // Use stored exchange rate if available
      if (transaction.exchange_rate_used) {
        return transaction.amount * transaction.exchange_rate_used;
      }

      // Get current exchange rate
      const exchangeRate = await exchangeRateService.getExchangeRate(
        transaction.currency_code, 
        primaryCurrency
      );

      if (!exchangeRate) return null;

      return transaction.amount * exchangeRate;
    } catch (error) {
      console.error('Error converting transaction to primary currency:', error);
      return null;
    }
  }

  // Get transaction summary by currency
  async getTransactionSummaryByCurrency(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Record<string, { total: number; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('currency_code, amount, type')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'completed');

      if (error) throw error;

      const summary = data.reduce((acc, transaction) => {
        const currency = transaction.currency_code;
        if (!acc[currency]) {
          acc[currency] = { total: 0, count: 0 };
        }
        acc[currency].total += Math.abs(transaction.amount);
        acc[currency].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      return summary;
    } catch (error) {
      console.error('Error getting transaction summary by currency:', error);
      throw error;
    }
  }

  // Delete transaction and update account balance
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      // Get transaction details
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Reverse the account balance change
      if (transaction.affects_balance) {
        await this.updateAccountBalance(
          transaction.account_id, 
          -transaction.amount, 
          transaction.type === 'income' ? 'expense' : 'income'
        );
      }

      // Delete the transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService();
