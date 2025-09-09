import { supabase } from './supabase';

export interface DailyRate {
  id?: string;
  base_currency: string;
  target_currency: string;
  rate: number; // 6 decimal precision
  fx_date: string; // YYYY-MM-DD format
  fx_source: string; // 'wise', 'reuters', 'exchangerate-host', etc.
  created_at: Date;
  is_stale: boolean;
}

export interface RateProvider {
  name: string;
  url: string;
  apiKey?: string;
  baseCurrency: string;
  priority: number; // Lower number = higher priority
}

class DailyRateFetcher {
  private readonly providers: RateProvider[] = [
    {
      name: 'exchangerate-host',
      url: 'https://api.exchangerate-host.com/v1/latest',
      baseCurrency: 'USD',
      priority: 1
    },
    {
      name: 'fixer-io',
      url: 'https://api.fixer.io/v1/latest',
      apiKey: 'your-fixer-api-key', // Replace with actual key
      baseCurrency: 'USD',
      priority: 2
    },
    {
      name: 'exchangerate-api',
      url: 'https://api.exchangerate-api.com/v4/latest',
      baseCurrency: 'USD',
      priority: 3
    }
  ];

  // Major currencies to fetch rates for
  private readonly targetCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD', 
    'HKD', 'NZD', 'KRW', 'MXN', 'BRL', 'RUB', 'ZAR', 'TRY', 'AED', 'SAR', 
    'THB', 'MYR', 'IDR', 'PHP', 'VND', 'BDT', 'PKR', 'LKR', 'NPR', 'MMK', 
    'KHR', 'LAK', 'BND', 'MOP', 'TWD', 'MVR', 'AFN', 'AMD', 'AZN', 'GEL', 
    'KZT', 'KGS', 'TJS', 'TMT', 'UZS', 'MNT', 'KPW'
  ];

  // Check if rates exist for today
  async hasRatesForToday(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_exchange_rates')
        .select('id')
        .eq('fx_date', today)
        .limit(1);
      
      if (error) {
        console.error('Error checking today rates:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error in hasRatesForToday:', error);
      return false;
    }
  }

  // Fetch rates from a specific provider
  async fetchFromProvider(provider: RateProvider): Promise<DailyRate[]> {
    try {
      console.log(`🔄 Fetching rates from ${provider.name}...`);
      
      let url = provider.url;
      if (provider.apiKey) {
        url += `?access_key=${provider.apiKey}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Provider ${provider.name} failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success && !data.rates) {
        throw new Error(`Provider ${provider.name} returned invalid data`);
      }
      
      const rates: DailyRate[] = [];
      const today = new Date().toISOString().split('T')[0];
      
      // Convert API response to our format
      for (const targetCurrency of this.targetCurrencies) {
        if (targetCurrency !== provider.baseCurrency && data.rates[targetCurrency]) {
          rates.push({
            base_currency: provider.baseCurrency,
            target_currency: targetCurrency,
            rate: Number(data.rates[targetCurrency].toFixed(6)), // 6 decimal precision
            fx_date: today,
            fx_source: provider.name,
            created_at: new Date(),
            is_stale: false
          });
        }
      }
      
      console.log(`✅ Fetched ${rates.length} rates from ${provider.name}`);
      return rates;
    } catch (error) {
      console.error(`❌ Error fetching from ${provider.name}:`, error);
      throw error;
    }
  }

  // Fetch rates for today using fallback providers
  async fetchTodaysRates(): Promise<DailyRate[]> {
    console.log('🚀 Starting daily rate fetch...');
    
    // Check if we already have today's rates
    if (await this.hasRatesForToday()) {
      console.log('✅ Today rates already exist, skipping fetch');
      return [];
    }
    
    // Try providers in priority order
    for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
      try {
        const rates = await this.fetchFromProvider(provider);
        if (rates.length > 0) {
          await this.storeRates(rates);
          console.log(`✅ Successfully fetched and stored rates from ${provider.name}`);
          return rates;
        }
      } catch (error) {
        console.error(`❌ Provider ${provider.name} failed:`, error);
        continue; // Try next provider
      }
    }
    
    // If all providers fail, use previous day's rates as fallback
    console.log('⚠️ All providers failed, using previous day rates as fallback');
    return await this.usePreviousDayRates();
  }

  // Store rates in database
  async storeRates(rates: DailyRate[]): Promise<void> {
    try {
      console.log(`💾 Storing ${rates.length} daily rates...`);
      
      const { error } = await supabase
        .from('daily_exchange_rates')
        .upsert(rates, {
          onConflict: 'base_currency,target_currency,fx_date',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Error storing daily rates:', error);
        throw error;
      }
      
      console.log('✅ Daily rates stored successfully');
    } catch (error) {
      console.error('Error in storeRates:', error);
      throw error;
    }
  }

  // Use previous day's rates as fallback
  async usePreviousDayRates(): Promise<DailyRate[]> {
    try {
      console.log('🔄 Using previous day rates as fallback...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_exchange_rates')
        .select('*')
        .eq('fx_date', yesterdayStr)
        .eq('is_stale', false);
      
      if (error) {
        console.error('Error fetching previous day rates:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.error('No previous day rates available');
        return [];
      }
      
      // Mark as stale and update date
      const staleRates: DailyRate[] = data.map(rate => ({
        ...rate,
        fx_date: new Date().toISOString().split('T')[0],
        is_stale: true,
        created_at: new Date()
      }));
      
      await this.storeRates(staleRates);
      console.log('⚠️ Using stale rates from previous day');
      
      return staleRates;
    } catch (error) {
      console.error('Error in usePreviousDayRates:', error);
      return [];
    }
  }

  // Get rate for specific currency pair and date
  async getRate(baseCurrency: string, targetCurrency: string, date?: string): Promise<DailyRate | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // First try exact date match
      let { data, error } = await supabase
        .from('daily_exchange_rates')
        .select('*')
        .eq('base_currency', baseCurrency)
        .eq('target_currency', targetCurrency)
        .eq('fx_date', targetDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching rate:', error);
        return null;
      }
      
      // If no exact match, try previous day
      if (!data) {
        const previousDate = new Date(targetDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateStr = previousDate.toISOString().split('T')[0];
        
        const { data: prevData, error: prevError } = await supabase
          .from('daily_exchange_rates')
          .select('*')
          .eq('base_currency', baseCurrency)
          .eq('target_currency', targetCurrency)
          .eq('fx_date', previousDateStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (prevError && prevError.code !== 'PGRST116') {
          console.error('Error fetching previous day rate:', prevError);
          return null;
        }
        
        data = prevData;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getRate:', error);
      return null;
    }
  }

  // Get all rates for a specific date
  async getRatesForDate(date: string): Promise<DailyRate[]> {
    try {
      const { data, error } = await supabase
        .from('daily_exchange_rates')
        .select('*')
        .eq('fx_date', date)
        .order('base_currency, target_currency');
      
      if (error) {
        console.error('Error fetching rates for date:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getRatesForDate:', error);
      return [];
    }
  }

  // Check for stale rates and show banner
  async checkStaleRates(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_exchange_rates')
        .select('is_stale')
        .eq('fx_date', today)
        .eq('is_stale', true)
        .limit(1);
      
      if (error) {
        console.error('Error checking stale rates:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkStaleRates:', error);
      return false;
    }
  }
}

export const dailyRateFetcher = new DailyRateFetcher();
