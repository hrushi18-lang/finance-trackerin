import React from 'react';
import { useCurrencyConversion } from '../../hooks/useCurrencyConversion';
import { getCurrencyInfo } from '../../utils/currency-converter';

interface DualCurrencyDisplayProps {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  className?: string;
  showSymbols?: boolean;
  precision?: number;
}

export const DualCurrencyDisplay: React.FC<DualCurrencyDisplayProps> = ({
  amount,
  fromCurrency,
  toCurrency,
  className = '',
  showSymbols = true,
  precision = 2
}) => {
  const { convertAmount, isLoading } = useCurrencyConversion();
  const [convertedAmount, setConvertedAmount] = React.useState<number | null>(null);
  const [conversionRate, setConversionRate] = React.useState<number | null>(null);

  React.useEffect(() => {
    const performConversion = async () => {
      if (fromCurrency === toCurrency) {
        setConvertedAmount(amount);
        setConversionRate(1);
        return;
      }

      try {
        console.log(`🔄 DualCurrencyDisplay: Converting ${amount} ${fromCurrency} to ${toCurrency}`);
        const converted = await convertAmount(amount, fromCurrency, toCurrency);
        setConvertedAmount(converted);
        
        // Calculate the conversion rate
        const rate = converted / amount;
        setConversionRate(rate);
        console.log(`✅ DualCurrencyDisplay: ${amount} ${fromCurrency} = ${converted.toFixed(2)} ${toCurrency} (rate: ${rate.toFixed(4)})`);
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setConvertedAmount(null);
        setConversionRate(null);
      }
    };

    performConversion();
  }, [amount, fromCurrency, toCurrency, convertAmount]);

  const fromCurrencyInfo = getCurrencyInfo(fromCurrency);
  const toCurrencyInfo = getCurrencyInfo(toCurrency);

  const formatAmount = (value: number, currency: string) => {
    const currencyInfo = getCurrencyInfo(currency);
    const symbol = showSymbols ? (currencyInfo?.symbol || '$') : '';
    return `${symbol}${value.toFixed(precision)}`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
        <div className="text-gray-400">Converting...</div>
      </div>
    );
  }

  if (fromCurrency === toCurrency) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="font-medium">
          {formatAmount(amount, fromCurrency)}
        </span>
        <span className="text-sm text-gray-500">
          {fromCurrencyInfo?.code || fromCurrency}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Original Amount */}
      <div className="flex items-center space-x-2">
        <span className="font-medium text-gray-900">
          {formatAmount(amount, fromCurrency)}
        </span>
        <span className="text-sm text-gray-500">
          {fromCurrencyInfo?.code || fromCurrency}
        </span>
      </div>
      
      {/* Live Converted Amount */}
      {convertedAmount !== null && (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-blue-600">
            {formatAmount(convertedAmount, toCurrency)}
          </span>
          <span className="text-sm text-gray-500">
            {toCurrencyInfo?.code || toCurrency}
          </span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            LIVE
          </span>
          {conversionRate && (
            <span className="text-xs text-gray-400">
              (Rate: {conversionRate.toFixed(4)})
            </span>
          )}
        </div>
      )}
      
      {convertedAmount === null && (
        <div className="text-sm text-red-500">
          Conversion failed
        </div>
      )}
    </div>
  );
};

export default DualCurrencyDisplay;
