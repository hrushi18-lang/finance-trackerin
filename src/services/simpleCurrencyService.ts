/**
 * Simple Currency Service
 * Supports only 4 currencies: USD, INR, EUR, GBP
 * Manual entry for all other currencies
 */

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  accountAmount: number;
  accountCurrency: string;
  primaryAmount: number;
  primaryCurrency: string;
  exchangeRate: number;
  conversionSource: 'hardcoded' | 'manual';
}

export class SimpleCurrencyService {
  private static instance: SimpleCurrencyService;
  
  // Default rates (can be overridden by user)
  private static readonly DEFAULT_RATES: Record<string, number> = {
    'USD': 88.20,  // 1 USD = 88.20 INR
    'EUR': 103.60, // 1 EUR = 103.60 INR
    'GBP': 120.00, // 1 GBP = 120.00 INR (updated)
    'INR': 1       // 1 INR = 1 INR
  };

  // User-editable rates (stored in localStorage)
  private userRates: Record<string, Record<string, number>> = {};

  // Supported currencies
  public static readonly SUPPORTED_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'];
  
  // Currency symbols
  public static readonly CURRENCY_SYMBOLS: Record<string, string> = {
    'USD': '$',
    'INR': '₹',
    'EUR': '€',
    'GBP': '£'
  };

  // Currency names
  public static readonly CURRENCY_NAMES: Record<string, string> = {
    'USD': 'US Dollar',
    'INR': 'Indian Rupee',
    'EUR': 'Euro',
    'GBP': 'British Pound'
  };

  private constructor() {
    this.loadUserRates();
  }

  public static getInstance(): SimpleCurrencyService {
    if (!SimpleCurrencyService.instance) {
      SimpleCurrencyService.instance = new SimpleCurrencyService();
    }
    return SimpleCurrencyService.instance;
  }

  /**
   * Check if currency is supported
   */
  public isSupported(currency: string): boolean {
    return SimpleCurrencyService.SUPPORTED_CURRENCIES.includes(currency);
  }

  /**
   * Get supported currencies
   */
  public getSupportedCurrencies(): string[] {
    return [...SimpleCurrencyService.SUPPORTED_CURRENCIES];
  }

  /**
   * Get currency symbol
   */
  public getCurrencySymbol(currency: string): string {
    return SimpleCurrencyService.CURRENCY_SYMBOLS[currency] || currency;
  }

  /**
   * Get currency name
   */
  public getCurrencyName(currency: string): string {
    return SimpleCurrencyService.CURRENCY_NAMES[currency] || currency;
  }

  /**
   * Get exchange rate between two currencies (user-editable)
   */
  public getRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1.0;
    
    // Check if user has set a direct rate for this pair
    if (this.userRates[fromCurrency]?.[toCurrency]) {
      return this.userRates[fromCurrency][toCurrency];
    }
    
    // Check if user has set a reverse rate
    if (this.userRates[toCurrency]?.[fromCurrency]) {
      return 1 / this.userRates[toCurrency][fromCurrency];
    }
    
    // Fallback to default rates
    const fromRate = SimpleCurrencyService.DEFAULT_RATES[fromCurrency];
    const toRate = SimpleCurrencyService.DEFAULT_RATES[toCurrency];
    
    if (!fromRate || !toRate) {
      console.warn(`⚠️ Currency not supported: ${fromCurrency} or ${toCurrency}`);
      return 1.0;
    }
    
    // Convert: fromCurrency → INR → toCurrency
    if (fromCurrency === 'INR') {
      // INR to other currency: divide by target rate
      return 1 / toRate;
    } else if (toCurrency === 'INR') {
      // Other currency to INR: multiply by source rate
      return fromRate;
    } else {
      // Other currency to other currency: (source_rate / target_rate)
      return fromRate / toRate;
    }
  }

  /**
   * Convert amount from one currency to another
   */
  public convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = this.getRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Convert amount to account currency and primary currency
   * This is the main conversion logic: Amount → Account → Primary
   */
  public convertForTransaction(
    amount: number,
    amountCurrency: string,
    accountCurrency: string,
    primaryCurrency: string
  ): ConversionResult {
    // Convert amount to account currency
    const accountAmount = this.convert(amount, amountCurrency, accountCurrency);
    
    // Convert amount to primary currency (for net worth calculation)
    const primaryAmount = this.convert(amount, amountCurrency, primaryCurrency);
    
    // Get exchange rate for display
    const exchangeRate = this.getRate(amountCurrency, accountCurrency);
    
    return {
      originalAmount: amount,
      originalCurrency: amountCurrency,
      accountAmount: accountAmount,
      accountCurrency: accountCurrency,
      primaryAmount: primaryAmount,
      primaryCurrency: primaryCurrency,
      exchangeRate: exchangeRate,
      conversionSource: this.isSupported(amountCurrency) ? 'hardcoded' : 'manual'
    };
  }

  /**
   * Format amount with currency symbol
   */
  public formatAmount(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    const formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `${symbol}${formattedAmount}`;
  }

  /**
   * Get all available rates for a base currency
   */
  public getAllRates(baseCurrency: string): Record<string, number> {
    const rates: Record<string, number> = {};
    
    SimpleCurrencyService.SUPPORTED_CURRENCIES.forEach(currency => {
      if (currency !== baseCurrency) {
        rates[currency] = this.getRate(baseCurrency, currency);
      }
    });
    
    return rates;
  }

  /**
   * Get all rates relative to INR
   */
  public getAllRatesToINR(): Record<string, number> {
    return { ...SimpleCurrencyService.DEFAULT_RATES };
  }

  /**
   * Get rate information for display
   */
  public getRateInfo(fromCurrency: string, toCurrency: string): {
    rate: number;
    formatted: string;
    source: string;
  } {
    const rate = this.getRate(fromCurrency, toCurrency);
    const formatted = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
    const source = this.isSupported(fromCurrency) ? 'User rates' : 'Manual entry required';
    
    return { rate, formatted, source };
  }

  /**
   * Load user rates from localStorage
   */
  private loadUserRates(): void {
    try {
      const savedRates = localStorage.getItem('userCurrencyRates');
      if (savedRates) {
        const rates = JSON.parse(savedRates);
        this.userRates = {};
        
        // Convert array format to nested object format
        rates.forEach((rate: any) => {
          if (!this.userRates[rate.from]) {
            this.userRates[rate.from] = {};
          }
          this.userRates[rate.from][rate.to] = rate.rate;
        });
      }
    } catch (error) {
      console.warn('Failed to load user rates:', error);
    }
  }

  /**
   * Update user rates
   */
  public updateUserRates(rates: Array<{ from: string; to: string; rate: number }>): void {
    this.userRates = {};
    
    // Convert array format to nested object format
    rates.forEach(rate => {
      if (!this.userRates[rate.from]) {
        this.userRates[rate.from] = {};
      }
      this.userRates[rate.from][rate.to] = rate.rate;
    });
  }

  /**
   * Get current user rates
   */
  public getUserRates(): Record<string, Record<string, number>> {
    return { ...this.userRates };
  }

  /**
   * Reset to default rates
   */
  public resetToDefaults(): void {
    this.userRates = {};
    localStorage.removeItem('userCurrencyRates');
  }
}

// Export singleton instance
export const simpleCurrencyService = SimpleCurrencyService.getInstance();
