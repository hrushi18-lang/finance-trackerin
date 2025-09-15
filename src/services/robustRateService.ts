/**
 * Robust Exchange Rate Service
 * Handles all edge cases and provides reliable fallbacks
 */

import { supabase } from '../lib/supabase';

export interface RateData {
  from_currency: string;
  to_currency: string;
  rate: number;
  source: 'live_api' | 'cached' | 'fallback';
  timestamp: string;
  expires_at: string;
}

export interface RateServiceConfig {
  primaryCurrency: string;
  fallbackRates: Record<string, number>;
  cacheDuration: number; // in hours
  maxRetries: number;
}

export class RobustRateService {
  private static instance: RobustRateService;
  private config: RateServiceConfig;
  private cache: Map<string, RateData> = new Map();
  private isInitialized = false;
  private lastFetchDate: string | null = null;

  // Fallback rates for major currencies (updated monthly)
  private static readonly FALLBACK_RATES: Record<string, Record<string, number>> = {
    'USD': {
      'EUR': 0.85,
      'GBP': 0.73,
      'INR': 83.0,
      'JPY': 110.0,
      'CAD': 1.25,
      'AUD': 1.35,
      'CHF': 0.92,
      'CNY': 6.45,
      'SGD': 1.35,
      'HKD': 7.80,
      'KRW': 1180.0,
      'BRL': 5.20,
      'MXN': 20.0,
      'RUB': 75.0,
      'ZAR': 15.0,
      'NZD': 1.40,
      'SEK': 8.50,
      'NOK': 8.80,
      'DKK': 6.30,
      'PLN': 3.90,
      'CZK': 21.0,
      'HUF': 300.0,
      'TRY': 8.50,
      'ILS': 3.25,
      'AED': 3.67,
      'SAR': 3.75,
      'QAR': 3.64,
      'KWD': 0.30,
      'BHD': 0.38,
      'OMR': 0.38,
      'JOD': 0.71,
      'LBP': 1500.0,
      'EGP': 15.7,
      'MAD': 9.0,
      'TND': 2.85,
      'DZD': 135.0,
      'NGN': 410.0,
      'KES': 110.0,
      'GHS': 5.8,
      'UGX': 3500.0,
      'TZS': 2300.0,
      'ETB': 44.0,
      'MUR': 40.0,
      'BWP': 10.8,
      'SZL': 15.0,
      'LSL': 15.0,
      'NAD': 15.0,
      'MWK': 820.0,
      'ZMW': 18.0,
      'FJD': 2.1,
      'PGK': 3.5,
      'SBD': 8.0,
      'VUV': 110.0,
      'WST': 2.6,
      'TOP': 2.3,
      'KID': 1.4,
      'XPF': 100.0,
      'ISK': 130.0
    },
    'INR': {
      'USD': 0.012,
      'EUR': 0.010,
      'GBP': 0.009,
      'JPY': 1.33,
      'CAD': 0.015,
      'AUD': 0.016,
      'CHF': 0.011,
      'CNY': 0.078,
      'SGD': 0.016,
      'HKD': 0.094,
      'KRW': 14.2,
      'BRL': 0.063,
      'MXN': 0.24,
      'RUB': 0.90,
      'ZAR': 0.18,
      'NZD': 0.017,
      'SEK': 0.10,
      'NOK': 0.11,
      'DKK': 0.076,
      'PLN': 0.047,
      'CZK': 0.25,
      'HUF': 3.6,
      'TRY': 0.10,
      'ILS': 0.039,
      'AED': 0.044,
      'SAR': 0.045,
      'QAR': 0.044,
      'KWD': 0.004,
      'BHD': 0.005,
      'OMR': 0.005,
      'JOD': 0.009,
      'LBP': 18.0,
      'EGP': 0.19,
      'MAD': 0.11,
      'TND': 0.034,
      'DZD': 1.6,
      'NGN': 4.9,
      'KES': 1.3,
      'GHS': 0.070,
      'UGX': 42.0,
      'TZS': 28.0,
      'ETB': 0.53,
      'MUR': 0.48,
      'BWP': 0.13,
      'SZL': 0.18,
      'LSL': 0.18,
      'NAD': 0.18,
      'MWK': 9.9,
      'ZMW': 0.22,
      'FJD': 0.025,
      'PGK': 0.042,
      'SBD': 0.096,
      'VUV': 1.3,
      'WST': 0.031,
      'TOP': 0.028,
      'KID': 0.017,
      'XPF': 1.2,
      'ISK': 1.6
    }
  };

  private constructor(config: RateServiceConfig) {
    this.config = config;
  }

  public static getInstance(config?: Partial<RateServiceConfig>): RobustRateService {
    if (!RobustRateService.instance) {
      const defaultConfig: RateServiceConfig = {
        primaryCurrency: 'USD',
        fallbackRates: {},
        cacheDuration: 24, // 24 hours
        maxRetries: 3
      };
      
      RobustRateService.instance = new RobustRateService({
        ...defaultConfig,
        ...config
      });
    }
    return RobustRateService.instance;
  }

  /**
   * Initialize the rate service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log(`🔄 Initializing RobustRateService for ${this.config.primaryCurrency}...`);
      
      // Load cached rates from database
      await this.loadCachedRates();
      
      // Try to fetch fresh rates (non-blocking)
      this.fetchFreshRates().catch(error => {
        console.warn('⚠️ Failed to fetch fresh rates during initialization:', error);
      });
      
      this.isInitialized = true;
      console.log(`✅ RobustRateService initialized for ${this.config.primaryCurrency}`);
    } catch (error) {
      console.error('❌ Failed to initialize RobustRateService:', error);
      // Don't throw - app should work with fallback rates
    }
  }

  /**
   * Get exchange rate with multiple fallback strategies
   */
  public async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return 1.0;

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    
    // 1. Check memory cache first
    if (this.cache.has(cacheKey)) {
      const cachedRate = this.cache.get(cacheKey)!;
      if (this.isRateValid(cachedRate)) {
        return cachedRate.rate;
      }
    }

    // 2. Try to get from database
    try {
      const dbRate = await this.getRateFromDatabase(fromCurrency, toCurrency);
      if (dbRate && this.isRateValid(dbRate)) {
        this.cache.set(cacheKey, dbRate);
        return dbRate.rate;
      }
    } catch (error) {
      console.warn('⚠️ Database rate lookup failed:', error);
    }

    // 3. Try to fetch fresh rates (if not already fetching)
    try {
      await this.fetchFreshRates();
      const freshRate = this.cache.get(cacheKey);
      if (freshRate && this.isRateValid(freshRate)) {
        return freshRate.rate;
      }
    } catch (error) {
      console.warn('⚠️ Fresh rate fetch failed:', error);
    }

    // 4. Use fallback rates
    const fallbackRate = this.getFallbackRate(fromCurrency, toCurrency);
    console.warn(`⚠️ Using fallback rate for ${fromCurrency} → ${toCurrency}: ${fallbackRate}`);
    
    // Cache the fallback rate
    const fallbackRateData: RateData = {
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate: fallbackRate,
      source: 'fallback',
      timestamp: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    this.cache.set(cacheKey, fallbackRateData);
    return fallbackRate;
  }

  /**
   * Load cached rates from database
   */
  private async loadCachedRates(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', this.config.primaryCurrency)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Failed to load cached rates:', error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach(rate => {
          const rateData: RateData = {
            from_currency: rate.from_currency,
            to_currency: rate.to_currency,
            rate: rate.rate,
            source: 'cached',
            timestamp: rate.created_at,
            expires_at: new Date(Date.now() + this.config.cacheDuration * 60 * 60 * 1000).toISOString()
          };
          
          const cacheKey = `${rate.from_currency}_${rate.to_currency}`;
          this.cache.set(cacheKey, rateData);
        });
        
        console.log(`✅ Loaded ${data.length} cached rates from database`);
      }
    } catch (error) {
      console.warn('⚠️ Error loading cached rates:', error);
    }
  }

  /**
   * Fetch fresh rates from API
   */
  private async fetchFreshRates(): Promise<void> {
    try {
      const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      console.log(`🌐 Fetching fresh rates for ${this.config.primaryCurrency}...`);
      
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${this.config.primaryCurrency}`);
      const data = await response.json();

      if (data.result !== 'success') {
        throw new Error(`API error: ${data.error_type}`);
      }

      // Store rates in database
      await this.storeRatesInDatabase(data.conversion_rates);
      
      // Update cache
      Object.entries(data.conversion_rates).forEach(([currency, rate]) => {
        const rateData: RateData = {
          from_currency: this.config.primaryCurrency,
          to_currency: currency,
          rate: rate as number,
          source: 'live_api',
          timestamp: new Date().toISOString(),
          expires_at: new Date(Date.now() + this.config.cacheDuration * 60 * 60 * 1000).toISOString()
        };
        
        const cacheKey = `${this.config.primaryCurrency}_${currency}`;
        this.cache.set(cacheKey, rateData);
      });

      this.lastFetchDate = new Date().toISOString().split('T')[0];
      console.log(`✅ Fetched and cached ${Object.keys(data.conversion_rates).length} fresh rates`);
      
    } catch (error) {
      console.warn('⚠️ Failed to fetch fresh rates:', error);
      throw error;
    }
  }

  /**
   * Store rates in database
   */
  private async storeRatesInDatabase(rates: Record<string, number>): Promise<void> {
    try {
      const now = new Date();
      const rateData = Object.entries(rates).map(([currency, rate]) => ({
        from_currency: this.config.primaryCurrency,
        to_currency: currency,
        rate: rate,
        source: 'live_api',
        api_provider: 'exchangerate_api',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }));

      // Delete old rates for today
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('exchange_rates')
        .delete()
        .eq('from_currency', this.config.primaryCurrency)
        .eq('source', 'live_api')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Insert new rates
      const { error } = await supabase
        .from('exchange_rates')
        .insert(rateData);

      if (error) {
        throw error;
      }

      console.log(`✅ Stored ${rateData.length} rates in database`);
    } catch (error) {
      console.error('❌ Failed to store rates in database:', error);
      throw error;
    }
  }

  /**
   * Get rate from database
   */
  private async getRateFromDatabase(fromCurrency: string, toCurrency: string): Promise<RateData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', this.config.primaryCurrency)
        .eq('to_currency', toCurrency)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        from_currency: data.from_currency,
        to_currency: data.to_currency,
        rate: data.rate,
        source: 'cached',
        timestamp: data.created_at,
        expires_at: new Date(Date.now() + this.config.cacheDuration * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.warn('⚠️ Database rate lookup failed:', error);
      return null;
    }
  }

  /**
   * Get fallback rate
   */
  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    // Try direct fallback rates
    if (RobustRateService.FALLBACK_RATES[fromCurrency]?.[toCurrency]) {
      return RobustRateService.FALLBACK_RATES[fromCurrency][toCurrency];
    }

    // Try reverse rate calculation
    if (RobustRateService.FALLBACK_RATES[toCurrency]?.[fromCurrency]) {
      return 1 / RobustRateService.FALLBACK_RATES[toCurrency][fromCurrency];
    }

    // Try through USD as intermediate
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUsd = RobustRateService.FALLBACK_RATES['USD']?.[fromCurrency];
      const usdToTarget = RobustRateService.FALLBACK_RATES['USD']?.[toCurrency];
      
      if (fromToUsd && usdToTarget) {
        return usdToTarget / fromToUsd;
      }
    }

    // Last resort: return 1.0
    console.warn(`⚠️ No fallback rate available for ${fromCurrency} → ${toCurrency}, using 1.0`);
    return 1.0;
  }

  /**
   * Check if rate is still valid
   */
  private isRateValid(rate: RateData): boolean {
    const now = new Date();
    const expiresAt = new Date(rate.expires_at);
    return now < expiresAt;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; lastFetch: string | null; validRates: number } {
    const validRates = Array.from(this.cache.values()).filter(rate => this.isRateValid(rate)).length;
    
    return {
      size: this.cache.size,
      lastFetch: this.lastFetchDate,
      validRates
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.lastFetchDate = null;
  }
}

// Export singleton instance
export const robustRateService = RobustRateService.getInstance();
