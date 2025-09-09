import { supabase } from './supabase';

export interface ExchangeRate {
  id?: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: 'api' | 'manual' | 'fallback';
  api_provider?: string;
  created_at: Date;
  valid_until?: Date;
}

export interface ExchangeRateResponse {
  success: boolean;
  rates: { [currency: string]: number };
  base: string;
  date: string;
}

class ExchangeRateService {
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest';
  private readonly FALLBACK_RATES: { [key: string]: number } = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'INR': 75.0,
    'CAD': 1.25,
    'AUD': 1.35,
    'CHF': 0.92,
    'CNY': 6.45,
    'SGD': 1.35,
    'HKD': 7.8,
    'NZD': 1.45,
    'KRW': 1180.0,
    'MXN': 20.0,
    'BRL': 5.2,
    'RUB': 75.0,
    'ZAR': 14.5,
    'TRY': 8.5,
    'AED': 3.67,
    'SAR': 3.75,
    'THB': 33.0,
    'MYR': 4.2,
    'IDR': 14500.0,
    'PHP': 50.0,
    'VND': 23000.0,
    'BDT': 85.0,
    'PKR': 160.0,
    'LKR': 200.0,
    'NPR': 120.0,
    'MMK': 1800.0,
    'KHR': 4100.0,
    'LAK': 9500.0,
    'BND': 1.35,
    'FJD': 2.1,
    'PGK': 3.5,
    'SBD': 8.0,
    'VUV': 110.0,
    'WST': 2.6,
    'TOP': 2.3,
    'TVD': 1.35,
    'SOS': 580.0,
    'ETB': 45.0,
    'KES': 110.0,
    'TZS': 2300.0,
    'UGX': 3500.0,
    'RWF': 1000.0,
    'BIF': 2000.0,
    'MWK': 800.0,
    'ZMW': 18.0,
    'BWP': 11.0,
    'SZL': 15.0,
    'LSL': 15.0,
    'NAD': 15.0,
    'MZN': 65.0,
    'AOA': 650.0,
    'MGA': 4000.0,
    'KMF': 450.0,
    'DJF': 180.0,
    'SCR': 13.5,
    'MUR': 40.0,
    'MVR': 15.4,
    'AFN': 80.0,
    'AMD': 520.0,
    'AZN': 1.7,
    'GEL': 3.1,
    'KZT': 425.0,
    'KGS': 85.0,
    'TJS': 11.0,
    'TMT': 3.5,
    'UZS': 10700.0,
    'TND': 2.8,
    'DZD': 135.0,
    'MAD': 9.0,
    'EGP': 15.7,
    'LYD': 4.5,
    'SDG': 55.0,
    'SSP': 300.0,
    'CDF': 2000.0,
    'XAF': 550.0,
    'XOF': 550.0,
    'CVE': 100.0,
    'STN': 22.0,
    'GMD': 52.0,
    'GNF': 10200.0,
    'LRD': 150.0,
    'SLE': 20.0,
    'GHS': 6.0,
    'NGN': 410.0,
    'XPF': 100.0,
    'CUP': 25.0,
    'DOP': 57.0,
    'HTG': 100.0,
    'JMD': 150.0,
    'TTD': 6.8,
    'BBD': 2.0,
    'BZD': 2.0,
    'XCD': 2.7,
    'AWG': 1.8,
    'BMD': 1.0,
    'KYD': 0.82,
    'BHD': 0.38,
    'QAR': 3.64,
    'OMR': 0.38,
    'JOD': 0.71,
    'LBP': 1500.0,
    'SYP': 2500.0,
    'IQD': 1460.0,
    'IRR': 42000.0,
    'YER': 250.0,
    'ILS': 3.2,
    'PEN': 3.7,
    'BOB': 6.9,
    'CLP': 800.0,
    'COP': 3800.0,
    'ARS': 100.0,
    'UYU': 44.0,
    'PYG': 7000.0,
    'BRL': 5.2,
    'VES': 4000000.0,
    'GYD': 210.0,
    'SRD': 21.0,
    'FKP': 0.73,
    'BND': 1.35,
    'KHR': 4100.0,
    'LAK': 9500.0,
    'MOP': 8.0,
    'NPR': 120.0,
    'LKR': 200.0,
    'BDT': 85.0,
    'BTN': 75.0,
    'MVR': 15.4,
    'NPR': 120.0,
    'PKR': 160.0,
    'AFN': 80.0,
    'AMD': 520.0,
    'AZN': 1.7,
    'GEL': 3.1,
    'KZT': 425.0,
    'KGS': 85.0,
    'TJS': 11.0,
    'TMT': 3.5,
    'UZS': 10700.0,
    'MNT': 2850.0,
    'KPW': 900.0,
    'KRW': 1180.0,
    'MOP': 8.0,
    'TWD': 28.0,
    'HKD': 7.8,
    'CNY': 6.45,
    'JPY': 110.0,
    'MOP': 8.0,
    'TWD': 28.0,
    'HKD': 7.8,
    'CNY': 6.45,
    'JPY': 110.0,
    'MOP': 8.0,
    'TWD': 28.0,
    'HKD': 7.8,
    'CNY': 6.45,
    'JPY': 110.0
  };

  // Fetch exchange rates from API
  async fetchExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRate[]> {
    try {
      console.log(`🔄 Fetching exchange rates for base currency: ${baseCurrency}`);
      
      const response = await fetch(`${this.API_URL}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      if (!data.success) {
        throw new Error('API returned unsuccessful response');
      }
      
      const exchangeRates: ExchangeRate[] = [];
      const now = new Date();
      const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Convert API response to our format
      for (const [currency, rate] of Object.entries(data.rates)) {
        if (currency !== baseCurrency) {
          exchangeRates.push({
            from_currency: baseCurrency,
            to_currency: currency,
            rate: rate,
            source: 'api',
            api_provider: 'exchangerate-api',
            created_at: now,
            valid_until: validUntil
          });
        }
      }
      
      console.log(`✅ Fetched ${exchangeRates.length} exchange rates`);
      return exchangeRates;
      
    } catch (error) {
      console.error('❌ Failed to fetch exchange rates:', error);
      
      // Return fallback rates
      return this.getFallbackRates(baseCurrency);
    }
  }

  // Get fallback rates when API fails
  private getFallbackRates(baseCurrency: string): ExchangeRate[] {
    console.log(`🔄 Using fallback rates for base currency: ${baseCurrency}`);
    
    const baseRate = this.FALLBACK_RATES[baseCurrency] || 1.0;
    const exchangeRates: ExchangeRate[] = [];
    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    for (const [currency, rate] of Object.entries(this.FALLBACK_RATES)) {
      if (currency !== baseCurrency) {
        exchangeRates.push({
          from_currency: baseCurrency,
          to_currency: currency,
          rate: rate / baseRate,
          source: 'fallback',
          created_at: now,
          valid_until: validUntil
        });
      }
    }
    
    return exchangeRates;
  }

  // Store exchange rates in database
  async storeExchangeRates(rates: ExchangeRate[]): Promise<void> {
    try {
      console.log(`💾 Storing ${rates.length} exchange rates in database`);
      
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(rates, { 
          onConflict: 'from_currency,to_currency,created_at',
          ignoreDuplicates: false 
        });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Exchange rates stored successfully');
      
    } catch (error) {
      console.error('❌ Failed to store exchange rates:', error);
      throw error;
    }
  }

  // Get latest exchange rate for a currency pair
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    try {
      // If same currency, return 1
      if (fromCurrency === toCurrency) {
        return 1.0;
      }
      
      // Try to get from database first
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate, valid_until')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        console.log(`🔄 No valid rate found for ${fromCurrency} → ${toCurrency}, fetching fresh rates`);
        
        // Fetch fresh rates
        const freshRates = await this.fetchExchangeRates(fromCurrency);
        await this.storeExchangeRates(freshRates);
        
        // Try to get the rate again
        const { data: newData } = await supabase
          .from('exchange_rates')
          .select('rate')
          .eq('from_currency', fromCurrency)
          .eq('to_currency', toCurrency)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return newData?.rate || null;
      }
      
      return data.rate;
      
    } catch (error) {
      console.error(`❌ Failed to get exchange rate for ${fromCurrency} → ${toCurrency}:`, error);
      
      // Return fallback rate
      const baseRate = this.FALLBACK_RATES[fromCurrency] || 1.0;
      const targetRate = this.FALLBACK_RATES[toCurrency] || 1.0;
      return targetRate / baseRate;
    }
  }

  // Get historical exchange rate for a specific date
  async getHistoricalRate(fromCurrency: string, toCurrency: string, date: Date): Promise<number | null> {
    try {
      if (fromCurrency === toCurrency) {
        return 1.0;
      }
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .lte('created_at', date.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        console.log(`🔄 No historical rate found for ${fromCurrency} → ${toCurrency} on ${date.toISOString()}`);
        return null;
      }
      
      return data.rate;
      
    } catch (error) {
      console.error(`❌ Failed to get historical rate for ${fromCurrency} → ${toCurrency}:`, error);
      return null;
    }
  }

  // Refresh all exchange rates
  async refreshAllRates(): Promise<void> {
    try {
      console.log('🔄 Refreshing all exchange rates');
      
      // Get all supported currencies
      const supportedCurrencies = Object.keys(this.FALLBACK_RATES);
      
      // Fetch rates for each currency as base
      for (const baseCurrency of supportedCurrencies) {
        try {
          const rates = await this.fetchExchangeRates(baseCurrency);
          await this.storeExchangeRates(rates);
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to refresh rates for ${baseCurrency}:`, error);
        }
      }
      
      console.log('✅ All exchange rates refreshed');
      
    } catch (error) {
      console.error('❌ Failed to refresh all exchange rates:', error);
      throw error;
    }
  }

  // Get exchange rate with caching
  private rateCache = new Map<string, { rate: number; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getCachedRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.rateCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.rate;
    }
    
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    
    if (rate !== null) {
      this.rateCache.set(cacheKey, { rate, timestamp: Date.now() });
    }
    
    return rate;
  }

  // Clear rate cache
  clearCache(): void {
    this.rateCache.clear();
  }
}

export const exchangeRateService = new ExchangeRateService();
