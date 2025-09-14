/**
 * Exchange Rate Service
 * Handles fetching, storing, and managing exchange rates
 */

import { supabase } from '../lib/supabase';

export interface ExchangeRateData {
  from_currency: string;
  to_currency: string;
  rate: number;
  source: 'api' | 'manual' | 'fallback';
  api_provider?: string;
  created_at: string;
  updated_at: string;
}

export interface RateResponse {
  rates: Record<string, number>;
  source: string;
  lastUpdated: Date;
  apiProvider?: string;
}

export class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cache: Map<string, ExchangeRateData> = new Map();
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return 1.0;

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const isExpired = Date.now() - new Date(cached.updated_at).getTime() > this.CACHE_DURATION;
      
      if (!isExpired) {
        return cached.rate;
      }
    }

    // Try to get from database
    const dbRate = await this.getRateFromDatabase(fromCurrency, toCurrency);
    if (dbRate) {
      this.cache.set(cacheKey, dbRate);
      return dbRate.rate;
    }

    // Fallback to API or hardcoded rates
    return await this.fetchAndStoreRate(fromCurrency, toCurrency);
  }

  /**
   * Get all exchange rates for a base currency
   */
  async getAllRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    const rates: Record<string, number> = {};
    
    // Check if we need to refresh rates
    const shouldRefresh = !this.lastFetch || 
      Date.now() - this.lastFetch.getTime() > this.CACHE_DURATION;

    if (shouldRefresh) {
      await this.refreshAllRates();
    }

    // Get rates from database
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('from_currency', baseCurrency)
      .gte('created_at', new Date(Date.now() - this.CACHE_DURATION).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rates from database:', error);
      return this.getFallbackRates();
    }

    if (data && data.length > 0) {
      data.forEach(rate => {
        rates[rate.to_currency] = rate.rate;
        this.cache.set(`${rate.from_currency}_${rate.to_currency}`, rate);
      });
      return rates;
    }

    // If no recent rates, fetch from API
    return await this.fetchAllRatesFromAPI(baseCurrency);
  }

  /**
   * Refresh all exchange rates
   */
  async refreshAllRates(): Promise<RateResponse> {
    try {
      const response = await this.fetchAllRatesFromAPI();
      this.lastFetch = new Date();
      return response;
    } catch (error) {
      console.error('Failed to refresh rates:', error);
      return {
        rates: this.getFallbackRates(),
        source: 'fallback',
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Fetch rates from external API
   */
  private async fetchAllRatesFromAPI(baseCurrency: string = 'USD'): Promise<RateResponse> {
    try {
      // Try multiple API providers for better reliability
      const apis = [
        () => this.fetchFromExchangeRateAPI(baseCurrency),
        () => this.fetchFromFixerIO(baseCurrency),
        () => this.fetchFromCurrencyAPI(baseCurrency)
      ];

      for (const api of apis) {
        try {
          const result = await api();
          if (result) {
            await this.storeRatesInDatabase(result.rates, result.source, result.apiProvider);
            return result;
          }
        } catch (error) {
          console.warn('API failed, trying next:', error);
          continue;
        }
      }

      throw new Error('All APIs failed');
    } catch (error) {
      console.error('All exchange rate APIs failed:', error);
      return {
        rates: this.getFallbackRates(),
        source: 'fallback',
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Fetch from ExchangeRate-API (free tier: 1000 requests/month)
   */
  private async fetchFromExchangeRateAPI(baseCurrency: string): Promise<RateResponse | null> {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`ExchangeRate-API failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      rates: data.rates,
      source: 'api',
      lastUpdated: new Date(data.date),
      apiProvider: 'exchangerate-api'
    };
  }

  /**
   * Fetch from Fixer.io (requires API key)
   */
  private async fetchFromFixerIO(baseCurrency: string): Promise<RateResponse | null> {
    const apiKey = process.env.REACT_APP_FIXER_API_KEY;
    if (!apiKey) return null;

    const response = await fetch(`http://data.fixer.io/api/latest?access_key=${apiKey}&base=${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Fixer.io failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Fixer.io error: ${data.error?.info}`);
    }

    return {
      rates: data.rates,
      source: 'api',
      lastUpdated: new Date(data.date),
      apiProvider: 'fixer-io'
    };
  }

  /**
   * Fetch from CurrencyAPI (free tier: 300 requests/month)
   */
  private async fetchFromCurrencyAPI(baseCurrency: string): Promise<RateResponse | null> {
    const apiKey = process.env.REACT_APP_CURRENCY_API_KEY;
    if (!apiKey) return null;

    const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`CurrencyAPI failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      rates: data.data,
      source: 'api',
      lastUpdated: new Date(data.meta.last_updated_at),
      apiProvider: 'currency-api'
    };
  }

  /**
   * Store rates in database
   */
  private async storeRatesInDatabase(
    rates: Record<string, number>, 
    source: string, 
    apiProvider?: string
  ): Promise<void> {
    const rateEntries = Object.entries(rates).map(([toCurrency, rate]) => ({
      from_currency: 'USD', // We always store rates relative to USD
      to_currency: toCurrency,
      rate: rate,
      source: source,
      api_provider: apiProvider,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('exchange_rates')
      .upsert(rateEntries, { 
        onConflict: 'from_currency,to_currency,created_at',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error storing rates in database:', error);
    }
  }

  /**
   * Get rate from database
   */
  private async getRateFromDatabase(fromCurrency: string, toCurrency: string): Promise<ExchangeRateData | null> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .gte('created_at', new Date(Date.now() - this.CACHE_DURATION).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Fetch and store a specific rate
   */
  private async fetchAndStoreRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const allRates = await this.fetchAllRatesFromAPI(fromCurrency);
      const rate = allRates.rates[toCurrency];
      
      if (rate) {
        return rate;
      }
    } catch (error) {
      console.error('Failed to fetch rate:', error);
    }

    // Fallback to hardcoded rates
    return this.getFallbackRate(fromCurrency, toCurrency);
  }

  /**
   * Get fallback rates (hardcoded)
   */
  private getFallbackRates(): Record<string, number> {
    return {
      'USD': 1.0,
      'EUR': 0.92,
      'GBP': 0.79,
      'INR': 83.45,
      'CNY': 7.24,
      'AUD': 1.53,
      'NZD': 1.65,
      'JPY': 150.0,
      'CAD': 1.36,
      'SGD': 1.35,
      'HKD': 7.82,
      'KRW': 1350,
      'AED': 3.67,
      'CHF': 0.88,
      'BRL': 5.15,
      'RUB': 92.5,
      'IDR': 15650,
      'MYR': 4.75,
      'THB': 36.5,
      'VND': 24500,
      'NPR': 133.5
    };
  }

  /**
   * Get fallback rate for specific currencies
   */
  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    const rates = this.getFallbackRates();
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    return toRate / fromRate;
  }

  /**
   * Manually update a specific exchange rate
   */
  async updateManualRate(
    fromCurrency: string, 
    toCurrency: string, 
    rate: number
  ): Promise<void> {
    const rateData: ExchangeRateData = {
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate: rate,
      source: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('exchange_rates')
      .upsert(rateData, { 
        onConflict: 'from_currency,to_currency,created_at',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error updating manual rate:', error);
      throw error;
    }

    // Update cache
    this.cache.set(`${fromCurrency}_${toCurrency}`, rateData);
  }

  /**
   * Get rate history for a currency pair
   */
  async getRateHistory(
    fromCurrency: string, 
    toCurrency: string, 
    days: number = 30
  ): Promise<ExchangeRateData[]> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching rate history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get last updated timestamp
   */
  getLastUpdated(): Date | null {
    return this.lastFetch;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = null;
  }
}

// Export singleton instance
export const exchangeRateService = ExchangeRateService.getInstance();
