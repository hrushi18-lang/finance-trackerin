import { Decimal } from 'decimal.js';
import { simpleCurrencyService } from './simpleCurrencyService';
import { getCurrencyPrecision } from '../utils/currencyUtils';
import { supabase } from '../lib/supabase';

export interface CurrencyExecutionRequest {
  amount: number;
  currency: string;
  accountId: string;
  operation: 'deduct' | 'add' | 'transfer' | 'create' | 'update' | 'contribute' | 'pay';
  description: string;
  targetAccountId?: string; // For transfers
  goalId?: string;
  billId?: string;
  liabilityId?: string;
  budgetId?: string;
  category?: string;
  // For account creation
  accountType?: string;
  accountName?: string;
  // For goal creation
  goalName?: string;
  targetAmount?: number;
  targetCurrency?: string;
  // For budget creation
  budgetName?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  budgetPeriod?: string;
  // For bill creation
  billName?: string;
  billAmount?: number;
  billCurrency?: string;
  dueDate?: string;
  // For liability creation
  liabilityName?: string;
  liabilityAmount?: number;
  liabilityCurrency?: string;
  liabilityType?: string;
}

export interface CurrencyExecutionResult {
  success: boolean;
  transactionId?: string;
  accountAmount: number;
  accountCurrency: string;
  primaryAmount: number;
  primaryCurrency: string;
  exchangeRate?: number;
  conversionSource?: string;
  rateTimestamp?: string;
  error?: string;
  executionId?: string;
  executionTimeMs?: number;
  auditData: {
    originalAmount: number;
    originalCurrency: string;
    conversionCase: string;
    timestamp: Date;
  };
}

export interface AccountBalance {
  id: string;
  balance: number;
  currency: string;
  name: string;
  type: string;
}

export class CurrencyExecutionEngine {
  private accounts: AccountBalance[] = [];
  private primaryCurrency: string = 'USD';
  private userId: string | null = null;

  constructor(accounts: AccountBalance[], primaryCurrency: string = 'USD', userId: string | null = null) {
    this.accounts = accounts;
    this.primaryCurrency = primaryCurrency;
    this.userId = userId;
  }

  /**
   * Main execution method - handles all currency operations
   */
  async execute(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    const startTime = Date.now();
    const executionId = crypto.randomUUID();
    
    try {
      console.log(`🔄 CurrencyExecutionEngine: Processing ${request.operation}`, {
        amount: request.amount,
        currency: request.currency,
        accountId: request.accountId,
        executionId
      });

      // Get account details
      const account = this.accounts.find(acc => acc.id === request.accountId);
      if (!account) {
        throw new Error(`Account ${request.accountId} not found`);
      }

      // Determine conversion case and execute
      const conversionCase = this.determineConversionCase(
        request.currency,
        account.currency,
        this.primaryCurrency
      );

      console.log(`📊 Conversion Case: ${conversionCase}`);

      let result: CurrencyExecutionResult;

      switch (conversionCase) {
        case 'all_same':
          result = await this.executeAllSame(request, account);
          break;
        case 'amount_account_same':
          result = await this.executeAmountAccountSame(request, account);
          break;
        case 'amount_primary_same':
          result = await this.executeAmountPrimarySame(request, account);
          break;
        case 'account_primary_same':
          result = await this.executeAccountPrimarySame(request, account);
          break;
        case 'all_different':
          result = await this.executeAllDifferent(request, account);
          break;
        case 'amount_different_others_same':
          result = await this.executeAmountDifferentOthersSame(request, account);
          break;
        default:
          throw new Error(`Unknown conversion case: ${conversionCase}`);
      }

      // Add audit data
      result.auditData = {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase,
        timestamp: new Date()
      };

      // Add execution ID and timing
      result.executionId = executionId;
      result.executionTimeMs = Date.now() - startTime;

      // Add rate timestamp if conversion was performed
      if (result.exchangeRate && result.conversionSource) {
        try {
          const rateTimestamp = await liveExchangeRateService.getRateTimestamp(
            this.primaryCurrency,
            this.primaryCurrency
          );
          result.rateTimestamp = rateTimestamp || undefined;
        } catch (error) {
          console.warn('⚠️ Failed to get rate timestamp:', error);
        }
      }

      // Log to database if user is authenticated
      if (this.userId) {
        await this.logExecutionToDatabase(executionId, request, result, conversionCase, Date.now() - startTime);
      }

      console.log(`✅ CurrencyExecutionEngine: Execution completed`, {
        success: result.success,
        accountAmount: result.accountAmount,
        primaryAmount: result.primaryAmount,
        conversionCase,
        executionTimeMs: result.executionTimeMs
      });

      return result;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error('❌ CurrencyExecutionEngine: Execution failed', error);
      
      const errorResult: CurrencyExecutionResult = {
        success: false,
        accountAmount: 0,
        accountCurrency: request.currency,
        primaryAmount: 0,
        primaryCurrency: this.primaryCurrency,
        error: error.message,
        executionId,
        executionTimeMs: executionTime,
        auditData: {
          originalAmount: request.amount,
          originalCurrency: request.currency,
          conversionCase: 'error',
          timestamp: new Date()
        }
      };

      // Log error to database if user is authenticated
      if (this.userId) {
        await this.logExecutionToDatabase(executionId, request, errorResult, 'error', executionTime, error.message);
      }

      return errorResult;
    }
  }

  /**
   * Case 1: All currencies are the same (am = acc = p)
   */
  private async executeAllSame(
    request: CurrencyExecutionRequest,
    account: AccountBalance
  ): Promise<CurrencyExecutionResult> {
    const amount = new Decimal(request.amount);
    
    return {
      success: true,
      accountAmount: amount.toNumber(),
      accountCurrency: account.currency,
      primaryAmount: amount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      auditData: {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase: 'all_same',
        timestamp: new Date()
      }
    };
  }

  /**
   * Case 2: Amount and Account currencies same, different from primary (am = acc ≠ p)
   */
  private async executeAmountAccountSame(
    request: CurrencyExecutionRequest,
    account: AccountBalance
  ): Promise<CurrencyExecutionResult> {
    const amount = new Decimal(request.amount);
    
    // Convert to primary currency for net worth
    const primaryAmount = await this.convertToPrimary(amount, request.currency);
    
    return {
      success: true,
      accountAmount: amount.toNumber(),
      accountCurrency: account.currency,
      primaryAmount: primaryAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      auditData: {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase: 'amount_account_same',
        timestamp: new Date()
      }
    };
  }

  /**
   * Case 3: Amount and Primary currencies same, different from account (am = p ≠ acc)
   */
  private async executeAmountPrimarySame(
    request: CurrencyExecutionRequest,
    account: AccountBalance
  ): Promise<CurrencyExecutionResult> {
    const amount = new Decimal(request.amount);
    
    // Convert to account currency for deduction
    const accountAmount = await this.convertToAccount(amount, request.currency, account.currency);
    
    return {
      success: true,
      accountAmount: accountAmount.toNumber(),
      accountCurrency: account.currency,
      primaryAmount: amount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      auditData: {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase: 'amount_primary_same',
        timestamp: new Date()
      }
    };
  }

  /**
   * Case 4: Account and Primary currencies same, different from amount (acc = p ≠ am)
   */
  private async executeAccountPrimarySame(
    request: CurrencyExecutionRequest,
    account: AccountBalance
  ): Promise<CurrencyExecutionResult> {
    const amount = new Decimal(request.amount);
    
    // Convert to account/primary currency
    const convertedAmount = await this.convertToAccount(amount, request.currency, account.currency);
    
    return {
      success: true,
      accountAmount: convertedAmount.toNumber(),
      accountCurrency: account.currency,
      primaryAmount: convertedAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      auditData: {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase: 'account_primary_same',
        timestamp: new Date()
      }
    };
  }

  /**
   * Case 5: All currencies are different (am ≠ acc ≠ p)
   */
  private async executeAllDifferent(
    request: CurrencyExecutionRequest,
    account: AccountBalance
  ): Promise<CurrencyExecutionResult> {
    const amount = new Decimal(request.amount);
    
    // Convert to account currency for deduction
    const accountAmount = await this.convertToAccount(amount, request.currency, account.currency);
    
    // Convert to primary currency for net worth
    const primaryAmount = await this.convertToPrimary(amount, request.currency);
    
    return {
      success: true,
      accountAmount: accountAmount.toNumber(),
      accountCurrency: account.currency,
      primaryAmount: primaryAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      auditData: {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase: 'all_different',
        timestamp: new Date()
      }
    };
  }

  /**
   * Case 6: Amount different, Account and Primary same (am ≠ acc = p)
   */
  private async executeAmountDifferentOthersSame(
    request: CurrencyExecutionRequest,
    account: AccountBalance
  ): Promise<CurrencyExecutionResult> {
    const amount = new Decimal(request.amount);
    
    // Convert to account/primary currency
    const convertedAmount = await this.convertToAccount(amount, request.currency, account.currency);
    
    return {
      success: true,
      accountAmount: convertedAmount.toNumber(),
      accountCurrency: account.currency,
      primaryAmount: convertedAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      auditData: {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase: 'amount_different_others_same',
        timestamp: new Date()
      }
    };
  }

  /**
   * Determine the conversion case based on currency relationships
   */
  private determineConversionCase(
    amountCurrency: string,
    accountCurrency: string,
    primaryCurrency: string
  ): string {
    if (amountCurrency === accountCurrency && accountCurrency === primaryCurrency) {
      return 'all_same';
    } else if (amountCurrency === accountCurrency && accountCurrency !== primaryCurrency) {
      return 'amount_account_same';
    } else if (amountCurrency === primaryCurrency && accountCurrency !== primaryCurrency) {
      return 'amount_primary_same';
    } else if (accountCurrency === primaryCurrency && amountCurrency !== primaryCurrency) {
      return 'amount_different_others_same';
    } else if (amountCurrency !== accountCurrency && accountCurrency === primaryCurrency) {
      return 'amount_different_others_same';
    } else {
      return 'all_different';
    }
  }

  /**
   * Convert amount to account currency
   */
  private async convertToAccount(
    amount: Decimal,
    fromCurrency: string,
    toCurrency: string
  ): Promise<Decimal> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = simpleCurrencyService.getRate(fromCurrency, toCurrency);
    return amount.mul(rate);
  }

  /**
   * Convert amount to primary currency
   */
  private async convertToPrimary(amount: Decimal, fromCurrency: string): Promise<Decimal> {
    if (fromCurrency === this.primaryCurrency) {
      return amount;
    }

    const rate = await liveExchangeRateService.getExchangeRate(fromCurrency, this.primaryCurrency, this.primaryCurrency);
    return amount.mul(rate);
  }

  /**
   * Validate sufficient balance for deduction
   */
  async validateBalance(accountId: string, requiredAmount: number, currency: string): Promise<boolean> {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (!account) return false;

    if (account.currency === currency) {
      return account.balance >= requiredAmount;
    }

    // Convert required amount to account currency
    const accountAmount = await this.convertToAccount(
      new Decimal(requiredAmount),
      currency,
      account.currency
    );

    return account.balance >= accountAmount.toNumber();
  }

  /**
   * Get account balance in specific currency
   */
  async getAccountBalance(accountId: string, targetCurrency: string): Promise<number> {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (!account) return 0;

    if (account.currency === targetCurrency) {
      return account.balance;
    }

    const convertedAmount = await this.convertToAccount(
      new Decimal(account.balance),
      account.currency,
      targetCurrency
    );

    return convertedAmount.toNumber();
  }

  /**
   * Update account balance after transaction
   */
  updateAccountBalance(accountId: string, amount: number, operation: 'add' | 'deduct'): void {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (!account) return;

    if (operation === 'add') {
      account.balance += amount;
    } else {
      account.balance -= amount;
    }

    console.log(`💰 Account balance updated: ${account.name} ${operation} ${amount} ${account.currency}`);
  }

  /**
   * Log execution to database for audit and analytics
   */
  private async logExecutionToDatabase(
    executionId: string,
    request: CurrencyExecutionRequest,
    result: CurrencyExecutionResult,
    conversionCase: string,
    executionTimeMs: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      if (!this.userId) return;

      const { error } = await supabase.rpc('log_currency_execution', {
        p_user_id: this.userId,
        p_execution_id: executionId,
        p_operation_type: this.getOperationType(request),
        p_status: result.success ? 'success' : 'failed',
        p_original_amount: request.amount,
        p_original_currency: request.currency,
        p_target_account_id: request.accountId,
        p_conversion_case: conversionCase,
        p_account_amount: result.accountAmount,
        p_account_currency: result.accountCurrency,
        p_primary_amount: result.primaryAmount,
        p_primary_currency: result.primaryCurrency,
        p_exchange_rate: result.exchangeRate,
        p_exchange_rate_used: result.exchangeRate,
        p_conversion_source: result.conversionSource,
        p_execution_time_ms: executionTimeMs,
        p_error_message: errorMessage || result.error,
        p_target_entity_id: request.goalId || request.billId || request.liabilityId,
        p_target_entity_type: this.getTargetEntityType(request)
      });

      if (error) {
        console.error('Failed to log currency execution to database:', error);
      } else {
        console.log(`📊 Currency execution logged to database: ${executionId}`);
      }
    } catch (error) {
      console.error('Error logging currency execution to database:', error);
    }
  }

  /**
   * Execute goal creation with currency conversion
   */
  async executeGoalCreation(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    if (!request.goalName || !request.targetAmount || !request.targetCurrency) {
      throw new Error('Goal creation requires name, target amount, and target currency');
    }

    const conversionCase = this.determineConversionCase(
      request.targetCurrency,
      request.targetCurrency, // Goal currency
      this.primaryCurrency
    );

    // Convert target amount to primary currency for tracking
    const primaryAmount = await this.convertToPrimary(
      new Decimal(request.targetAmount),
      request.targetCurrency
    );

    return {
      success: true,
      accountAmount: 0, // No account deduction for goal creation
      accountCurrency: request.currency,
      primaryAmount: primaryAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      exchangeRate: request.targetCurrency === this.primaryCurrency ? 1 : undefined,
      conversionSource: 'goal_creation',
      auditData: {
        originalAmount: request.targetAmount,
        originalCurrency: request.targetCurrency,
        conversionCase,
        timestamp: new Date()
      }
    };
  }

  /**
   * Execute budget creation with currency conversion
   */
  async executeBudgetCreation(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    if (!request.budgetName || !request.budgetAmount || !request.budgetCurrency) {
      throw new Error('Budget creation requires name, amount, and currency');
    }

    const conversionCase = this.determineConversionCase(
      request.budgetCurrency,
      request.budgetCurrency, // Budget currency
      this.primaryCurrency
    );

    // Convert budget amount to primary currency for tracking
    const primaryAmount = await this.convertToPrimary(
      new Decimal(request.budgetAmount),
      request.budgetCurrency
    );

    return {
      success: true,
      accountAmount: 0, // No account deduction for budget creation
      accountCurrency: request.currency,
      primaryAmount: primaryAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      exchangeRate: request.budgetCurrency === this.primaryCurrency ? 1 : undefined,
      conversionSource: 'budget_creation',
      auditData: {
        originalAmount: request.budgetAmount,
        originalCurrency: request.budgetCurrency,
        conversionCase,
        timestamp: new Date()
      }
    };
  }

  /**
   * Execute bill creation with currency conversion
   */
  async executeBillCreation(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    if (!request.billName || !request.billAmount || !request.billCurrency) {
      throw new Error('Bill creation requires name, amount, and currency');
    }

    const conversionCase = this.determineConversionCase(
      request.billCurrency,
      request.billCurrency, // Bill currency
      this.primaryCurrency
    );

    // Convert bill amount to primary currency for tracking
    const primaryAmount = await this.convertToPrimary(
      new Decimal(request.billAmount),
      request.billCurrency
    );

    return {
      success: true,
      accountAmount: 0, // No account deduction for bill creation
      accountCurrency: request.currency,
      primaryAmount: primaryAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      exchangeRate: request.billCurrency === this.primaryCurrency ? 1 : undefined,
      conversionSource: 'bill_creation',
      auditData: {
        originalAmount: request.billAmount,
        originalCurrency: request.billCurrency,
        conversionCase,
        timestamp: new Date()
      }
    };
  }

  /**
   * Execute liability creation with currency conversion
   */
  async executeLiabilityCreation(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    if (!request.liabilityName || !request.liabilityAmount || !request.liabilityCurrency) {
      throw new Error('Liability creation requires name, amount, and currency');
    }

    const conversionCase = this.determineConversionCase(
      request.liabilityCurrency,
      request.liabilityCurrency, // Liability currency
      this.primaryCurrency
    );

    // Convert liability amount to primary currency for tracking
    const primaryAmount = await this.convertToPrimary(
      new Decimal(request.liabilityAmount),
      request.liabilityCurrency
    );

    return {
      success: true,
      accountAmount: 0, // No account deduction for liability creation
      accountCurrency: request.currency,
      primaryAmount: primaryAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      exchangeRate: request.liabilityCurrency === this.primaryCurrency ? 1 : undefined,
      conversionSource: 'liability_creation',
      auditData: {
        originalAmount: request.liabilityAmount,
        originalCurrency: request.liabilityCurrency,
        conversionCase,
        timestamp: new Date()
      }
    };
  }

  /**
   * Execute account creation with currency conversion
   */
  async executeAccountCreation(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    if (!request.accountName || !request.accountType) {
      throw new Error('Account creation requires name and type');
    }

    const conversionCase = this.determineConversionCase(
      request.currency,
      request.currency, // Account currency
      this.primaryCurrency
    );

    // Convert initial amount to primary currency for tracking
    const primaryAmount = await this.convertToPrimary(
      new Decimal(request.amount),
      request.currency
    );

    return {
      success: true,
      accountAmount: request.amount, // Initial account balance
      accountCurrency: request.currency,
      primaryAmount: primaryAmount.toNumber(),
      primaryCurrency: this.primaryCurrency,
      exchangeRate: request.currency === this.primaryCurrency ? 1 : undefined,
      conversionSource: 'account_creation',
      auditData: {
        originalAmount: request.amount,
        originalCurrency: request.currency,
        conversionCase,
        timestamp: new Date()
      }
    };
  }

  /**
   * Execute goal contribution with currency conversion
   */
  async executeGoalContribution(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    if (!request.goalId) {
      throw new Error('Goal contribution requires goal ID');
    }

    // Use the main execute method for goal contributions
    return this.execute(request);
  }

  /**
   * Execute budget spending with currency conversion
   */
  async executeBudgetSpending(request: CurrencyExecutionRequest): Promise<CurrencyExecutionResult> {
    if (!request.budgetId) {
      throw new Error('Budget spending requires budget ID');
    }

    // Use the main execute method for budget spending
    return this.execute(request);
  }

  /**
   * Get operation type from request
   */
  private getOperationType(request: CurrencyExecutionRequest): string {
    if (request.goalId) return 'goal_contribution';
    if (request.billId) return 'bill_payment';
    if (request.liabilityId) return 'liability_payment';
    if (request.budgetId) return 'budget_spending';
    if (request.targetAccountId) return 'transfer';
    if (request.operation === 'create') {
      if (request.goalName) return 'goal_creation';
      if (request.budgetName) return 'budget_creation';
      if (request.billName) return 'bill_creation';
      if (request.liabilityName) return 'liability_creation';
      if (request.accountName) return 'account_creation';
    }
    return 'transaction';
  }

  /**
   * Get target entity type from request
   */
  private getTargetEntityType(request: CurrencyExecutionRequest): string | null {
    if (request.goalId) return 'goal';
    if (request.billId) return 'bill';
    if (request.liabilityId) return 'liability';
    return null;
  }
}

// Export singleton instance
export const currencyExecutionEngine = new CurrencyExecutionEngine([], 'USD');
