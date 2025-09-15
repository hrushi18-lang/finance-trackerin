import { useState, useEffect, useCallback, useMemo } from 'react';
import { Decimal } from 'decimal.js';
import { 
  currencyConversionService, 
  ConversionResult, 
  ConversionRequest 
} from '../services/currencyConversionService';
import { transferService, TransferRequest, TransferResult } from '../services/transferService';
import { timezoneService } from '../services/timezoneService';
import { reconciliationService } from '../services/reconciliationService';
import { complianceService, TransactionContext } from '../services/complianceService';

export interface CurrencyConversionHook {
  // Basic conversion
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<ConversionResult>;
  convertCurrency: (request: ConversionRequest) => Promise<ConversionResult>;
  
  // Transfer operations
  createTransfer: (request: TransferRequest) => Promise<TransferResult>;
  createSameCurrencyTransfer: (
    amount: number,
    fromAccountId: string,
    toAccountId: string,
    currency: string,
    primaryCurrency: string,
    description: string
  ) => Promise<TransferResult>;
  
  // Compliance checking
  checkCompliance: (context: TransactionContext) => Promise<boolean>;
  
  // Utility functions
  formatAmount: (amount: Decimal, currency: string) => string;
  getCurrencySymbol: (currency: string) => string;
  getCurrencyPrecision: (currency: string) => number;
  isCurrencyRestricted: (currency: string) => boolean;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastConversion: ConversionResult | null;
  rateStatistics: {
    totalRates: number;
    staleRates: number;
    providers: string[];
    lastUpdate: Date | null;
  };
}

export const useCurrencyConversion = (): CurrencyConversionHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConversion, setLastConversion] = useState<ConversionResult | null>(null);

  // Get rate statistics
  const rateStatistics = useMemo(() => {
    return currencyConversionService.getRateStatistics();
  }, []);

  // Basic conversion function
  const convertAmount = useCallback(async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await currencyConversionService.convertCurrency({
        amount,
        enteredCurrency: fromCurrency,
        accountCurrency: toCurrency,
        primaryCurrency: fromCurrency, // Use entered currency as primary for simple conversion
        includeFees: false,
        auditContext: 'simple_conversion'
      });

      setLastConversion(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Full conversion function
  const convertCurrency = useCallback(async (request: ConversionRequest): Promise<ConversionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await currencyConversionService.convertCurrency(request);
      setLastConversion(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create transfer
  const createTransfer = useCallback(async (request: TransferRequest): Promise<TransferResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check compliance first
      const complianceContext: TransactionContext = {
        amount: request.amount,
        currency: request.fromAccountCurrency,
        fromAccountId: request.fromAccountId,
        toAccountId: request.toAccountId,
        userId: 'current_user', // This would come from auth context
        userCountry: 'US', // This would come from user profile
        userIP: '127.0.0.1', // This would come from request
        userAgent: navigator.userAgent,
        transactionType: 'transfer',
        description: request.description,
        timestamp: new Date()
      };

      const complianceCheck = await complianceService.checkTransactionCompliance(complianceContext);
      if (!complianceCheck.isCompliant) {
        throw new Error(`Compliance check failed: ${complianceCheck.restrictions.join(', ')}`);
      }

      const result = await transferService.createTransfer(request);
      return result;
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create same currency transfer
  const createSameCurrencyTransfer = useCallback(async (
    amount: number,
    fromAccountId: string,
    toAccountId: string,
    currency: string,
    primaryCurrency: string,
    description: string
  ): Promise<TransferResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await transferService.createSameCurrencyTransfer(
        amount,
        fromAccountId,
        toAccountId,
        currency,
        primaryCurrency,
        description
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check compliance
  const checkCompliance = useCallback(async (context: TransactionContext): Promise<boolean> => {
    try {
      const complianceCheck = await complianceService.checkTransactionCompliance(context);
      return complianceCheck.isCompliant;
    } catch (err: any) {
      setError(err.message || 'Compliance check failed');
      return false;
    }
  }, []);

  // Utility functions
  const formatAmount = useCallback((amount: Decimal, currency: string): string => {
    return currencyConversionService.formatAmount(amount, currency);
  }, []);

  const getCurrencySymbol = useCallback((currency: string): string => {
    return currencyConversionService.getCurrencySymbol(currency);
  }, []);

  const getCurrencyPrecision = useCallback((currency: string): number => {
    return currencyConversionService.getCurrencyPrecision(currency);
  }, []);

  const isCurrencyRestricted = useCallback((currency: string): boolean => {
    return currencyConversionService.isCurrencyRestricted(currency);
  }, []);

  // Clean up stale rates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      currencyConversionService.clearStaleRates();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    convertAmount,
    convertCurrency,
    createTransfer,
    createSameCurrencyTransfer,
    checkCompliance,
    formatAmount,
    getCurrencySymbol,
    getCurrencyPrecision,
    isCurrencyRestricted,
    isLoading,
    error,
    lastConversion,
    rateStatistics
  };
};