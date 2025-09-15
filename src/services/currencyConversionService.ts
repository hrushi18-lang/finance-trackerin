import { Decimal } from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

// Currency precision rules
export const CURRENCY_PRECISION: Record<string, number> = {
  // Major currencies
  'USD': 2, 'EUR': 2, 'GBP': 2, 'CAD': 2, 'AUD': 2, 'CHF': 2, 'NZD': 2,
  'JPY': 0, 'KRW': 0, 'VND': 0, 'IDR': 0,
  'CNY': 2, 'HKD': 2, 'SGD': 2, 'THB': 2, 'MYR': 2, 'PHP': 2,
  'INR': 2, 'PKR': 2, 'BDT': 2, 'LKR': 2, 'NPR': 2,
  'BRL': 2, 'ARS': 2, 'CLP': 0, 'COP': 0, 'MXN': 2,
  'RUB': 2, 'UAH': 2, 'PLN': 2, 'CZK': 2, 'HUF': 2,
  'ZAR': 2, 'EGP': 2, 'NGN': 2, 'KES': 2,
  'AED': 2, 'SAR': 2, 'QAR': 2, 'KWD': 3, 'BHD': 3,
  'SEK': 2, 'NOK': 2, 'DKK': 2, 'ISK': 0,
  // Crypto currencies
  'BTC': 8, 'ETH': 8, 'USDC': 6, 'USDT': 6,
  // Default
  'DEFAULT': 2
};

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
  'INR': '₹', 'KRW': '₩', 'THB': '฿', 'VND': '₫',
  'BTC': '₿', 'ETH': 'Ξ', 'USDC': 'USDC', 'USDT': 'USDT',
  'DEFAULT': '$'
};

// Sanctioned/restricted currencies
export const RESTRICTED_CURRENCIES = new Set([
  'IRR', // Iranian Rial
  'KPW', // North Korean Won
  'SYP', // Syrian Pound
  'VES', // Venezuelan Bolívar
  'CUP', // Cuban Peso
  'MMK', // Myanmar Kyat
  'AFN', // Afghan Afghani
]);

// Rate provider interfaces
export interface RateProvider {
  name: string;
  priority: number;
  getRate(from: string, to: string): Promise<number>;
  getAllRates(base: string): Promise<Record<string, number>>;
  isAvailable(): Promise<boolean>;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  source: string;
  timestamp: Date;
  ttl: number;
  isStale: boolean;
}

export interface ConversionResult {
  // Original values
  enteredAmount: Decimal;
  enteredCurrency: string;
  enteredSymbol: string;
  
  // Account values
  accountAmount: Decimal;
  accountCurrency: string;
  accountSymbol: string;
  
  // Primary values
  primaryAmount: Decimal;
  primaryCurrency: string;
  primarySymbol: string;
  
  // Conversion metadata
  exchangeRate: Decimal;
  exchangeRateUsed: Decimal;
  conversionSource: string;
  conversionTimestamp: Date;
  conversionCase: string;
  
  // Fees and costs
  conversionFee: Decimal;
  totalCost: Decimal;
  
  // Audit trail
  rateRecord: ExchangeRate;
  auditId: string;
}

export interface ConversionRequest {
  amount: number;
  enteredCurrency: string;
  accountCurrency: string;
  primaryCurrency: string;
  includeFees?: boolean;
  feePercentage?: number;
  auditContext?: string;
}

// Rate providers implementation
class ExchangeRateAPIProvider implements RateProvider {
  name = 'ExchangeRate-API';
  priority = 1;
  private apiKey: string;
  private baseUrl = 'https://api.exchangerate-api.com/v4/latest';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/USD?access_key=${this.apiKey}`, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    
    const response = await fetch(`${this.baseUrl}/${from}?access_key=${this.apiKey}`);
    if (!response.ok) throw new Error(`ExchangeRate-API error: ${response.status}`);
    
    const data = await response.json();
    return data.rates[to] || 1;
  }

  async getAllRates(base: string): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/${base}?access_key=${this.apiKey}`);
    if (!response.ok) throw new Error(`ExchangeRate-API error: ${response.status}`);
    
    const data = await response.json();
    return data.rates || {};
  }
}

class FixerIOProvider implements RateProvider {
  name = 'Fixer.io';
  priority = 2;
  private apiKey: string;
  private baseUrl = 'http://data.fixer.io/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/latest?access_key=${this.apiKey}`, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    
    const response = await fetch(`${this.baseUrl}/latest?access_key=${this.apiKey}&base=${from}&symbols=${to}`);
    if (!response.ok) throw new Error(`Fixer.io error: ${response.status}`);
    
    const data = await response.json();
    if (!data.success) throw new Error(`Fixer.io error: ${data.error?.info}`);
    
    return data.rates[to] || 1;
  }

  async getAllRates(base: string): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/latest?access_key=${this.apiKey}&base=${base}`);
    if (!response.ok) throw new Error(`Fixer.io error: ${response.status}`);
    
    const data = await response.json();
    if (!data.success) throw new Error(`Fixer.io error: ${data.error?.info}`);
    
    return data.rates || {};
  }
}

class OpenExchangeProvider implements RateProvider {
  name = 'OpenExchange';
  priority = 3;
  private apiKey: string;
  private baseUrl = 'https://openexchangerates.org/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/latest.json?app_id=${this.apiKey}`, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    
    const response = await fetch(`${this.baseUrl}/latest.json?app_id=${this.apiKey}`);
    if (!response.ok) throw new Error(`OpenExchange error: ${response.status}`);
    
    const data = await response.json();
    const fromRate = data.rates[from] || 1;
    const toRate = data.rates[to] || 1;
    
    return toRate / fromRate;
  }

  async getAllRates(base: string): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/latest.json?app_id=${this.apiKey}`);
    if (!response.ok) throw new Error(`OpenExchange error: ${response.status}`);
    
    const data = await response.json();
    const baseRate = data.rates[base] || 1;
    const rates: Record<string, number> = {};
    
    for (const [currency, rate] of Object.entries(data.rates)) {
      rates[currency] = (rate as number) / baseRate;
    }
    
    return rates;
  }
}

// Fallback provider with hardcoded rates
class FallbackProvider implements RateProvider {
  name = 'Fallback';
  priority = 999;
  
  private fallbackRates: Record<string, Record<string, number>> = {
    'USD': {
      'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'CAD': 1.25, 'AUD': 1.35,
      'CHF': 0.92, 'CNY': 6.45, 'INR': 74, 'KRW': 1180, 'SGD': 1.35,
      'HKD': 7.8, 'NZD': 1.4, 'SEK': 8.5, 'NOK': 8.8, 'DKK': 6.3
    },
    'EUR': {
      'USD': 1.18, 'GBP': 0.86, 'JPY': 129, 'CHF': 1.08, 'CNY': 7.6,
      'INR': 87, 'KRW': 1390, 'SGD': 1.59, 'HKD': 9.2, 'NZD': 1.65
    },
    'GBP': {
      'USD': 1.37, 'EUR': 1.16, 'JPY': 150, 'CHF': 1.26, 'CNY': 8.8,
      'INR': 101, 'KRW': 1610, 'SGD': 1.85, 'HKD': 10.7, 'NZD': 1.92
    }
  };

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    
    // Try direct rate
    if (this.fallbackRates[from]?.[to]) {
      return this.fallbackRates[from][to];
    }
    
    // Try reverse rate
    if (this.fallbackRates[to]?.[from]) {
      return 1 / this.fallbackRates[to][from];
    }
    
    // Try through USD
    const fromToUSD = this.fallbackRates['USD']?.[from] || 1;
    const usdToTo = this.fallbackRates['USD']?.[to] || 1;
    
    return usdToTo / fromToUSD;
  }

  async getAllRates(base: string): Promise<Record<string, number>> {
    const rates: Record<string, number> = {};
    
    for (const [currency, rate] of Object.entries(this.fallbackRates[base] || {})) {
      rates[currency] = rate;
    }
    
    return rates;
  }
}

// Main currency conversion service
export class CurrencyConversionService {
  private providers: RateProvider[] = [];
  private rateCache = new Map<string, ExchangeRate>();
  private cacheTTL = 60 * 60 * 1000; // 1 hour
  private staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(apiKeys: {
    exchangeRateAPI?: string;
    fixerIO?: string;
    openExchange?: string;
  }) {
    // Initialize providers based on available API keys
    if (apiKeys.exchangeRateAPI) {
      this.providers.push(new ExchangeRateAPIProvider(apiKeys.exchangeRateAPI));
    }
    if (apiKeys.fixerIO) {
      this.providers.push(new FixerIOProvider(apiKeys.fixerIO));
    }
    if (apiKeys.openExchange) {
      this.providers.push(new OpenExchangeProvider(apiKeys.openExchange));
    }
    
    // Always add fallback provider
    this.providers.push(new FallbackProvider());
    
    // Sort by priority
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  // Get exchange rate with caching and failover
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        source: 'same_currency',
        timestamp: new Date(),
        ttl: this.cacheTTL,
        isStale: false
      };
    }

    // Check cache first
    const cacheKey = `${from}-${to}`;
    const cached = this.rateCache.get(cacheKey);
    
    if (cached && !this.isRateStale(cached)) {
      return cached;
    }

    // Try providers in order of priority
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          const rate = await provider.getRate(from, to);
          
          const rateRecord: ExchangeRate = {
            from,
            to,
            rate,
            source: provider.name,
            timestamp: new Date(),
            ttl: this.cacheTTL,
            isStale: false
          };
          
          // Cache the rate
          this.rateCache.set(cacheKey, rateRecord);
          
          return rateRecord;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed for ${from}-${to}:`, error);
        continue;
      }
    }

    throw new Error(`No rate providers available for ${from}-${to}`);
  }

  // Check if rate is stale
  private isRateStale(rate: ExchangeRate): boolean {
    const age = Date.now() - rate.timestamp.getTime();
    return age > this.staleThreshold;
  }

  // Get currency precision
  getCurrencyPrecision(currency: string): number {
    return CURRENCY_PRECISION[currency] || CURRENCY_PRECISION.DEFAULT;
  }

  // Get currency symbol
  getCurrencySymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.DEFAULT;
  }

  // Check if currency is restricted
  isCurrencyRestricted(currency: string): boolean {
    return RESTRICTED_CURRENCIES.has(currency);
  }

  // Format amount with proper precision
  formatAmount(amount: Decimal, currency: string): string {
    const precision = this.getCurrencyPrecision(currency);
    const symbol = this.getCurrencySymbol(currency);
    const formatted = amount.toFixed(precision);
    
    return `${symbol}${formatted}`;
  }

  // Main conversion method
  async convertCurrency(request: ConversionRequest): Promise<ConversionResult> {
    const {
      amount,
      enteredCurrency,
      accountCurrency,
      primaryCurrency,
      includeFees = false,
      feePercentage = 0.0025, // 0.25% default fee
      auditContext = 'manual_conversion'
    } = request;

    // Validate currencies
    if (this.isCurrencyRestricted(enteredCurrency)) {
      throw new Error(`Currency ${enteredCurrency} is restricted and cannot be converted`);
    }
    if (this.isCurrencyRestricted(accountCurrency)) {
      throw new Error(`Currency ${accountCurrency} is restricted and cannot be converted`);
    }
    if (this.isCurrencyRestricted(primaryCurrency)) {
      throw new Error(`Currency ${primaryCurrency} is restricted and cannot be converted`);
    }

    // Convert amount to Decimal for precision
    const enteredAmount = new Decimal(amount);
    
    // Determine conversion case
    const caseType = this.determineConversionCase(enteredCurrency, accountCurrency, primaryCurrency);
    
    // Get exchange rates
    const accountRate = await this.getExchangeRate(enteredCurrency, accountCurrency);
    const primaryRate = await this.getExchangeRate(enteredCurrency, primaryCurrency);
    
    // Calculate amounts
    const accountAmount = enteredAmount.mul(accountRate.rate);
    const primaryAmount = enteredAmount.mul(primaryRate.rate);
    
    // Calculate fees
    const conversionFee = includeFees ? primaryAmount.mul(feePercentage) : new Decimal(0);
    const totalCost = primaryAmount.add(conversionFee);
    
    // Generate audit ID
    const auditId = `${auditContext}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      // Original values
      enteredAmount,
      enteredCurrency,
      enteredSymbol: this.getCurrencySymbol(enteredCurrency),
      
      // Account values
      accountAmount,
      accountCurrency,
      accountSymbol: this.getCurrencySymbol(accountCurrency),
      
      // Primary values
      primaryAmount,
      primaryCurrency,
      primarySymbol: this.getCurrencySymbol(primaryCurrency),
      
      // Conversion metadata
      exchangeRate: new Decimal(accountRate.rate),
      exchangeRateUsed: new Decimal(accountRate.rate),
      conversionSource: accountRate.source,
      conversionTimestamp: accountRate.timestamp,
      conversionCase: caseType,
      
      // Fees and costs
      conversionFee,
      totalCost,
      
      // Audit trail
      rateRecord: accountRate,
      auditId
    };
  }

  // Determine conversion case
  private determineConversionCase(entered: string, account: string, primary: string): string {
    if (entered === account && account === primary) {
      return 'all_same';
    } else if (entered === account && account !== primary) {
      return 'entered_equals_account';
    } else if (entered === primary && account !== primary) {
      return 'entered_equals_primary';
    } else if (entered !== account && account === primary) {
      return 'account_equals_primary';
    } else if (entered !== account && account !== primary && entered !== primary) {
      return 'all_different';
    } else {
      return 'unknown';
    }
  }

  // Get all cached rates
  getAllCachedRates(): ExchangeRate[] {
    return Array.from(this.rateCache.values());
  }

  // Clear stale rates
  clearStaleRates(): void {
    for (const [key, rate] of this.rateCache.entries()) {
      if (this.isRateStale(rate)) {
        this.rateCache.delete(key);
      }
    }
  }

  // Get rate statistics
  getRateStatistics(): {
    totalRates: number;
    staleRates: number;
    providers: string[];
    lastUpdate: Date | null;
  } {
    const rates = Array.from(this.rateCache.values());
    const staleRates = rates.filter(rate => this.isRateStale(rate));
    const providers = [...new Set(rates.map(rate => rate.source))];
    const lastUpdate = rates.length > 0 ? new Date(Math.max(...rates.map(rate => rate.timestamp.getTime()))) : null;
    
    return {
      totalRates: rates.length,
      staleRates: staleRates.length,
      providers,
      lastUpdate
    };
  }
}

// Export singleton instance
export const currencyConversionService = new CurrencyConversionService({
  exchangeRateAPI: 'd5f75c5f95ed0834f2899bc0', // Live API key provided
  fixerIO: import.meta.env.VITE_FIXER_IO_API_KEY || undefined,
  openExchange: import.meta.env.VITE_OPEN_EXCHANGE_API_KEY || undefined
});
