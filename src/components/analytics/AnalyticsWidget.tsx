/**
 * Analytics Widget Component
 * Small interactive widget for Home page that shows spending trends
 * 540px x 200px with line graph
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../contexts/FinanceContext';
import { useProfile } from '../../contexts/ProfileContext';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';
import { format, subDays, startOfDay } from 'date-fns';

export const AnalyticsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useFinance();
  const { profile } = useProfile();
  
  const primaryCurrency = profile?.primaryCurrency || 'INR';
  const currencySymbol = simpleCurrencyService.getCurrencySymbol(primaryCurrency);

  // Calculate last 7 days spending data
  const spendingData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'EEE'),
        fullDate: startOfDay(date),
        income: 0,
        expense: 0,
        net: 0
      };
    });

    transactions.forEach(transaction => {
      const txDate = startOfDay(new Date(transaction.date));
      const dayData = last7Days.find(d => d.fullDate.getTime() === txDate.getTime());
      
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

    return last7Days;
  }, [transactions]);

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
  const generatePath = (data: number[], color: string) => {
    if (data.length === 0) return '';
    
    const width = 500;
    const height = 80;
    const padding = 10;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * plotWidth;
      const normalizedValue = range === 0 ? 0.5 : (value - minValue) / range;
      const y = padding + plotHeight - (normalizedValue * plotHeight);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const incomePath = generatePath(spendingData.map(d => d.income), '#10b981');
  const expensePath = generatePath(spendingData.map(d => -d.expense), '#ef4444');

  return (
    <div
      onClick={() => navigate('/analytics')}
      className="rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden w-full max-w-[540px] mx-auto"
      style={{
        minHeight: '200px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className="h-full flex flex-col p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BarChart3 size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Spending Analytics
            </h3>
          </div>
          <div className="flex items-center space-x-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>Last 7 days</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-3 overflow-hidden">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex items-center space-x-1 min-w-0">
              <TrendingUp size={14} className="text-green-500 flex-shrink-0" />
              <span className="text-xs font-medium text-green-500 truncate">
                +{currencySymbol}{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center space-x-1 min-w-0">
              <TrendingDown size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-xs font-medium text-red-500 truncate">
                -{currencySymbol}{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div 
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="truncate">
              {isPositive ? '+' : ''}{currencySymbol}{Math.abs(netChange).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Line Chart */}
        <div className="flex-1 relative">
          <svg 
            width="500" 
            height="80" 
            className="w-full h-full"
            viewBox="0 0 500 80"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <line x1="0" y1="40" x2="500" y2="40" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            
            {/* Expense line */}
            {expensePath && (
              <path
                d={expensePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            )}
            
            {/* Income line */}
            {incomePath && (
              <path
                d={incomePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            )}
            
            {/* Data points */}
            {spendingData.map((day, index) => {
              const x = 10 + (index / (spendingData.length - 1)) * 480;
              return (
                <g key={index}>
                  {/* Income point */}
                  {day.income > 0 && (
                    <circle
                      cx={x}
                      cy={10 + 60 - ((day.income - minValue) / range * 60)}
                      r="3"
                      fill="#10b981"
                    />
                  )}
                  {/* Expense point */}
                  {day.expense > 0 && (
                    <circle
                      cx={x}
                      cy={10 + 60 - ((-day.expense - minValue) / range * 60)}
                      r="3"
                      fill="#ef4444"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Day labels */}
          <div className="flex justify-between mt-1">
            {spendingData.map((day, index) => (
              <span 
                key={index} 
                className="text-[10px]" 
                style={{ color: 'var(--text-tertiary)' }}
              >
                {day.date}
              </span>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-2 text-center">
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            Click to view detailed analytics →
          </span>
        </div>
      </div>
    </div>
  );
};

