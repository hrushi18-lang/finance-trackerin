import React, { useState, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { TransactionList } from '../components/transactions/TransactionList';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { FinancialHealthCard } from '../components/analytics/FinancialHealthCard';
import { TrendAnalysis } from '../components/analytics/TrendAnalysis';
import { PredictiveAnalytics } from '../components/analytics/PredictiveAnalytics';
import { AnalyticsEngine } from '../utils/analytics-engine';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeftRight,
  Filter,
  Download,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

const Transactions: React.FC = () => {
  const { transactions, accounts, isLoading, error, goals, bills, liabilities, budgets, userCategories } = useFinance();
  const navigate = useNavigate();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  
  // Analytics state
  const [financialHealth, setFinancialHealth] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initialize analytics engine
  const analyticsEngine = useMemo(() => {
    return new AnalyticsEngine(
      transactions,
      accounts,
      goals,
      bills,
      liabilities,
      budgets,
      userCategories
    );
  }, [transactions, accounts, goals, bills, liabilities, budgets, userCategories]);

  // Load analytics data
  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      // Simulate analytics loading (replace with actual analytics engine calls)
      const mockFinancialHealth = {
        netWorth: 25000,
        totalAssets: 50000,
        totalLiabilities: 25000,
        totalIncome: 8000,
        totalExpenses: 5000,
        savingsRate: 37.5,
        debtToIncomeRatio: 0.31,
        creditUtilization: 25.0,
        emergencyFundMonths: 6.0,
        investmentRatio: 15.0,
        overallHealthScore: 85,
        healthGrade: 'A-',
        riskLevel: 'low',
        recommendations: [
          'Continue your excellent savings rate',
          'Consider increasing investment allocation',
          'Maintain current debt management strategy'
        ]
      };

      const mockTrendData = {
        income: [
          { period: 'Jan', value: 7500, change: 0, changePercent: 0, trend: 'stable' },
          { period: 'Feb', value: 8000, change: 500, changePercent: 6.7, trend: 'up' },
          { period: 'Mar', value: 8200, change: 200, changePercent: 2.5, trend: 'up' }
        ],
        expenses: [
          { period: 'Jan', value: 4800, change: 0, changePercent: 0, trend: 'stable' },
          { period: 'Feb', value: 5200, change: 400, changePercent: 8.3, trend: 'up' },
          { period: 'Mar', value: 5000, change: -200, changePercent: 3.8, trend: 'down' }
        ],
        savings: [
          { period: 'Jan', value: 2700, change: 0, changePercent: 0, trend: 'stable' },
          { period: 'Feb', value: 2800, change: 100, changePercent: 3.7, trend: 'up' },
          { period: 'Mar', value: 3200, change: 400, changePercent: 14.3, trend: 'up' }
        ]
      };

      const mockPredictions = {
        income: [
          { period: 'Apr 2024', predicted: 8500, confidence: 85, trend: 'increasing', factors: ['Salary increase', 'Bonus season'] },
          { period: 'May 2024', predicted: 8200, confidence: 80, trend: 'stable', factors: ['Regular salary', 'No bonuses'] },
          { period: 'Jun 2024', predicted: 8300, confidence: 75, trend: 'increasing', factors: ['Performance review', 'Market trends'] }
        ],
        expenses: [
          { period: 'Apr 2024', predicted: 5100, confidence: 80, trend: 'increasing', factors: ['Seasonal spending', 'Inflation impact'] },
          { period: 'May 2024', predicted: 4900, confidence: 85, trend: 'decreasing', factors: ['Budget optimization', 'Reduced dining out'] },
          { period: 'Jun 2024', predicted: 5000, confidence: 75, trend: 'stable', factors: ['Summer activities', 'Vacation planning'] }
        ]
      };

      setFinancialHealth(mockFinancialHealth);
      setTrendData(mockTrendData);
      setPredictions(mockPredictions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth;
    });

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;
    
    const totalTransfers = currentMonthTransactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      totalTransfers,
      transactionCount: currentMonthTransactions.length
    };
  }, [transactions]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category))];
    return uniqueCategories.sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by account
    if (selectedAccount) {
      filtered = filtered.filter(t => 
        t.account_id === selectedAccount || t.target_account_id === selectedAccount
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by date range
    if (selectedDateRange) {
      const now = new Date();
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        switch (selectedDateRange) {
          case 'today':
            return format(transactionDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return format(transactionDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
          case 'this_week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return transactionDate >= startOfWeek;
          case 'this_month':
            return transactionDate >= startOfMonth(now) && transactionDate <= endOfMonth(now);
          case 'last_month':
            const lastMonth = subMonths(now, 1);
            return transactionDate >= startOfMonth(lastMonth) && transactionDate <= endOfMonth(lastMonth);
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, selectedAccount, selectedType, selectedCategory, selectedDateRange, searchTerm]);

  const handleExportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Account', 'Notes'],
      ...filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.description,
        t.category,
        t.type,
        t.amount.toString(),
        accounts.find(a => a.id === t.account_id)?.name || 'Unknown',
        t.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedAccount('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedDateRange('this_month');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
          <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error.message}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
            <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>Transactions</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportTransactions}
              icon={<Download size={16} />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTransactionForm(true)}
              icon={<Plus size={16} />}
            >
              Add
            </Button>
        </div>
      </div>

      {/* Transaction Analytics Section */}
      <div className="px-4 mb-6">
        <div className="card-neumorphic p-4 slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              Transaction Analytics
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDetailedView(!showDetailedView)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={showDetailedView ? 'Hide Detailed View' : 'Show Detailed View'}
              >
                {showDetailedView ? <EyeOff size={16} className="text-gray-600" /> : <Eye size={16} className="text-gray-600" />}
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              >
                <BarChart3 size={16} className={showAnalytics ? 'text-blue-600' : 'text-gray-600'} />
              </button>
            </div>
          </div>

          {showAnalytics && (
            <div className="space-y-6">
              {/* Transaction Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-green-800">Total Income</h3>
                    <TrendingUp size={16} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-numbers text-green-900">${financialMetrics.totalIncome.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-red-800">Total Expenses</h3>
                    <TrendingDown size={16} className="text-red-600" />
                  </div>
                  <p className="text-2xl font-numbers text-red-900">${financialMetrics.totalExpenses.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-blue-800">Net Income</h3>
                    <DollarSign size={16} className="text-blue-600" />
                  </div>
                  <p className={`text-2xl font-numbers ${financialMetrics.netIncome >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                    ${financialMetrics.netIncome.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-purple-800">Transactions</h3>
                    <ArrowLeftRight size={16} className="text-purple-600" />
                  </div>
                  <p className="text-2xl font-numbers text-purple-900">{filteredTransactions.length}</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Spending by Category
                  </h3>
                  {(() => {
                    const categoryData = filteredTransactions
                      .filter(t => t.type === 'expense')
                      .reduce((acc, t) => {
                        acc[t.category] = (acc[t.category] || 0) + t.amount;
                        return acc;
                      }, {} as Record<string, number>);

                    const chartData = Object.entries(categoryData).map(([category, amount], index) => ({
                      label: category,
                      value: amount,
                      color: `hsl(${120 + index * 30}, 60%, 50%)`
                    }));

                    return chartData.length > 0 ? (
                      <RingChart
                        data={chartData}
                        size={180}
                        strokeWidth={15}
                        interactive={true}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No spending data for this period</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Monthly Trends */}
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Monthly Trends
                  </h3>
                  {(() => {
                    const monthlyData = filteredTransactions.reduce((acc, t) => {
                      const month = format(new Date(t.date), 'MMM yyyy');
                      if (!acc[month]) {
                        acc[month] = { income: 0, expenses: 0 };
                      }
                      if (t.type === 'income') {
                        acc[month].income += t.amount;
                      } else {
                        acc[month].expenses += t.amount;
                      }
                      return acc;
                    }, {} as Record<string, { income: number; expenses: number }>);

                    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
                      month,
                      income: data.income,
                      spending: data.expenses
                    }));

                    return chartData.length > 0 ? (
                      <BarChart
                        data={chartData}
                        interactive={true}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No trend data available</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Account Breakdown */}
              {showDetailedView && (
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Transactions by Account
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((account) => {
                      const accountTransactions = filteredTransactions.filter(t => 
                        t.account_id === account.id || t.target_account_id === account.id
                      );
                      const accountIncome = accountTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);
                      const accountExpenses = accountTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);

                      return (
                        <div key={account.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {account.name}
                            </h4>
                            <span className="text-xs text-gray-500">{accountTransactions.length} txns</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span style={{ color: 'var(--text-secondary)' }}>Income</span>
                              <span className="font-numbers text-green-600">+${accountIncome.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span style={{ color: 'var(--text-secondary)' }}>Expenses</span>
                              <span className="font-numbers text-red-600">-${accountExpenses.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span style={{ color: 'var(--text-secondary)' }}>Net</span>
                              <span className={`font-numbers ${accountIncome - accountExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {accountIncome - accountExpenses >= 0 ? '+' : ''}${(accountIncome - accountExpenses).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Large Transactions */}
              {showDetailedView && (
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Recent Large Transactions
                  </h3>
                  <div className="space-y-2">
                    {filteredTransactions
                      .filter(t => Math.abs(t.amount) >= 100)
                      .slice(0, 5)
                      .map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500">{transaction.category} • {accounts.find(a => a.id === transaction.account_id)?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-numbers ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(transaction.date, 'MMM dd')}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Enhanced Analytics Components */}
              {financialHealth && (
                <div className="mb-8">
                  <FinancialHealthCard 
                    metrics={financialHealth} 
                    formatCurrency={(amount: number) => `$${amount.toFixed(2)}`} 
                  />
                </div>
              )}

              {/* Trend Analysis */}
              {trendData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <TrendAnalysis
                    title="Income Trends"
                    data={trendData.income}
                    formatCurrency={(amount: number) => `$${amount.toFixed(2)}`}
                    icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                  />
                  <TrendAnalysis
                    title="Expense Trends"
                    data={trendData.expenses}
                    formatCurrency={(amount: number) => `$${amount.toFixed(2)}`}
                    icon={<TrendingDown className="w-5 h-5 text-red-400" />}
                  />
                  <TrendAnalysis
                    title="Savings Trends"
                    data={trendData.savings}
                    formatCurrency={(amount: number) => `$${amount.toFixed(2)}`}
                    icon={<Target className="w-5 h-5 text-blue-400" />}
                  />
                </div>
              )}

              {/* Predictive Analytics */}
              {predictions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <PredictiveAnalytics
                    title="Income Forecast"
                    predictions={predictions.income}
                    formatCurrency={(amount: number) => `$${amount.toFixed(2)}`}
                    icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
                  />
                  <PredictiveAnalytics
                    title="Expense Forecast"
                    predictions={predictions.expenses}
                    formatCurrency={(amount: number) => `$${amount.toFixed(2)}`}
                    icon={<TrendingDown className="w-6 h-6 text-orange-400" />}
                  />
                </div>
              )}

              {/* Load Analytics Button */}
              <div className="text-center">
                <button
                  onClick={loadAnalytics}
                  disabled={isLoadingAnalytics}
                  className="px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white'
                  }}
                >
                  {isLoadingAnalytics ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Loading Analytics...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 size={20} />
                      <span>Load Advanced Analytics</span>
                    </>
                  )}
                </button>
                {lastUpdated && (
                  <p className="text-sm text-gray-400 mt-2">
                    Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Financial Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Income</span>
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <p className="text-lg font-numbers font-bold text-green-600">
              ${(financialMetrics.totalIncome || 0).toLocaleString()}
            </p>
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Expenses</span>
              <TrendingDown size={16} className="text-red-600" />
            </div>
            <p className="text-lg font-numbers font-bold text-red-600">
              ${(financialMetrics.totalExpenses || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              />
              <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter size={16} />}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Card */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-heading text-white">Advanced Analytics</h3>
                <p className="text-sm text-gray-300">Get deeper insights into your financial health</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'white'
              }}
            >
              <BarChart3 size={16} />
              <span>View Analytics</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">85</div>
              <div className="text-xs text-gray-400">Health Score</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">37.5%</div>
              <div className="text-xs text-gray-400">Savings Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">6.0</div>
              <div className="text-xs text-gray-400">Emergency Fund</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">25%</div>
              <div className="text-xs text-gray-400">Credit Usage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4">
        <TransactionList
          transactions={filteredTransactions}
          accounts={accounts}
          onEditTransaction={(transaction) => {
            setSelectedTransaction(transaction);
            setShowTransactionForm(true);
          }}
          onDeleteTransaction={async (transaction) => {
            if (window.confirm('Are you sure you want to delete this transaction?')) {
              try {
                await deleteTransaction(transaction.id);
              } catch (error) {
                console.error('Error deleting transaction:', error);
              }
            }
          }}
        />
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default Transactions;
