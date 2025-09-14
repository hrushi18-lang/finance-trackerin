/**
 * Enhanced Currency Converter
 * Uses real-time exchange rates with fallback support
 */

import { exchangeRateService } from '../services/exchangeRateService';

// Fallback rates (used when API is unavailable)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,      // United States
  EUR: 0.92,     // Europe (Euro)
  GBP: 0.79,     // United Kingdom
  INR: 83.45,    // India (₹83.45 = $1)
  CNY: 7.24,     // China
  RUB: 92.5,     // Russia
  AUD: 1.53,     // Australia
  NZD: 1.65,     // New Zealand
  JPY: 150.0,    // Japan
  IDR: 15650,    // Indonesia
  MYR: 4.75,     // Malaysia
  THB: 36.5,     // Thailand
  CAD: 1.36,     // Canada
  SGD: 1.35,     // Singapore
  VND: 24500,    // Vietnam
  CHF: 0.88,     // Switzerland
  BRL: 5.15,     // Brazil
  HKD: 7.82,     // Hong Kong
  KRW: 1350,     // South Korea
  AED: 3.67,     // UAE
  NPR: 133.5     // Nepal
};

// Cache for exchange rates
let ratesCache: Record<string, number> | null = null;
let lastCacheUpdate: Date | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Get exchange rates relative to a specific base currency
export async function getExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  try {
    // Check if cache is valid
    if (ratesCache && lastCacheUpdate && 
        Date.now() - lastCacheUpdate.getTime() < CACHE_DURATION) {
      return convertRatesToBase(ratesCache, baseCurrency);
    }

    // Fetch fresh rates
    const rates = await exchangeRateService.getAllRates('USD');
    ratesCache = rates;
    lastCacheUpdate = new Date();
    
    return convertRatesToBase(rates, baseCurrency);
  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallback:', error);
    return convertRatesToBase(FALLBACK_RATES, baseCurrency);
  }
}

// Convert rates to a specific base currency
function convertRatesToBase(rates: Record<string, number>, baseCurrency: string): Record<string, number> {
  const baseRate = rates[baseCurrency];
  if (!baseRate) return rates;

  const convertedRates: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(rates)) {
    convertedRates[currency] = rate / baseRate;
  }
  return convertedRates;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimal_places?: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimal_places: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimal_places: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimal_places: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimal_places: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', decimal_places: 2 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', decimal_places: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimal_places: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', decimal_places: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimal_places: 0 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimal_places: 0 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimal_places: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimal_places: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', decimal_places: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimal_places: 2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimal_places: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', decimal_places: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimal_places: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', decimal_places: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', decimal_places: 0 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', decimal_places: 2 },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', flag: '🇳🇵', decimal_places: 2 }
];

export function getCurrencyInfo(code: string): CurrencyInfo | null {
  return CURRENCIES.find(currency => currency.code === code) || null;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyInfo(currencyCode);
  if (!currency) return amount.toString();

  // Use decimal places from currency info, fallback to 2
  const decimalPlaces = currency.decimal_places ?? 2;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  return `${currency.symbol}${formatted}`;
}

export async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string,
  baseCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const rates = await getExchangeRates(baseCurrency);
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    
    if (!fromRate || !toRate) return null;
    
    // Convert through the base currency
    const baseAmount = amount / fromRate;
    const convertedAmount = baseAmount * toRate;
    
    // Round to appropriate decimal places
    const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR'];
    const decimalPlaces = noDecimalCurrencies.includes(toCurrency) ? 0 : 2;
    return Number(convertedAmount.toFixed(decimalPlaces));
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return null;
  }
}

// Synchronous version for backward compatibility (uses cached rates)
export function convertCurrencySync(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string,
  baseCurrency: string
): number | null {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = convertRatesToBase(ratesCache || FALLBACK_RATES, baseCurrency);
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  
  if (!fromRate || !toRate) return null;
  
  // Convert through the base currency
  const baseAmount = amount / fromRate;
  const convertedAmount = baseAmount * toRate;
  
  // Round to appropriate decimal places
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR'];
  const decimalPlaces = noDecimalCurrencies.includes(toCurrency) ? 0 : 2;
  return Number(convertedAmount.toFixed(decimalPlaces));
}

export async function getExchangeRate(
  fromCurrency: string, 
  toCurrency: string, 
  baseCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1.0;
  
  try {
    const rates = await getExchangeRates(baseCurrency);
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    
    if (!fromRate || !toRate) return null;
    
    return toRate / fromRate;
  } catch (error) {
    console.error('Failed to get exchange rate:', error);
    return null;
  }
}

// Synchronous version for backward compatibility
export function getExchangeRateSync(
  fromCurrency: string, 
  toCurrency: string, 
  baseCurrency: string
): number | null {
  if (fromCurrency === toCurrency) return 1.0;
  
  const rates = convertRatesToBase(ratesCache || FALLBACK_RATES, baseCurrency);
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  
  if (!fromRate || !toRate) return null;
  
  return toRate / fromRate;
}

export function needsConversion(accountCurrency: string, transactionCurrency: string): boolean {
  return accountCurrency !== transactionCurrency;
}

// Multi-currency display helper
export function formatDualCurrency(
  nativeAmount: number,
  nativeCurrency: string,
  convertedAmount: number,
  convertedCurrency: string,
  showBoth: boolean = true
): string {
  const nativeFormatted = formatCurrency(nativeAmount, nativeCurrency);
  
  if (!showBoth || nativeCurrency === convertedCurrency) {
    return nativeFormatted;
  }
  
  const convertedFormatted = formatCurrency(convertedAmount, convertedCurrency);
  return `${nativeFormatted} ≈ ${convertedFormatted}`;
}

// Get currency symbol for a currency code
export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyInfo(currencyCode);
  return currency?.symbol || currencyCode;
}

// Check if currency uses no decimal places
export function isNoDecimalCurrency(currencyCode: string): boolean {
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR'];
  return noDecimalCurrencies.includes(currencyCode);
}
