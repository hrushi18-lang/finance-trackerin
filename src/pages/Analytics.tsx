import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { transactions, accounts, goals, budgets } = useFinance();
  
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedView, setSelectedView] = useState('overview');

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'lastMonth':
        startDate = startOfMonth(subMonths(currentDate, 1));
        endDate = endOfMonth(subMonths(currentDate, 1));
        break;
      case 'last3Months':
        startDate = startOfMonth(subMonths(currentDate, 3));
        endDate = endOfMonth(currentDate);
        break;
      case 'last6Months':
        startDate = startOfMonth(subMonths(currentDate, 6));
        endDate = endOfMonth(currentDate);
        break;
      default: // thisMonth
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
    }

    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = income - expenses;

    // Category breakdown
    const categoryBreakdown = periodTransactions.reduce((acc, t) => {
      const category = t.category || 'Other';
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0, type: t.type };
      }
      acc[category].amount += t.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number; type: string }>);

    return {
      income,
      expenses,
      netIncome,
      transactionCount: periodTransactions.length,
      categoryBreakdown,
      period: { startDate, endDate }
    };
  }, [transactions, selectedPeriod]);

  // Get period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'lastMonth': return 'Last Month';
      case 'last3Months': return 'Last 3 Months';
      case 'last6Months': return 'Last 6 Months';
      default: return 'This Month';
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="card-elevated mx-6 mt-6 mb-4 px-6 py-4 fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/overview')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-heading">Analytics</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Filter size={18} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Calendar size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Period Selector */}
        <div className="card p-4 slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading">Time Period</h3>
            <span className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
              {getPeriodLabel()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'thisMonth', label: 'This Month' },
              { key: 'lastMonth', label: 'Last Month' },
              { key: 'last3Months', label: 'Last 3 Months' },
              { key: 'last6Months', label: 'Last 6 Months' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === period.key
                    ? 'text-white transform scale-105'
                    : 'text-gray-700 hover:scale-105'
                }`}
                style={{
                  backgroundColor: selectedPeriod === period.key ? 'var(--primary)' : 'var(--surface)',
                  border: selectedPeriod === period.key ? 'none' : '1px solid var(--border)'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 slide-in-up">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success)' }}>
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Income</p>
                <p className="text-xl font-numbers">{formatCurrency(analyticsData.income)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--error)' }}>
                <TrendingDown size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Expenses</p>
                <p className="text-xl font-numbers">{formatCurrency(analyticsData.expenses)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Net Income</p>
                <p className={`text-xl font-numbers ${analyticsData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analyticsData.netIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Transactions</p>
                <p className="text-xl font-numbers">{analyticsData.transactionCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-6 slide-in-up">
          <h3 className="text-lg font-heading mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analyticsData.categoryBreakdown).length > 0 ? (
              Object.entries(analyticsData.categoryBreakdown)
                .sort(([,a], [,b]) => b.amount - a.amount)
                .slice(0, 8)
                .map(([category, data]) => {
                  const percentage = analyticsData.expenses > 0 
                    ? (data.amount / analyticsData.expenses) * 100 
                    : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-numbers">{formatCurrency(data.amount)}</p>
                        <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8">
                <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                  No transaction data for this period
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 slide-in-up">
          <div className="card p-4">
            <h4 className="font-heading mb-3">Total Accounts</h4>
            <p className="text-2xl font-numbers">{accounts.length}</p>
          </div>
          <div className="card p-4">
            <h4 className="font-heading mb-3">Active Goals</h4>
            <p className="text-2xl font-numbers">{goals.length}</p>
          </div>
          <div className="card p-4">
            <h4 className="font-heading mb-3">Budgets</h4>
            <p className="text-2xl font-numbers">{budgets.length}</p>
          </div>
          <div className="card p-4">
            <h4 className="font-heading mb-3">Savings Rate</h4>
            <p className="text-2xl font-numbers">
              {analyticsData.income > 0 
                ? `${((analyticsData.netIncome / analyticsData.income) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};