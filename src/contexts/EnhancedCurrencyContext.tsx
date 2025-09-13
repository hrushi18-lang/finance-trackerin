import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { currencyService } from '../services/currencyService';

// Supported currencies interface
interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  flag_emoji: string;
  decimal_places: number;
  is_active: boolean;
}

// Exchange rate interface
interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  source: 'api' | 'manual' | 'fallback';
  api_provider?: string;
  created_at: Date;
}

// User currency preferences interface
interface UserCurrencyPreferences {
  primary_currency: string;
  display_currency: string;
  auto_convert: boolean;
  show_original_amounts: boolean;
  preferred_currencies: string[];
}

// Currency conversion log interface
interface CurrencyConversion {
  from_currency: string;
  to_currency: string;
  original_amount: number;
  converted_amount: number;
  exchange_rate: number;
  conversion_fee: number;
  transaction_id?: string;
  goal_id?: string;
  liability_id?: string;
  bill_id?: string;
}

// Exchange rates map
interface ExchangeRates {
  [key: string]: number;
}

// Context interface
interface EnhancedCurrencyContextType {
  // Supported currencies
  supportedCurrencies: SupportedCurrency[];
  
  // Current exchange rates
  exchangeRates: ExchangeRates;
  isLoading: boolean;
  lastUpdated: Date | null;
  isOnline: boolean;
  
  // User preferences
  userPreferences: UserCurrencyPreferences | null;
  primaryCurrency: string;
  displayCurrency: string;
  
  // Core functions
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number | null;
  getConversionRate: (fromCurrency: string, toCurrency: string) => number | null;
  formatCurrency: (amount: number, currencyCode: string, showSymbol?: boolean) => string;
  
  // Database functions
  saveConversionLog: (conversion: Omit<CurrencyConversion, 'created_at'>) => Promise<void>;
  getUserPreferences: () => Promise<UserCurrencyPreferences | null>;
  updateUserPreferences: (preferences: Partial<UserCurrencyPreferences>) => Promise<void>;
  
  // Exchange rate functions
  refreshRates: () => Promise<void>;
  getHistoricalRate: (fromCurrency: string, toCurrency: string, date: Date) => Promise<number | null>;
  
  // Utility functions
  getCurrencyInfo: (code: string) => SupportedCurrency | null;
  getPopularCurrencies: () => SupportedCurrency[];
  searchCurrencies: (query: string) => SupportedCurrency[];
}

const EnhancedCurrencyContext = createContext<EnhancedCurrencyContextType | undefined>(undefined);

export const useEnhancedCurrency = () => {
  const context = useContext(EnhancedCurrencyContext);
  if (context === undefined) {
    throw new Error('useEnhancedCurrency must be used within an EnhancedCurrencyProvider');
  }
  return context;
};

interface EnhancedCurrencyProviderProps {
  children: ReactNode;
}

export const EnhancedCurrencyProvider: React.FC<EnhancedCurrencyProviderProps> = ({ children }) => {
  // State
  const [supportedCurrencies, setSupportedCurrencies] = useState<SupportedCurrency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userPreferences, setUserPreferences] = useState<UserCurrencyPreferences | null>(null);

  // Derived state
  const primaryCurrency = userPreferences?.primary_currency || 'USD';
  const displayCurrency = userPreferences?.display_currency || 'USD';

  // Fallback exchange rates (updated with current approximate rates) - only supported currencies
  const fallbackRates: ExchangeRates = {
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
    'AUD': 1.53
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load supported currencies on mount
  useEffect(() => {
    loadSupportedCurrencies();
    loadUserPreferences();
  }, []);

  // Auto-refresh rates every 5 minutes when online
  useEffect(() => {
    if (isOnline) {
      refreshRates();
      const interval = setInterval(refreshRates, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Load supported currencies from database
  const loadSupportedCurrencies = async () => {
    try {
      console.log('Loading supported currencies from database...');
      const { data, error } = await supabase
        .from('supported_currencies')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      console.log('Loaded currencies from database:', data);
      setSupportedCurrencies(data || []);
    } catch (error) {
      console.error('Error loading supported currencies:', error);
      console.log('Using fallback currencies...');
      // Use fallback currencies
      const fallbackCurrencies: SupportedCurrency[] = [
        { code: 'USD', name: 'US Dollar', symbol: '$', flag_emoji: '🇺🇸', decimal_places: 2, is_active: true },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag_emoji: '🇮🇳', decimal_places: 2, is_active: true },
        { code: 'EUR', name: 'Euro', symbol: '€', flag_emoji: '🇪🇺', decimal_places: 2, is_active: true },
        { code: 'GBP', name: 'British Pound', symbol: '£', flag_emoji: '🇬🇧', decimal_places: 2, is_active: true },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag_emoji: '🇯🇵', decimal_places: 0, is_active: true },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag_emoji: '🇨🇳', decimal_places: 2, is_active: true },
        { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag_emoji: '🇲🇾', decimal_places: 2, is_active: true },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag_emoji: '🇸🇬', decimal_places: 2, is_active: true },
        { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag_emoji: '🇦🇪', decimal_places: 2, is_active: true },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag_emoji: '🇳🇿', decimal_places: 2, is_active: true },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag_emoji: '🇿🇦', decimal_places: 2, is_active: true },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag_emoji: '🇨🇦', decimal_places: 2, is_active: true },
        { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag_emoji: '🇱🇰', decimal_places: 2, is_active: true },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag_emoji: '🇦🇺', decimal_places: 2, is_active: true }
      ];
      setSupportedCurrencies(fallbackCurrencies);
    }
  };

  // Load user preferences
  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_currency_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserPreferences(data);
      } else {
        // Create default preferences
        const defaultPreferences: UserCurrencyPreferences = {
          primary_currency: 'USD',
          display_currency: 'USD',
          auto_convert: true,
          show_original_amounts: true,
          preferred_currencies: ['USD', 'INR', 'EUR', 'GBP']
        };
        setUserPreferences(defaultPreferences);
        await updateUserPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Refresh exchange rates using the enhanced currency service
  const refreshRates = async (): Promise<void> => {
    if (!isOnline) {
      setExchangeRates(fallbackRates);
      return;
    }

    setIsLoading(true);
    try {
      // Use the enhanced currency service
      const rateInfo = await currencyService.refreshRates();
      setExchangeRates(rateInfo.rates);
      setLastUpdated(rateInfo.lastUpdated);
      console.log(`✅ Exchange rates updated from ${rateInfo.source}`);

      // Save rates to database for historical tracking
      await saveRatesToDatabase(rateInfo.rates, rateInfo.source, rateInfo.apiProvider);
    } catch (error) {
      console.error('❌ Failed to refresh exchange rates:', error);
      setExchangeRates(fallbackRates);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Save rates to database
  const saveRatesToDatabase = async (rates: ExchangeRates, source: string, apiProvider?: string) => {
    try {
      // Only save rates for currencies that exist in supported_currencies table
      const supportedCurrencyCodes = supportedCurrencies.map(c => c.code);
      const filteredRates = Object.entries(rates).filter(([currency]) => 
        supportedCurrencyCodes.includes(currency)
      );

      if (filteredRates.length === 0) {
        console.log('No supported currencies found in rates, skipping database save');
        return;
      }

      const rateEntries = filteredRates.map(([currency, rate]) => ({
        from_currency: 'USD',
        to_currency: currency,
        rate: rate,
        source: source,
        api_provider: apiProvider
      }));

      // Insert rates (ignore conflicts for same day)
      const { error: upsertError } = await supabase
        .from('exchange_rates')
        .upsert(rateEntries, { 
          onConflict: 'from_currency,to_currency,created_at',
          ignoreDuplicates: true 
        });

      if (upsertError) {
        console.error('Error saving rates to database:', upsertError);
        // Fallback: try individual inserts with conflict handling
        for (const entry of rateEntries) {
          try {
            await supabase
              .from('exchange_rates')
              .insert(entry)
              .select()
              .single();
          } catch (insertError: any) {
            // Ignore duplicate key errors
            if (insertError?.code !== '23505') {
              console.warn('Failed to insert rate entry:', insertError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving rates to database:', error);
    }
  };

  // Get conversion rate between two currencies
  const getConversionRate = (fromCurrency: string, toCurrency: string): number | null => {
    if (fromCurrency === toCurrency) return 1.0;

    const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : fallbackRates;
    
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    
    if (!fromRate || !toRate) return null;
    
    // Convert through USD as base currency
    return toRate / fromRate;
  };

  // Convert amount between currencies
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number | null => {
    const rate = getConversionRate(fromCurrency, toCurrency);
    if (rate === null) return null;
    
    const convertedAmount = amount * rate;
    const currency = getCurrencyInfo(toCurrency);
    const decimalPlaces = currency?.decimal_places || 2;
    
    return Number(convertedAmount.toFixed(decimalPlaces));
  };

  // Format currency amount
  const formatCurrency = (amount: number, currencyCode: string, showSymbol: boolean = true): string => {
    const currency = getCurrencyInfo(currencyCode);
    if (!currency) return amount.toString();

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currency.decimal_places,
      maximumFractionDigits: currency.decimal_places,
    }).format(amount);

    return showSymbol ? `${currency.symbol}${formatted}` : formatted;
  };

  // Save conversion log to database
  const saveConversionLog = async (conversion: Omit<CurrencyConversion, 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('currency_conversions')
        .insert({
          user_id: user.id,
          ...conversion
        });
    } catch (error) {
      console.error('Error saving conversion log:', error);
    }
  };

  // Get user preferences
  const getUserPreferences = async (): Promise<UserCurrencyPreferences | null> => {
    return userPreferences;
  };

  // Update user preferences
  const updateUserPreferences = async (preferences: Partial<UserCurrencyPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_currency_preferences')
        .upsert({
          user_id: user.id,
          ...preferences
        })
        .select()
        .single();

      if (error) throw error;
      setUserPreferences(data);
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  // Get historical exchange rate
  const getHistoricalRate = async (fromCurrency: string, toCurrency: string, date: Date): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .gte('created_at', date.toISOString().split('T')[0])
        .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data?.rate || null;
    } catch (error) {
      console.error('Error fetching historical rate:', error);
      return null;
    }
  };

  // Get currency info
  const getCurrencyInfo = (code: string): SupportedCurrency | null => {
    return supportedCurrencies.find(currency => currency.code === code) || null;
  };

  // Get popular currencies with USD always first (memoized)
  const popularCurrencies = useMemo((): SupportedCurrency[] => {
    console.log('getPopularCurrencies called, supportedCurrencies length:', supportedCurrencies.length);
    
    // Fallback popular currencies if database is not loaded
    const fallbackCurrencies: SupportedCurrency[] = [
      { code: 'USD', name: 'US Dollar', symbol: '$', flag_emoji: '🇺🇸', decimal_places: 2, is_active: true },
      { code: 'EUR', name: 'Euro', symbol: '€', flag_emoji: '🇪🇺', decimal_places: 2, is_active: true },
      { code: 'GBP', name: 'British Pound', symbol: '£', flag_emoji: '🇬🇧', decimal_places: 2, is_active: true },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag_emoji: '🇮🇳', decimal_places: 2, is_active: true },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag_emoji: '🇯🇵', decimal_places: 0, is_active: true },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag_emoji: '🇨🇳', decimal_places: 2, is_active: true },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag_emoji: '🇨🇦', decimal_places: 2, is_active: true },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag_emoji: '🇦🇺', decimal_places: 2, is_active: true }
    ];

    // If no currencies loaded from database, use fallback
    if (supportedCurrencies.length === 0) {
      console.log('Using fallback currencies');
      return fallbackCurrencies;
    }

    // Always put USD first, then add other currencies
    const usdCurrency = supportedCurrencies.find(c => c.code === 'USD');
    const otherCurrencies = supportedCurrencies.filter(c => c.code !== 'USD');
    
    const result = [];
    
    // Add USD first if it exists
    if (usdCurrency) {
      result.push(usdCurrency);
    }
    
    // Add up to 7 more currencies (total of 8)
    const remainingSlots = 8 - result.length;
    result.push(...otherCurrencies.slice(0, remainingSlots));
    
    console.log('Returning popular currencies:', result.map(c => c.code));
    return result;
  }, [supportedCurrencies]);

  // Get popular currencies function (now just returns memoized value)
  const getPopularCurrencies = (): SupportedCurrency[] => {
    return popularCurrencies;
  };

  // Search currencies
  const searchCurrencies = (query: string): SupportedCurrency[] => {
    const lowercaseQuery = query.toLowerCase();
    return supportedCurrencies.filter(currency => 
      currency.code.toLowerCase().includes(lowercaseQuery) ||
      currency.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  const value: EnhancedCurrencyContextType = {
    // Data
    supportedCurrencies,
    exchangeRates,
    isLoading,
    lastUpdated,
    isOnline,
    userPreferences,
    primaryCurrency,
    displayCurrency,
    
    // Core functions
    convertAmount,
    getConversionRate,
    formatCurrency,
    
    // Database functions
    saveConversionLog,
    getUserPreferences,
    updateUserPreferences,
    
    // Exchange rate functions
    refreshRates,
    getHistoricalRate,
    
    // Utility functions
    getCurrencyInfo,
    getPopularCurrencies,
    searchCurrencies,
  };

  return (
    <EnhancedCurrencyContext.Provider value={value}>
      {children}
    </EnhancedCurrencyContext.Provider>
  );
};
