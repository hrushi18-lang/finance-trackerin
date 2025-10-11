/**
 * Currency Conversion Preview Component
 * Reusable component for showing currency conversions in forms
 */

import React from 'react';
import { ArrowRight, Info } from 'lucide-react';

interface CurrencyConversionPreviewProps {
  enteredAmount: number;
  enteredCurrency: string;
  accountAmount?: number;
  accountCurrency?: string;
  primaryAmount?: number;
  primaryCurrency?: string;
  exchangeRate?: number;
  conversionCase?: string;
  conversionNote?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export const CurrencyConversionPreview: React.FC<CurrencyConversionPreviewProps> = ({
  enteredAmount,
  enteredCurrency,
  accountAmount,
  accountCurrency,
  primaryAmount,
  primaryCurrency,
  exchangeRate,
  conversionCase,
  conversionNote,
  variant = 'default'
}) => {
  // Don't show if no conversion needed
  if (conversionCase === 'T=A=P' || (enteredCurrency === accountCurrency && accountCurrency === primaryCurrency)) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div className="text-xs text-blue-600 italic">
        {conversionNote || 'Conversion applied'}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
        <div className="text-xs text-blue-700">
          <div className="flex items-center justify-between">
            <span>{enteredCurrency} {enteredAmount.toFixed(2)}</span>
            <ArrowRight size={12} className="mx-2" />
            <span>{accountCurrency} {accountAmount?.toFixed(2)}</span>
          </div>
          {exchangeRate && exchangeRate !== 1 && (
            <div className="text-blue-600 mt-1">
              Rate: {exchangeRate.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default full display
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
        <Info className="mr-2" size={16} />
        Currency Conversion Preview
      </h4>
      
      <div className="space-y-3">
        {/* Entered Amount */}
        <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-blue-600 mb-1">You're entering:</div>
          <div className="text-lg font-bold text-blue-900">
            {enteredCurrency} {enteredAmount.toFixed(2)}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="flex items-center text-blue-400">
            <div className="h-px w-full bg-blue-300" />
            <ArrowRight size={20} className="mx-2" />
            <div className="h-px w-full bg-blue-300" />
          </div>
        </div>

        {/* Account Amount (if different) */}
        {accountAmount && accountCurrency && accountCurrency !== enteredCurrency && (
          <>
            <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
              <div className="text-xs text-blue-600 mb-1">Will deduct from account:</div>
              <div className="text-lg font-bold text-blue-900">
                {accountCurrency} {accountAmount.toFixed(2)}
              </div>
            </div>
            
            {exchangeRate && (
              <div className="text-xs text-blue-600">
                Exchange rate: 1 {enteredCurrency} = {exchangeRate.toFixed(4)} {accountCurrency}
              </div>
            )}
          </>
        )}

        {/* Primary Amount (if different from account) */}
        {primaryAmount && primaryCurrency && primaryCurrency !== accountCurrency && (
          <>
            <div className="flex items-center justify-center">
              <ArrowRight size={16} className="text-blue-400" />
            </div>
            
            <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
              <div className="text-xs text-blue-600 mb-1">Net worth impact:</div>
              <div className="text-lg font-bold text-blue-900">
                {primaryCurrency} {primaryAmount.toFixed(2)}
              </div>
            </div>
          </>
        )}

        {/* Conversion Note */}
        {conversionNote && (
          <div className="text-xs text-blue-600 italic bg-blue-100/50 rounded p-2">
            {conversionNote}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simple inline conversion display
 */
export const InlineConversionDisplay: React.FC<{
  nativeAmount: number;
  nativeCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
}> = ({ nativeAmount, nativeCurrency, convertedAmount, convertedCurrency }) => {
  const nativeInfo = getCurrencyInfo(nativeCurrency);
  const convertedInfo = getCurrencyInfo(convertedCurrency);
  
  const nativeSymbol = nativeInfo?.symbol || nativeCurrency;
  const convertedSymbol = convertedInfo?.symbol || convertedCurrency;
  
  if (nativeCurrency === convertedCurrency) {
    return (
      <span className="font-semibold">
        {nativeSymbol}{nativeAmount.toFixed(2)}
      </span>
    );
  }
  
  return (
    <span>
      <span className="font-semibold">{nativeSymbol}{nativeAmount.toFixed(2)}</span>
      <span className="text-sm text-gray-500 ml-2">
        (≈ {convertedSymbol}{convertedAmount.toFixed(2)})
      </span>
    </span>
  );
};

/**
 * Currency badge component
 */
export const CurrencyBadge: React.FC<{
  currency: string;
  variant?: 'default' | 'primary' | 'foreign';
}> = ({ currency, variant = 'default' }) => {
  const colors = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    primary: 'bg-blue-100 text-blue-700 border-blue-300',
    foreign: 'bg-orange-100 text-orange-700 border-orange-300'
  };
  
  const colorClass = colors[variant];
  const info = getCurrencyInfo(currency);
  const symbol = info?.symbol || currency;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${colorClass}`}>
      {symbol} {currency}
    </span>
  );
};

