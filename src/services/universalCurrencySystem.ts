/**
 * ===================================================================
 * UNIVERSAL MULTI-CURRENCY TRANSACTION SYSTEM
 * ===================================================================
 * 
 * A complete, reusable multi-currency transaction system that handles:
 * - Live exchange rate fetching from exchangerate.host
 * - Universal currency conversions (transaction → account → base)
 * - Transaction deduction/addition logic (income/expense/transfer)
 * - Proper formatting with Intl.NumberFormat
 * - Session caching to reduce API calls
 * - Offline fallback support
 * 
 * @author Universal Currency System
 * @version 2.0.0
 */

// ===================================================================
// TYPES & INTERFACES
// ===================================================================

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: 'api' | 'cache' | 'manual' | 'fallback';
}

export interface ConversionResult {
  // Original transaction
  transactionAmount: number;
  transactionCurrency: string;
  transactionFormatted: string;
  
  // Account currency (for deduction/addition)
  accountAmount: number;
  accountCurrency: string;
  accountFormatted: string;
  
  // Base currency (for display/totals)
  baseAmount: number;
  baseCurrency: string;
  baseFormatted: string;
  
  // Exchange rates used
  rates: {
    transactionToAccount: number;
    transactionToBase: number;
    accountToBase: number;
  };
  
  // Metadata
  conversionPath: string;
  timestamp: Date;
  cacheHit: boolean;
}

export interface TransactionRequest {
  // Transaction details
  amount: number;
  currency: string; // Currency user entered
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  
  // Account details
  accountId: string;
  accountCurrency: string;
  
  // User settings
  baseCurrency: string; // User's base currency for display
  
  // Optional
  targetAccountId?: string; // For transfers
  targetAccountCurrency?: string; // For transfers
  manualRate?: number; // Manual override
}

export interface TransactionResult extends ConversionResult {
  // Transaction execution data
  accountBalanceChange: number; // Amount to deduct/add from account
  baseBalanceChange: number; // Amount in base currency
  
  // Transfer specific (if applicable)
  targetAccountChange?: number;
  targetCurrencyFormatted?: string;
  
  // Summary
  summary: {
    action: string;
    primary: string;
    secondary: string;
  };
}

// ===================================================================
// EXCHANGE RATE SERVICE
// ===================================================================

class ExchangeRateService {
  private cache: Map<string, ExchangeRate> = new Map();
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds
  private readonly API_BASE_URL = 'https://api.exchangerate.host';
  
  // Fallback rates (updated October 2025)
  private readonly FALLBACK_RATES: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.50,
    JPY: 149.50,
    AUD: 1.53,
    CAD: 1.36,
    CHF: 0.88,
    CNY: 7.25,
    MXN: 17.10,
    BRL: 5.15,
    ZAR: 18.90,
    SGD: 1.34,
    HKD: 7.82,
    KRW: 1355.0,
    THB: 36.50,
    NZD: 1.62,
    MYR: 4.48,
    AED: 3.67,
    SAR: 3.75,
    RUB: 92.50,
    TRY: 28.50
  };
  
  /**
   * Get exchange rate between two currencies
   */
  async getRate(from: string, to: string, manualRate?: number): Promise<ExchangeRate> {
    // Same currency = 1.0
    if (from === to) {
      return {
        from,
        to,
        rate: 1.0,
        timestamp: new Date(),
        source: 'api'
      };
    }
    
    // Use manual rate if provided
    if (manualRate !== undefined) {
      return {
        from,
        to,
        rate: manualRate,
        timestamp: new Date(),
        source: 'manual'
      };
    }
    
    // Check cache first
    const cacheKey = `${from}_${to}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log(`💰 Using cached rate: ${from} → ${to} = ${cached.rate}`);
      return { ...cached, source: 'cache' };
    }
    
    // Fetch from API
    try {
      const rate = await this.fetchRateFromAPI(from, to);
      const rateData: ExchangeRate = {
        from,
        to,
        rate,
        timestamp: new Date(),
        source: 'api'
      };
      
      // Cache the rate
      this.cache.set(cacheKey, rateData);
      
      // Also cache session storage for offline use
      this.cacheToSession(cacheKey, rateData);
      
      console.log(`✅ Fetched rate: ${from} → ${to} = ${rate}`);
      return rateData;
      
    } catch (error) {
      console.warn(`⚠️ API failed, trying fallback: ${error}`);
      
      // Try session storage
      const sessionRate = this.getFromSession(cacheKey);
      if (sessionRate) {
        console.log(`📦 Using session storage rate: ${from} → ${to}`);
        return sessionRate;
      }
      
      // Use fallback rates
      const fallbackRate = this.calculateFallbackRate(from, to);
      return {
        from,
        to,
        rate: fallbackRate,
        timestamp: new Date(),
        source: 'fallback'
      };
    }
  }
  
  /**
   * Fetch rate from exchangerate.host API
   */
  private async fetchRateFromAPI(from: string, to: string): Promise<number> {
    const url = `${this.API_BASE_URL}/convert?from=${from}&to=${to}&amount=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result) {
      throw new Error('Invalid API response');
    }
    
    return data.result;
  }
  
  /**
   * Calculate rate using fallback rates (through USD)
   */
  private calculateFallbackRate(from: string, to: string): number {
    const fromRate = this.FALLBACK_RATES[from];
    const toRate = this.FALLBACK_RATES[to];
    
    if (!fromRate || !toRate) {
      console.warn(`⚠️ No fallback rate for ${from} or ${to}, using 1.0`);
      return 1.0;
    }
    
    // Convert through USD
    return toRate / fromRate;
  }
  
  /**
   * Check if cached rate is still valid
   */
  private isCacheValid(rate: ExchangeRate): boolean {
    const now = new Date().getTime();
    const rateTime = rate.timestamp.getTime();
    return (now - rateTime) < this.CACHE_DURATION;
  }
  
  /**
   * Cache rate to session storage
   */
  private cacheToSession(key: string, rate: ExchangeRate): void {
    try {
      sessionStorage.setItem(
        `currency_rate_${key}`,
        JSON.stringify({
          ...rate,
          timestamp: rate.timestamp.toISOString()
        })
      );
    } catch (error) {
      console.warn('Failed to cache to session:', error);
    }
  }
  
  /**
   * Get rate from session storage
   */
  private getFromSession(key: string): ExchangeRate | null {
    try {
      const cached = sessionStorage.getItem(`currency_rate_${key}`);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp)
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Clear expired cache entries
   */
  clearStaleCache(): void {
    const staleKeys: string[] = [];
    
    this.cache.forEach((rate, key) => {
      if (!this.isCacheValid(rate)) {
        staleKeys.push(key);
      }
    });
    
    staleKeys.forEach(key => this.cache.delete(key));
    
    console.log(`🧹 Cleared ${staleKeys.length} stale cache entries`);
  }
  
  /**
   * Get all cached rates (for debugging)
   */
  getCachedRates(): ExchangeRate[] {
    return Array.from(this.cache.values());
  }
}

// ===================================================================
// CURRENCY FORMATTER
// ===================================================================

class CurrencyFormatter {
  /**
   * Format amount with proper currency symbol using Intl.NumberFormat
   */
  format(amount: number, currencyCode: string): string {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      return formatter.format(amount);
    } catch (error) {
      // Fallback for unsupported currencies
      console.warn(`Unsupported currency: ${currencyCode}`);
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  }
  
  /**
   * Get currency symbol
   */
  getSymbol(currencyCode: string): string {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      
      // Format 0 to extract symbol
      const parts = formatter.formatToParts(0);
      const symbolPart = parts.find(part => part.type === 'currency');
      
      return symbolPart?.value || currencyCode;
    } catch (error) {
      return currencyCode;
    }
  }
}

// ===================================================================
// MULTI-CURRENCY CONVERTER
// ===================================================================

class MultiCurrencyConverter {
  private rateService: ExchangeRateService;
  private formatter: CurrencyFormatter;
  
  constructor() {
    this.rateService = new ExchangeRateService();
    this.formatter = new CurrencyFormatter();
  }
  
  /**
   * Convert amount through multiple currencies
   * Transaction Currency → Account Currency → Base Currency
   */
  async convertAmount(
    amount: number,
    transactionCurrency: string,
    accountCurrency: string,
    baseCurrency: string,
    manualRate?: number
  ): Promise<ConversionResult> {
    console.log(`\n🔄 Converting: ${amount} ${transactionCurrency}`);
    console.log(`   Account: ${accountCurrency}`);
    console.log(`   Base: ${baseCurrency}`);
    
    // Get all exchange rates
    const transToAccountRate = await this.rateService.getRate(
      transactionCurrency,
      accountCurrency,
      manualRate
    );
    
    const transToBaseRate = await this.rateService.getRate(
      transactionCurrency,
      baseCurrency
    );
    
    const accountToBaseRate = await this.rateService.getRate(
      accountCurrency,
      baseCurrency
    );
    
    // Calculate amounts
    const accountAmount = amount * transToAccountRate.rate;
    const baseAmount = amount * transToBaseRate.rate;
    
    // Format amounts
    const transactionFormatted = this.formatter.format(amount, transactionCurrency);
    const accountFormatted = this.formatter.format(accountAmount, accountCurrency);
    const baseFormatted = this.formatter.format(baseAmount, baseCurrency);
    
    // Determine conversion path
    const conversionPath = this.determineConversionPath(
      transactionCurrency,
      accountCurrency,
      baseCurrency
    );
    
    const result: ConversionResult = {
      transactionAmount: amount,
      transactionCurrency,
      transactionFormatted,
      
      accountAmount: Math.round(accountAmount * 100) / 100,
      accountCurrency,
      accountFormatted,
      
      baseAmount: Math.round(baseAmount * 100) / 100,
      baseCurrency,
      baseFormatted,
      
      rates: {
        transactionToAccount: transToAccountRate.rate,
        transactionToBase: transToBaseRate.rate,
        accountToBase: accountToBaseRate.rate
      },
      
      conversionPath,
      timestamp: new Date(),
      cacheHit: transToAccountRate.source === 'cache'
    };
    
    console.log(`✅ Conversion complete:`);
    console.log(`   Transaction: ${transactionFormatted}`);
    console.log(`   Account: ${accountFormatted}`);
    console.log(`   Base: ${baseFormatted}`);
    console.log(`   Path: ${conversionPath}\n`);
    
    return result;
  }
  
  /**
   * Determine conversion path (for logging/display)
   */
  private determineConversionPath(t: string, a: string, b: string): string {
    if (t === a && a === b) return 'T=A=B (No conversion)';
    if (t === a && a !== b) return 'T=A≠B (Convert to base)';
    if (t !== a && a === b) return 'T≠A=B (Convert to account/base)';
    if (t === b && a !== b) return 'T=B≠A (Convert to account)';
    return 'T≠A≠B (Multi-step conversion)';
  }
  
  /**
   * Get rate service (for manual operations)
   */
  getRateService(): ExchangeRateService {
    return this.rateService;
  }
  
  /**
   * Get formatter (for manual operations)
   */
  getFormatter(): CurrencyFormatter {
    return this.formatter;
  }
}

// ===================================================================
// TRANSACTION HANDLER
// ===================================================================

class TransactionHandler {
  private converter: MultiCurrencyConverter;
  
  constructor() {
    this.converter = new MultiCurrencyConverter();
  }
  
  /**
   * Handle a transaction (income, expense, or transfer)
   */
  async handleTransaction(request: TransactionRequest): Promise<TransactionResult> {
    console.log(`\n💸 Processing ${request.type.toUpperCase()} transaction`);
    
    // Convert amounts
    const conversion = await this.converter.convertAmount(
      request.amount,
      request.currency,
      request.accountCurrency,
      request.baseCurrency,
      request.manualRate
    );
    
    // Calculate balance changes based on transaction type
    let accountBalanceChange: number;
    let baseBalanceChange: number;
    let summary: TransactionResult['summary'];
    
    switch (request.type) {
      case 'income':
        // Add to account
        accountBalanceChange = +conversion.accountAmount;
        baseBalanceChange = +conversion.baseAmount;
        summary = {
          action: 'Credit',
          primary: `+${conversion.accountFormatted} to account`,
          secondary: `Base: +${conversion.baseFormatted}`
        };
        break;
        
      case 'expense':
        // Deduct from account
        accountBalanceChange = -conversion.accountAmount;
        baseBalanceChange = -conversion.baseAmount;
        summary = {
          action: 'Debit',
          primary: `-${conversion.accountFormatted} from account`,
          secondary: `Base: -${conversion.baseFormatted}`
        };
        break;
        
      case 'transfer':
        // Deduct from source account
        accountBalanceChange = -conversion.accountAmount;
        baseBalanceChange = -conversion.baseAmount;
        
        // If target account exists, calculate target amount
        let targetAccountChange: number | undefined;
        let targetCurrencyFormatted: string | undefined;
        
        if (request.targetAccountId && request.targetAccountCurrency) {
          const targetRate = await this.converter.getRateService().getRate(
            request.currency,
            request.targetAccountCurrency
          );
          
          targetAccountChange = request.amount * targetRate.rate;
          targetCurrencyFormatted = this.converter.getFormatter().format(
            targetAccountChange,
            request.targetAccountCurrency
          );
        }
        
        summary = {
          action: 'Transfer',
          primary: `-${conversion.accountFormatted} from source`,
          secondary: targetCurrencyFormatted 
            ? `+${targetCurrencyFormatted} to target`
            : `Base: -${conversion.baseFormatted}`
        };
        
        return {
          ...conversion,
          accountBalanceChange,
          baseBalanceChange,
          targetAccountChange,
          targetCurrencyFormatted,
          summary
        };
        
      default:
        throw new Error(`Invalid transaction type: ${request.type}`);
    }
    
    const result: TransactionResult = {
      ...conversion,
      accountBalanceChange,
      baseBalanceChange,
      summary
    };
    
    console.log(`✅ Transaction processed:`);
    console.log(`   ${summary.action}: ${summary.primary}`);
    console.log(`   ${summary.secondary}\n`);
    
    return result;
  }
  
  /**
   * Get converter (for direct access)
   */
  getConverter(): MultiCurrencyConverter {
    return this.converter;
  }
}

// ===================================================================
// MAIN SYSTEM CLASS
// ===================================================================

export class UniversalCurrencySystem {
  private handler: TransactionHandler;
  private converter: MultiCurrencyConverter;
  private rateService: ExchangeRateService;
  private formatter: CurrencyFormatter;
  
  constructor() {
    this.handler = new TransactionHandler();
    this.converter = this.handler.getConverter();
    this.rateService = this.converter.getRateService();
    this.formatter = this.converter.getFormatter();
  }
  
  // ===== HIGH-LEVEL API =====
  
  /**
   * Process a transaction
   */
  async processTransaction(request: TransactionRequest): Promise<TransactionResult> {
    return this.handler.handleTransaction(request);
  }
  
  /**
   * Convert amount between currencies
   */
  async convertAmount(
    amount: number,
    from: string,
    to: string,
    baseCurrency?: string
  ): Promise<ConversionResult> {
    const base = baseCurrency || to;
    return this.converter.convertAmount(amount, from, to, base);
  }
  
  /**
   * Get exchange rate
   */
  async getRate(from: string, to: string, manualRate?: number): Promise<ExchangeRate> {
    return this.rateService.getRate(from, to, manualRate);
  }
  
  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string): string {
    return this.formatter.format(amount, currency);
  }
  
  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: string): string {
    return this.formatter.getSymbol(currency);
  }
  
  // ===== MAINTENANCE =====
  
  /**
   * Clear stale cache
   */
  clearCache(): void {
    this.rateService.clearStaleCache();
  }
  
  /**
   * Get cached rates (for debugging)
   */
  getCachedRates(): ExchangeRate[] {
    return this.rateService.getCachedRates();
  }
}

// ===================================================================
// SINGLETON INSTANCE
// ===================================================================

let systemInstance: UniversalCurrencySystem | null = null;

/**
 * Get singleton instance of the currency system
 */
export function getCurrencySystem(): UniversalCurrencySystem {
  if (!systemInstance) {
    systemInstance = new UniversalCurrencySystem();
  }
  return systemInstance;
}

// ===================================================================
// CONVENIENCE FUNCTIONS
// ===================================================================

/**
 * Quick transaction processing
 */
export async function processTransaction(
  amount: number,
  currency: string,
  accountCurrency: string,
  baseCurrency: string,
  type: 'income' | 'expense' | 'transfer',
  accountId: string,
  options?: {
    targetAccountId?: string;
    targetAccountCurrency?: string;
    description?: string;
    manualRate?: number;
  }
): Promise<TransactionResult> {
  const system = getCurrencySystem();
  
  return system.processTransaction({
    amount,
    currency,
    type,
    accountId,
    accountCurrency,
    baseCurrency,
    ...options
  });
}

/**
 * Quick conversion
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
  baseCurrency?: string
): Promise<ConversionResult> {
  const system = getCurrencySystem();
  return system.convertAmount(amount, from, to, baseCurrency);
}

/**
 * Quick rate lookup
 */
export async function getExchangeRate(
  from: string,
  to: string,
  manualRate?: number
): Promise<number> {
  const system = getCurrencySystem();
  const rate = await system.getRate(from, to, manualRate);
  return rate.rate;
}

/**
 * Quick formatting
 */
export function formatCurrency(amount: number, currency: string): string {
  const system = getCurrencySystem();
  return system.formatCurrency(amount, currency);
}

