/**
 * Simple Currency Converter
 * Handles basic currency conversion with fallback rates
 */

// Simple exchange rates (USD as base)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.45,
  JPY: 150.0,
  CAD: 1.36,
  AUD: 1.53,
  CNY: 7.24
};

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' }
];

export function getCurrencyInfo(code: string): CurrencyInfo | null {
  return CURRENCIES.find(currency => currency.code === code) || null;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyInfo(currencyCode);
  if (!currency) return amount.toString();

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(amount);

  return `${currency.symbol}${formatted}`;
}

export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): number | null {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = EXCHANGE_RATES[fromCurrency];
  const toRate = EXCHANGE_RATES[toCurrency];
  
  if (!fromRate || !toRate) return null;
  
  // Convert through USD as base currency
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;
  
  // Round to appropriate decimal places
  const decimalPlaces = toCurrency === 'JPY' ? 0 : 2;
  return Number(convertedAmount.toFixed(decimalPlaces));
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number | null {
  if (fromCurrency === toCurrency) return 1.0;
  
  const fromRate = EXCHANGE_RATES[fromCurrency];
  const toRate = EXCHANGE_RATES[toCurrency];
  
  if (!fromRate || !toRate) return null;
  
  return toRate / fromRate;
}

export function needsConversion(accountCurrency: string, transactionCurrency: string): boolean {
  return accountCurrency !== transactionCurrency;
}
