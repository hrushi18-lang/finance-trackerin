import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft,
  CreditCard,
  Building2,
  Wallet,
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  EyeOff,
  Settings,
  Star,
  Shield,
  Zap,
  PieChart,
  BarChart3,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useAuth } from '../contexts/AuthContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { ChartPopup } from '../components/analytics/ChartPopup';
import { FinancialHealthCard } from '../components/analytics/FinancialHealthCard';
import { TrendAnalysis } from '../components/analytics/TrendAnalysis';
import { PredictiveAnalytics } from '../components/analytics/PredictiveAnalytics';

const Cards: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { user } = useAuth();
  const { transactions, accounts, goals, budgets, liabilities } = useFinance();
  
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedView] = useState('overview');
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);
  const [popupType, setPopupType] = useState<'ring' | 'bar'>('ring');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [showDetailedView, setShowDetailedView] = useState(false);
  
  // Enhanced analytics state (temporarily disabled)
  const [financialHealth, setFinancialHealth] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load enhanced analytics data (temporarily disabled)
  const loadEnhancedAnalytics = async () => {
    // Temporarily disabled to fix deadlock
    console.log('Enhanced analytics temporarily disabled');
    setLastUpdated(new Date());
  };

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
          break;
      }
    }

    // Filter transactions by date range
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Filter by account if selected
    const accountFilteredTransactions = selectedAccount === 'all' 
      ? filteredTransactions 
      : filteredTransactions.filter(t => t.accountId === selectedAccount);

    // Filter by category if selected
    const categoryFilteredTransactions = selectedCategory === 'all'
      ? accountFilteredTransactions
      : accountFilteredTransactions.filter(t => t.category === selectedCategory);

    const expenses = categoryFilteredTransactions.filter(t => t.type === 'expense');
    const income = categoryFilteredTransactions.filter(t => t.type === 'income');

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    // Calculate category breakdown
    const categoryBreakdown = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate account breakdown
    const accountBreakdown = categoryFilteredTransactions.reduce((acc, t) => {
      const account = accounts.find(a => a.id === t.accountId);
      const accountName = account?.name || 'Unknown Account';
      acc[accountName] = (acc[accountName] || 0) + (t.type === 'income' ? t.amount : -t.amount);
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly trends
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(currentDate, 5 - i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = categoryFilteredTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: format(month, 'MMM'),
        expenses: monthExpenses,
        income: monthIncome,
        net: monthIncome - monthExpenses
      };
    });

    return {
      totalExpenses,
      totalIncome,
      netIncome,
      categoryBreakdown,
      accountBreakdown,
      monthlyTrends,
      transactionCount: categoryFilteredTransactions.length,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      averageIncome: income.length > 0 ? totalIncome / income.length : 0
    };
  }, [transactions, accounts, selectedPeriod, customDateRange, selectedAccount, selectedCategory]);

  // Load analytics data
  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Mock data for now (replace with real analytics engine when ready)
      setFinancialHealth({
        score: 85,
        grade: 'B+',
        riskLevel: 'low',
        metrics: {
          netWorth: 25000,
          savingsRate: 15.2,
          debtToIncome: 0.3,
          creditUtilization: 25.5
        },
        recommendations: [
          'Consider increasing your emergency fund',
          'Your debt-to-income ratio is healthy',
          'Great job maintaining low credit utilization'
        ]
      });

      setTrendData({
        income: { current: 5000, previous: 4800, change: 4.2 },
        expenses: { current: 3500, previous: 3600, change: -2.8 },
        savings: { current: 1500, previous: 1200, change: 25.0 }
      });

      setPredictions({
        nextMonthIncome: 5100,
        nextMonthExpenses: 3400,
        confidence: 0.85
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

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
            <div>
              <h1 className="text-2xl font-heading text-white">Activities</h1>
              <p className="text-sm text-gray-400">Comprehensive overview of all your financial activities</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Advanced Filters"
            >
              <Filter size={16} style={{ color: 'var(--text-primary)' }} />
            </button>
            <button
              onClick={loadAnalytics}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
              title="Refresh Analytics"
            >
              <RefreshCw size={16} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Period Selection */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[
            { key: 'thisMonth', label: 'This Month' },
            { key: 'lastMonth', label: 'Last Month' },
            { key: 'last3Months', label: 'Last 3 Months' },
            { key: 'last6Months', label: 'Last 6 Months' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Total Income</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(analyticsData.totalIncome)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <TrendingDown size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Total Expenses</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(analyticsData.totalExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Net Income</h3>
                <p className={`text-2xl font-bold ${analyticsData.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(analyticsData.netIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Target size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Transactions</h3>
                <p className="text-2xl font-bold text-white">{analyticsData.transactionCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading text-white">Expenses by Category</h3>
              <button
                onClick={() => {
                  setPopupData(Object.entries(analyticsData.categoryBreakdown).map(([name, value]) => ({ name, value })));
                  setPopupType('ring');
                  setShowChartPopup(true);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <PieChart size={16} className="text-gray-400" />
              </button>
            </div>
            <RingChart data={Object.entries(analyticsData.categoryBreakdown).map(([name, value]) => ({ name, value }))} />
          </div>

          {/* Monthly Trends */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading text-white">Monthly Trends</h3>
              <button
                onClick={() => {
                  setPopupData(analyticsData.monthlyTrends);
                  setPopupType('bar');
                  setShowChartPopup(true);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <BarChart3 size={16} className="text-gray-400" />
              </button>
            </div>
            <BarChart data={analyticsData.monthlyTrends} />
          </div>
        </div>

        {/* Enhanced Analytics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading text-white">Advanced Analytics</h2>
            <button
              onClick={loadAnalytics}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>Load Advanced Analytics</span>
            </button>
          </div>

          {financialHealth && (
            <FinancialHealthCard 
              data={financialHealth}
              formatCurrency={formatCurrency}
            />
          )}

          {trendData && (
            <TrendAnalysis 
              data={trendData}
              formatCurrency={formatCurrency}
            />
          )}

          {predictions && (
            <PredictiveAnalytics 
              data={predictions}
              formatCurrency={formatCurrency}
            />
          )}

          {lastUpdated && (
            <div className="text-center text-sm text-gray-400">
              Last updated: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
            </div>
          )}
        </div>
      </div>

      {/* Chart Popup */}
      {showChartPopup && (
        <ChartPopup
          isOpen={showChartPopup}
          onClose={() => setShowChartPopup(false)}
          data={popupData}
          type={popupType}
          title={popupType === 'ring' ? 'Category Breakdown' : 'Monthly Trends'}
        />
      )}
    </div>
  );
};

export default Cards;