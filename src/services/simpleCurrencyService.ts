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
  
  // ✅ Default rates - October 2025 Market Rates
  // These are current market rates that work for any base currency
  private static readonly DEFAULT_RATES: Record<string, Record<string, number>> = {
    'USD': {
      'USD': 1.0000,
      'EUR': 0.8575,    // 1 USD = 0.8575 EUR
      'GBP': 0.7460,    // 1 USD = 0.7460 GBP
      'INR': 88.25      // 1 USD = 88.25 INR
    },
    'EUR': {
      'USD': 1.1650,    // 1 EUR = 1.1650 USD
      'EUR': 1.0000,
      'GBP': 0.8700,    // 1 EUR = 0.8700 GBP
      'INR': 103.6      // 1 EUR = 103.6 INR
    },
    'GBP': {
      'USD': 1.3400,    // 1 GBP = 1.3400 USD
      'EUR': 1.1500,    // 1 GBP = 1.1500 EUR
      'GBP': 1.0000,
      'INR': 119.5      // 1 GBP = 119.5 INR
    },
    'INR': {
      'USD': 0.01133,   // 1 INR = 0.01133 USD
      'EUR': 0.00965,   // 1 INR = 0.00965 EUR
      'GBP': 0.00837,   // 1 INR = 0.00837 GBP
      'INR': 1.0000
    }
  };

  // User-editable rates (stored in localStorage)
  private userRates: Record<string, Record<string, number>> = {};

  // Metadata tracking for custom rates
  private rateMetadata: Record<string, { lastUpdated: string; notes?: string }> = {};

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
    this.loadFromLocalStorage();
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
   * ✅ Get exchange rate between two currencies (user-editable)
   * Works correctly regardless of which currency is the base
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
    
    // ✅ Use direct rate lookup from matrix
    if (SimpleCurrencyService.DEFAULT_RATES[fromCurrency]?.[toCurrency]) {
      return SimpleCurrencyService.DEFAULT_RATES[fromCurrency][toCurrency];
    }
    
    // ✅ If direct rate not found, calculate via USD as intermediary
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUSD = SimpleCurrencyService.DEFAULT_RATES[fromCurrency]?.['USD'];
      const usdToTarget = SimpleCurrencyService.DEFAULT_RATES['USD']?.[toCurrency];
      
      if (fromToUSD && usdToTarget) {
        return fromToUSD * usdToTarget;
      }
    }
    
    console.warn(`⚠️ Currency pair not supported: ${fromCurrency} → ${toCurrency}`);
    return 1.0;
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
   * ✅ Get all available rates for ANY base currency
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
   * ✅ Get rates for a specific base currency (supports USD, EUR, INR, GBP as base)
   */
  public getRatesForBase(baseCurrency: string): Record<string, number> {
    return SimpleCurrencyService.DEFAULT_RATES[baseCurrency] || { [baseCurrency]: 1.0 };
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
    this.rateMetadata = {};
    localStorage.removeItem('userCurrencyRates');
  }

  // ===== NEW RATE MANAGEMENT METHODS =====

  /**
   * Save a custom user rate with metadata
   */
  public saveUserRate(from: string, to: string, rate: number, notes?: string): void {
    if (!this.userRates[from]) {
      this.userRates[from] = {};
    }
    this.userRates[from][to] = rate;
    
    // Save metadata
    const key = `${from}-${to}`;
    this.rateMetadata[key] = {
      lastUpdated: new Date().toISOString(),
      notes
    };
    
    // Also save inverse
    if (!this.userRates[to]) {
      this.userRates[to] = {};
    }
    this.userRates[to][from] = 1 / rate;
    
    const inverseKey = `${to}-${from}`;
    this.rateMetadata[inverseKey] = {
      lastUpdated: new Date().toISOString(),
      notes: notes ? `Auto-calculated from ${from}→${to}` : undefined
    };
    
    this.saveToLocalStorage();
  }

  /**
   * Delete a custom user rate
   */
  public deleteUserRate(from: string, to: string): void {
    if (this.userRates[from]) {
      delete this.userRates[from][to];
    }
    if (this.userRates[to]) {
      delete this.userRates[to][from];
    }
    
    // Remove metadata
    delete this.rateMetadata[`${from}-${to}`];
    delete this.rateMetadata[`${to}-${from}`];
    
    this.saveToLocalStorage();
  }

  /**
   * Check if a rate is custom (user-edited)
   */
  public isCustomRate(from: string, to: string): boolean {
    return !!this.userRates[from]?.[to];
  }

  /**
   * Get the default system rate
   */
  public getDefaultRate(from: string, to: string): number {
    return SimpleCurrencyService.DEFAULT_RATES[from]?.[to] || 1.0;
  }

  /**
   * Get metadata for a rate (last updated, notes)
   */
  public getRateMetadata(from: string, to: string): { lastUpdated: string; notes?: string } | null {
    return this.rateMetadata[`${from}-${to}`] || null;
  }

  /**
   * Get all custom rates with metadata
   */
  public getAllCustomRates(): Array<{from: string; to: string; rate: number; lastUpdated?: string; notes?: string}> {
    const rates = [];
    for (const from in this.userRates) {
      for (const to in this.userRates[from]) {
        const metadata = this.rateMetadata[`${from}-${to}`];
        rates.push({ 
          from, 
          to, 
          rate: this.userRates[from][to],
          lastUpdated: metadata?.lastUpdated,
          notes: metadata?.notes
        });
      }
    }
    return rates;
  }

  /**
   * Get all rates for display (both default and custom)
   */
  public getAllRatesForDisplay(): Array<{
    from: string; 
    to: string; 
    rate: number; 
    defaultRate: number;
    isCustom: boolean;
    lastUpdated?: string;
    notes?: string;
  }> {
    const currencies = ['USD', 'EUR', 'GBP', 'INR'];
    const rates = [];
    
    for (const from of currencies) {
      for (const to of currencies) {
        if (from !== to) {
          const rate = this.getRate(from, to);
          const defaultRate = this.getDefaultRate(from, to);
          const isCustom = this.isCustomRate(from, to);
          const metadata = this.getRateMetadata(from, to);
          
          rates.push({
            from,
            to,
            rate,
            defaultRate,
            isCustom,
            lastUpdated: metadata?.lastUpdated,
            notes: metadata?.notes
          });
        }
      }
    }
    
    return rates;
  }

  /**
   * Export custom rates to JSON
   */
  public exportRates(): string {
    return JSON.stringify({
      rates: this.getAllCustomRates(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import rates from JSON
   */
  public importRates(json: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(json);
      const rates = Array.isArray(data) ? data : data.rates;
      
      if (!rates || !Array.isArray(rates)) {
        return { success: false, imported: 0, errors: ['Invalid format'] };
      }
      
      let imported = 0;
      const errors: string[] = [];
      
      for (const rate of rates) {
        if (!rate.from || !rate.to || !rate.rate || rate.rate <= 0) {
          errors.push(`Invalid rate: ${JSON.stringify(rate)}`);
          continue;
        }
        
        this.saveUserRate(rate.from, rate.to, rate.rate, rate.notes);
        imported++;
      }
      
      return { success: true, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [error.message] };
    }
  }

  /**
   * Reset all custom rates
   */
  public resetAllRates(): void {
    this.userRates = {};
    this.rateMetadata = {};
    this.saveToLocalStorage();
  }

  /**
   * Reset a specific rate to default
   */
  public resetRate(from: string, to: string): void {
    this.deleteUserRate(from, to);
  }

  /**
   * Save rates and metadata to localStorage
   */
  private saveToLocalStorage(): void {
    const data = {
      rates: this.userRates,
      metadata: this.rateMetadata
    };
    localStorage.setItem('userCurrencyRates', JSON.stringify(data));
  }

  /**
   * Load rates and metadata from localStorage
   */
  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('userCurrencyRates');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Handle old format (just rates) and new format (rates + metadata)
        if (data.rates) {
          this.userRates = data.rates;
          this.rateMetadata = data.metadata || {};
        } else {
          // Old format - just rates
          this.userRates = data;
          this.rateMetadata = {};
        }
      } catch (error) {
        console.error('Error loading custom rates:', error);
        this.userRates = {};
        this.rateMetadata = {};
      }
    }
  }
}

// Export singleton instance
export const simpleCurrencyService = SimpleCurrencyService.getInstance();
