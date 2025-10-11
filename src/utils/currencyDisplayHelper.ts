/**
 * Currency Display Helper
 * Utility functions for displaying amounts with multi-currency support
 */

import { unifiedCurrencyService } from '../services/unifiedCurrencyService';
import { getCurrencyInfo } from './currency-converter';

/**
 * Format amount with native and primary currencies
 * Returns: "$1,000 USD (≈ ₹88,200 INR)"
 */
export async function formatDualCurrency(
  amount: number,
  nativeCurrency: string,
  primaryCurrency: string,
  accountId: string = 'display'
): Promise<string> {
  if (nativeCurrency === primaryCurrency) {
    return formatSingleCurrency(amount, nativeCurrency);
  }
  
  try {
    const conversion = await unifiedCurrencyService.convert({
      enteredAmount: amount,
      enteredCurrency: nativeCurrency,
      accountId: accountId,
      accountCurrency: nativeCurrency,
      primaryCurrency: primaryCurrency,
      operation: 'preview',
      operationType: 'transaction'
    });
    
    if (conversion.success) {
      return `${conversion.displayText.entered} (≈ ${conversion.displayText.primary})`;
    }
  } catch (error) {
    console.error('Dual currency formatting failed:', error);
  }
  
  // Fallback
  return formatSingleCurrency(amount, nativeCurrency);
}

/**
 * Format amount in single currency
 * Returns: "$1,000 USD"
 */
export function formatSingleCurrency(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const symbol = info?.symbol || currencyCode;
  
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${symbol}${formatted} ${currencyCode}`;
}

/**
 * Get conversion text
 * Returns: "1 USD = 88.20 INR"
 */
export function getConversionText(
  fromAmount: number,
  fromCurrency: string,
  toAmount: number,
  toCurrency: string
): string {
  if (fromCurrency === toCurrency) {
    return 'No conversion needed';
  }
  
  const rate = toAmount / fromAmount;
  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);
  
  const fromSymbol = fromInfo?.symbol || fromCurrency;
  const toSymbol = toInfo?.symbol || toCurrency;
  
  return `1 ${fromSymbol} = ${rate.toFixed(4)} ${toSymbol}`;
}

/**
 * Check if conversion is needed
 */
export function needsConversion(currency1: string, currency2: string): boolean {
  return currency1 !== currency2;
}

/**
 * Format exchange rate
 * Returns: "1 USD = 88.2000 INR"
 */
export function formatExchangeRate(rate: number, fromCurrency: string, toCurrency: string): string {
  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);
  
  const fromSymbol = fromInfo?.symbol || fromCurrency;
  const toSymbol = toInfo?.symbol || toCurrency;
  
  return `1 ${fromSymbol} = ${rate.toFixed(4)} ${toSymbol}`;
}

/**
 * Convert amount for display (returns both native and converted)
 */
export async function convertAmountForDisplay(
  amount: number,
  nativeCurrency: string,
  primaryCurrency: string,
  accountId: string = 'display'
): Promise<{ native: string; primary: string; rate: number; needsConversion: boolean }> {
  if (nativeCurrency === primaryCurrency) {
    const formatted = formatSingleCurrency(amount, nativeCurrency);
    return {
      native: formatted,
      primary: formatted,
      rate: 1.0,
      needsConversion: false
    };
  }
  
  try {
    const conversion = await unifiedCurrencyService.convert({
      enteredAmount: amount,
      enteredCurrency: nativeCurrency,
      accountId: accountId,
      accountCurrency: nativeCurrency,
      primaryCurrency: primaryCurrency,
      operation: 'preview',
      operationType: 'transaction'
    });
    
    if (conversion.success) {
      return {
        native: conversion.displayText.entered,
        primary: conversion.displayText.primary,
        rate: conversion.enteredToPrimaryRate,
        needsConversion: true
      };
    }
  } catch (error) {
    console.error('Conversion for display failed:', error);
  }
  
  // Fallback
  const formatted = formatSingleCurrency(amount, nativeCurrency);
  return {
    native: formatted,
    primary: formatted,
    rate: 1.0,
    needsConversion: false
  };
}

/**
 * Format compact currency with conversion
 * Returns: "$1.2K USD (≈ ₹106K INR)"
 */
export function formatCompactDualCurrency(
  amount: number,
  nativeCurrency: string,
  primaryCurrency: string,
  primaryAmount?: number
): string {
  const info = getCurrencyInfo(nativeCurrency);
  const symbol = info?.symbol || nativeCurrency;
  
  const formatCompact = (val: number): string => {
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toFixed(0);
  };
  
  const nativeFormatted = `${symbol}${formatCompact(amount)} ${nativeCurrency}`;
  
  if (!primaryAmount || nativeCurrency === primaryCurrency) {
    return nativeFormatted;
  }
  
  const primaryInfo = getCurrencyInfo(primaryCurrency);
  const primarySymbol = primaryInfo?.symbol || primaryCurrency;
  const primaryFormatted = `${primarySymbol}${formatCompact(primaryAmount)} ${primaryCurrency}`;
  
  return `${nativeFormatted} (≈ ${primaryFormatted})`;
}

/**
 * Get currency symbol with fallback
 */
export function getCurrencySymbolSafe(currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  return info?.symbol || currencyCode;
}

/**
 * Format amount with symbol and thousands separator
 */
export function formatAmountWithSymbol(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbolSafe(currencyCode);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol}${formatted}`;
}

