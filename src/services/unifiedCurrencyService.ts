/**
 * Unified Currency Service
 * Single source of truth for ALL currency operations in the app
 * 
 * Consolidates:
 * - simpleCurrencyService (rate lookups)
 * - transactionConversionService (preview logic)
 * - currencyExecutionEngine (execution logic)
 * 
 * Three-Currency System: T (Transaction) → A (Account) → P (Primary)
 */

import { Decimal } from 'decimal.js';
import { simpleCurrencyService } from './simpleCurrencyService';
import { getCurrencyInfo } from '../utils/currency-converter';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversionRequest {
  // User input
  enteredAmount: number;
  enteredCurrency: string;
  
  // Account details
  accountId: string;
  accountCurrency: string;
  
  // User settings
  primaryCurrency: string;
  
  // Operation context
  operation: 'preview' | 'execute';
  operationType?: 'transaction' | 'goal_contribution' | 'bill_payment' | 'liability_payment' | 'account_creation' | 'entity_creation';
  
  // Optional metadata
  userId?: string;
  description?: string;
  linkedEntityId?: string; // goalId, billId, liabilityId
  linkedEntityType?: 'goal' | 'bill' | 'liability';
}

export interface ConversionResult {
  success: boolean;
  
  // Original input
  enteredAmount: number;
  enteredCurrency: string;
  enteredSymbol: string;
  
  // Account currency (for deduction)
  accountAmount: number;
  accountCurrency: string;
  accountSymbol: string;
  
  // Primary currency (for display)
  primaryAmount: number;
  primaryCurrency: string;
  primarySymbol: string;
  
  // Exchange rates
  enteredToAccountRate: number;
  enteredToPrimaryRate: number;
  accountToPrimaryRate: number;
  
  // Metadata
  conversionCase: 'T=A=P' | 'T=A≠P' | 'T≠A,A=P' | 'T=P≠A' | 'T≠A≠P';
  timestamp: Date;
  
  // For database storage
  dbPayload: {
    native_amount: number;
    native_currency: string;
    native_symbol: string;
    converted_amount: number;
    converted_currency: string;
    converted_symbol: string;
    primary_amount: number;
    primary_currency: string;
    primary_symbol: string;
    exchange_rate: number;
    exchange_rate_used: number;
    conversion_source: string;
  };
  
  // Display helpers
  displayText: {
    entered: string;
    account: string;
    primary: string;
    conversionNote: string;
  };
  
  // Error handling
  error?: string;
  warnings?: string[];
}

export interface AccountCreationRequest {
  name: string;
  type: string;
  balance: number;
  currency: string;
  primaryCurrency: string;
  userId: string;
  institution?: string;
  platform?: string;
}

export interface AccountCreationResult {
  success: boolean;
  accountData: {
    balance: number; // Native amount
    currencycode: string; // Native currency
  };
  displayAmount: number; // In primary currency
  conversionApplied: boolean;
  exchangeRate: number;
  error?: string;
}

export interface EntityCreationRequest {
  entityType: 'goal' | 'bill' | 'liability';
  amount: number; // Target amount, bill amount, or liability total
  currency: string;
  primaryCurrency: string;
  userId: string;
  additionalAmounts?: { // For liabilities
    remainingAmount?: number;
    monthlyPayment?: number;
    minimumPayment?: number;
  };
}

export interface EntityCreationResult {
  success: boolean;
  entityData: {
    amount: number; // NATIVE amount
    currencycode: string; // NATIVE currency
    additionalAmounts?: {
      remainingAmount?: number;
      monthlyPayment?: number;
      minimumPayment?: number;
    };
  };
  displayAmount: number; // In primary currency
  conversionApplied: boolean;
  exchangeRate: number;
  error?: string;
}

export interface PaymentRequest {
  paymentType: 'goal_contribution' | 'bill_payment' | 'liability_payment';
  amount: number;
  paymentCurrency: string;
  accountId: string;
  accountCurrency: string;
  primaryCurrency: string;
  userId: string;
  
  // Target entity details
  targetEntityId: string;
  targetEntityType: 'goal' | 'bill' | 'liability';
  targetEntityCurrency: string;
  targetEntityAmount?: number; // Current goal amount, bill amount, or remaining liability
  
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  
  // Amounts in different currencies
  paymentAmountInPaymentCurrency: number;
  paymentAmountInAccountCurrency: number;
  paymentAmountInEntityCurrency: number;
  paymentAmountInPrimaryCurrency: number;
  
  // What to deduct from account
  accountDeduction: number;
  accountCurrency: string;
  
  // What to add to entity
  entityAddition: number;
  entityCurrency: string;
  
  // Transaction data
  transactionData: ConversionResult['dbPayload'] & {
    type: 'expense' | 'income' | 'transfer';
    description: string;
    accountId: string;
  };
  
  // Metadata
  conversionCase: string;
  exchangeRates: {
    paymentToAccount: number;
    paymentToEntity: number;
    paymentToPrimary: number;
  };
  
  error?: string;
  warnings?: string[];
}

// ============================================================================
// UNIFIED CURRENCY SERVICE
// ============================================================================

export class UnifiedCurrencyService {
  private static instance: UnifiedCurrencyService;
  
  private constructor() {}
  
  public static getInstance(): UnifiedCurrencyService {
    if (!UnifiedCurrencyService.instance) {
      UnifiedCurrencyService.instance = new UnifiedCurrencyService();
    }
    return UnifiedCurrencyService.instance;
  }
  
  // ==========================================================================
  // CORE CONVERSION LOGIC
  // ==========================================================================
  
  /**
   * Main conversion method - handles all currency conversions
   * Works for both preview and execution
   */
  async convert(request: ConversionRequest): Promise<ConversionResult> {
    try {
      const {
        enteredAmount,
        enteredCurrency,
        accountCurrency,
        primaryCurrency,
        operation,
        operationType = 'transaction'
      } = request;
      
      console.log(`🔄 UnifiedCurrencyService.convert [${operation}]:`, {
        amount: enteredAmount,
        from: enteredCurrency,
        account: accountCurrency,
        primary: primaryCurrency,
        type: operationType
      });
      
      // Validate inputs
      if (enteredAmount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (!enteredCurrency || !accountCurrency || !primaryCurrency) {
        throw new Error('All currencies must be specified');
      }
      
      // Determine conversion case
      const conversionCase = this.determineConversionCase(
        enteredCurrency,
        accountCurrency,
        primaryCurrency
      );
      
      console.log(`📊 Conversion case: ${conversionCase}`);
      
      // Get exchange rates
      const enteredToAccountRate = this.getRate(enteredCurrency, accountCurrency);
      const enteredToPrimaryRate = this.getRate(enteredCurrency, primaryCurrency);
      const accountToPrimaryRate = this.getRate(accountCurrency, primaryCurrency);
      
      // Calculate amounts based on conversion case
      const { accountAmount, primaryAmount } = this.calculateAmounts(
        enteredAmount,
        conversionCase,
        enteredToAccountRate,
        enteredToPrimaryRate
      );
      
      // Get currency symbols
      const enteredSymbol = this.getCurrencySymbol(enteredCurrency);
      const accountSymbol = this.getCurrencySymbol(accountCurrency);
      const primarySymbol = this.getCurrencySymbol(primaryCurrency);
      
      // Build database payload
      const dbPayload = {
        native_amount: enteredAmount,
        native_currency: enteredCurrency,
        native_symbol: enteredSymbol,
        converted_amount: accountAmount,
        converted_currency: accountCurrency,
        converted_symbol: accountSymbol,
        primary_amount: primaryAmount,
        primary_currency: primaryCurrency,
        primary_symbol: primarySymbol,
        exchange_rate: enteredToAccountRate,
        exchange_rate_used: enteredToPrimaryRate,
        conversion_source: 'unified_service'
      };
      
      // Generate display text
      const displayText = this.generateDisplayText({
        enteredAmount,
        enteredCurrency,
        enteredSymbol,
        accountAmount,
        accountCurrency,
        accountSymbol,
        primaryAmount,
        primaryCurrency,
        primarySymbol,
        conversionCase,
        enteredToAccountRate,
        enteredToPrimaryRate
      });
      
      const result: ConversionResult = {
        success: true,
        enteredAmount,
        enteredCurrency,
        enteredSymbol,
        accountAmount,
        accountCurrency,
        accountSymbol,
        primaryAmount,
        primaryCurrency,
        primarySymbol,
        enteredToAccountRate,
        enteredToPrimaryRate,
        accountToPrimaryRate,
        conversionCase,
        timestamp: new Date(),
        dbPayload,
        displayText
      };
      
      // Log execution if requested
      if (operation === 'execute' && request.userId) {
        await this.logConversion(request, result);
      }
      
      console.log(`✅ Conversion result:`, {
        entered: displayText.entered,
        account: displayText.account,
        primary: displayText.primary
      });
      
      return result;
      
    } catch (error: any) {
      console.error('❌ Conversion failed:', error);
      
      return {
        success: false,
        enteredAmount: request.enteredAmount,
        enteredCurrency: request.enteredCurrency,
        enteredSymbol: this.getCurrencySymbol(request.enteredCurrency),
        accountAmount: 0,
        accountCurrency: request.accountCurrency,
        accountSymbol: this.getCurrencySymbol(request.accountCurrency),
        primaryAmount: 0,
        primaryCurrency: request.primaryCurrency,
        primarySymbol: this.getCurrencySymbol(request.primaryCurrency),
        enteredToAccountRate: 1,
        enteredToPrimaryRate: 1,
        accountToPrimaryRate: 1,
        conversionCase: 'T=A=P',
        timestamp: new Date(),
        dbPayload: {
          native_amount: request.enteredAmount,
          native_currency: request.enteredCurrency,
          native_symbol: this.getCurrencySymbol(request.enteredCurrency),
          converted_amount: 0,
          converted_currency: request.accountCurrency,
          converted_symbol: this.getCurrencySymbol(request.accountCurrency),
          primary_amount: 0,
          primary_currency: request.primaryCurrency,
          primary_symbol: this.getCurrencySymbol(request.primaryCurrency),
          exchange_rate: 1,
          exchange_rate_used: 1,
          conversion_source: 'error'
        },
        displayText: {
          entered: '',
          account: '',
          primary: '',
          conversionNote: ''
        },
        error: error.message
      };
    }
  }
  
  // ==========================================================================
  // ACCOUNT OPERATIONS
  // ==========================================================================
  
  /**
   * Create account with proper currency handling
   * Stores NATIVE balance and currency
   */
  async createAccount(request: AccountCreationRequest): Promise<AccountCreationResult> {
    try {
      const { balance, currency, primaryCurrency } = request;
      
      console.log(`🏦 Creating account:`, {
        balance,
        currency,
        primaryCurrency
      });
      
      // NO CONVERSION - store native balance
      const accountData = {
        balance: balance, // NATIVE amount
        currencycode: currency // NATIVE currency
      };
      
      // Calculate display amount (in primary currency)
      const rate = this.getRate(currency, primaryCurrency);
      const displayAmount = balance * rate;
      
      const conversionApplied = currency !== primaryCurrency;
      
      console.log(`✅ Account created: ${balance} ${currency}${conversionApplied ? ` (≈ ${displayAmount.toFixed(2)} ${primaryCurrency})` : ''}`);
      
      return {
        success: true,
        accountData,
        displayAmount: Math.round(displayAmount * 100) / 100,
        conversionApplied,
        exchangeRate: rate
      };
      
    } catch (error: any) {
      console.error('❌ Account creation failed:', error);
      return {
        success: false,
        accountData: {
          balance: 0,
          currencycode: request.currency
        },
        displayAmount: 0,
        conversionApplied: false,
        exchangeRate: 1,
        error: error.message
      };
    }
  }
  
  // ==========================================================================
  // ENTITY OPERATIONS (Goals, Bills, Liabilities)
  // ==========================================================================
  
  /**
   * Create goal/bill/liability with proper currency handling
   * Stores NATIVE amounts only (no conversion)
   */
  async createEntity(request: EntityCreationRequest): Promise<EntityCreationResult> {
    try {
      const { entityType, amount, currency, primaryCurrency, additionalAmounts } = request;
      
      console.log(`📝 Creating ${entityType}:`, {
        amount,
        currency,
        primaryCurrency
      });
      
      // NO CONVERSION - store native amounts
      const entityData: EntityCreationResult['entityData'] = {
        amount: amount, // NATIVE amount
        currencycode: currency // NATIVE currency
      };
      
      // For liabilities, also store additional native amounts
      if (entityType === 'liability' && additionalAmounts) {
        entityData.additionalAmounts = {
          remainingAmount: additionalAmounts.remainingAmount || amount,
          monthlyPayment: additionalAmounts.monthlyPayment || 0,
          minimumPayment: additionalAmounts.minimumPayment || 0
        };
      }
      
      // Calculate display amount (in primary currency)
      const rate = this.getRate(currency, primaryCurrency);
      const displayAmount = amount * rate;
      
      const conversionApplied = currency !== primaryCurrency;
      
      console.log(`✅ ${entityType} created: ${amount} ${currency}${conversionApplied ? ` (≈ ${displayAmount.toFixed(2)} ${primaryCurrency})` : ''}`);
      
      return {
        success: true,
        entityData,
        displayAmount: Math.round(displayAmount * 100) / 100,
        conversionApplied,
        exchangeRate: rate
      };
      
    } catch (error: any) {
      console.error(`❌ ${request.entityType} creation failed:`, error);
      return {
        success: false,
        entityData: {
          amount: 0,
          currencycode: request.currency
        },
        displayAmount: 0,
        conversionApplied: false,
        exchangeRate: 1,
        error: error.message
      };
    }
  }
  
  // ==========================================================================
  // PAYMENT OPERATIONS
  // ==========================================================================
  
  /**
   * Process payment (goal contribution, bill payment, liability payment)
   * Handles multi-currency conversions correctly
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const {
        paymentType,
        amount,
        paymentCurrency,
        accountCurrency,
        targetEntityCurrency,
        primaryCurrency,
        accountId,
        targetEntityId,
        targetEntityType,
        description
      } = request;
      
      console.log(`💰 Processing ${paymentType}:`, {
        amount,
        paymentCurrency,
        accountCurrency,
        entityCurrency: targetEntityCurrency,
        primaryCurrency
      });
      
      // Calculate all conversions
      const paymentToAccountRate = this.getRate(paymentCurrency, accountCurrency);
      const paymentToEntityRate = this.getRate(paymentCurrency, targetEntityCurrency);
      const paymentToPrimaryRate = this.getRate(paymentCurrency, primaryCurrency);
      
      const amountInAccountCurrency = amount * paymentToAccountRate;
      const amountInEntityCurrency = amount * paymentToEntityRate;
      const amountInPrimaryCurrency = amount * paymentToPrimaryRate;
      
      // Determine what to deduct from account (account's native currency)
      const accountDeduction = amountInAccountCurrency;
      
      // Determine what to add to entity (entity's native currency)
      const entityAddition = amountInEntityCurrency;
      
      // Determine conversion case for transaction
      const conversionCase = this.determineConversionCase(
        paymentCurrency,
        accountCurrency,
        primaryCurrency
      );
      
      // Get symbols
      const paymentSymbol = this.getCurrencySymbol(paymentCurrency);
      const accountSymbol = this.getCurrencySymbol(accountCurrency);
      const primarySymbol = this.getCurrencySymbol(primaryCurrency);
      
      // Build transaction data
      const transactionData = {
        type: 'expense' as const,
        description: description || `${paymentType.replace('_', ' ')} payment`,
        accountId,
        native_amount: amount,
        native_currency: paymentCurrency,
        native_symbol: paymentSymbol,
        converted_amount: amountInAccountCurrency,
        converted_currency: accountCurrency,
        converted_symbol: accountSymbol,
        primary_amount: amountInPrimaryCurrency,
        primary_currency: primaryCurrency,
        primary_symbol: primarySymbol,
        exchange_rate: paymentToAccountRate,
        exchange_rate_used: paymentToPrimaryRate,
        conversion_source: 'unified_service'
      };
      
      console.log(`✅ Payment processed:`, {
        deductFromAccount: `${accountSymbol}${accountDeduction.toFixed(2)}`,
        addToEntity: `${this.getCurrencySymbol(targetEntityCurrency)}${entityAddition.toFixed(2)}`,
        primary: `${primarySymbol}${amountInPrimaryCurrency.toFixed(2)}`
      });
      
      return {
        success: true,
        paymentAmountInPaymentCurrency: amount,
        paymentAmountInAccountCurrency: amountInAccountCurrency,
        paymentAmountInEntityCurrency: amountInEntityCurrency,
        paymentAmountInPrimaryCurrency: amountInPrimaryCurrency,
        accountDeduction: Math.round(accountDeduction * 100) / 100,
        accountCurrency,
        entityAddition: Math.round(entityAddition * 100) / 100,
        entityCurrency: targetEntityCurrency,
        transactionData,
        conversionCase,
        exchangeRates: {
          paymentToAccount: paymentToAccountRate,
          paymentToEntity: paymentToEntityRate,
          paymentToPrimary: paymentToPrimaryRate
        }
      };
      
    } catch (error: any) {
      console.error(`❌ Payment processing failed:`, error);
      return {
        success: false,
        paymentAmountInPaymentCurrency: request.amount,
        paymentAmountInAccountCurrency: 0,
        paymentAmountInEntityCurrency: 0,
        paymentAmountInPrimaryCurrency: 0,
        accountDeduction: 0,
        accountCurrency: request.accountCurrency,
        entityAddition: 0,
        entityCurrency: request.targetEntityCurrency,
        transactionData: {
          type: 'expense',
          description: '',
          accountId: request.accountId,
          native_amount: 0,
          native_currency: request.paymentCurrency,
          native_symbol: '',
          converted_amount: 0,
          converted_currency: request.accountCurrency,
          converted_symbol: '',
          primary_amount: 0,
          primary_currency: request.primaryCurrency,
          primary_symbol: '',
          exchange_rate: 1,
          exchange_rate_used: 1,
          conversion_source: 'error'
        },
        conversionCase: 'T=A=P',
        exchangeRates: {
          paymentToAccount: 1,
          paymentToEntity: 1,
          paymentToPrimary: 1
        },
        error: error.message
      };
    }
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  /**
   * Get exchange rate between two currencies
   */
  private getRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1.0;
    return simpleCurrencyService.getRate(fromCurrency, toCurrency);
  }
  
  /**
   * Get currency symbol
   */
  private getCurrencySymbol(currencyCode: string): string {
    const info = getCurrencyInfo(currencyCode);
    return info?.symbol || currencyCode;
  }
  
  /**
   * Determine conversion case
   */
  private determineConversionCase(
    T: string, // Transaction
    A: string, // Account
    P: string  // Primary
  ): ConversionResult['conversionCase'] {
    if (T === A && A === P) return 'T=A=P';
    if (T === A && A !== P) return 'T=A≠P';
    if (T !== A && A === P) return 'T≠A,A=P';
    if (T === P && A !== P) return 'T=P≠A';
    return 'T≠A≠P';
  }
  
  /**
   * Calculate amounts based on conversion case
   */
  private calculateAmounts(
    enteredAmount: number,
    conversionCase: string,
    enteredToAccountRate: number,
    enteredToPrimaryRate: number
  ): { accountAmount: number; primaryAmount: number } {
    let accountAmount: number;
    let primaryAmount: number;
    
    switch (conversionCase) {
      case 'T=A=P':
        // All same - no conversion
        accountAmount = enteredAmount;
        primaryAmount = enteredAmount;
        break;
        
      case 'T=A≠P':
        // Transaction = Account, convert to Primary
        accountAmount = enteredAmount;
        primaryAmount = enteredAmount * enteredToPrimaryRate;
        break;
        
      case 'T≠A,A=P':
        // Transaction ≠ Account = Primary
        accountAmount = enteredAmount * enteredToAccountRate;
        primaryAmount = accountAmount;
        break;
        
      case 'T=P≠A':
        // Transaction = Primary ≠ Account
        accountAmount = enteredAmount * enteredToAccountRate;
        primaryAmount = enteredAmount;
        break;
        
      case 'T≠A≠P':
        // All different
        accountAmount = enteredAmount * enteredToAccountRate;
        primaryAmount = enteredAmount * enteredToPrimaryRate;
        break;
        
      default:
        accountAmount = enteredAmount;
        primaryAmount = enteredAmount;
    }
    
    // Round to 2 decimal places
    return {
      accountAmount: Math.round(accountAmount * 100) / 100,
      primaryAmount: Math.round(primaryAmount * 100) / 100
    };
  }
  
  /**
   * Generate display text
   */
  private generateDisplayText(params: {
    enteredAmount: number;
    enteredCurrency: string;
    enteredSymbol: string;
    accountAmount: number;
    accountCurrency: string;
    accountSymbol: string;
    primaryAmount: number;
    primaryCurrency: string;
    primarySymbol: string;
    conversionCase: string;
    enteredToAccountRate: number;
    enteredToPrimaryRate: number;
  }): ConversionResult['displayText'] {
    const {
      enteredAmount,
      enteredCurrency,
      enteredSymbol,
      accountAmount,
      accountCurrency,
      accountSymbol,
      primaryAmount,
      primaryCurrency,
      primarySymbol,
      conversionCase,
      enteredToAccountRate,
      enteredToPrimaryRate
    } = params;
    
    const formatAmount = (amount: number, symbol: string) => {
      return `${symbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };
    
    const entered = formatAmount(enteredAmount, enteredSymbol);
    const account = formatAmount(accountAmount, accountSymbol);
    const primary = formatAmount(primaryAmount, primarySymbol);
    
    let conversionNote = '';
    
    switch (conversionCase) {
      case 'T=A=P':
        conversionNote = 'No conversion needed';
        break;
      case 'T=A≠P':
        conversionNote = `Account: ${entered} • Display: ${primary} (1 ${enteredCurrency} = ${enteredToPrimaryRate.toFixed(4)} ${primaryCurrency})`;
        break;
      case 'T≠A,A=P':
        conversionNote = `Deducted: ${account} (1 ${enteredCurrency} = ${enteredToAccountRate.toFixed(4)} ${accountCurrency})`;
        break;
      case 'T=P≠A':
        conversionNote = `Deducted: ${account} (1 ${enteredCurrency} = ${enteredToAccountRate.toFixed(4)} ${accountCurrency})`;
        break;
      case 'T≠A≠P':
        conversionNote = `Account: ${account} • Display: ${primary}`;
        break;
    }
    
    return {
      entered,
      account,
      primary,
      conversionNote
    };
  }
  
  /**
   * Log conversion to database
   */
  private async logConversion(request: ConversionRequest, result: ConversionResult): Promise<void> {
    try {
      if (!request.userId) return;
      
      const { error } = await supabase.from('currency_conversion_log').insert({
        user_id: request.userId,
        operation_type: request.operationType || 'transaction',
        entered_amount: result.enteredAmount,
        entered_currency: result.enteredCurrency,
        account_amount: result.accountAmount,
        account_currency: result.accountCurrency,
        primary_amount: result.primaryAmount,
        primary_currency: result.primaryCurrency,
        conversion_case: result.conversionCase,
        exchange_rate: result.enteredToAccountRate,
        exchange_rate_used: result.enteredToPrimaryRate,
        linked_entity_id: request.linkedEntityId,
        linked_entity_type: request.linkedEntityType,
        timestamp: result.timestamp.toISOString()
      });
      
      if (error) {
        console.warn('Failed to log conversion:', error);
      }
    } catch (error) {
      console.warn('Error logging conversion:', error);
    }
  }
}

// Export singleton instance
export const unifiedCurrencyService = UnifiedCurrencyService.getInstance();

