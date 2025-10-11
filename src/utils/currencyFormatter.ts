/**
 * Unified Currency Formatter
 * Single source of truth for all currency formatting and display operations
 */

import { getCurrencyInfo } from './currency-converter';

export interface FormatCurrencyOptions {
  /**
   * Currency code (USD, INR, EUR, etc.)
   */
  currency?: string;
  
  /**
   * Number of decimal places (defaults to currency's standard)
   */
  precision?: number;
  
  /**
   * Whether to show currency symbol (default: true)
   */
  showSymbol?: boolean;
  
  /**
   * Whether to use thousands separator (default: true)
   */
  useThousandsSeparator?: boolean;
  
  /**
   * Symbol position: 'before' or 'after' (defaults to currency's standard)
   */
  symbolPosition?: 'before' | 'after';
}

/**
 * Format currency amount with consistent symbol placement and decimal handling
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  // Handle invalid amounts
  if (amount === null || amount === undefined || isNaN(amount)) {
    const symbol = getCurrencySymbol(options.currency || 'INR');
    return `${symbol}0.00`;
  }

  const {
    currency = 'INR',
    precision,
    showSymbol = true,
    useThousandsSeparator = true,
    symbolPosition
  } = options;

  const currencyInfo = getCurrencyInfo(currency);
  const symbol = showSymbol ? (currencyInfo?.symbol || '$') : '';
  const decimalPlaces = precision !== undefined ? precision : (currencyInfo?.decimal_places ?? 2);
  const position = symbolPosition || (currencyInfo ? 'before' : 'before');

  // Handle negative amounts
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;

  // Format the number
  let formatted: string;
  if (useThousandsSeparator) {
    formatted = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  } else {
    formatted = absAmount.toFixed(decimalPlaces);
  }

  // Apply symbol position
  let result = position === 'before' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
  
  // Apply negative sign
  if (isNegative) {
    result = position === 'before' ? `-${symbol}${formatted}` : `-${formatted}${symbol}`;
  }

  return result;
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currencyInfo = getCurrencyInfo(currencyCode);
  return currencyInfo?.symbol || currencyCode;
}

/**
 * Format dual currency display (original + converted)
 */
export function formatDualCurrency(
  nativeAmount: number,
  nativeCurrency: string,
  convertedAmount: number,
  convertedCurrency: string,
  showBoth: boolean = true
): string {
  const nativeFormatted = formatCurrency(nativeAmount, { currency: nativeCurrency });
  
  if (!showBoth || nativeCurrency === convertedCurrency) {
    return nativeFormatted;
  }
  
  const convertedFormatted = formatCurrency(convertedAmount, { currency: convertedCurrency });
  return `${nativeFormatted} ≈ ${convertedFormatted}`;
}

/**
 * Format transaction amount with both original and converted currencies
 */
export function formatTransactionAmount(
  amount: number,
  originalCurrency: string,
  convertedAmount?: number,
  convertedCurrency?: string
): string {
  if (!convertedAmount || !convertedCurrency || originalCurrency === convertedCurrency) {
    return formatCurrency(amount, { currency: originalCurrency });
  }

  const originalFormatted = formatCurrency(amount, { currency: originalCurrency });
  const convertedFormatted = formatCurrency(convertedAmount, { currency: convertedCurrency });
  
  return `${originalFormatted} (≈ ${convertedFormatted})`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format compact currency (e.g., 1.2K, 3.5M)
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  const symbol = getCurrencySymbol(currency);
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  let formatted: string;
  
  if (absAmount >= 1_000_000_000) {
    formatted = `${(absAmount / 1_000_000_000).toFixed(1)}B`;
  } else if (absAmount >= 1_000_000) {
    formatted = `${(absAmount / 1_000_000).toFixed(1)}M`;
  } else if (absAmount >= 1_000) {
    formatted = `${(absAmount / 1_000).toFixed(1)}K`;
  } else {
    formatted = absAmount.toFixed(0);
  }
  
  const result = `${symbol}${formatted}`;
  return isNegative ? `-${result}` : result;
}

/**
 * Check if currency uses decimal places
 */
export function currencyHasDecimals(currencyCode: string): boolean {
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR'];
  return !noDecimalCurrencies.includes(currencyCode);
}

/**
 * Get decimal places for a currency
 */
export function getCurrencyDecimals(currencyCode: string): number {
  const currencyInfo = getCurrencyInfo(currencyCode);
  return currencyInfo?.decimal_places ?? 2;
}

/**
 * Parse formatted currency string back to number
 */
export function parseCurrencyString(formattedString: string): number | null {
  if (!formattedString) return null;
  
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = formattedString.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format exchange rate for display
 */
export function formatExchangeRate(
  rate: number,
  fromCurrency: string,
  toCurrency: string,
  precision: number = 4
): string {
  const fromSymbol = getCurrencySymbol(fromCurrency);
  const toSymbol = getCurrencySymbol(toCurrency);
  
  return `1 ${fromSymbol} = ${rate.toFixed(precision)} ${toSymbol}`;
}

