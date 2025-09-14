/**
 * Comprehensive Multi-Currency Transaction Converter
 * Handles all 5 currency combination cases for transactions
 */

import { convertCurrency, getCurrencyInfo } from './currency-converter';

export interface CurrencyConversionResult {
  // Transaction Currency (what user entered)
  transactionAmount: number;
  transactionCurrency: string;
  transactionSymbol: string;
  
  // Account Currency (what the account uses)
  accountAmount: number;
  accountCurrency: string;
  accountSymbol: string;
  
  // Primary Currency (user's primary currency)
  primaryAmount: number;
  primaryCurrency: string;
  primarySymbol: string;
  
  // Exchange rates used
  transactionToAccountRate: number;
  transactionToPrimaryRate: number;
  accountToPrimaryRate: number;
  
  // Case identifier
  case: 'T=A=P' | 'T=A≠P' | 'T≠A,A=P' | 'T≠A,T=P' | 'T≠A≠P';
}

export interface MultiCurrencyTransaction {
  // Core transaction data
  type: 'income' | 'expense' | 'transfer';
  description: string;
  category: string;
  date: Date;
  accountId: string;
  
  // Currency conversion result
  conversion: CurrencyConversionResult;
  
  // Additional fields
  affectsBalance?: boolean;
  transferToAccountId?: string;
  status?: string;
  notes?: string;
}

/**
 * Convert transaction amount based on all 5 currency cases
 */
export async function convertTransactionCurrency(
  transactionAmount: number,
  transactionCurrency: string,
  accountCurrency: string,
  primaryCurrency: string
): Promise<CurrencyConversionResult> {
  // Validate inputs
  if (!transactionCurrency || !accountCurrency || !primaryCurrency) {
    throw new Error('All currency parameters must be provided');
  }
  
  if (transactionAmount <= 0) {
    throw new Error('Transaction amount must be greater than 0');
  }
  
  const transactionInfo = getCurrencyInfo(transactionCurrency);
  const accountInfo = getCurrencyInfo(accountCurrency);
  const primaryInfo = getCurrencyInfo(primaryCurrency);
  
  // Validate currency info
  if (!transactionInfo) {
    throw new Error(`Invalid transaction currency: ${transactionCurrency}`);
  }
  if (!accountInfo) {
    throw new Error(`Invalid account currency: ${accountCurrency}`);
  }
  if (!primaryInfo) {
    throw new Error(`Invalid primary currency: ${primaryCurrency}`);
  }
  
  // Determine the case
  const caseType = determineCurrencyCase(transactionCurrency, accountCurrency, primaryCurrency);
  
  // Get exchange rates
  const transactionToAccountRate = await getExchangeRate(transactionCurrency, accountCurrency);
  const transactionToPrimaryRate = await getExchangeRate(transactionCurrency, primaryCurrency);
  const accountToPrimaryRate = await getExchangeRate(accountCurrency, primaryCurrency);
  
  // Calculate amounts based on case
  let accountAmount: number;
  let primaryAmount: number;
  
  switch (caseType) {
    case 'T=A=P':
      // Case 1: All same - no conversion needed
      accountAmount = transactionAmount;
      primaryAmount = transactionAmount;
      break;
      
    case 'T=A≠P':
      // Case 2: Transaction = Account ≠ Primary
      accountAmount = transactionAmount;
      primaryAmount = transactionAmount * transactionToPrimaryRate;
      break;
      
    case 'T≠A,A=P':
      // Case 3: Transaction ≠ Account = Primary
      accountAmount = transactionAmount * transactionToAccountRate;
      primaryAmount = accountAmount; // Same as account since A = P
      break;
      
    case 'T≠A,T=P':
      // Case 4: Transaction ≠ Account, Transaction = Primary
      accountAmount = transactionAmount * transactionToAccountRate;
      primaryAmount = transactionAmount;
      break;
      
    case 'T≠A≠P':
      // Case 5: All different
      accountAmount = transactionAmount * transactionToAccountRate;
      primaryAmount = transactionAmount * transactionToPrimaryRate;
      break;
      
    default:
      throw new Error('Invalid currency case');
  }
  
  return {
    // Transaction Currency (what user entered)
    transactionAmount,
    transactionCurrency,
    transactionSymbol: transactionInfo?.symbol || '$',
    
    // Account Currency (what the account uses)
    accountAmount: Math.round(accountAmount * 100) / 100, // Round to 2 decimal places
    accountCurrency,
    accountSymbol: accountInfo?.symbol || '$',
    
    // Primary Currency (user's primary currency)
    primaryAmount: Math.round(primaryAmount * 100) / 100, // Round to 2 decimal places
    primaryCurrency,
    primarySymbol: primaryInfo?.symbol || '$',
    
    // Exchange rates
    transactionToAccountRate,
    transactionToPrimaryRate,
    accountToPrimaryRate,
    
    // Case identifier
    case: caseType
  };
}

/**
 * Determine which currency case applies
 */
function determineCurrencyCase(
  transactionCurrency: string,
  accountCurrency: string,
  primaryCurrency: string
): CurrencyConversionResult['case'] {
  console.log('determineCurrencyCase called with:', {
    transactionCurrency,
    accountCurrency,
    primaryCurrency
  });
  
  if (transactionCurrency === accountCurrency && accountCurrency === primaryCurrency) {
    console.log('Case: T=A=P');
    return 'T=A=P';
  } else if (transactionCurrency === accountCurrency && accountCurrency !== primaryCurrency) {
    console.log('Case: T=A≠P');
    return 'T=A≠P';
  } else if (transactionCurrency !== accountCurrency && accountCurrency === primaryCurrency) {
    console.log('Case: T≠A,A=P');
    return 'T≠A,A=P';
  } else if (transactionCurrency !== accountCurrency && transactionCurrency === primaryCurrency) {
    console.log('Case: T≠A,T=P');
    return 'T≠A,T=P';
  } else {
    console.log('Case: T≠A≠P');
    return 'T≠A≠P';
  }
}

/**
 * Get exchange rate between two currencies
 */
async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }
  
  // Use the existing currency converter
  const rate = convertCurrency(1, fromCurrency, toCurrency);
  return rate || 1.0;
}

/**
 * Format currency amount with symbol
 */
export function formatCurrencyAmount(amount: number, currency: string, symbol: string): string {
  // Validate inputs
  if (amount === undefined || amount === null || isNaN(amount)) {
    console.warn('formatCurrencyAmount: Invalid amount provided:', amount);
    return `${symbol || '$'}0.00`;
  }
  
  if (!currency || !symbol) {
    console.warn('formatCurrencyAmount: Invalid currency or symbol:', { currency, symbol });
    return `${symbol || '$'}0.00`;
  }
  
  const info = getCurrencyInfo(currency);
  const decimalPlaces = info?.decimal_places || 2;
  
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  })}`;
}

/**
 * Generate display text for transaction based on currency case
 */
export function generateTransactionDisplayText(conversion: CurrencyConversionResult): {
  transactionDisplay: string;
  accountDisplay: string;
  totalDisplay: string;
  conversionNote: string;
} {
  // Validate conversion object
  if (!conversion) {
    console.error('generateTransactionDisplayText: conversion object is null or undefined');
    return {
      transactionDisplay: '$0.00',
      accountDisplay: '$0.00',
      totalDisplay: '$0.00',
      conversionNote: 'Invalid conversion data'
    };
  }
  
  const { case: caseType } = conversion;
  
  // Debug logging to help identify the issue
  console.log('generateTransactionDisplayText called with case:', caseType);
  console.log('conversion object:', conversion);
  
  let transactionDisplay: string;
  let accountDisplay: string;
  let totalDisplay: string;
  let conversionNote: string;
  
  switch (caseType) {
    case 'T=A=P':
      // All same - simple display
      transactionDisplay = formatCurrencyAmount(
        conversion.transactionAmount,
        conversion.transactionCurrency,
        conversion.transactionSymbol
      );
      accountDisplay = formatCurrencyAmount(
        conversion.accountAmount,
        conversion.accountCurrency,
        conversion.accountSymbol
      );
      totalDisplay = formatCurrencyAmount(
        conversion.primaryAmount,
        conversion.primaryCurrency,
        conversion.primarySymbol
      );
      conversionNote = 'No conversion needed - all currencies match';
      break;
      
    case 'T=A≠P':
      // Transaction = Account ≠ Primary
      transactionDisplay = formatCurrencyAmount(
        conversion.transactionAmount,
        conversion.transactionCurrency,
        conversion.transactionSymbol
      );
      accountDisplay = formatCurrencyAmount(
        conversion.accountAmount,
        conversion.accountCurrency,
        conversion.accountSymbol
      );
      totalDisplay = formatCurrencyAmount(
        conversion.primaryAmount,
        conversion.primaryCurrency,
        conversion.primarySymbol
      );
      conversionNote = `Converted to primary currency: ${conversion.transactionSymbol}1 = ${conversion.primarySymbol}${conversion.transactionToPrimaryRate.toFixed(4)}`;
      break;
      
    case 'T≠A,A=P':
      // Transaction ≠ Account = Primary
      transactionDisplay = formatCurrencyAmount(
        conversion.transactionAmount,
        conversion.transactionCurrency,
        conversion.transactionSymbol
      );
      accountDisplay = formatCurrencyAmount(
        conversion.accountAmount,
        conversion.accountCurrency,
        conversion.accountSymbol
      );
      totalDisplay = formatCurrencyAmount(
        conversion.primaryAmount,
        conversion.primaryCurrency,
        conversion.primarySymbol
      );
      conversionNote = `Converted to account currency: ${conversion.transactionSymbol}1 = ${conversion.accountSymbol}${conversion.transactionToAccountRate.toFixed(4)}`;
      break;
      
    case 'T≠A,T=P':
      // Transaction ≠ Account, Transaction = Primary
      transactionDisplay = formatCurrencyAmount(
        conversion.transactionAmount,
        conversion.transactionCurrency,
        conversion.transactionSymbol
      );
      accountDisplay = formatCurrencyAmount(
        conversion.accountAmount,
        conversion.accountCurrency,
        conversion.accountSymbol
      );
      totalDisplay = formatCurrencyAmount(
        conversion.primaryAmount,
        conversion.primaryCurrency,
        conversion.primarySymbol
      );
      conversionNote = `Converted to account currency: ${conversion.transactionSymbol}1 = ${conversion.accountSymbol}${conversion.transactionToAccountRate.toFixed(4)}`;
      break;
      
    case 'T≠A≠P':
      // All different
      transactionDisplay = formatCurrencyAmount(
        conversion.transactionAmount,
        conversion.transactionCurrency,
        conversion.transactionSymbol
      );
      accountDisplay = formatCurrencyAmount(
        conversion.accountAmount,
        conversion.accountCurrency,
        conversion.accountSymbol
      );
      totalDisplay = formatCurrencyAmount(
        conversion.primaryAmount,
        conversion.primaryCurrency,
        conversion.primarySymbol
      );
      conversionNote = `Multi-currency conversion: ${conversion.transactionSymbol}1 = ${conversion.accountSymbol}${conversion.transactionToAccountRate.toFixed(4)} = ${conversion.primarySymbol}${conversion.transactionToPrimaryRate.toFixed(4)}`;
      break;
      
    default:
      console.error('Invalid currency case:', caseType);
      console.error('Available cases: T=A=P, T=A≠P, T≠A,A=P, T≠A,T=P, T≠A≠P');
      // Fallback to T≠A≠P case for safety
      transactionDisplay = formatCurrencyAmount(
        conversion.transactionAmount,
        conversion.transactionCurrency,
        conversion.transactionSymbol
      );
      accountDisplay = formatCurrencyAmount(
        conversion.accountAmount,
        conversion.accountCurrency,
        conversion.accountSymbol
      );
      totalDisplay = formatCurrencyAmount(
        conversion.primaryAmount,
        conversion.primaryCurrency,
        conversion.primarySymbol
      );
      conversionNote = `Multi-currency conversion: ${conversion.transactionSymbol}1 = ${conversion.accountSymbol}${conversion.transactionToAccountRate.toFixed(4)} = ${conversion.primarySymbol}${conversion.transactionToPrimaryRate.toFixed(4)}`;
      break;
  }
  
  return {
    transactionDisplay,
    accountDisplay,
    totalDisplay,
    conversionNote
  };
}

/**
 * Generate storage data for database
 */
export function generateStorageData(conversion: CurrencyConversionResult) {
  return {
    // Transaction Currency (what user entered)
    native_amount: conversion.transactionAmount,
    native_currency: conversion.transactionCurrency,
    native_symbol: conversion.transactionSymbol,
    
    // Account Currency (what the account uses)
    converted_amount: conversion.accountAmount,
    converted_currency: conversion.accountCurrency,
    converted_symbol: conversion.accountSymbol,
    
    // Primary Currency (for totals)
    currency_code: conversion.primaryCurrency,
    
    // Exchange rates
    exchange_rate: conversion.transactionToAccountRate,
    exchange_rate_used: conversion.transactionToPrimaryRate,
    
    // Conversion metadata
    conversion_source: 'api',
    conversion_case: conversion.case
  };
}
