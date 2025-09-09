import { dailyRateFetcher, DailyRate } from './daily-rate-fetcher';

export interface ConversionResult {
  originalAmount: number; // In minor units (paise/cents)
  convertedAmount: number; // In minor units (paise/cents)
  originalCurrency: string;
  convertedCurrency: string;
  fxRate: number;
  fxBase: string;
  fxDate: string;
  fxSource: string;
  isStale: boolean;
  displayText: string; // "Converted using rate X (source) on DATE"
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number; // How many decimal places to show
  minorUnitMultiplier: number; // 100 for most currencies, 1000 for some
}

class CurrencyConversionService {
  // Currency information with minor unit multipliers
  private readonly currencyInfo: { [key: string]: CurrencyInfo } = {
    'USD': { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'EUR': { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'GBP': { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'JPY': { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, minorUnitMultiplier: 1 },
    'INR': { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'CAD': { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'AUD': { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'CHF': { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'CNY': { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'SGD': { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'HKD': { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'NZD': { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'KRW': { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, minorUnitMultiplier: 1 },
    'MXN': { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'BRL': { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'RUB': { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'ZAR': { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'TRY': { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'AED': { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'SAR': { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'THB': { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'MYR': { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'IDR': { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 0, minorUnitMultiplier: 1 },
    'PHP': { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'VND': { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0, minorUnitMultiplier: 1 },
    'BDT': { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'PKR': { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'LKR': { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', decimalPlaces: 2, minorUnitMultiplier: 100 },
    'NPR': { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', decimalPlaces: 2, minorUnitMultiplier: 100 }
  };

  // Convert amount from major units to minor units
  toMinorUnits(amount: number, currency: string): number {
    const info = this.currencyInfo[currency];
    if (!info) {
      console.warn(`Unknown currency: ${currency}, using default multiplier 100`);
      return Math.round(amount * 100);
    }
    return Math.round(amount * info.minorUnitMultiplier);
  }

  // Convert amount from minor units to major units
  fromMinorUnits(amount: number, currency: string): number {
    const info = this.currencyInfo[currency];
    if (!info) {
      console.warn(`Unknown currency: ${currency}, using default multiplier 100`);
      return amount / 100;
    }
    return amount / info.minorUnitMultiplier;
  }

  // Format amount for display
  formatAmount(amount: number, currency: string, showSymbol: boolean = true): string {
    const info = this.currencyInfo[currency];
    if (!info) {
      return `${amount.toFixed(2)} ${currency}`;
    }

    const majorAmount = this.fromMinorUnits(amount, currency);
    const formatted = majorAmount.toFixed(info.decimalPlaces);
    
    if (showSymbol) {
      return `${info.symbol}${formatted}`;
    }
    
    return `${formatted} ${currency}`;
  }

  // Convert between currencies with full metadata
  async convert(
    amount: number, // In minor units
    fromCurrency: string,
    toCurrency: string,
    date?: string
  ): Promise<ConversionResult | null> {
    try {
      if (fromCurrency === toCurrency) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          originalCurrency: fromCurrency,
          convertedCurrency: toCurrency,
          fxRate: 1.0,
          fxBase: fromCurrency,
          fxDate: date || new Date().toISOString().split('T')[0],
          fxSource: 'same_currency',
          isStale: false,
          displayText: 'Same currency - no conversion needed'
        };
      }

      console.log(`🔄 Converting ${amount} ${fromCurrency} to ${toCurrency}`);

      // Get exchange rate
      const rateData = await dailyRateFetcher.getRate(fromCurrency, toCurrency, date);
      
      if (!rateData) {
        console.error(`No exchange rate found for ${fromCurrency} → ${toCurrency}`);
        return null;
      }

      // Convert using the rate
      const convertedAmount = Math.round(amount * rateData.rate);
      
      const result: ConversionResult = {
        originalAmount: amount,
        convertedAmount: convertedAmount,
        originalCurrency: fromCurrency,
        convertedCurrency: toCurrency,
        fxRate: rateData.rate,
        fxBase: rateData.base_currency,
        fxDate: rateData.fx_date,
        fxSource: rateData.fx_source,
        isStale: rateData.is_stale,
        displayText: `Converted using rate ${rateData.rate.toFixed(6)} (${rateData.fx_source}) on ${rateData.fx_date}${rateData.is_stale ? ' (stale)' : ''}`
      };

      console.log(`✅ Converted: ${this.formatAmount(amount, fromCurrency)} → ${this.formatAmount(convertedAmount, toCurrency)}`);
      console.log(`📊 Rate: ${rateData.rate} (${rateData.fx_source}) on ${rateData.fx_date}`);
      
      return result;
    } catch (error) {
      console.error('Error in convert:', error);
      return null;
    }
  }

  // Get currency info
  getCurrencyInfo(currency: string): CurrencyInfo | null {
    return this.currencyInfo[currency] || null;
  }

  // Get all supported currencies
  getSupportedCurrencies(): CurrencyInfo[] {
    return Object.values(this.currencyInfo);
  }

  // Check if currency is supported
  isSupported(currency: string): boolean {
    return currency in this.currencyInfo;
  }

  // Get conversion transparency text
  getTransparencyText(result: ConversionResult): string {
    return result.displayText;
  }
}

export const currencyConversionService = new CurrencyConversionService();
