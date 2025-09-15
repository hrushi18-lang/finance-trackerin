/**
 * Live Currency Converter Component
 * Uses live exchange rates for real-time currency conversion
 */

import React, { useState, useEffect } from 'react';
import { ArrowUpDown, RefreshCw, TrendingUp, Globe, AlertCircle } from 'lucide-react';
import { CurrencySelector } from './CurrencySelector';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';

interface LiveCurrencyConverterProps {
  initialFromCurrency?: string;
  initialToCurrency?: string;
  initialAmount?: number;
  showLiveRate?: boolean;
  showTrend?: boolean;
  className?: string;
}

export const LiveCurrencyConverter: React.FC<LiveCurrencyConverterProps> = ({
  initialFromCurrency = 'USD',
  initialToCurrency = 'INR',
  initialAmount = 100,
  showLiveRate = true,
  showTrend = true,
  className = ''
}) => {
  const { 
    formatCurrency, 
    getCurrencyInfo, 
    supportedCurrencies,
    isLoading: contextLoading 
  } = useEnhancedCurrency();

  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [amount, setAmount] = useState(initialAmount);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fromCurrencyInfo = getCurrencyInfo(fromCurrency);
  const toCurrencyInfo = getCurrencyInfo(toCurrency);

  // Convert currency when inputs change
  useEffect(() => {
    const convertCurrency = async () => {
      if (!amount || amount <= 0 || fromCurrency === toCurrency) {
        setConvertedAmount(amount);
        setExchangeRate(1);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get live exchange rate
        const rate = simpleCurrencyService.getRate(fromCurrency, toCurrency);
        const converted = amount * rate;
        
        setExchangeRate(rate);
        setConvertedAmount(converted);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setError('Failed to convert currency. Please try again.');
        setConvertedAmount(null);
        setExchangeRate(null);
      } finally {
        setIsLoading(false);
      }
    };

    convertCurrency();
  }, [amount, fromCurrency, toCurrency]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simple currency service doesn't need refresh
      // Re-trigger conversion
      const rate = simpleCurrencyService.getRate(fromCurrency, toCurrency);
      const converted = amount * rate;
      setExchangeRate(rate);
      setConvertedAmount(converted);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh rates:', error);
      setError('Failed to refresh rates. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Live Currency Converter
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time exchange rates
            </p>
          </div>
        </div>
        
        {showLiveRate && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Refresh rates"
          >
            <RefreshCw 
              size={16} 
              className={isRefreshing ? 'animate-spin' : ''} 
            />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Conversion Form */}
      <div className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            From
          </label>
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
            </div>
            <div className="w-32">
              <CurrencySelector
                value={fromCurrency}
                onChange={setFromCurrency}
                showFlag={true}
                showFullName={false}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapCurrencies}
            disabled={isLoading}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Swap currencies"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            To
          </label>
          <div className="flex space-x-3">
            <div className="flex-1">
              <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {convertedAmount !== null 
                      ? formatCurrency(convertedAmount, toCurrency)
                      : isLoading 
                        ? 'Converting...' 
                        : '0.00'
                    }
                  </span>
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>
            </div>
            <div className="w-32">
              <CurrencySelector
                value={toCurrency}
                onChange={setToCurrency}
                showFlag={true}
                showFullName={false}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Display */}
      {exchangeRate !== null && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Exchange Rate
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
              </div>
            </div>
            {showTrend && (
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">Live</span>
              </div>
            )}
          </div>
          
          {lastUpdated && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Last updated: {formatTimeAgo(lastUpdated)}
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {(isLoading || contextLoading) && (
        <div className="mt-4 flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? 'Converting...' : 'Loading...'}
          </span>
        </div>
      )}
    </div>
  );
};