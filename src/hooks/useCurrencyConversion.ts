import { useState, useCallback } from 'react';
import { useInternationalization } from '../contexts/InternationalizationContext';

interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  originalCurrency: string;
  targetCurrency: string;
}

export const useCurrencyConversion = () => {
  const { supportedCurrencies } = useInternationalization();
  const [isConverting, setIsConverting] = useState(false);

  const getConversionRate = useCallback((fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;

    // Simple conversion rates (in real app, this would come from an API)
    const conversionRates: { [key: string]: { [key: string]: number } } = {
      'USD': { 'INR': 83.0, 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25, 'AUD': 1.35 },
      'EUR': { 'USD': 1.18, 'INR': 97.5, 'GBP': 0.86, 'JPY': 129.0, 'CAD': 1.47, 'AUD': 1.59 },
      'GBP': { 'USD': 1.37, 'INR': 113.5, 'EUR': 1.16, 'JPY': 150.0, 'CAD': 1.71, 'AUD': 1.85 },
      'INR': { 'USD': 0.012, 'EUR': 0.010, 'GBP': 0.009, 'JPY': 1.32, 'CAD': 0.015, 'AUD': 0.016 },
      'JPY': { 'USD': 0.009, 'INR': 0.76, 'EUR': 0.008, 'GBP': 0.007, 'CAD': 0.011, 'AUD': 0.012 },
      'CAD': { 'USD': 0.80, 'INR': 66.4, 'EUR': 0.68, 'GBP': 0.58, 'JPY': 87.5, 'AUD': 1.08 },
      'AUD': { 'USD': 0.74, 'INR': 61.5, 'EUR': 0.63, 'GBP': 0.54, 'JPY': 81.0, 'CAD': 0.93 }
    };

    return conversionRates[fromCurrency]?.[toCurrency] || 1;
  }, []);

  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<ConversionResult> => {
    setIsConverting(true);
    
    try {
      const rate = getConversionRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;
      
      return {
        originalAmount: amount,
        convertedAmount,
        exchangeRate: rate,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency
      };
    } finally {
      setIsConverting(false);
    }
  }, [getConversionRate]);

  const formatCurrencyAmount = useCallback((amount: number, currencyCode: string): string => {
    const currency = supportedCurrencies.find(c => c.code === currencyCode);
    if (!currency) return amount.toString();

    const formatted = amount.toFixed(currency.decimals);
    return currency.symbolPosition === 'before' 
      ? `${currency.symbol}${formatted}`
      : `${formatted} ${currency.symbol}`;
  }, [supportedCurrencies]);

  const needsConversion = useCallback((fromCurrency: string, toCurrency: string): boolean => {
    return fromCurrency !== toCurrency;
  }, []);

  return {
    convertAmount,
    getConversionRate,
    formatCurrencyAmount,
    needsConversion,
    isConverting
  };
};
