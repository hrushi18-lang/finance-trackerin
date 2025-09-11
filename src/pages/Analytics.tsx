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
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { ChartPopup } from '../components/analytics/ChartPopup';
import { AdvancedCharts } from '../components/analytics/AdvancedCharts';
import { FinancialInsights } from '../components/analytics/FinancialInsights';
import { MobileGestures } from '../components/mobile/MobileGestures';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { transactions, accounts, goals, budgets } = useFinance();
  
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedView, setSelectedView] = useState('overview');
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);
  const [popupType, setPopupType] = useState<'ring' | 'bar'>('ring');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date;

    // Use custom date range if set, otherwise use period selection
    if (customDateRange.start && customDateRange.end) {
      startDate = customDateRange.start;
      endDate = customDateRange.end;
    } else {
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
    }

    let periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Apply account filter
    if (selectedAccount !== 'all') {
      periodTransactions = periodTransactions.filter(t => t.accountId === selectedAccount);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      periodTransactions = periodTransactions.filter(t => t.category === selectedCategory);
    }

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
  }, [transactions, selectedPeriod, selectedAccount, selectedCategory, customDateRange]);

  // Get period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'lastMonth': return 'Last Month';
      case 'last3Months': return 'Last 3 Months';
      case 'last6Months': return 'Last 6 Months';
      default: return 'This Month';
    }
  };

  // Export analytics data
  const exportAnalyticsData = () => {
    const exportData = {
      period: getPeriodLabel(),
      dateRange: {
        start: analyticsData.period.startDate.toISOString().split('T')[0],
        end: analyticsData.period.endDate.toISOString().split('T')[0]
      },
      filters: {
        account: selectedAccount === 'all' ? 'All Accounts' : accounts.find(a => a.id === selectedAccount)?.name || 'Unknown',
        category: selectedCategory === 'all' ? 'All Categories' : selectedCategory
      },
      summary: {
        income: analyticsData.income,
        expenses: analyticsData.expenses,
        netIncome: analyticsData.netIncome,
        transactionCount: analyticsData.transactionCount,
        savingsRate: analyticsData.income > 0 ? (analyticsData.netIncome / analyticsData.income) * 100 : 0
      },
      categoryBreakdown: analyticsData.categoryBreakdown,
      accounts: accounts.map(acc => ({
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        currency: acc.currency
      })),
      goals: goals.map(goal => ({
        name: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
        targetDate: goal.targetDate
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/overview')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
            <h1 className="text-2xl font-heading">Analytics</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowDetailedView(!showDetailedView)}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                showDetailedView ? 'bg-green-500 text-white' : ''
              }`}
              style={{ 
                backgroundColor: showDetailedView ? 'var(--success)' : 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title={showDetailedView ? 'Switch to Simple View' : 'Switch to Detailed View'}
            >
              {showDetailedView ? <EyeOff size={16} style={{ color: 'white' }} /> : <Eye size={16} style={{ color: 'var(--text-primary)' }} />}
            </button>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                showAdvancedFilters ? 'bg-blue-500 text-white' : ''
              }`}
              style={{ 
                backgroundColor: showAdvancedFilters ? 'var(--primary)' : 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Advanced Filters"
            >
              <Filter size={16} style={{ color: showAdvancedFilters ? 'white' : 'var(--text-primary)' }} />
            </button>
            <button 
              onClick={exportAnalyticsData}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Export Analytics Data"
            >
              <Download size={16} style={{ color: 'var(--text-primary)' }} />
            </button>
            <button 
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Calendar View"
            >
              <Calendar size={16} style={{ color: 'var(--text-primary)' }} />
            </button>
            <button 
              onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                showAdvancedCharts ? 'bg-purple-500 text-white' : ''
              }`}
              style={{ 
                backgroundColor: showAdvancedCharts ? 'var(--primary)' : 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Advanced Charts"
            >
              <BarChart3 size={16} style={{ color: showAdvancedCharts ? 'white' : 'var(--text-primary)' }} />
            </button>
            <button 
              onClick={() => setShowInsights(!showInsights)}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                showInsights ? 'bg-yellow-500 text-white' : ''
              }`}
              style={{ 
                backgroundColor: showInsights ? 'var(--warning)' : 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Financial Insights"
            >
              <Target size={16} style={{ color: showInsights ? 'white' : 'var(--text-primary)' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Period Selector */}
        <div 
          className="p-4 rounded-2xl slide-in-up"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
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
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: selectedPeriod === period.key ? 'var(--primary)' : 'var(--background-secondary)',
                  color: selectedPeriod === period.key ? 'white' : 'var(--text-primary)',
                  boxShadow: selectedPeriod === period.key 
                    ? 'inset 2px 2px 4px rgba(0,0,0,0.2)' 
                    : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
                  transform: selectedPeriod === period.key ? 'scale(0.98)' : 'scale(1)'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div 
            className="p-4 rounded-2xl slide-in-up"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="text-lg font-heading mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Account Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {Array.from(new Set(transactions.map(t => t.category))).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Custom Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={customDateRange.start ? customDateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={customDateRange.end ? customDateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End Date"
                  />
                </div>
                {(customDateRange.start || customDateRange.end) && (
                  <button
                    onClick={() => setCustomDateRange({start: null, end: null})}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear Custom Range
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 slide-in-up">
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--success)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.3)'
                }}
              >
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>Income</p>
                <p className="text-lg font-numbers">{formatCurrency(analyticsData.income)}</p>
              </div>
            </div>
          </div>

          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--error)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.3)'
                }}
              >
                <TrendingDown size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>Expenses</p>
                <p className="text-lg font-numbers">{formatCurrency(analyticsData.expenses)}</p>
              </div>
            </div>
          </div>

          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--primary)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.3)'
                }}
              >
                <DollarSign size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>Net Income</p>
                <p className={`text-lg font-numbers ${analyticsData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analyticsData.netIncome)}
                </p>
              </div>
            </div>
          </div>

          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--accent)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.3)'
                }}
              >
                <BarChart3 size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>Transactions</p>
                <p className="text-lg font-numbers">{analyticsData.transactionCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Ring Chart */}
        <MobileGestures
          onPinch={(scale) => console.log('Pinch scale:', scale)}
          onRotate={(angle) => console.log('Rotation:', angle)}
          onDoubleTap={() => {
            setPopupData(analyticsData.categoryBreakdown);
            setPopupType('ring');
            setShowChartPopup(true);
          }}
          className="p-4 rounded-2xl slide-in-up"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading mb-4">Spending Breakdown</h3>
          <RingChart
            data={Object.entries(analyticsData.categoryBreakdown).map(([category, data], index) => ({
              label: category,
              value: data.amount,
              color: `hsl(${120 + index * 30}, 60%, 50%)`
            }))}
            size={180}
            strokeWidth={15}
            interactive={true}
            onSegmentClick={(segment) => {
              setPopupData(segment);
              setPopupType('ring');
              setShowChartPopup(true);
            }}
          />
        </MobileGestures>

        {/* Income vs Spending Bar Chart */}
        <MobileGestures
          onPinch={(scale) => console.log('Bar chart pinch scale:', scale)}
          onRotate={(angle) => console.log('Bar chart rotation:', angle)}
          onDoubleTap={() => {
            setPopupData(analyticsData);
            setPopupType('bar');
            setShowChartPopup(true);
          }}
          className="p-4 rounded-2xl slide-in-up"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading mb-4">Income vs Spending</h3>
          <BarChart
            data={(() => {
              // Calculate real historical data for the last 6 months
              const months = [];
              const currentDate = new Date();
              
              for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
                
                const monthTransactions = transactions.filter(t => {
                  const transactionDate = new Date(t.date);
                  return transactionDate >= monthDate && transactionDate <= monthEnd;
                });
                
                const monthIncome = monthTransactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0);
                
                const monthSpending = monthTransactions
                  .filter(t => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0);
                
                months.push({
                  month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
                  income: monthIncome,
                  spending: monthSpending
                });
              }
              
              return months;
            })()}
            interactive={true}
            onBarClick={(data) => {
              setPopupData(data);
              setPopupType('bar');
              setShowChartPopup(true);
            }}
          />
        </MobileGestures>

        {/* Category Breakdown */}
        <div 
          className="p-4 rounded-2xl slide-in-up"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
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

        {/* Goal Progress Analytics */}
        {goals.length > 0 && (
          <div 
            className="p-4 rounded-2xl slide-in-up"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="text-lg font-heading mb-4">Goal Progress</h3>
            <div className="space-y-4">
              {goals.slice(0, 5).map((goal) => {
                const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const isCompleted = progress >= 100;
                
                return (
                  <div key={goal.id} className="p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {goal.name}
                      </h4>
                      <span className="text-sm font-numbers" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {progress.toFixed(1)}% Complete
                      </span>
                      {goal.targetDate && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Due: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Net Worth Tracking */}
        <div 
          className="p-4 rounded-2xl slide-in-up"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading mb-4">Net Worth Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Total Assets
              </h4>
              <p className="text-2xl font-numbers text-green-600">
                {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Account Distribution
              </h4>
              <div className="space-y-2">
                {accounts.slice(0, 3).map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {account.name}
                    </span>
                    <span className="text-sm font-numbers">
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                ))}
                {accounts.length > 3 && (
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    +{accounts.length - 3} more accounts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spending Trends */}
        <div 
          className="p-4 rounded-2xl slide-in-up"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading mb-4">Spending Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Average Daily Spending
              </h4>
              <p className="text-xl font-numbers">
                {formatCurrency(analyticsData.expenses / Math.max(1, analyticsData.period.endDate.getDate()))}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Largest Transaction
              </h4>
              <p className="text-xl font-numbers">
                {analyticsData.transactionCount > 0 
                  ? formatCurrency(Math.max(...transactions.map(t => t.amount)))
                  : formatCurrency(0)
                }
              </p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Transaction Frequency
              </h4>
              <p className="text-xl font-numbers">
                {analyticsData.transactionCount > 0 
                  ? `${(analyticsData.transactionCount / Math.max(1, analyticsData.period.endDate.getDate())).toFixed(1)}/day`
                  : '0/day'
                }
              </p>
            </div>
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

      {/* Enhanced Analytics Sections */}
      {showAdvancedCharts && (
        <div className="px-4 space-y-6">
          <AdvancedCharts
            data={analyticsData}
            timeRange={selectedPeriod}
            onTimeRangeChange={setSelectedPeriod}
            onExport={exportAnalyticsData}
          />
        </div>
      )}

      {showInsights && (
        <div className="px-4 space-y-6">
          <FinancialInsights
            data={analyticsData}
            onInsightClick={(insight) => {
              console.log('Insight clicked:', insight);
              // Handle insight click - could navigate to relevant section
            }}
          />
        </div>
      )}

      {/* Interactive Chart Popup */}
      <ChartPopup
        isOpen={showChartPopup}
        onClose={() => setShowChartPopup(false)}
        title={popupType === 'ring' ? 'Category Details' : 'Monthly Details'}
        data={popupData}
        type={popupType}
        onRangeSelect={(startDate, endDate) => {
          // Handle date range selection
          console.log('Date range selected:', startDate, endDate);
          setShowChartPopup(false);
        }}
      />
    </div>
  );
};

export default Analytics;
