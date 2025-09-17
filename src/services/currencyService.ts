/**
 * Enhanced Multi-Currency Service with Real-Time API Integration
 * Handles dual currency logic for accounts and transactions with live exchange rates
 */

import { 
  convertCurrency, 
  getExchangeRate, 
  getCurrencyInfo, 
  formatDualCurrency,
  CURRENCIES 
} from '../utils/currency-converter';

export interface DualCurrencyData {
  nativeAmount: number;
  nativeCurrency: string;
  nativeSymbol: string;
  convertedAmount: number;
  convertedCurrency: string;
  convertedSymbol: string;
  exchangeRate: number;
  needsConversion: boolean;
  rateSource?: 'api' | 'cached' | 'fallback';
  lastUpdated?: Date;
}

export interface AccountCurrencyData {
  accountId: string;
  nativeCurrency: string;
  nativeBalance: number;
  nativeSymbol: string;
  convertedBalance: number;
  convertedCurrency: string;
  convertedSymbol: string;
  exchangeRate: number;
  lastConversionDate: Date;
}

export interface ExchangeRates {
  [currency: string]: number;
}

export interface RateInfo {
  rates: ExchangeRates;
  lastUpdated: Date;
  source: 'api' | 'cached' | 'fallback';
  apiProvider?: string;
}

export class CurrencyService {
  private userPrimaryCurrency: string = 'USD';
  private rates: ExchangeRates = {};
  private lastUpdated: Date | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CURRENCY_API_KEY) || '';
  private rateSource: 'api' | 'cached' | 'fallback' = 'fallback';

  // API Endpoints (in order of preference)
  private getApiEndpoints() {
    return [
      {
        name: 'ExchangeRate-API',
        url: 'https://api.exchangerate-api.com/v4/latest/USD',
        requiresKey: false,
        priority: 1
      },
      ...(this.API_KEY ? [{
        name: 'CurrencyAPI',
        url: `https://api.currencyapi.com/v3/latest?apikey=${this.API_KEY}&base_currency=USD`,
        requiresKey: true,
        priority: 2
      }] : []),
      ...(this.API_KEY ? [{
        name: 'Fixer.io',
        url: `https://api.fixer.io/latest?access_key=${this.API_KEY}&base=USD`,
        requiresKey: true,
        priority: 3
      }] : [])
    ];
  }

  // Fallback rates (updated for September 2025)
  private readonly FALLBACK_RATES: ExchangeRates = {
    'USD': 1.0,
    'INR': 83.45,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 150.0,
    'CNY': 7.24,
    'MYR': 4.47,
    'SGD': 1.34,
    'AED': 3.67,
    'NZD': 1.62,
    'ZAR': 18.85,
    'CAD': 1.36,
    'LKR': 325.0,
    'AUD': 1.53,
    'HKD': 7.82,
    'KRW': 1350.0,
    'THB': 36.5,
    'CHF': 0.88,
    'BRL': 5.15,
    'RUB': 92.5
  };

  constructor(primaryCurrency?: string) {
    if (primaryCurrency) {
      this.userPrimaryCurrency = primaryCurrency;
    }
    this.initializeRates();
  }

  /**
   * Initialize rates on service creation
   */
  private async initializeRates() {
    await this.refreshRates();
  }

  /**
   * Check if current rates are fresh (less than 24 hours old)
   */
  private isRatesFresh(): boolean {
    if (!this.lastUpdated) return false;
    const now = new Date();
    const timeDiff = now.getTime() - this.lastUpdated.getTime();
    return timeDiff < this.CACHE_DURATION;
  }

  /**
   * Get cached rates from localStorage
   */
  private getCachedRates(): ExchangeRates | null {
    try {
      const cached = localStorage.getItem('finspire_exchange_rates');
      const timestamp = localStorage.getItem('finspire_rates_timestamp');
      
      if (cached && timestamp) {
        const lastUpdated = new Date(timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        
        // Use cached rates if less than 24 hours old
        if (timeDiff < this.CACHE_DURATION) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.error('Error loading cached rates:', error);
    }
    return null;
  }

  /**
   * Cache rates to localStorage
   */
  private cacheRates(rates: ExchangeRates) {
    try {
      localStorage.setItem('finspire_exchange_rates', JSON.stringify(rates));
      localStorage.setItem('finspire_rates_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Error caching rates:', error);
    }
  }

  /**
   * Fetch rates from multiple APIs with fallback chain
   */
  private async fetchRatesFromAPIs(): Promise<ExchangeRates | null> {
    // Try each API in order of preference
    for (const api of this.getApiEndpoints()) {
      // Skip APIs that require keys if no key is available
      if (api.requiresKey && !this.API_KEY) {
        console.log(`Skipping ${api.name} - API key required`);
        continue;
      }

      try {
        console.log(`Trying ${api.name}...`);
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit'
        });

        if (response.ok) {
          const data = await response.json();
          let rates: ExchangeRates = {};

          // Parse response based on API format
          if (api.name === 'ExchangeRate-API') {
            rates = data.rates;
          } else if (api.name === 'CurrencyAPI') {
            rates = Object.fromEntries(
              Object.entries(data.data).map(([key, value]: [string, any]) => [key, value.value])
            );
          } else if (api.name === 'Fixer.io') {
            rates = data.rates;
          }

          // Ensure USD is always 1.0
          rates['USD'] = 1.0;

          console.log(`✅ ${api.name} successful`);
          this.rateSource = 'api';
          return rates;
        }
      } catch (error) {
        console.log(`❌ ${api.name} failed:`, error);
      }
    }

    console.log('All APIs failed, using fallback rates');
    this.rateSource = 'fallback';
    return this.FALLBACK_RATES;
  }

  /**
   * Refresh exchange rates from APIs
   */
  public async refreshRates(): Promise<RateInfo> {
    // Check if we have fresh cached rates first
    if (this.isRatesFresh()) {
      return {
        rates: this.rates,
        lastUpdated: this.lastUpdated!,
        source: 'cached',
        apiProvider: 'cached'
      };
    }

    // Try to get cached rates from localStorage
    const cachedRates = this.getCachedRates();
    if (cachedRates) {
      this.rates = cachedRates;
      this.lastUpdated = new Date();
      this.rateSource = 'cached';
      return {
        rates: this.rates,
        lastUpdated: this.lastUpdated,
        source: 'cached',
        apiProvider: 'cached'
      };
    }

    // Fetch fresh rates from APIs
    const freshRates = await this.fetchRatesFromAPIs();
    if (freshRates) {
      this.rates = freshRates;
      this.lastUpdated = new Date();
      this.cacheRates(freshRates);
      
      return {
        rates: this.rates,
        lastUpdated: this.lastUpdated,
        source: this.rateSource,
        apiProvider: this.rateSource === 'api' ? 'multiple' : undefined
      };
    }

    // Use fallback rates as last resort
    this.rates = this.FALLBACK_RATES;
    this.lastUpdated = new Date();
    this.rateSource = 'fallback';

    return {
      rates: this.rates,
      lastUpdated: this.lastUpdated,
      source: 'fallback',
      apiProvider: 'fallback'
    };
  }

  /**
   * Get current exchange rates
   */
  public getCurrentRates(): ExchangeRates {
    return this.rates;
  }

  /**
   * Get rate info including metadata
   */
  public getRateInfo(): RateInfo {
    return {
      rates: this.rates,
      lastUpdated: this.lastUpdated || new Date(),
      source: this.rateSource,
      apiProvider: this.rateSource === 'api' ? 'multiple' : this.rateSource
    };
  }

  /**
   * Convert amount between currencies using current rates
   */
  public convertAmount(amount: number, fromCurrency: string, toCurrency: string): number | null {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = this.rates[fromCurrency];
    const toRate = this.rates[toCurrency];
    
    if (!fromRate || !toRate) {
      console.warn(`Exchange rates not available for ${fromCurrency} or ${toCurrency}`);
      return null;
    }
    
    // Convert through USD as base currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    // Round to appropriate decimal places
    const currency = getCurrencyInfo(toCurrency);
    const decimalPlaces = currency?.decimal_places || 2;
    
    return Number(convertedAmount.toFixed(decimalPlaces));
  }

  /**
   * Get exchange rate between two currencies
   */
  public getExchangeRate(fromCurrency: string, toCurrency: string): number | null {
    if (fromCurrency === toCurrency) return 1.0;
    
    const fromRate = this.rates[fromCurrency];
    const toRate = this.rates[toCurrency];
    
    if (!fromRate || !toRate) return null;
    
    return toRate / fromRate;
  }

  setPrimaryCurrency(currency: string) {
    this.userPrimaryCurrency = currency;
  }

  getPrimaryCurrency(): string {
    return this.userPrimaryCurrency;
  }

  /**
   * Process account creation with currency conversion
   */
  processAccountCreation(
    accountCurrency: string,
    initialBalance: number,
    userPrimaryCurrency?: string
  ): DualCurrencyData {
    const primaryCurrency = userPrimaryCurrency || this.userPrimaryCurrency;
    const needsConversion = accountCurrency !== primaryCurrency;

    let convertedAmount = initialBalance;
    let exchangeRate = 1.0;

    if (needsConversion) {
      const converted = this.convertAmount(initialBalance, accountCurrency, primaryCurrency);
      if (converted !== null) {
        convertedAmount = converted;
        exchangeRate = this.getExchangeRate(accountCurrency, primaryCurrency) || 1.0;
      }
    }

    const nativeCurrencyInfo = getCurrencyInfo(accountCurrency);
    const convertedCurrencyInfo = getCurrencyInfo(primaryCurrency);

    return {
      nativeAmount: initialBalance,
      nativeCurrency: accountCurrency,
      nativeSymbol: nativeCurrencyInfo?.symbol || accountCurrency,
      convertedAmount,
      convertedCurrency: primaryCurrency,
      convertedSymbol: convertedCurrencyInfo?.symbol || primaryCurrency,
      exchangeRate,
      needsConversion,
      rateSource: this.rateSource,
      lastUpdated: this.lastUpdated || undefined
    };
  }

  /**
   * Process transaction with currency conversion
   */
  processTransaction(
    transactionAmount: number,
    transactionCurrency: string,
    accountCurrency: string,
    userPrimaryCurrency?: string
  ): DualCurrencyData {
    const primaryCurrency = userPrimaryCurrency || this.userPrimaryCurrency;
    
    // First convert transaction to account currency if needed
    let accountAmount = transactionAmount;
    let accountExchangeRate = 1.0;
    
    if (transactionCurrency !== accountCurrency) {
      const converted = this.convertAmount(transactionAmount, transactionCurrency, accountCurrency);
      if (converted !== null) {
        accountAmount = converted;
        accountExchangeRate = this.getExchangeRate(transactionCurrency, accountCurrency) || 1.0;
      }
    }

    // Then convert to primary currency if needed
    let convertedAmount = accountAmount;
    let primaryExchangeRate = 1.0;
    
    if (accountCurrency !== primaryCurrency) {
      const converted = this.convertAmount(accountAmount, accountCurrency, primaryCurrency);
      if (converted !== null) {
        convertedAmount = converted;
        primaryExchangeRate = this.getExchangeRate(accountCurrency, primaryCurrency) || 1.0;
      }
    }

    const needsConversion = transactionCurrency !== primaryCurrency;
    const totalExchangeRate = accountExchangeRate * primaryExchangeRate;

    const nativeCurrencyInfo = getCurrencyInfo(transactionCurrency);
    const convertedCurrencyInfo = getCurrencyInfo(primaryCurrency);

    return {
      nativeAmount: transactionAmount,
      nativeCurrency: transactionCurrency,
      nativeSymbol: nativeCurrencyInfo?.symbol || transactionCurrency,
      convertedAmount,
      convertedCurrency: primaryCurrency,
      convertedSymbol: convertedCurrencyInfo?.symbol || primaryCurrency,
      exchangeRate: totalExchangeRate,
      needsConversion,
      rateSource: this.rateSource,
      lastUpdated: this.lastUpdated || undefined
    };
  }

  /**
   * Calculate total balance across all accounts in primary currency
   */
  calculateTotalBalance(accounts: AccountCurrencyData[]): number {
    return accounts.reduce((total, account) => {
      return total + account.convertedBalance;
    }, 0);
  }

  /**
   * Format account balance for display
   */
  formatAccountBalance(account: AccountCurrencyData, showBoth: boolean = true): string {
    if (!showBoth || !account.needsConversion) {
      return `${account.nativeSymbol}${account.nativeBalance.toLocaleString()}`;
    }

    return formatDualCurrency(
      account.nativeBalance,
      account.nativeCurrency,
      account.convertedBalance,
      account.convertedCurrency,
      true
    );
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies() {
    return CURRENCIES;
  }

  /**
   * Validate currency code
   */
  isValidCurrency(currencyCode: string): boolean {
    return CURRENCIES.some(currency => currency.code === currencyCode);
  }

  /**
   * Get currency info by code
   */
  getCurrencyInfo(currencyCode: string) {
    return getCurrencyInfo(currencyCode);
  }

  /**
   * Check if rates are fresh and up to date
   */
  isRatesUpToDate(): boolean {
    return this.isRatesFresh();
  }

  /**
   * Get rate freshness status
   */
  getRateStatus(): {
    isFresh: boolean;
    lastUpdated: Date | null;
    source: 'api' | 'cached' | 'fallback';
    hoursOld: number;
  } {
    const now = new Date();
    const hoursOld = this.lastUpdated 
      ? Math.round((now.getTime() - this.lastUpdated.getTime()) / (1000 * 60 * 60))
      : 999;

    return {
      isFresh: this.isRatesFresh(),
      lastUpdated: this.lastUpdated,
      source: this.rateSource,
      hoursOld
    };
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();