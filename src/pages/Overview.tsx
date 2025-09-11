import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Wallet, 
  CreditCard, 
  Target, 
  Calendar, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Plus, 
  Building, 
  Smartphone, 
  PiggyBank,
  Receipt,
  PieChart,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { AnalyticsEngine } from '../utils/analytics-engine';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { 
    accounts, 
    transactions, 
    goals, 
    liabilities, 
    budgets,
    bills,
    stats 
  } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  
  const [showBalances, setShowBalances] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Initialize analytics engine
  const analyticsEngine = useMemo(() => {
    return new AnalyticsEngine(transactions, accounts, goals, bills, liabilities, budgets, []);
  }, [transactions, accounts, goals, bills, liabilities, budgets]);

  // Get date range for analytics
  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'week':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'quarter':
        return {
          start: startOfMonth(subMonths(now, 3)),
          end: endOfMonth(now)
        };
      case 'year':
        return {
          start: startOfMonth(subMonths(now, 12)),
          end: endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const { start: startDate, end: endDate } = getDateRange(selectedPeriod);

  // Get financial health score
  const financialHealth = useMemo(() => {
    return analyticsEngine.getFinancialHealthScore('USD');
  }, [analyticsEngine]);

  // Get comprehensive analytics data
  const analyticsData = useMemo(() => {
    return analyticsEngine.getDashboardSummary(startDate, endDate, 'USD');
  }, [analyticsEngine, startDate, endDate]);

  // Calculate comprehensive financial metrics
  const financialMetrics = useMemo(() => {
    const totalAssets = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.remaining_amount || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Monthly income and expenses
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const monthlyTransactions = transactions.filter(transaction => 
      isWithinInterval(new Date(transaction.date), { start: monthStart, end: monthEnd })
    );
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const monthlyNet = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlyNet / monthlyIncome) * 100 : 0;
    
    // Debt-to-income ratio
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalLiabilities / monthlyIncome) * 100 : 0;
    
    // Emergency fund (assuming 3 months of expenses)
    const emergencyFundTarget = monthlyExpenses * 3;
    const emergencyFundProgress = Math.min((totalAssets / emergencyFundTarget) * 100, 100);
    
    return {
      netWorth,
      totalAssets,
      totalLiabilities,
      monthlyIncome,
      monthlyExpenses,
      monthlyNet,
      savingsRate,
      debtToIncomeRatio,
      emergencyFundTarget,
      emergencyFundProgress
    };
  }, [accounts, liabilities, transactions]);

  // Get active goals with progress
  const activeGoals = useMemo(() => {
    return goals.filter(goal => !goal.is_archived).map(goal => ({
      ...goal,
      progress: Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100)
    }));
  }, [goals]);

  // Get upcoming bills
  const upcomingBills = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return bills.filter(bill => 
      new Date(bill.due_date) <= nextWeek && !bill.is_paid
    );
  }, [bills]);

  // Get overdue bills
  const overdueBills = useMemo(() => {
    const today = new Date();
    return bills.filter(bill => 
      new Date(bill.due_date) < today && !bill.is_paid
    );
  }, [bills]);

  // Get active budgets with progress
  const activeBudgets = useMemo(() => {
    return budgets.filter(budget => budget.is_active).map(budget => ({
      ...budget,
      progress: Math.min(((budget.spent_amount || 0) / budget.limit_amount) * 100, 100),
      isOverBudget: (budget.spent_amount || 0) > budget.limit_amount
    }));
  }, [budgets]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Financial health score (0-100)
  const financialHealthScore = useMemo(() => {
    let score = 0;
    
    // Net worth positive (20 points)
    if (financialMetrics.netWorth > 0) score += 20;
    
    // Savings rate (30 points)
    if (financialMetrics.savingsRate >= 20) score += 30;
    else if (financialMetrics.savingsRate >= 10) score += 20;
    else if (financialMetrics.savingsRate >= 0) score += 10;
    
    // Debt-to-income ratio (25 points)
    if (financialMetrics.debtToIncomeRatio <= 20) score += 25;
    else if (financialMetrics.debtToIncomeRatio <= 40) score += 15;
    else if (financialMetrics.debtToIncomeRatio <= 60) score += 10;
    
    // Emergency fund (25 points)
    if (financialMetrics.emergencyFundProgress >= 100) score += 25;
    else if (financialMetrics.emergencyFundProgress >= 50) score += 15;
    else if (financialMetrics.emergencyFundProgress >= 25) score += 10;
    
    return Math.min(score, 100);
  }, [financialMetrics]);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>Financial Overview</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/analytics')}
              className="px-4 py-2 rounded-xl transition-colors flex items-center space-x-2"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'white'
              }}
            >
              <BarChart3 size={16} />
              <span className="text-sm font-medium">Analytics</span>
            </button>
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center space-x-2 text-sm font-body hover:scale-105 transition-all duration-200"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{showBalances ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Financial Health Score Widget */}
        <div className="mb-6">
          <div className="card-neumorphic p-6 slide-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
                Financial Health Score
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                financialHealth.healthStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                financialHealth.healthStatus === 'good' ? 'bg-blue-100 text-blue-800' :
                financialHealth.healthStatus === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                financialHealth.healthStatus === 'poor' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {financialHealth.healthStatus.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <div className="text-4xl font-numbers mb-2" style={{ color: 'var(--text-primary)' }}>
                  {financialHealth.overallScore}
                </div>
                <div className="text-sm text-gray-500">Overall Score</div>
              </div>
              <div className="flex-1 ml-8">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      financialHealth.healthStatus === 'excellent' ? 'bg-green-500' :
                      financialHealth.healthStatus === 'good' ? 'bg-blue-500' :
                      financialHealth.healthStatus === 'fair' ? 'bg-yellow-500' :
                      financialHealth.healthStatus === 'poor' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${financialHealth.overallScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">0 - 100 Scale</div>
              </div>
            </div>

            {/* Health Components */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-numbers text-blue-600">{financialHealth.components.liquidity.score.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Liquidity</div>
                <div className="text-xs text-gray-500">{financialHealth.components.liquidity.ratio.toFixed(1)}x expenses</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-numbers text-red-600">{financialHealth.components.debtToIncome.score.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Debt-to-Income</div>
                <div className="text-xs text-gray-500">{(financialHealth.components.debtToIncome.ratio * 100).toFixed(1)}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-numbers text-green-600">{financialHealth.components.savingsRate.score.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Savings Rate</div>
                <div className="text-xs text-gray-500">{financialHealth.components.savingsRate.rate.toFixed(1)}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-numbers text-purple-600">{financialHealth.components.emergencyFund.score.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Emergency Fund</div>
                <div className="text-xs text-gray-500">{(financialHealth.components.emergencyFund.coverage * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-numbers text-yellow-600">{financialHealth.components.billPayment.score.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Bill Payment</div>
                <div className="text-xs text-gray-500">{(financialHealth.components.billPayment.rate * 100).toFixed(0)}%</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-numbers text-indigo-600">{financialHealth.components.goalProgress.score.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Goal Progress</div>
                <div className="text-xs text-gray-500">{(financialHealth.components.goalProgress.progress * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Recommendations */}
            {financialHealth.recommendations.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {financialHealth.recommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <span>{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Net Worth */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Wallet size={20} style={{ color: 'var(--primary)' }} />
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            </div>
            <h3 className="text-sm font-body mb-1" style={{ color: 'var(--text-secondary)' }}>Net Worth</h3>
            <p className="text-lg font-numbers" style={{ color: 'var(--text-primary)' }}>
              {showBalances ? formatCurrency(financialMetrics.netWorth) : '••••••'}
            </p>
          </div>

          {/* Monthly Net */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Activity size={20} style={{ color: 'var(--primary)' }} />
              {financialMetrics.monthlyNet >= 0 ? 
                <TrendingUp size={16} style={{ color: 'var(--success)' }} /> :
                <TrendingDown size={16} style={{ color: 'var(--error)' }} />
              }
            </div>
            <h3 className="text-sm font-body mb-1" style={{ color: 'var(--text-secondary)' }}>This Month</h3>
            <p className={`text-lg font-numbers ${financialMetrics.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {showBalances ? formatCurrency(financialMetrics.monthlyNet) : '••••••'}
            </p>
          </div>

          {/* Savings Rate */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <PiggyBank size={20} style={{ color: 'var(--primary)' }} />
              <Zap size={16} style={{ color: 'var(--success)' }} />
            </div>
            <h3 className="text-sm font-body mb-1" style={{ color: 'var(--text-secondary)' }}>Savings Rate</h3>
            <p className="text-lg font-numbers" style={{ color: 'var(--text-primary)' }}>
              {financialMetrics.savingsRate.toFixed(1)}%
            </p>
          </div>

          {/* Emergency Fund */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Shield size={20} style={{ color: 'var(--primary)' }} />
              <CheckCircle size={16} style={{ color: 'var(--success)' }} />
            </div>
            <h3 className="text-sm font-body mb-1" style={{ color: 'var(--text-secondary)' }}>Emergency Fund</h3>
            <p className="text-lg font-numbers" style={{ color: 'var(--text-primary)' }}>
              {financialMetrics.emergencyFundProgress.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Bills & Payments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Bills & Payments</h3>
            <button
              onClick={() => navigate('/bills')}
              className="text-sm font-body hover:scale-105 transition-all duration-200"
              style={{ color: 'var(--primary)' }}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {overdueBills.length > 0 && (
              <div 
                className="p-4 rounded-2xl border-l-4"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  borderLeftColor: 'var(--error)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle size={20} style={{ color: 'var(--error)' }} />
                  <div>
                    <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                      {overdueBills.length} Overdue Bill{overdueBills.length > 1 ? 's' : ''}
                    </h4>
                    <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                      Total: {formatCurrency(overdueBills.reduce((sum, bill) => sum + (bill.amount || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {upcomingBills.length > 0 ? (
              upcomingBills.slice(0, 3).map((bill) => (
                <div 
                  key={bill.id}
                  className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                  onClick={() => navigate(`/bills/${bill.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Receipt size={20} style={{ color: 'var(--primary)' }} />
                      <div>
                        <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                          {bill.name}
                        </h4>
                        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                          Due {format(new Date(bill.due_date), 'MMM dd')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-numbers" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(bill.amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div 
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <CheckCircle size={32} style={{ color: 'var(--success)' }} className="mx-auto mb-3" />
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  No upcoming bills
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Goals Progress */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Goals Progress</h3>
            <button
              onClick={() => navigate('/goals')}
              className="text-sm font-body hover:scale-105 transition-all duration-200"
              style={{ color: 'var(--primary)' }}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {activeGoals.length > 0 ? (
              activeGoals.slice(0, 3).map((goal) => (
                <div 
                  key={goal.id}
                  className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Target size={20} style={{ color: 'var(--primary)' }} />
                      <div>
                        <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                          {goal.description || 'Untitled Goal'}
                        </h4>
                        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                          {goal.progress.toFixed(0)}% complete
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-body px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                      {goal.progress.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: 'var(--primary)',
                        width: `${goal.progress}%`
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-body mt-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>{formatCurrency(goal.current_amount || 0)}</span>
                    <span>{formatCurrency(goal.target_amount || 0)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div 
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <Target size={32} style={{ color: 'var(--text-tertiary)' }} className="mx-auto mb-3" />
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  No active goals
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Budget Performance */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Budget Performance</h3>
            <button
              onClick={() => navigate('/budgets')}
              className="text-sm font-body hover:scale-105 transition-all duration-200"
              style={{ color: 'var(--primary)' }}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {activeBudgets.length > 0 ? (
              activeBudgets.slice(0, 3).map((budget) => (
                <div 
                  key={budget.id}
                  className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                  onClick={() => navigate(`/budgets/${budget.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <PieChart size={20} style={{ color: 'var(--primary)' }} />
                      <div>
                        <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                          {budget.name}
                        </h4>
                        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                          {budget.progress.toFixed(0)}% used
                        </p>
                      </div>
                    </div>
                    <span 
                      className="text-sm font-body px-2 py-1 rounded-full"
                      style={{ 
                        backgroundColor: budget.isOverBudget ? 'var(--error)' : 'var(--success)', 
                        color: 'white' 
                      }}
                    >
                      {budget.progress.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: budget.isOverBudget ? 'var(--error)' : 'var(--success)',
                        width: `${Math.min(budget.progress, 100)}%`
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-body mt-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>{formatCurrency(budget.spent_amount || 0)}</span>
                    <span>{formatCurrency(budget.limit_amount || 0)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div 
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <PieChart size={32} style={{ color: 'var(--text-tertiary)' }} className="mx-auto mb-3" />
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  No active budgets
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
