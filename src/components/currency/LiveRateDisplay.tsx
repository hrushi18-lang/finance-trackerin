import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';

interface LiveRateDisplayProps {
  fromCurrency: string;
  toCurrency: string;
  amount?: number;
  showTrend?: boolean;
  showLastUpdated?: boolean;
  compact?: boolean;
  className?: string;
  onRateClick?: (rate: number) => void;
}

export const LiveRateDisplay: React.FC<LiveRateDisplayProps> = ({
  fromCurrency,
  toCurrency,
  amount = 1,
  showTrend = true,
  showLastUpdated = true,
  compact = false,
  className = "",
  onRateClick
}) => {
  const { 
    getConversionRate, 
    getCurrencyInfo, 
    formatCurrency,
    isLoading,
    lastUpdated,
    isOnline,
    refreshRates
  } = useEnhancedCurrency();

  const [previousRate, setPreviousRate] = useState<number | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentRate = getConversionRate(fromCurrency, toCurrency);
  const fromCurrencyInfo = getCurrencyInfo(fromCurrency);
  const toCurrencyInfo = getCurrencyInfo(toCurrency);

  // Track rate changes for trend
  useEffect(() => {
    if (currentRate !== null && previousRate !== null) {
      if (currentRate > previousRate) {
        setTrend('up');
      } else if (currentRate < previousRate) {
        setTrend('down');
      } else {
        setTrend('neutral');
      }
    }
    setPreviousRate(currentRate);
  }, [currentRate, previousRate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRates();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleRateClick = () => {
    if (currentRate !== null && onRateClick) {
      onRateClick(currentRate);
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

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={14} className="text-red-500" />;
      default:
        return <Minus size={14} className="text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (currentRate === null) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-sm text-gray-500">
          Rate unavailable
        </div>
        {!isOnline && <WifiOff size={14} className="text-red-500" />}
      </div>
    );
  }

  const convertedAmount = amount * currentRate;

  if (compact) {
    return (
      <div 
        className={`
          flex items-center space-x-2 cursor-pointer hover:bg-gray-50 
          px-2 py-1 rounded-md transition-colors ${className}
        `}
        onClick={handleRateClick}
      >
        <div className="flex items-center space-x-1">
          {fromCurrencyInfo && toCurrencyInfo && (
            <>
              <span className="text-xs">{fromCurrencyInfo.flag_emoji}</span>
              <span className="text-xs font-medium">
                {formatCurrency(amount, fromCurrency)}
              </span>
              <span className="text-xs text-gray-400">=</span>
              <span className="text-xs">{toCurrencyInfo.flag_emoji}</span>
              <span className="text-xs font-medium">
                {formatCurrency(convertedAmount, toCurrency)}
              </span>
            </>
          )}
        </div>
        {showTrend && getTrendIcon()}
        {!isOnline && <WifiOff size={12} className="text-red-500" />}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {fromCurrencyInfo && (
              <>
                <span className="text-lg">{fromCurrencyInfo.flag_emoji}</span>
                <span className="font-medium text-gray-700">{fromCurrency}</span>
              </>
            )}
            <span className="text-gray-400">→</span>
            {toCurrencyInfo && (
              <>
                <span className="text-lg">{toCurrencyInfo.flag_emoji}</span>
                <span className="font-medium text-gray-700">{toCurrency}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {!isOnline && <WifiOff size={14} className="text-red-500" />}
            {isOnline && <Wifi size={14} className="text-green-500" />}
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh rates"
        >
          <RefreshCw 
            size={14} 
            className={`text-gray-500 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {/* Exchange Rate */}
      <div 
        className="cursor-pointer hover:bg-gray-50 rounded-md p-2 transition-colors"
        onClick={handleRateClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(amount, fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
            </div>
            <div className="text-sm text-gray-500">
              1 {fromCurrency} = {currentRate.toFixed(toCurrencyInfo?.decimal_places || 2)} {toCurrency}
            </div>
          </div>
          {showTrend && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-xs font-medium">
                {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                {Math.abs((currentRate - (previousRate || currentRate)) / (previousRate || currentRate) * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      {showLastUpdated && lastUpdated && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Updated {formatTimeAgo(lastUpdated)}
          </div>
          <div className="text-xs text-gray-400">
            {isOnline ? 'Live rates' : 'Offline rates'}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Updating rates...</span>
          </div>
        </div>
      )}
    </div>
  );
};
