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
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { ChartPopup } from '../components/analytics/ChartPopup';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { transactions, accounts, goals, budgets } = useFinance();
  
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedView, setSelectedView] = useState('overview');
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);
  const [popupType, setPopupType] = useState<'ring' | 'bar'>('ring');

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
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <Filter size={16} style={{ color: 'var(--text-primary)' }} />
            </button>
            <button 
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <Calendar size={16} style={{ color: 'var(--text-primary)' }} />
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
        <div 
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
        </div>

        {/* Income vs Spending Bar Chart */}
        <div 
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
        </div>

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