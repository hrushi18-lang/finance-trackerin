/**
 * Expanded Analytics Widget Component
 * Larger version for Overview page with time period filters
 */

import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../contexts/FinanceContext';
import { useProfile } from '../../contexts/ProfileContext';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';
import { format, subDays, subMonths, startOfDay, isWithinInterval } from 'date-fns';

type TimePeriod = 'week' | 'month' | '6months';

export const ExpandedAnalyticsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useFinance();
  const { profile } = useProfile();
  
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  
  const primaryCurrency = profile?.primaryCurrency || 'INR';
  const currencySymbol = simpleCurrencyService.getCurrencySymbol(primaryCurrency);

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        return { start: subDays(now, 7), end: now, days: 7, label: 'Last 7 Days' };
      case 'month':
        return { start: subDays(now, 30), end: now, days: 30, label: 'Last 30 Days' };
      case '6months':
        return { start: subMonths(now, 6), end: now, days: 180, label: 'Last 6 Months' };
      default:
        return { start: subDays(now, 30), end: now, days: 30, label: 'Last 30 Days' };
    }
  };

  const { start: startDate, end: endDate, days, label } = getDateRange();

  // Calculate spending data for the selected period
  const spendingData = useMemo(() => {
    const dataPoints = selectedPeriod === '6months' ? 180 : selectedPeriod === 'month' ? 30 : 7;
    const groupBy = selectedPeriod === '6months' ? 'week' : 'day';
    
    const data = Array.from({ length: dataPoints }, (_, i) => {
      const date = subDays(endDate, dataPoints - 1 - i);
      return {
        date: format(date, selectedPeriod === '6months' ? 'MMM dd' : selectedPeriod === 'month' ? 'MMM dd' : 'EEE'),
        fullDate: startOfDay(date),
        income: 0,
        expense: 0,
        net: 0
      };
    });

    // Aggregate data if showing 6 months (weekly buckets)
    if (selectedPeriod === '6months') {
      // Group by weeks
      const weeklyData: typeof data = [];
      for (let i = 0; i < 26; i++) { // ~26 weeks in 6 months
        const weekStart = subDays(endDate, (26 - i) * 7);
        weeklyData.push({
          date: format(weekStart, 'MMM dd'),
          fullDate: startOfDay(weekStart),
          income: 0,
          expense: 0,
          net: 0
        });
      }

      transactions.forEach(transaction => {
        const txDate = new Date(transaction.date);
        if (isWithinInterval(txDate, { start: startDate, end: endDate })) {
          const weekIndex = Math.floor((endDate.getTime() - txDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const dataIndex = 25 - weekIndex;
          if (dataIndex >= 0 && dataIndex < 26 && weeklyData[dataIndex]) {
            const amount = Math.abs(transaction.amount);
            if (transaction.type === 'income') {
              weeklyData[dataIndex].income += amount;
              weeklyData[dataIndex].net += amount;
            } else if (transaction.type === 'expense') {
              weeklyData[dataIndex].expense += amount;
              weeklyData[dataIndex].net -= amount;
            }
          }
        }
      });

      return weeklyData;
    }

    // Daily data for week and month
    transactions.forEach(transaction => {
      const txDate = startOfDay(new Date(transaction.date));
      const dayData = data.find(d => d.fullDate.getTime() === txDate.getTime());
      
      if (dayData) {
        const amount = Math.abs(transaction.amount);
        if (transaction.type === 'income') {
          dayData.income += amount;
          dayData.net += amount;
        } else if (transaction.type === 'expense') {
          dayData.expense += amount;
          dayData.net -= amount;
        }
      }
    });

    return data;
  }, [transactions, selectedPeriod, startDate, endDate]);

  // Calculate totals
  const totalIncome = spendingData.reduce((sum, day) => sum + day.income, 0);
  const totalExpense = spendingData.reduce((sum, day) => sum + day.expense, 0);
  const netChange = totalIncome - totalExpense;
  const isPositive = netChange >= 0;

  // Find min and max for scaling
  const allValues = spendingData.flatMap(d => [d.income, -d.expense]);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, -1);
  const range = maxValue - minValue;

  // Generate SVG path for line chart
  const generatePath = (data: number[]) => {
    if (data.length === 0) return '';
    
    const width = 900;
    const height = 200;
    const padding = 20;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    
    const points = data.map((value, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * plotWidth;
      const normalizedValue = range === 0 ? 0.5 : (value - minValue) / range;
      const y = padding + plotHeight - (normalizedValue * plotHeight);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const incomePath = generatePath(spendingData.map(d => d.income));
  const expensePath = generatePath(spendingData.map(d => -d.expense));

  // Calculate display points (show fewer labels for better readability)
  const labelIndices = selectedPeriod === '6months' 
    ? [0, 4, 8, 12, 16, 20, 25] // Show ~6 labels for 6 months
    : selectedPeriod === 'month'
    ? [0, 5, 10, 15, 20, 25, 29] // Show ~7 labels for month
    : Array.from({ length: 7 }, (_, i) => i); // Show all for week

  return (
    <div
      className="rounded-2xl transition-all duration-300 overflow-hidden w-full max-w-full"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <BarChart3 size={20} sm:size={24} style={{ color: 'var(--primary)' }} />
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Spending Analytics
            </h3>
          </div>
          
          {/* Time Period Selector */}
          <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedPeriod === 'week'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setSelectedPeriod('6months')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedPeriod === '6months'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              6M
            </button>
          </div>
        </div>

        {/* Period Label */}
        <div className="flex items-center space-x-2 mb-4">
          <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="p-3 sm:p-4 rounded-xl bg-green-50">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
              <TrendingUp size={16} className="text-green-600 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-green-600">Income</span>
            </div>
            <div className="text-base sm:text-xl font-bold text-green-700 break-words">
              {currencySymbol}{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          
          <div className="p-3 sm:p-4 rounded-xl bg-red-50">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
              <TrendingDown size={16} className="text-red-600 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-red-600">Expenses</span>
            </div>
            <div className="text-base sm:text-xl font-bold text-red-700 break-words">
              {currencySymbol}{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          
          <div className={`p-3 sm:p-4 rounded-xl ${isPositive ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
              {isPositive ? <TrendingUp size={16} className="text-blue-600 flex-shrink-0" /> : <TrendingDown size={16} className="text-orange-600 flex-shrink-0" />}
              <span className={`text-[10px] sm:text-xs font-medium ${isPositive ? 'text-blue-600' : 'text-orange-600'}`}>Net</span>
            </div>
            <div className={`text-base sm:text-xl font-bold break-words ${isPositive ? 'text-blue-700' : 'text-orange-700'}`}>
              {isPositive ? '+' : ''}{currencySymbol}{Math.abs(netChange).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="relative bg-white rounded-xl p-4 border border-gray-100">
          <svg 
            width="900" 
            height="200" 
            className="w-full"
            viewBox="0 0 900 200"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            <line x1="20" y1="110" x2="880" y2="110" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="60" x2="880" y2="60" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="160" x2="880" y2="160" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Expense line */}
            {expensePath && (
              <path
                d={expensePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Income line */}
            {incomePath && (
              <path
                d={incomePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Data points */}
            {spendingData.map((day, index) => {
              const x = 20 + (index / Math.max(spendingData.length - 1, 1)) * 860;
              return (
                <g key={index}>
                  {/* Income point */}
                  {day.income > 0 && (
                    <circle
                      cx={x}
                      cy={20 + 160 - ((day.income - minValue) / range * 160)}
                      r="4"
                      fill="#10b981"
                    />
                  )}
                  {/* Expense point */}
                  {day.expense > 0 && (
                    <circle
                      cx={x}
                      cy={20 + 160 - ((-day.expense - minValue) / range * 160)}
                      r="4"
                      fill="#ef4444"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Day labels */}
          <div className="flex justify-between mt-2 px-1">
            {labelIndices.map((index) => (
              <span 
                key={index} 
                className="text-xs" 
                style={{ color: 'var(--text-tertiary)' }}
              >
                {spendingData[index]?.date || ''}
              </span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-green-500 rounded"></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Income</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-red-500 rounded"></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Expenses</span>
          </div>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => navigate('/analytics')}
          className="w-full mt-4 py-3 rounded-xl font-medium transition-all hover:shadow-md"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white'
          }}
        >
          View Detailed Analytics →
        </button>
      </div>
    </div>
  );
};

