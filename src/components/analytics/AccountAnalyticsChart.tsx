import React, { useState, useMemo } from 'react';
import { X, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '../../types';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';

interface AccountAnalyticsChartProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accountName: string;
}

interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
}

export const AccountAnalyticsChart: React.FC<AccountAnalyticsChartProps> = ({
  isOpen,
  onClose,
  transactions,
  accountName
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (selectedPeriod) {
      case 'week':
        startDate = startOfDay(subDays(now, 7));
        break;
      case 'month':
        startDate = startOfDay(subDays(now, 30));
        break;
      case 'quarter':
        startDate = startOfDay(subDays(now, 90));
        break;
      case 'year':
        startDate = startOfDay(subDays(now, 365));
        break;
      default:
        startDate = startOfDay(subDays(now, 30));
    }

    // Filter transactions for the selected period
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Group transactions by date
    const transactionsByDate = periodTransactions.reduce((acc, transaction) => {
      const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[dateKey].income += transaction.amount || 0;
      } else if (transaction.type === 'expense') {
        acc[dateKey].expense += transaction.amount || 0;
      }
      
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    // Create data points for each day in the period
    const dataPoints: ChartDataPoint[] = [];
    let cumulative = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, 'yyyy-MM-dd');
      const dayData = transactionsByDate[dateKey] || { income: 0, expense: 0 };
      const net = dayData.income - dayData.expense;
      cumulative += net;
      
      dataPoints.push({
        date: dateKey,
        income: dayData.income,
        expense: dayData.expense,
        net,
        cumulative
      });
    }

    return dataPoints;
  }, [transactions, selectedPeriod]);

  const maxValue = useMemo(() => {
    if (!chartData.length) return 100;
    const maxIncome = Math.max(...chartData.map(d => d.income));
    const maxExpense = Math.max(...chartData.map(d => d.expense));
    return Math.max(maxIncome, maxExpense) * 1.1;
  }, [chartData]);

  const minValue = useMemo(() => {
    if (!chartData.length) return -100;
    const minExpense = Math.min(...chartData.map(d => -d.expense));
    return minExpense * 1.1;
  }, [chartData]);

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p>No data available for the selected period</p>
          </div>
        </div>
      );
    }

    const chartHeight = 200;
    const chartWidth = Math.max(400, chartData.length * 8);
    const zeroLine = chartHeight / 2;

    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Zero line */}
          <line x1="0" y1={zeroLine} x2="100%" y2={zeroLine} stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />
          
          {/* Income bars */}
          {chartData.map((point, index) => {
            const x = (index / (chartData.length - 1)) * (chartWidth - 40) + 20;
            const incomeHeight = (point.income / maxValue) * (zeroLine - 10);
            const expenseHeight = (point.expense / maxValue) * (zeroLine - 10);
            
            return (
              <g key={point.date}>
                {/* Income bar */}
                {point.income > 0 && (
                  <rect
                    x={x - 3}
                    y={zeroLine - incomeHeight}
                    width="6"
                    height={incomeHeight}
                    fill="#10b981"
                    opacity="0.8"
                  />
                )}
                
                {/* Expense bar */}
                {point.expense > 0 && (
                  <rect
                    x={x - 3}
                    y={zeroLine}
                    width="6"
                    height={expenseHeight}
                    fill="#ef4444"
                    opacity="0.8"
                  />
                )}
                
                {/* Net line */}
                <circle
                  cx={x}
                  cy={zeroLine - (point.net / maxValue) * (zeroLine - 10)}
                  r="2"
                  fill={point.net >= 0 ? "#10b981" : "#ef4444"}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{accountName} Analytics</h2>
            <p className="text-sm text-gray-600">Income vs Expenses Timeline</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
            </div>
            <div className="flex space-x-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6">
          {renderChart()}
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Income (+Y axis)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Expenses (-Y axis)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Net Position</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${chartData.reduce((sum, d) => sum + d.income, 0).toFixed(0)}
              </div>
              <div className="text-sm text-green-700">Total Income</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                ${chartData.reduce((sum, d) => sum + d.expense, 0).toFixed(0)}
              </div>
              <div className="text-sm text-red-700">Total Expenses</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${chartData.reduce((sum, d) => sum + d.net, 0).toFixed(0)}
              </div>
              <div className="text-sm text-blue-700">Net Change</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
