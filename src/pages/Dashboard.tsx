import React, { useState, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { AccountCard } from '../components/accounts/AccountCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AccountForm } from '../components/accounts/AccountForm';
import { RingChart } from '../components/analytics/RingChart';
import { AnalyticsEngine } from '../utils/analytics-engine';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CreditCard, 
  FileText,
  Settings,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { useInternationalization } from '../contexts/InternationalizationContext';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';

const Dashboard: React.FC = () => {
  const { formatCurrency } = useInternationalization();
  
  const { 
    accounts, 
    transactions, 
    goals, 
    liabilities, 
    bills,
    budgets,
    userCategories,
    addAccount
  } = useFinance();
  
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  // Initialize analytics engine
  const analyticsEngine = useMemo(() => {
    // Filter out enhanced liabilities to match the expected type
    const standardLiabilities = liabilities.filter(l => 
      'type' in l && 'due_date' in l && 
      typeof l.type === 'string' && 
      ['loan', 'credit_card', 'mortgage', 'purchase', 'other'].includes(l.type)
    ) as any[];
    return new AnalyticsEngine(
      transactions,
      accounts,
      goals,
      bills,
      standardLiabilities,
      budgets,
      userCategories
    );
  }, [transactions, accounts, goals, bills, liabilities, budgets, userCategories]);

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'lastMonth':
        return {
          start: startOfMonth(subDays(now, 30)),
          end: endOfMonth(subDays(now, 30))
        };
      case 'last3Months':
        return {
          start: startOfMonth(subDays(now, 90)),
          end: endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Get comprehensive dashboard data
  const dashboardData = useMemo(() => {
    return analyticsEngine.getDashboardSummary(startDate, endDate, 'USD');
  }, [analyticsEngine, startDate, endDate]);


  // Calculate financial metrics
  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalIncome = dashboardData.totalIncome;
  const totalExpenses = dashboardData.totalExpenses;
  const netWorth = totalBalance - liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
  
  const activeGoals = goals.filter(g => !(g as any).is_archived);

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setShowAccountForm(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setShowAccountForm(true);
  };

  const handleAccountSubmit = async (data: any) => {
    try {
      await addAccount(data);
      setShowAccountForm(false);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleQuickAction = (action: string) => {
    setShowQuickActions(false);
    // Navigate to appropriate page or open modal
    switch (action) {
      case 'add-transaction':
        // Navigate to add transaction page
        break;
      case 'add-goal':
        // Navigate to add goal page
        break;
      case 'add-budget':
        // Navigate to add budget page
        break;
      case 'add-bill':
        // Navigate to add bill page
        break;
    }
  };


  return (
    <div className="min-h-screen pb-20 mobile-container" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile-optimized Header */}
      <div className="mobile-header">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="mobile-text-display font-heading truncate" style={{ color: 'var(--text-primary)' }}>
              Welcome back!
            </h1>
            <p className="mobile-text-small font-body truncate" style={{ color: 'var(--text-secondary)' }}>
              {format(new Date(), 'EEEE, MMM do')}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button className="mobile-touch-target p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <button className="mobile-touch-target p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* Mobile-optimized Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="mobile-card">
            <div className="flex items-center justify-between mb-2">
              <span className="mobile-text-small font-body" style={{ color: 'var(--text-secondary)' }}>Net Worth</span>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            </div>
            <p className="mobile-text-large font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency ? formatCurrency(netWorth) : `$${netWorth.toLocaleString()}`}
            </p>
          </div>
          <div className="mobile-card">
            <div className="flex items-center justify-between mb-2">
              <span className="mobile-text-small font-body" style={{ color: 'var(--text-secondary)' }}>This Month</span>
              <TrendingDown size={16} style={{ color: 'var(--error)' }} />
            </div>
            <p className="mobile-text-large font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency ? formatCurrency(totalIncome - totalExpenses) : `$${(totalIncome - totalExpenses).toLocaleString()}`}
            </p>
          </div>
        </div>
            </div>

      {/* Mobile-optimized Quick Actions */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="mobile-text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowQuickActions(true)}
            icon={<Plus size={16} />}
            className="mobile-button"
          >
            Add
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button 
            onClick={() => handleQuickAction('add-transaction')}
            className="mobile-touch-target p-3 rounded-xl text-center hover:scale-105 transition-transform mobile-card"
          >
            <div className="text-xl mb-1">💸</div>
            <p className="mobile-text-small font-body" style={{ color: 'var(--text-secondary)' }}>Transaction</p>
          </button>
          <button
            onClick={() => handleQuickAction('add-goal')}
            className="mobile-touch-target p-3 rounded-xl text-center hover:scale-105 transition-transform mobile-card"
          >
            <div className="text-xl mb-1">🎯</div>
            <p className="mobile-text-small font-body" style={{ color: 'var(--text-secondary)' }}>Goal</p>
          </button>
          <button
            onClick={() => handleQuickAction('add-budget')}
            className="mobile-touch-target p-3 rounded-xl text-center hover:scale-105 transition-transform mobile-card"
          >
            <div className="text-xl mb-1">📊</div>
            <p className="mobile-text-small font-body" style={{ color: 'var(--text-secondary)' }}>Budget</p>
          </button>
          <button
            onClick={() => handleQuickAction('add-bill')}
            className="mobile-touch-target p-3 rounded-xl text-center hover:scale-105 transition-transform mobile-card"
          >
            <div className="text-xl mb-1">📄</div>
            <p className="mobile-text-small font-body" style={{ color: 'var(--text-secondary)' }}>Bill</p>
          </button>
        </div>
      </div>

      {/* Mobile-optimized Current Balance & Net Worth Widget */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Current Balance */}
          <div className="mobile-card mobile-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="mobile-text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
                Current Balance
              </h2>
              <Wallet size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="text-center">
              <div className="mobile-text-hero font-numbers mb-2" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency ? formatCurrency(totalBalance) : `$${totalBalance.toLocaleString()}`}
              </div>
              <div className="mobile-text-small text-gray-500">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Net Worth */}
          <div className="mobile-card mobile-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="mobile-text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
                Net Worth
              </h2>
              <TrendingUp size={20} style={{ color: 'var(--success)' }} />
            </div>
            <div className="text-center">
              <div className="mobile-text-hero font-numbers mb-2" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency ? formatCurrency(netWorth) : `$${netWorth.toLocaleString()}`}
              </div>
              <div className="mobile-text-small text-gray-500">Assets - Liabilities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Analytics Widgets */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="mobile-text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Analytics</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="mobile-input px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-900"
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last3Months">Last 3 Months</option>
          </select>
        </div>

        {/* Mobile-optimized Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="mobile-card">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mobile-text-small font-body text-gray-500">Income</p>
                <p className="mobile-text-medium font-numbers font-bold truncate">
                  {formatCurrency ? formatCurrency(dashboardData.totalIncome) : `$${dashboardData.totalIncome.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown size={16} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mobile-text-small font-body text-gray-500">Expenses</p>
                <p className="mobile-text-medium font-numbers font-bold truncate">
                  {formatCurrency ? formatCurrency(dashboardData.totalExpenses) : `$${dashboardData.totalExpenses.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <PiggyBank size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mobile-text-small font-body text-gray-500">Savings Rate</p>
                <p className="mobile-text-medium font-numbers font-bold">{dashboardData.savingsRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="mobile-card">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart3 size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mobile-text-small font-body text-gray-500">Transactions</p>
                <p className="mobile-text-medium font-numbers font-bold">{dashboardData.transactionCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Spending Breakdown Pie Chart */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
              Spending by Category
            </h3>
            {dashboardData.categoryBreakdown.length > 0 ? (
              <RingChart
                data={dashboardData.categoryBreakdown.map((category, index) => ({
                  label: category.category,
                  value: category.totalAmount,
                  color: `hsl(${120 + index * 30}, 60%, 50%)`
                }))}
                size={180}
                strokeWidth={15}
                interactive={true}
              />
            ) : (
              <div className="text-center py-8">
                <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No spending data for this period</p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
              Recent Transactions
            </h3>
            <div className="space-y-3">
              {dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight size={16} className="text-green-600" />
                        ) : (
                          <ArrowDownRight size={16} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-numbers ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Bills & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Bills */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="text-lg font-heading mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
              <Clock size={20} className="mr-2 text-orange-500" />
              Upcoming Bills
            </h3>
            <div className="space-y-3">
              {dashboardData.upcomingBills.length > 0 ? (
                dashboardData.upcomingBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {bill.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-numbers font-bold">${bill.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{bill.currencyCode || 'USD'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming bills</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <h3 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CreditCard size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Total Accounts
                  </span>
                </div>
                <span className="text-lg font-numbers font-bold">{dashboardData.totalAccounts}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Target size={16} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Active Goals
                  </span>
                </div>
                <span className="text-lg font-numbers font-bold">{dashboardData.activeGoals}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <BarChart3 size={16} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Budgets
                  </span>
                </div>
                <span className="text-lg font-numbers font-bold">{dashboardData.totalBudgets}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-orange-600" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Net Worth
                  </span>
                </div>
                <span className="text-lg font-numbers font-bold">${netWorth.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Your Accounts</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddAccount}
            icon={<Plus size={16} />}
          >
            Add Account
          </Button>
        </div>
        {accounts.length === 0 ? (
          <div
            className="p-8 rounded-2xl text-center"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
              No accounts yet
            </h3>
            <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
              Add your first account to start tracking your finances
            </p>
            <Button variant="primary" onClick={handleAddAccount}>
              Add Your First Account
            </Button>
              </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts.map((account: any) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEditAccount}
              />
            ))}
                      </div>
                      )}
                    </div>
                    
      {/* Goals Section */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Your Goals</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction('add-goal')}
            icon={<Plus size={16} />}
          >
            Add Goal
          </Button>
        </div>
        {activeGoals.length === 0 ? (
          <div
            className="p-6 rounded-2xl text-center"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-base font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              No goals set
            </h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Set your first financial goal to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                    {goal.description || 'Untitled Goal'}
                  </h3>
                  <span className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100)}%
                </span>
              </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--primary)',
                      width: `${Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  <span>${(goal.currentAmount || 0).toLocaleString()}</span>
                  <span>${(goal.targetAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickAction('add-transaction')}
            icon={<Plus size={16} />}
          >
            Add Transaction
          </Button>
        </div>
        {recentTransactions.length === 0 ? (
          <div
            className="p-6 rounded-2xl text-center"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="text-3xl mb-3">💸</div>
            <h3 className="text-base font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              No transactions yet
            </h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Add your first transaction to start tracking
            </p>
            </div>
        ) : (
            <div className="space-y-3">
            {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                className="p-4 rounded-2xl flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
                >
                  <div className="flex items-center space-x-3">
                    <LuxuryCategoryIcon 
                      category={transaction.category} 
                      size={16} 
                      variant="luxury"
                    />
                    <div>
                    <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                        {transaction.description}
                    </h3>
                    <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-numbers text-sm font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${(transaction.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    {transaction.category}
                  </p>
            </div>
          </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AccountForm
        isOpen={showAccountForm}
        onClose={() => setShowAccountForm(false)}
        onSubmit={handleAccountSubmit}
        account={selectedAccount}
        loading={false}
      />

      <Modal
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="Quick Actions"
      >
        <div className="space-y-3">
          <button
            onClick={() => handleQuickAction('add-transaction')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Plus size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Transaction
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Record income or expense
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('add-goal')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Target size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Goal
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Set a financial target
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('add-budget')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <CreditCard size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Budget
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Set spending limits
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('add-bill')}
            className="w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <FileText size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                  Add Bill
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  Track recurring payments
                </p>
              </div>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
