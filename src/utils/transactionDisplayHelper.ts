/**
 * Transaction Display Helper for Multi-Currency
 * Shows actual currency symbol with converted amount in primary currency
 */

import { getCurrencySystem } from '../services/universalCurrencySystem';

export interface TransactionDisplayResult {
  symbol: string;
  amount: number;
  formatted: string;
  originalCurrency: string;
  primaryCurrency: string;
  needsConversion: boolean;
}

/**
 * Format transaction for display
 * Shows: Actual currency symbol + Converted amount
 * Example: €30 EUR transaction → "€2,742" (Euro symbol, INR amount)
 */
export function formatTransactionForDisplay(
  transaction: any,
  primaryCurrency: string
): TransactionDisplayResult {
  const system = getCurrencySystem();
  
  // Get transaction currency and amount
  const originalCurrency = transaction.native_currency || transaction.currency_code || transaction.currencycode || primaryCurrency;
  const originalAmount = transaction.native_amount || transaction.amount || 0;
  const primaryAmount = transaction.primary_amount || transaction.converted_amount || transaction.amount || 0;
  
  // Get currency symbol for original currency
  const symbol = system.getCurrencySymbol(originalCurrency);
  
  // Check if conversion is needed
  const needsConversion = originalCurrency !== primaryCurrency;
  
  // Format the amount (primary currency value)
  const displayAmount = needsConversion ? primaryAmount : originalAmount;
  
  const formatted = `${symbol}${Math.abs(displayAmount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  
  return {
    symbol,
    amount: displayAmount,
    formatted,
    originalCurrency,
    primaryCurrency,
    needsConversion
  };
}

/**
 * Format for display with type prefix
 */
export function formatTransactionWithSign(
  transaction: any,
  primaryCurrency: string
): string {
  const display = formatTransactionForDisplay(transaction, primaryCurrency);
  const sign = transaction.type === 'income' ? '+' : '-';
  return `${sign}${display.formatted}`;
}

/**
 * Get compact display (for lists)
 * Shows: Symbol + Number
 * Example: "€2,742"
 */
export function getCompactDisplay(
  transaction: any,
  primaryCurrency: string
): string {
  const display = formatTransactionForDisplay(transaction, primaryCurrency);
  return display.formatted;
}

/**
 * Get detailed display (for modals)
 * Shows: Symbol + Number + Currency note
 * Example: "€2,742 (from €30 EUR)"
 */
export function getDetailedDisplay(
  transaction: any,
  primaryCurrency: string
): {
  main: string;
  note: string | null;
} {
  const display = formatTransactionForDisplay(transaction, primaryCurrency);
  
  const main = display.formatted;
  const note = display.needsConversion
    ? `from ${display.symbol}${Math.abs(transaction.native_amount || transaction.amount).toFixed(2)} ${display.originalCurrency}`
    : null;
  
  return { main, note };
}

