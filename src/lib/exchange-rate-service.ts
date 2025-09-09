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
  private readonly FIXER_API_URL = 'https://api.fixer.io/v1/latest';
  private readonly FIXER_API_KEY = 'your-fixer-api-key'; // Replace with actual API key
  
  // Simplified fallback rates - only essential currencies
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
    'MOP': 8.0,
    'TWD': 28.0,
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
    'MNT': 2850.0,
    'KPW': 900.0
  };

  // Check if we need to fetch new rates for today
  async shouldFetchNewRates(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('created_at')
        .eq('source', 'api')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .limit(1);
      
      if (error) {
        console.error('Error checking existing rates:', error);
        return true; // Fetch if error
      }
      
      return data.length === 0; // Fetch if no rates for today
    } catch (error) {
      console.error('Error in shouldFetchNewRates:', error);
      return true; // Fetch if error
    }
  }

  // Fetch exchange rates from API
  async fetchExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRate[]> {
    try {
      console.log(`🔄 Fetching exchange rates for base currency: ${baseCurrency}`);
      
      // Try primary API first
      let response = await fetch(`${this.API_URL}/${baseCurrency}`);
      let apiProvider = 'exchangerate-api';
      
      if (!response.ok) {
        console.warn('Primary API failed, trying Fixer.io...');
        // Try Fixer.io as backup
        response = await fetch(`${this.FIXER_API_URL}?access_key=${this.FIXER_API_KEY}&base=${baseCurrency}`);
        apiProvider = 'fixer-io';
      }
      
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
            api_provider: apiProvider,
            created_at: now,
            valid_until: validUntil
          });
        }
      }
      
      console.log(`✅ Fetched ${exchangeRates.length} exchange rates from ${apiProvider}`);
      return exchangeRates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
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
        console.error('Error storing exchange rates:', error);
        throw error;
      }
      
      console.log('✅ Exchange rates stored successfully');
    } catch (error) {
      console.error('Error in storeExchangeRates:', error);
      throw error;
    }
  }

  // Get exchange rate from database or fallback
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    try {
      if (fromCurrency === toCurrency) return 1.0;
      
      console.log(`🔍 Looking for exchange rate: ${fromCurrency} → ${toCurrency}`);
      
      // First try direct conversion
      const { data: directRate, error: directError } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!directError && directRate) {
        console.log(`✅ Found direct rate: ${directRate.rate}`);
        return directRate.rate;
      }
      
      // Try reverse conversion (e.g., if USD->INR not found, try INR->USD)
      const { data: reverseRate, error: reverseError } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', toCurrency)
        .eq('to_currency', fromCurrency)
        .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!reverseError && reverseRate) {
        const calculatedRate = 1 / reverseRate.rate;
        console.log(`✅ Found reverse rate: ${reverseRate.rate} → ${calculatedRate}`);
        return calculatedRate;
      }
      
      // Fallback to hardcoded rates
      if (fromCurrency === 'USD' && this.FALLBACK_RATES[toCurrency]) {
        console.log(`⚠️ Using fallback rate for ${fromCurrency} → ${toCurrency}: ${this.FALLBACK_RATES[toCurrency]}`);
        return this.FALLBACK_RATES[toCurrency];
      }
      
      if (toCurrency === 'USD' && this.FALLBACK_RATES[fromCurrency]) {
        const fallbackRate = 1 / this.FALLBACK_RATES[fromCurrency];
        console.log(`⚠️ Using fallback rate for ${fromCurrency} → ${toCurrency}: ${fallbackRate}`);
        return fallbackRate;
      }
      
      console.log(`❌ No exchange rate found for ${fromCurrency} → ${toCurrency}`);
      return null;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return null;
    }
  }

  // Get cached rate (alias for getExchangeRate)
  async getCachedRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    return this.getExchangeRate(fromCurrency, toCurrency);
  }

  // Initialize daily rates
  async initializeDailyRates(): Promise<void> {
    try {
      console.log('🚀 Initializing daily exchange rates...');
      
      const shouldFetch = await this.shouldFetchNewRates();
      
      if (shouldFetch) {
        console.log('📅 No rates found for today, fetching new rates...');
        
        // Fetch rates for major currencies
        const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD', 'HKD', 'NZD', 'KRW', 'MXN', 'BRL', 'RUB', 'ZAR', 'TRY', 'AED', 'SAR', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'BDT', 'PKR', 'LKR', 'NPR', 'MMK', 'KHR', 'LAK', 'BND', 'MOP', 'TWD', 'MVR', 'AFN', 'AMD', 'AZN', 'GEL', 'KZT', 'KGS', 'TJS', 'TMT', 'UZS', 'MNT', 'KPW'];
        
        for (const baseCurrency of currencies) {
          try {
            const rates = await this.fetchExchangeRates(baseCurrency);
            await this.storeExchangeRates(rates);
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error fetching rates for ${baseCurrency}:`, error);
            // Continue with other currencies
          }
        }
        
        console.log('✅ Daily exchange rates initialized');
      } else {
        console.log('✅ Exchange rates for today already exist');
      }
    } catch (error) {
      console.error('Error initializing daily rates:', error);
      throw error;
    }
  }

  // Get all available currencies
  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('from_currency, to_currency')
        .or('valid_until.is.null,valid_until.gte.' + new Date().toISOString());
      
      if (error) {
        console.error('Error getting available currencies:', error);
        return Object.keys(this.FALLBACK_RATES);
      }
      
      const currencies = new Set<string>();
      data.forEach(rate => {
        currencies.add(rate.from_currency);
        currencies.add(rate.to_currency);
      });
      
      return Array.from(currencies);
    } catch (error) {
      console.error('Error in getAvailableCurrencies:', error);
      return Object.keys(this.FALLBACK_RATES);
    }
  }

  // Clean up old rates (older than 7 days)
  async cleanupOldRates(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { error } = await supabase
        .from('exchange_rates')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString());
      
      if (error) {
        console.error('Error cleaning up old rates:', error);
      } else {
        console.log('✅ Old exchange rates cleaned up');
      }
    } catch (error) {
      console.error('Error in cleanupOldRates:', error);
    }
  }
}

export const exchangeRateService = new ExchangeRateService();