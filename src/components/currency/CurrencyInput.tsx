import React, { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { CurrencySelector } from './CurrencySelector';
import { LiveRateDisplay } from './LiveRateDisplay';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';

interface CurrencyInputProps {
  label?: string;
  value: number | '';
  currency: string;
  onValueChange: (value: number | '') => void;
  onCurrencyChange: (currency: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  showConversion?: boolean;
  targetCurrency?: string;
  onTargetCurrencyChange?: (currency: string) => void;
  showLiveRate?: boolean;
  className?: string;
  required?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  placeholder = "0.00",
  disabled = false,
  error,
  showConversion = false,
  targetCurrency,
  onTargetCurrencyChange,
  showLiveRate = false,
  className = "",
  required = false
}) => {
  const { 
    convertAmount, 
    formatCurrency, 
    getCurrencyInfo,
    displayCurrency 
  } = useEnhancedCurrency();

  const [inputValue, setInputValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  const currencyInfo = getCurrencyInfo(currency);
  const targetCurrencyInfo = targetCurrency ? getCurrencyInfo(targetCurrency) : null;
  const effectiveTargetCurrency = targetCurrency || displayCurrency;

  // Sync input value with prop value
  useEffect(() => {
    if (value === '') {
      setInputValue('');
    } else if (typeof value === 'number') {
      const decimalPlaces = currencyInfo?.decimal_places || 2;
      setInputValue(value.toFixed(decimalPlaces));
    }
  }, [value, currencyInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    // Parse and validate the input
    if (inputVal === '') {
      onValueChange('');
      return;
    }

    const numericValue = parseFloat(inputVal);
    if (!isNaN(numericValue) && numericValue >= 0) {
      onValueChange(numericValue);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    
    // Format the input value when focus is lost
    if (value !== '' && typeof value === 'number') {
      const decimalPlaces = currencyInfo?.decimal_places || 2;
      setInputValue(value.toFixed(decimalPlaces));
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleSwapCurrencies = () => {
    if (targetCurrency && onTargetCurrencyChange) {
      onCurrencyChange(targetCurrency);
      onTargetCurrencyChange(currency);
    }
  };

  const getConvertedAmount = (): number | null => {
    if (value === '' || typeof value !== 'number') return null;
    return convertAmount(value, currency, effectiveTargetCurrency);
  };

  const convertedAmount = getConvertedAmount();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Input Row */}
      <div className="flex space-x-2">
        {/* Amount Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              step="any"
              min="0"
              className={`
                w-full px-3 py-2 border rounded-lg text-right font-mono
                focus:outline-none focus:ring-2 transition-colors duration-200
                ${disabled 
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' 
                  : error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }
              `}
            />
            {currencyInfo && !isFocused && value !== '' && (
              <div className="absolute left-3 top-2 text-gray-500 pointer-events-none">
                {currencyInfo.symbol}
              </div>
            )}
          </div>
        </div>

        {/* Currency Selector */}
        <div className="w-32">
          <CurrencySelector
            value={currency}
            onChange={onCurrencyChange}
            disabled={disabled}
            showFlag={true}
            showFullName={false}
            popularOnly={true}
            error={error ? '' : undefined} // Don't show error on currency selector if amount has error
          />
        </div>
      </div>

      {/* Conversion Display */}
      {showConversion && convertedAmount !== null && value !== '' && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          {/* Swap Button */}
          {targetCurrency && onTargetCurrencyChange && (
            <button
              type="button"
              onClick={handleSwapCurrencies}
              className="p-1 rounded-full hover:bg-white transition-colors"
              title="Swap currencies"
            >
              <ArrowUpDown size={16} className="text-gray-500" />
            </button>
          )}

          {/* Conversion */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {formatCurrency(value as number, currency)} =
              </div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(convertedAmount, effectiveTargetCurrency)}
              </div>
            </div>
            
            {targetCurrencyInfo && (
              <div className="text-xs text-gray-500 mt-1">
                {targetCurrencyInfo.flag_emoji} {targetCurrencyInfo.name}
              </div>
            )}
          </div>

          {/* Target Currency Selector */}
          {targetCurrency && onTargetCurrencyChange && (
            <div className="w-24">
              <CurrencySelector
                value={targetCurrency}
                onChange={onTargetCurrencyChange}
                disabled={disabled}
                showFlag={true}
                showFullName={false}
                popularOnly={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Live Rate Display */}
      {showLiveRate && currency !== effectiveTargetCurrency && (
        <LiveRateDisplay
          fromCurrency={currency}
          toCurrency={effectiveTargetCurrency}
          amount={1}
          compact={true}
          showTrend={true}
          showLastUpdated={false}
        />
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Helper Text */}
      {!error && currencyInfo && (
        <p className="text-xs text-gray-500">
          {currencyInfo.decimal_places === 0 
            ? 'Whole numbers only' 
            : `Up to ${currencyInfo.decimal_places} decimal places`
          }
        </p>
      )}
    </div>
  );
};
