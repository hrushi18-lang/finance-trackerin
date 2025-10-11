/**
 * Transaction Conversion Service
 * Single source of truth for ALL transaction currency conversions
 * Ensures preview = execution (WYSIWYG principle)
 */

import { simpleCurrencyService } from './simpleCurrencyService';
import { getCurrencyInfo } from '../utils/currency-converter';

export interface TransactionConversionRequest {
  // User input
  enteredAmount: number;
  enteredCurrency: string;
  
  // Account details
  accountId: string;
  accountCurrency: string;
  
  // User settings
  primaryCurrency: string;
  
  // Options
  lockRates?: boolean; // false = preview, true = final submission
  rateTimestamp?: Date;
}

export interface TransactionConversionResult {
  // Original input (what user entered)
  enteredAmount: number;
  enteredCurrency: string;
  enteredSymbol: string;
  
  // Account currency (what will be deducted)
  accountAmount: number;
  accountCurrency: string;
  accountSymbol: string;
  
  // Primary currency (for net worth/reporting)
  primaryAmount: number;
  primaryCurrency: string;
  primarySymbol: string;
  
  // Exchange rates used
  enteredToAccountRate: number;
  enteredToPrimaryRate: number;
  accountToPrimaryRate: number;
  
  // Metadata
  conversionCase: 'T=A=P' | 'T=A≠P' | 'T≠A,A=P' | 'T=P≠A' | 'T≠A≠P';
  ratesLockedAt: Date | null;
  rateSource: 'api' | 'manual' | 'fallback';
  
  // For database storage
  dbPayload: {
    native_amount: number;
    native_currency: string;
    native_symbol: string;
    converted_amount: number; // Account currency
    converted_currency: string; // Account currency
    converted_symbol: string;
    currency_code: string; // Primary currency
    primary_amount: number; // ← ADD: For APP DISPLAY (in primary currency)
    primary_currency: string; // ← ADD: User's display preference
    primary_symbol: string; // ← ADD: Primary currency symbol
    exchange_rate: number; // Entered → Account
    exchange_rate_used: number; // Entered → Primary
    conversion_source: string;
  };
  
  // Display helpers
  displayText: {
    entered: string;
    account: string;
    primary: string;
    conversionNote: string;
  };
}

export class TransactionConversionService {
  private static instance: TransactionConversionService;
  
  // Store locked rates for consistency
  private lockedRates: Map<string, { rate: number; timestamp: Date }> = new Map();
  
  public static getInstance(): TransactionConversionService {
    if (!TransactionConversionService.instance) {
      TransactionConversionService.instance = new TransactionConversionService();
    }
    return TransactionConversionService.instance;
  }
  
  /**
   * Main conversion method - calculates all currency conversions
   */
  async convert(request: TransactionConversionRequest): Promise<TransactionConversionResult> {
    const {
      enteredAmount,
      enteredCurrency,
      accountCurrency,
      primaryCurrency,
      lockRates = false,
      accountId
    } = request;
    
    console.log('🔄 TransactionConversion:', {
      amount: enteredAmount,
      from: enteredCurrency,
      account: accountCurrency,
      primary: primaryCurrency,
      lock: lockRates
    });
    
    // 1. Determine conversion case
    const conversionCase = this.determineConversionCase(
      enteredCurrency,
      accountCurrency,
      primaryCurrency
    );
    
    console.log('📊 Conversion case:', conversionCase);
    
    // 2. Get exchange rates (locked or fresh)
    const enteredToAccountRate = await this.getRate(
      enteredCurrency,
      accountCurrency,
      lockRates,
      `${accountId}_entered_to_account`
    );
    
    const enteredToPrimaryRate = await this.getRate(
      enteredCurrency,
      primaryCurrency,
      lockRates,
      `${accountId}_entered_to_primary`
    );
    
    const accountToPrimaryRate = await this.getRate(
      accountCurrency,
      primaryCurrency,
      lockRates,
      `${accountId}_account_to_primary`
    );
    
    // 3. Calculate amounts based on case
    const { accountAmount, primaryAmount } = this.calculateAmounts(
      enteredAmount,
      conversionCase,
      enteredToAccountRate,
      enteredToPrimaryRate
    );
    
    // 4. Get currency symbols
    const enteredInfo = getCurrencyInfo(enteredCurrency);
    const accountInfo = getCurrencyInfo(accountCurrency);
    const primaryInfo = getCurrencyInfo(primaryCurrency);
    
    const enteredSymbol = enteredInfo?.symbol || enteredCurrency;
    const accountSymbol = accountInfo?.symbol || accountCurrency;
    const primarySymbol = primaryInfo?.symbol || primaryCurrency;
    
    // 5. Build database payload
    const dbPayload = {
      native_amount: enteredAmount,
      native_currency: enteredCurrency,
      native_symbol: enteredSymbol,
      converted_amount: accountAmount,
      converted_currency: accountCurrency,
      converted_symbol: accountSymbol,
      currency_code: primaryCurrency,
      primary_amount: primaryAmount, // ✅ ADD: For APP DISPLAY
      primary_currency: primaryCurrency, // ✅ ADD: User's display preference
      primary_symbol: primarySymbol, // ✅ ADD: Primary currency symbol
      exchange_rate: enteredToAccountRate,
      exchange_rate_used: enteredToPrimaryRate,
      conversion_source: 'api' as const
    };
    
    // 6. Generate display text
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
    
    const result: TransactionConversionResult = {
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
      ratesLockedAt: lockRates ? new Date() : null,
      rateSource: 'api',
      dbPayload,
      displayText
    };
    
    console.log('✅ Conversion result:', {
      entered: `${enteredSymbol}${enteredAmount}`,
      account: `${accountSymbol}${accountAmount}`,
      primary: `${primarySymbol}${primaryAmount}`,
      locked: lockRates
    });
    
    return result;
  }
  
  /**
   * Determine which of the 5 conversion cases applies
   */
  private determineConversionCase(
    T: string, // Transaction
    A: string, // Account
    P: string  // Primary
  ): TransactionConversionResult['conversionCase'] {
    if (T === A && A === P) {
      return 'T=A=P'; // All same
    }
    if (T === A && A !== P) {
      return 'T=A≠P'; // Transaction = Account ≠ Primary
    }
    if (T !== A && A === P) {
      return 'T≠A,A=P'; // Transaction ≠ Account = Primary
    }
    if (T === P && A !== P) {
      return 'T=P≠A'; // Transaction = Primary ≠ Account
    }
    return 'T≠A≠P'; // All different
  }
  
  /**
   * Calculate account and primary amounts based on conversion case
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
        primaryAmount = accountAmount; // Same as account
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
    accountAmount = Math.round(accountAmount * 100) / 100;
    primaryAmount = Math.round(primaryAmount * 100) / 100;
    
    return { accountAmount, primaryAmount };
  }
  
  /**
   * Get exchange rate with optional locking
   */
  private async getRate(
    fromCurrency: string,
    toCurrency: string,
    lock: boolean,
    lockKey: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }
    
    // If locked, check for existing locked rate
    if (lock) {
      const locked = this.lockedRates.get(lockKey);
      if (locked) {
        console.log(`🔒 Using locked rate for ${lockKey}:`, locked.rate);
        return locked.rate;
      }
    }
    
    // Get fresh rate
    const rate = simpleCurrencyService.getRate(fromCurrency, toCurrency);
    
    // If locking, store the rate
    if (lock) {
      this.lockedRates.set(lockKey, { rate, timestamp: new Date() });
      console.log(`🔒 Locked rate for ${lockKey}:`, rate);
    }
    
    return rate;
  }
  
  /**
   * Clear locked rates (after transaction is saved)
   */
  clearLockedRates(accountId: string): void {
    const keysToDelete: string[] = [];
    
    this.lockedRates.forEach((_, key) => {
      if (key.startsWith(accountId)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.lockedRates.delete(key));
    console.log('🗑️ Cleared locked rates for account:', accountId);
  }
  
  /**
   * Generate display text for UI
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
  }): TransactionConversionResult['displayText'] {
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
        conversionNote = 'No conversion needed - all currencies match';
        break;
        
      case 'T=A≠P':
        conversionNote = `Converted to primary: 1 ${enteredCurrency} = ${enteredToPrimaryRate.toFixed(4)} ${primaryCurrency}`;
        break;
        
      case 'T≠A,A=P':
        conversionNote = `Converted to account: 1 ${enteredCurrency} = ${enteredToAccountRate.toFixed(4)} ${accountCurrency}`;
        break;
        
      case 'T=P≠A':
        conversionNote = `Converted to account: 1 ${enteredCurrency} = ${enteredToAccountRate.toFixed(4)} ${accountCurrency}`;
        break;
        
      case 'T≠A≠P':
        conversionNote = `Multi-currency: 1 ${enteredCurrency} = ${enteredToAccountRate.toFixed(4)} ${accountCurrency} = ${enteredToPrimaryRate.toFixed(4)} ${primaryCurrency}`;
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
   * Validate conversion request
   */
  validateRequest(request: TransactionConversionRequest): { valid: boolean; error?: string } {
    if (!request.enteredAmount || request.enteredAmount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }
    
    if (!request.enteredCurrency) {
      return { valid: false, error: 'Transaction currency is required' };
    }
    
    if (!request.accountCurrency) {
      return { valid: false, error: 'Account currency is required' };
    }
    
    if (!request.primaryCurrency) {
      return { valid: false, error: 'Primary currency is required' };
    }
    
    if (!request.accountId) {
      return { valid: false, error: 'Account ID is required' };
    }
    
    return { valid: true };
  }
}

// Export singleton instance
export const transactionConversionService = TransactionConversionService.getInstance();

