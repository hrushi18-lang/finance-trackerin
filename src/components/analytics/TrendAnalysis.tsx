import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';

interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendAnalysisProps {
  title: string;
  data: TrendData[];
  formatCurrency: (amount: number) => string;
  showPercentage?: boolean;
  icon?: React.ReactNode;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  title,
  data,
  formatCurrency,
  showPercentage = false,
  icon
}) => {
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: 'stable' as const, change: 0, changePercent: 0 };
    
    const change = current - previous;
    const changePercent = (change / Math.abs(previous)) * 100;
    
    if (Math.abs(changePercent) < 1) return { trend: 'stable' as const, change, changePercent };
    return {
      trend: change > 0 ? 'up' as const : 'down' as const,
      change,
      changePercent: Math.abs(changePercent)
    };
  };

  const trend = previousData ? calculateTrend(latestData.value, previousData.value) : {
    trend: 'stable' as const,
    change: 0,
    changePercent: 0
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon || <DollarSign className="w-5 h-5 text-blue-400" />}
          <h3 className="text-lg font-heading text-white">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {getTrendIcon(trend.trend)}
          <span className={`text-sm font-medium ${getTrendColor(trend.trend)}`}>
            {trend.changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Value */}
        <div>
          <div className="text-2xl font-bold text-white">
            {showPercentage ? `${latestData.value.toFixed(1)}%` : formatCurrency(latestData.value)}
          </div>
          <div className="text-sm text-gray-400">
            {latestData.period}
          </div>
        </div>

        {/* Trend Chart */}
        <div className="flex items-end space-x-1 h-16">
          {data.map((item, index) => {
            const maxValue = Math.max(...data.map(d => d.value));
            const minValue = Math.min(...data.map(d => d.value));
            const range = maxValue - minValue;
            const height = range > 0 ? ((item.value - minValue) / range) * 100 : 50;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    item.trend === 'up' ? 'bg-green-400' : 
                    item.trend === 'down' ? 'bg-red-400' : 'bg-gray-400'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {item.period.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Change Details */}
        {trend.change !== 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">vs previous period</span>
            <span className={`font-medium ${getTrendColor(trend.trend)}`}>
              {trend.change > 0 ? '+' : ''}
              {showPercentage ? `${trend.changePercent.toFixed(1)}%` : formatCurrency(trend.change)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
