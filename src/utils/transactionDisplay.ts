import { Transaction } from '../types';

/**
 * Get the display currency and amount for a transaction
 * Shows original transaction currency first, with primary currency in parentheses
 */
export function getTransactionDisplay(transaction: Transaction, primaryCurrency: string = 'USD'): {
  primaryDisplay: string;
  secondaryDisplay?: string;
  originalAmount: number;
  originalCurrency: string;
  primaryAmount: number;
  showConversion: boolean;
} {
  // Priority order for finding original transaction currency:
  // 1. native_currency (what user actually transacted in)
  // 2. original_currency
  // 3. currency_code
  // 4. Fall back to primary currency
  
  const originalCurrency = transaction.native_currency 
    || transaction.original_currency 
    || transaction.currencycode 
    || primaryCurrency;
  
  const originalAmount = transaction.native_amount 
    || transaction.original_amount 
    || transaction.amount;
  
  // Get primary currency amount for reporting
  const primaryAmount = transaction.primary_amount 
    || transaction.amount;
  
  // Determine if we need to show conversion
  const showConversion = originalCurrency !== primaryCurrency;
  
  // Format primary display (what user sees first)
  const originalSymbol = transaction.native_symbol || getCurrencySymbol(originalCurrency);
  const primaryDisplay = `${originalSymbol}${originalAmount.toFixed(2)} ${originalCurrency}`;
  
  // Format secondary display (converted to primary currency)
  let secondaryDisplay: string | undefined;
  if (showConversion) {
    const primarySymbol = getCurrencySymbol(primaryCurrency);
    secondaryDisplay = `${primarySymbol}${primaryAmount.toFixed(2)} ${primaryCurrency}`;
  }
  
  return {
    primaryDisplay,
    secondaryDisplay,
    originalAmount,
    originalCurrency,
    primaryAmount,
    showConversion
  };
}

/**
 * Get detailed multi-currency info for a transaction
 */
export function getTransactionCurrencyDetails(transaction: Transaction): {
  original: { amount: number; currency: string; symbol: string };
  account: { amount: number; currency: string; symbol: string };
  primary: { amount: number; currency: string; symbol: string };
  exchangeRates: { nativeToAccount?: number; accountToPrimary?: number };
  hasMultipleCurrencies: boolean;
} {
  const originalAmount = transaction.native_amount || transaction.original_amount || transaction.amount;
  const originalCurrency = transaction.native_currency || transaction.original_currency || transaction.currencycode || 'USD';
  const originalSymbol = transaction.native_symbol || getCurrencySymbol(originalCurrency);
  
  const accountAmount = transaction.converted_amount || transaction.amount;
  const accountCurrency = transaction.converted_currency || transaction.currencycode || 'USD';
  const accountSymbol = transaction.converted_symbol || getCurrencySymbol(accountCurrency);
  
  const primaryAmount = transaction.primary_amount || transaction.amount;
  const primaryCurrency = transaction.primary_currency || transaction.currencycode || 'USD';
  const primarySymbol = getCurrencySymbol(primaryCurrency);
  
  const hasMultipleCurrencies = 
    originalCurrency !== accountCurrency || 
    accountCurrency !== primaryCurrency ||
    originalCurrency !== primaryCurrency;
  
  return {
    original: { amount: originalAmount, currency: originalCurrency, symbol: originalSymbol },
    account: { amount: accountAmount, currency: accountCurrency, symbol: accountSymbol },
    primary: { amount: primaryAmount, currency: primaryCurrency, symbol: primarySymbol },
    exchangeRates: {
      nativeToAccount: transaction.exchange_rate,
      accountToPrimary: transaction.exchange_rate_used
    },
    hasMultipleCurrencies
  };
}

/**
 * Format transaction amount for display
 */
export function formatTransactionAmount(
  transaction: Transaction,
  primaryCurrency: string,
  options: {
    showOriginal?: boolean;
    showConverted?: boolean;
    compact?: boolean;
  } = { showOriginal: true, showConverted: true, compact: false }
): string {
  const details = getTransactionCurrencyDetails(transaction);
  
  if (!details.hasMultipleCurrencies || !options.showConverted) {
    // Single currency or don't show conversion
    return `${details.original.symbol}${details.original.amount.toFixed(2)}`;
  }
  
  if (options.compact) {
    // Compact format: "$100 (₹8,350)"
    return `${details.original.symbol}${details.original.amount.toFixed(2)} (${details.primary.symbol}${details.primary.amount.toFixed(2)})`;
  }
  
  // Full format: "$100 USD → ₹8,350 INR"
  return `${details.original.symbol}${details.original.amount.toFixed(2)} ${details.original.currency} → ${details.primary.symbol}${details.primary.amount.toFixed(2)} ${details.primary.currency}`;
}

/**
 * Get currency symbol
 */
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'Fr',
    'SEK': 'kr',
    'NZD': 'NZ$'
  };
  
  return symbols[currencyCode] || currencyCode + ' ';
}











