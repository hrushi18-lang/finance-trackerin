// Transaction functionality test utility
// This file helps verify that transaction logic works correctly

export interface TransactionTestData {
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  accountId: string;
  transferToAccountId?: string;
  currency?: string;
}

export class TransactionTester {
  private accounts: any[] = [];
  private transactions: any[] = [];

  constructor(accounts: any[]) {
    this.accounts = accounts;
  }

  // Test basic transaction creation
  testBasicTransaction(data: TransactionTestData) {
    const errors: string[] = [];

    // Validate required fields
    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.description) {
      errors.push('Description is required');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    if (!data.accountId) {
      errors.push('Account ID is required');
    }

    // Validate account exists
    const account = this.accounts.find(acc => acc.id === data.accountId);
    if (!account) {
      errors.push('Account not found');
    }

    // Validate transfer logic
    if (data.type === 'transfer' && data.transferToAccountId) {
      const targetAccount = this.accounts.find(acc => acc.id === data.transferToAccountId);
      if (!targetAccount) {
        errors.push('Target account not found');
      }
      if (data.accountId === data.transferToAccountId) {
        errors.push('Cannot transfer to the same account');
      }
    }

    // Validate sufficient funds for expenses
    if (data.type === 'expense' && account) {
      if (account.type !== 'credit_card' && account.type !== 'investment') {
        if (account.balance < data.amount) {
          errors.push(`Insufficient funds. Account balance (${account.balance}) is less than transaction amount (${data.amount})`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Test currency conversion
  testCurrencyConversion(amount: number, fromCurrency: string, toCurrency: string) {
    const errors: string[] = [];

    if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!fromCurrency || !toCurrency) {
      errors.push('Both from and to currencies are required');
    }

    if (fromCurrency === toCurrency) {
      errors.push('From and to currencies cannot be the same');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Test transfer logic
  testTransferLogic(sourceAccountId: string, targetAccountId: string, amount: number) {
    const errors: string[] = [];

    const sourceAccount = this.accounts.find(acc => acc.id === sourceAccountId);
    const targetAccount = this.accounts.find(acc => acc.id === targetAccountId);

    if (!sourceAccount) {
      errors.push('Source account not found');
    }

    if (!targetAccount) {
      errors.push('Target account not found');
    }

    if (sourceAccountId === targetAccountId) {
      errors.push('Cannot transfer to the same account');
    }

    if (sourceAccount && sourceAccount.type !== 'credit_card' && sourceAccount.type !== 'investment') {
      if (sourceAccount.balance < amount) {
        errors.push(`Insufficient funds. Source account balance (${sourceAccount.balance}) is less than transfer amount (${amount})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Simulate transaction execution
  simulateTransaction(data: TransactionTestData) {
    const validation = this.testBasicTransaction(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const account = this.accounts.find(acc => acc.id === data.accountId);
    if (!account) {
      return { success: false, errors: ['Account not found'] };
    }

    // Simulate balance update
    let newBalance = account.balance;
    if (data.type === 'income') {
      newBalance += data.amount;
    } else if (data.type === 'expense') {
      newBalance -= data.amount;
    }

    // Simulate transfer
    if (data.type === 'transfer' && data.transferToAccountId) {
      const targetAccount = this.accounts.find(acc => acc.id === data.transferToAccountId);
      if (targetAccount) {
        // Source account (expense)
        account.balance -= data.amount;
        // Target account (income)
        targetAccount.balance += data.amount;
      }
    } else {
      account.balance = newBalance;
    }

    return {
      success: true,
      newBalance: account.balance,
      message: 'Transaction simulated successfully'
    };
  }
}

// Export test cases
export const testCases = {
  validIncome: {
    amount: 1000,
    description: 'Salary',
    category: 'Salary',
    type: 'income' as const,
    accountId: 'test-account-1',
    currency: 'USD'
  },
  validExpense: {
    amount: 50,
    description: 'Groceries',
    category: 'Food & Dining',
    type: 'expense' as const,
    accountId: 'test-account-1',
    currency: 'USD'
  },
  validTransfer: {
    amount: 200,
    description: 'Transfer to savings',
    category: 'Transfer',
    type: 'transfer' as const,
    accountId: 'test-account-1',
    transferToAccountId: 'test-account-2',
    currency: 'USD'
  },
  invalidAmount: {
    amount: -100,
    description: 'Invalid amount',
    category: 'Other',
    type: 'expense' as const,
    accountId: 'test-account-1',
    currency: 'USD'
  },
  insufficientFunds: {
    amount: 10000,
    description: 'Large expense',
    category: 'Other',
    type: 'expense' as const,
    accountId: 'test-account-1',
    currency: 'USD'
  }
};
