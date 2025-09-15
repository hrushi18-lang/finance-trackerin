import { getCurrencyInfo } from './currency-converter';

export interface DualCurrencyResult {
  originalAmount: number;
  originalCurrency: string;
  originalSymbol: string;
  convertedAmount: number;
  convertedCurrency: string;
  convertedSymbol: string;
  exchangeRate: number;
  conversionSource: 'api' | 'fallback' | 'manual';
  lastUpdated: Date;
}

export interface CurrencyConversionOptions {
  precision?: number;
  showSymbols?: boolean;
  includeMetadata?: boolean;
}

/**
 * Convert an amount from one currency to another with comprehensive tracking
 */
export async function convertToDualCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  options: CurrencyConversionOptions = {}
): Promise<DualCurrencyResult> {
  const {
    precision = 2,
    showSymbols = true,
    includeMetadata = true
  } = options;

  // Get currency information
  const fromCurrencyInfo = getCurrencyInfo(fromCurrency);
  const toCurrencyInfo = getCurrencyInfo(toCurrency);

  // If same currency, return original amount
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      originalSymbol: fromCurrencyInfo?.symbol || '$',
      convertedAmount: amount,
      convertedCurrency: toCurrency,
      convertedSymbol: toCurrencyInfo?.symbol || '$',
      exchangeRate: 1,
      conversionSource: 'manual',
      lastUpdated: new Date()
    };
  }

  try {
    // Try to get live exchange rate
    const { simpleCurrencyService } = await import('../services/simpleCurrencyService');
    const exchangeRate = simpleCurrencyService.getRate(fromCurrency, toCurrency);
    
    const convertedAmount = Number((amount * exchangeRate).toFixed(precision));
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      originalSymbol: fromCurrencyInfo?.symbol || '$',
      convertedAmount,
      convertedCurrency: toCurrency,
      convertedSymbol: toCurrencyInfo?.symbol || '$',
      exchangeRate,
      conversionSource: 'api',
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Live currency conversion failed, using fallback:', error);
    
    // Fallback to hardcoded rates
    const fallbackRates = getFallbackRates();
    const exchangeRate = fallbackRates[`${fromCurrency}_${toCurrency}`] || 1;
    const convertedAmount = Number((amount * exchangeRate).toFixed(precision));
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      originalSymbol: fromCurrencyInfo?.symbol || '$',
      convertedAmount,
      convertedCurrency: toCurrency,
      convertedSymbol: toCurrencyInfo?.symbol || '$',
      exchangeRate,
      conversionSource: 'fallback',
      lastUpdated: new Date()
    };
  }
}

/**
 * Convert amount to both account currency and primary currency
 */
export async function convertToAccountAndPrimaryCurrency(
  amount: number,
  originalCurrency: string,
  accountCurrency: string,
  primaryCurrency: string,
  options: CurrencyConversionOptions = {}
): Promise<{
  account: DualCurrencyResult;
  primary: DualCurrencyResult;
}> {
  const [accountConversion, primaryConversion] = await Promise.all([
    convertToDualCurrency(amount, originalCurrency, accountCurrency, options),
    convertToDualCurrency(amount, originalCurrency, primaryCurrency, options)
  ]);

  return {
    account: accountConversion,
    primary: primaryConversion
  };
}

/**
 * Format currency amount with symbol and code
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string,
  options: CurrencyConversionOptions = {}
): string {
  const { precision = 2, showSymbols = true } = options;
  const currencyInfo = getCurrencyInfo(currency);
  const symbol = showSymbols ? (currencyInfo?.symbol || '$') : '';
  return `${symbol}${amount.toFixed(precision)}`;
}

/**
 * Get fallback exchange rates (September 2025)
 */
function getFallbackRates(): Record<string, number> {
  return {
    // USD to others
    'USD_EUR': 0.87,
    'USD_GBP': 0.76,
    'USD_INR': 88.22,
    'USD_JPY': 152.0,
    'USD_CAD': 1.38,
    'USD_AUD': 1.55,
    'USD_CHF': 0.89,
    'USD_CNY': 7.15,
    'USD_SGD': 1.37,
    'USD_HKD': 7.80,
    'USD_KRW': 1350.0,
    'USD_BRL': 5.25,
    'USD_MXN': 17.80,
    'USD_RUB': 95.0,
    'USD_ZAR': 18.20,
    'USD_NZD': 1.65,
    'USD_SEK': 10.50,
    'USD_NOK': 10.60,
    'USD_DKK': 6.85,
    'USD_PLN': 4.05,
    'USD_CZK': 23.20,
    'USD_HUF': 365.0,
    'USD_TRY': 29.50,
    'USD_ILS': 3.65,
    'USD_AED': 3.67,
    'USD_SAR': 3.75,
    'USD_QAR': 3.64,
    'USD_KWD': 0.31,
    'USD_BHD': 0.38,
    'USD_OMR': 0.38,
    'USD_JOD': 0.71,
    'USD_LBP': 150000.0,
    'USD_EGP': 31.20,
    'USD_MAD': 10.15,
    'USD_TND': 3.12,
    'USD_DZD': 135.0,
    'USD_NGN': 1620.0,
    'USD_KES': 162.0,
    'USD_GHS': 12.60,
    'USD_UGX': 3750.0,
    'USD_TZS': 2520.0,
    'USD_ETB': 56.0,
    'USD_MUR': 46.0,
    'USD_BWP': 13.60,
    'USD_SZL': 18.20,
    'USD_LSL': 18.20,
    'USD_NAD': 18.20,
    'USD_MWK': 1720.0,
    'USD_ZMW': 25.50,
    'USD_BIF': 2900.0,
    'USD_RWF': 1220.0,
    'USD_CDF': 2850.0,
    'USD_AOA': 840.0,
    'USD_MZN': 65.0,
    'USD_SLL': 22500.0,
    'USD_LRD': 195.0,
    'USD_GMD': 68.0,
    'USD_GNF': 8750.0,
    'USD_SLE': 22500.0,
    'USD_STN': 23.0,
    
    // EUR to others
    'EUR_USD': 1.15,
    'EUR_GBP': 0.87,
    'EUR_INR': 101.5,
    'EUR_JPY': 175.0,
    'EUR_CAD': 1.59,
    'EUR_AUD': 1.78,
    'EUR_CHF': 1.02,
    'EUR_CNY': 8.22,
    'EUR_SGD': 1.58,
    'EUR_HKD': 8.97,
    'EUR_KRW': 1552.5,
    'EUR_BRL': 6.04,
    'EUR_MXN': 20.47,
    'EUR_RUB': 109.25,
    'EUR_ZAR': 20.93,
    'EUR_NZD': 1.90,
    'EUR_SEK': 12.08,
    'EUR_NOK': 12.19,
    'EUR_DKK': 7.88,
    'EUR_PLN': 4.66,
    'EUR_CZK': 26.68,
    'EUR_HUF': 419.75,
    'EUR_TRY': 33.93,
    'EUR_ILS': 4.20,
    'EUR_AED': 4.22,
    'EUR_SAR': 4.31,
    'EUR_QAR': 4.19,
    'EUR_KWD': 0.36,
    'EUR_BHD': 0.44,
    'EUR_OMR': 0.44,
    'EUR_JOD': 0.82,
    'EUR_LBP': 172500.0,
    'EUR_EGP': 35.88,
    'EUR_MAD': 11.67,
    'EUR_TND': 3.59,
    'EUR_DZD': 155.25,
    'EUR_NGN': 1863.0,
    'EUR_KES': 186.3,
    'EUR_GHS': 14.49,
    'EUR_UGX': 4312.5,
    'EUR_TZS': 2898.0,
    'EUR_ETB': 64.4,
    'EUR_MUR': 52.9,
    'EUR_BWP': 15.64,
    'EUR_SZL': 20.93,
    'EUR_LSL': 20.93,
    'EUR_NAD': 20.93,
    'EUR_MWK': 1978.0,
    'EUR_ZMW': 29.33,
    'EUR_BIF': 3335.0,
    'EUR_RWF': 1403.0,
    'EUR_CDF': 3277.5,
    'EUR_AOA': 966.0,
    'EUR_MZN': 74.75,
    'EUR_SLL': 25875.0,
    'EUR_LRD': 224.25,
    'EUR_GMD': 78.2,
    'EUR_GNF': 10062.5,
    'EUR_SLE': 25875.0,
    'EUR_STN': 26.45,
    
    // GBP to others
    'GBP_USD': 1.32,
    'GBP_EUR': 1.15,
    'GBP_INR': 116.4,
    'GBP_JPY': 200.0,
    'GBP_CAD': 1.82,
    'GBP_AUD': 2.04,
    'GBP_CHF': 1.17,
    'GBP_CNY': 9.44,
    'GBP_SGD': 1.81,
    'GBP_HKD': 10.30,
    'GBP_KRW': 1782.0,
    'GBP_BRL': 6.93,
    'GBP_MXN': 23.50,
    'GBP_RUB': 125.4,
    'GBP_ZAR': 24.0,
    'GBP_NZD': 2.18,
    'GBP_SEK': 13.86,
    'GBP_NOK': 13.99,
    'GBP_DKK': 9.04,
    'GBP_PLN': 5.35,
    'GBP_CZK': 30.64,
    'GBP_HUF': 481.8,
    'GBP_TRY': 38.94,
    'GBP_ILS': 4.82,
    'GBP_AED': 4.84,
    'GBP_SAR': 4.95,
    'GBP_QAR': 4.81,
    'GBP_KWD': 0.41,
    'GBP_BHD': 0.50,
    'GBP_OMR': 0.50,
    'GBP_JOD': 0.94,
    'GBP_LBP': 198000.0,
    'GBP_EGP': 41.18,
    'GBP_MAD': 13.38,
    'GBP_TND': 4.12,
    'GBP_DZD': 178.2,
    'GBP_NGN': 2138.4,
    'GBP_KES': 213.84,
    'GBP_GHS': 16.63,
    'GBP_UGX': 4950.0,
    'GBP_TZS': 3324.0,
    'GBP_ETB': 73.92,
    'GBP_MUR': 60.72,
    'GBP_BWP': 17.95,
    'GBP_SZL': 24.0,
    'GBP_LSL': 24.0,
    'GBP_NAD': 24.0,
    'GBP_MWK': 2271.6,
    'GBP_ZMW': 33.66,
    'GBP_BIF': 3828.0,
    'GBP_RWF': 1609.2,
    'GBP_CDF': 3762.0,
    'GBP_AOA': 1108.8,
    'GBP_MZN': 85.8,
    'GBP_SLL': 29700.0,
    'GBP_LRD': 257.4,
    'GBP_GMD': 89.76,
    'GBP_GNF': 11550.0,
    'GBP_SLE': 29700.0,
    'GBP_STN': 30.36,
    
    // INR to others
    'INR_USD': 0.0113,
    'INR_EUR': 0.0098,
    'INR_GBP': 0.0086,
    'INR_JPY': 1.72,
    'INR_CAD': 0.0156,
    'INR_AUD': 0.0176,
    'INR_CHF': 0.0101,
    'INR_CNY': 0.0811,
    'INR_SGD': 0.0155,
    'INR_HKD': 0.0884,
    'INR_KRW': 15.31,
    'INR_BRL': 0.0595,
    'INR_MXN': 0.2018,
    'INR_RUB': 1.08,
    'INR_ZAR': 0.2064,
    'INR_NZD': 0.0187,
    'INR_SEK': 0.1191,
    'INR_NOK': 0.1202,
    'INR_DKK': 0.0777,
    'INR_PLN': 0.0459,
    'INR_CZK': 0.2631,
    'INR_HUF': 4.14,
    'INR_TRY': 0.3345,
    'INR_ILS': 0.0414,
    'INR_AED': 0.0416,
    'INR_SAR': 0.0425,
    'INR_QAR': 0.0413,
    'INR_KWD': 0.0035,
    'INR_BHD': 0.0043,
    'INR_OMR': 0.0043,
    'INR_JOD': 0.0081,
    'INR_LBP': 1701.0,
    'INR_EGP': 0.3538,
    'INR_MAD': 0.1151,
    'INR_TND': 0.0354,
    'INR_DZD': 1.53,
    'INR_NGN': 18.36,
    'INR_KES': 1.836,
    'INR_GHS': 0.1428,
    'INR_UGX': 42.53,
    'INR_TZS': 28.56,
    'INR_ETB': 0.6348,
    'INR_MUR': 0.5216,
    'INR_BWP': 0.1542,
    'INR_SZL': 0.2064,
    'INR_LSL': 0.2064,
    'INR_NAD': 0.2064,
    'INR_MWK': 19.51,
    'INR_ZMW': 0.2891,
    'INR_BIF': 32.87,
    'INR_RWF': 13.83,
    'INR_CDF': 32.32,
    'INR_AOA': 9.53,
    'INR_MZN': 0.7373,
    'INR_SLL': 255.15,
    'INR_LRD': 2.21,
    'INR_GMD': 0.7711,
    'INR_GNF': 99.23,
    'INR_SLE': 255.15,
    'INR_STN': 0.2608
  };
}

export default {
  convertToDualCurrency,
  convertToAccountAndPrimaryCurrency,
  formatCurrencyAmount,
  getFallbackRates
};
