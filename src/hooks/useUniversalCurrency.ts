/**
 * React Hook for Universal Currency System
 * Easy integration into React components
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getCurrencySystem,
  TransactionRequest,
  TransactionResult,
  ConversionResult,
  ExchangeRate,
  UniversalCurrencySystem
} from '../services/universalCurrencySystem';

export interface UseUniversalCurrencyReturn {
  // Transaction processing
  processTransaction: (request: TransactionRequest) => Promise<TransactionResult>;
  
  // Currency conversion
  convertAmount: (
    amount: number,
    from: string,
    to: string,
    base?: string
  ) => Promise<ConversionResult>;
  
  // Rate fetching
  getRate: (from: string, to: string, manualRate?: number) => Promise<ExchangeRate>;
  
  // Formatting
  formatCurrency: (amount: number, currency: string) => string;
  getCurrencySymbol: (currency: string) => string;
  
  // State management
  isProcessing: boolean;
  error: string | null;
  lastResult: TransactionResult | ConversionResult | null;
  
  // Cache management
  clearCache: () => void;
  getCachedRates: () => ExchangeRate[];
  
  // Reset
  reset: () => void;
}

/**
 * Universal Currency Hook
 * 
 * @example
 * ```tsx
 * const { processTransaction, convertAmount, formatCurrency, isProcessing } = useUniversalCurrency();
 * 
 * // Process a transaction
 * const result = await processTransaction({
 *   amount: 100,
 *   currency: 'EUR',
 *   accountCurrency: 'USD',
 *   baseCurrency: 'INR',
 *   type: 'expense',
 *   accountId: 'acc_123'
 * });
 * 
 * // Convert currency
 * const conversion = await convertAmount(50, 'GBP', 'USD', 'INR');
 * 
 * // Format currency
 * const formatted = formatCurrency(1234.56, 'USD'); // "$1,234.56"
 * ```
 */
export function useUniversalCurrency(): UseUniversalCurrencyReturn {
  const [system] = useState<UniversalCurrencySystem>(() => getCurrencySystem());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TransactionResult | ConversionResult | null>(null);
  
  /**
   * Process a transaction
   */
  const processTransaction = useCallback(async (
    request: TransactionRequest
  ): Promise<TransactionResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await system.processTransaction(request);
      setLastResult(result);
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Transaction processing failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [system]);
  
  /**
   * Convert amount between currencies
   */
  const convertAmount = useCallback(async (
    amount: number,
    from: string,
    to: string,
    base?: string
  ): Promise<ConversionResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await system.convertAmount(amount, from, to, base);
      setLastResult(result);
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Currency conversion failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [system]);
  
  /**
   * Get exchange rate
   */
  const getRate = useCallback(async (
    from: string,
    to: string,
    manualRate?: number
  ): Promise<ExchangeRate> => {
    try {
      return await system.getRate(from, to, manualRate);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch exchange rate';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [system]);
  
  /**
   * Format currency amount
   */
  const formatCurrency = useCallback((amount: number, currency: string): string => {
    try {
      return system.formatCurrency(amount, currency);
    } catch (err: any) {
      console.error('Format error:', err);
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, [system]);
  
  /**
   * Get currency symbol
   */
  const getCurrencySymbol = useCallback((currency: string): string => {
    try {
      return system.getCurrencySymbol(currency);
    } catch (err: any) {
      console.error('Symbol error:', err);
      return currency;
    }
  }, [system]);
  
  /**
   * Clear stale cache
   */
  const clearCache = useCallback(() => {
    system.clearCache();
  }, [system]);
  
  /**
   * Get all cached rates
   */
  const getCachedRates = useCallback((): ExchangeRate[] => {
    return system.getCachedRates();
  }, [system]);
  
  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
    setIsProcessing(false);
  }, []);
  
  // Auto-clear stale cache every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      system.clearCache();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [system]);
  
  return {
    processTransaction,
    convertAmount,
    getRate,
    formatCurrency,
    getCurrencySymbol,
    isProcessing,
    error,
    lastResult,
    clearCache,
    getCachedRates,
    reset
  };
}

/**
 * Hook for simple currency conversion (without transaction processing)
 */
export function useCurrencyConverter() {
  const { convertAmount, formatCurrency, getCurrencySymbol, isProcessing, error } = useUniversalCurrency();
  
  return {
    convert: convertAmount,
    format: formatCurrency,
    getSymbol: getCurrencySymbol,
    isLoading: isProcessing,
    error
  };
}

/**
 * Hook for transaction processing only
 */
export function useTransactionProcessor() {
  const { processTransaction, formatCurrency, isProcessing, error, lastResult } = useUniversalCurrency();
  
  return {
    process: processTransaction,
    format: formatCurrency,
    isProcessing,
    error,
    lastResult: lastResult as TransactionResult | null
  };
}

