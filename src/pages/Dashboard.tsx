import React, { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, CreditCard, Plus, Target, Receipt, Search, Bell, History, Repeat, User, Eye, EyeOff, ArrowLeftRight, Calculator, PieChart, Calendar, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/common/Modal';
import { GoalForm } from '../components/forms/GoalForm';
import { LiabilityForm } from '../components/forms/LiabilityForm';
import { RecurringTransactionForm } from '../components/forms/RecurringTransactionForm';
import { AccountForm } from '../components/forms/AccountForm';
import { TransferForm } from '../components/forms/TransferForm';
import { QuickActions } from '../components/common/QuickActions';
import { SearchAndFilter } from '../components/common/SearchAndFilter';
import { PageNavigation } from '../components/layout/PageNavigation';
import { CollapsibleHeader } from '../components/layout/CollapsibleHeader';
import { NotificationsPanel } from '../components/common/NotificationsPanel';
import { ProfileMenu } from '../components/common/ProfileMenu';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { Button } from '../components/common/Button';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, getDashboardComponents, shouldShowTutorial } = usePersonalization();
  const { 
    stats, 
    transactions, 
    accounts, 
    goals, 
    liabilities, 
    budgets,
    recurringTransactions,
    addGoal, 
    addLiability, 
    addTransaction, 
    addRecurringTransaction,
    addAccount,
    transferBetweenAccounts,
    loading, 
    getMonthlyTrends 
  } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const { t } = useTranslation();
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState(transactions);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddGoal = async (goal: any) => {
    try {
      setIsSubmitting(true);
      await addGoal(goal);
      setShowGoalModal(false);
    } catch (error) {
      console.error('Error adding goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLiability = async (liability: any, addAsIncome: boolean) => {
    try {
      setIsSubmitting(true);
      await addLiability(liability);
      if (addAsIncome && liability.type !== 'purchase') {
        await addTransaction({
          type: 'income',
          amount: liability.totalAmount,
          category: 'Loan',
          description: `Loan received: ${liability.name}`,
          date: new Date(),
        });
      }
      setShowLiabilityModal(false);
    } catch (error) {
      console.error('Error adding liability:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRecurringTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      await addRecurringTransaction(data);
      setShowRecurringModal(false);
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAccount = async (data: any) => {
    try {
      setIsSubmitting(true);
      await addAccount(data);
      setShowAccountModal(false);
    } catch (error) {
      console.error('Error adding account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (data: any) => {
    try {
      setIsSubmitting(true);
      await transferBetweenAccounts(data.fromAccountId, data.toAccountId, data.amount, data.description);
      setShowTransferModal(false);
    } catch (error) {
      console.error('Error transferring funds:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const netWorth = stats.totalIncome - stats.totalExpenses - stats.totalLiabilities;
  const financialHealthScore = Math.min(Math.max(((netWorth / 10000) * 100) + 500, 0), 1000);

  // Calculate total balance across all visible accounts
  const totalBalance = (accounts || [])
    .filter(account => account.isVisible)
    .reduce((sum, account) => sum + (Number(account.balance) || 0), 0);

  // Get upcoming bills (next 7 days)
  const upcomingBills = (recurringTransactions || [])
    .filter(rt => rt.isActive && rt.type === 'expense')
    .slice(0, 3);

  // Show welcome message for new users
  const isNewUser = !transactions || transactions.length === 0;
  const dashboardComponents = getDashboardComponents();
  const showTutorial = shouldShowTutorial('dashboard');

  // Get monthly trends for mini chart
  const monthlyTrends = getMonthlyTrends(3);
  const currentMonthNet = monthlyTrends[monthlyTrends.length - 1]?.net || 0;
  const previousMonthNet = monthlyTrends[monthlyTrends.length - 2]?.net || 0;
  const netChange = currentMonthNet - previousMonthNet;

  if (loading) {
    return (
      <div className="min-h-screen text-white pb-20 flex items-center justify-center bg-forest-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-500 mx-auto mb-4"></div>
          <p className="text-forest-300 font-body">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20 bg-forest-800">
      {/* Collapsible Header */}
      <CollapsibleHeader>
        <div className="px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-white">
                FinTrack
              </h1>
              <p className="text-xs sm:text-sm text-forest-300 font-body">
                {t('welcome_back', { userName: user?.name?.split(' ')[0] || 'User' })}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-xl hover:bg-forest-600/20 transition-colors"
              >
                <Search size={18} className="text-forest-300 sm:w-5 sm:h-5" />
              </button>
              
              <button 
                onClick={() => navigate('/transaction-history')}
                className="p-2 rounded-xl hover:bg-forest-600/20 transition-colors"
                title={t('history')}
              >
                <History size={18} className="text-forest-300 sm:w-5 sm:h-5" />
              </button>
              
              <button 
                onClick={() => setShowNotifications(true)}
                className="p-2 rounded-xl hover:bg-forest-600/20 transition-colors relative"
              >
                <Bell size={18} className="text-forest-300 sm:w-5 sm:h-5" />
                {isNewUser && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-forest-500 rounded-full"></span>
                )}
              </button>
              
              <button 
                onClick={() => setShowProfileMenu(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-forest-600 rounded-full flex items-center justify-center"
              >
                <span className="text-xs sm:text-sm font-numbers font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
            </div>
          </div>

          {/* Page Navigation */}
          <PageNavigation />
        </div>
      </CollapsibleHeader>
      
      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-32 sm:pt-36 px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Search */}
        {showSearch && (
          <SearchAndFilter
            onResults={setSearchResults}
            placeholder="Search transactions, goals, or categories..."
          />
        )}

        {/* Welcome Message for New Users */}
        {isNewUser && (
          <div className="bg-gradient-to-r from-forest-700/80 to-forest-600/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-forest-500/20">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-forest-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Wallet size={24} className="text-forest-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-white mb-2">
                  Welcome to your personalized FinTrack! 🌱
                </h3>
                <p className="text-forest-100 text-sm mb-4 font-body">
                  Your comprehensive financial management system is ready. Start by adding your accounts, 
                  setting up recurring transactions, and tracking your financial goals.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowAccountModal(true)}
                    className="bg-white text-forest-600 py-2 px-4 rounded-lg font-medium hover:bg-forest-50 transition-colors text-sm flex items-center justify-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Account
                  </button>
                  <button
                    onClick={() => navigate('/add-transaction')}
                    className="bg-forest-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-forest-700 transition-colors text-sm flex items-center justify-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Accounts Hub */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-forest-600/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-forest-600/20 rounded-lg">
                <Wallet size={20} className="text-forest-400" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-white">Financial Accounts</h3>
                <p className="text-sm text-forest-300 font-body">Manage all your payment methods</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
                title={showBalances ? "Hide balances" : "Show balances"}
              >
                {showBalances ? (
                  <EyeOff size={18} className="text-forest-400" />
                ) : (
                  <Eye size={18} className="text-forest-400" />
                )}
              </button>
              <button
                onClick={() => navigate('/accounts-hub')}
                className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
                title="Manage all accounts"
              >
                <ArrowLeftRight size={18} className="text-forest-400" />
              </button>
              <Button
                onClick={() => setShowAccountModal(true)}
                size="sm"
                className="bg-forest-600 hover:bg-forest-700"
              >
                <Plus size={16} className="mr-2" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Total Balance */}
          {showBalances && (accounts || []).length > 0 && (
            <div className="bg-forest-800/30 rounded-lg p-4 text-center mb-4">
              <p className="text-sm text-forest-300 mb-1 font-body">Total Balance</p>
              <p className="text-2xl font-numbers font-bold text-white">
                <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
                {totalBalance.toLocaleString()}
              </p>
              <p className="text-xs text-forest-400 font-body">
                {(accounts || []).filter(a => a.isVisible).length} visible accounts
              </p>
            </div>
          )}

          {/* Accounts Grid */}
          {(accounts || []).length === 0 ? (
            <div className="text-center py-8">
              <Wallet size={48} className="mx-auto text-forest-600 mb-4" />
              <h4 className="text-lg font-heading font-semibold text-white mb-2">No accounts added</h4>
              <p className="text-forest-300 mb-6 font-body">Add your first financial account to start tracking</p>
              <Button onClick={() => setShowAccountModal(true)}>
                <Plus size={18} className="mr-2" />
                Add First Account
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(accounts || []).slice(0, 4).map((account) => (
                <div key={account.id} className="bg-forest-800/20 rounded-xl p-3 border border-forest-600/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
                        <Wallet size={16} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-heading font-medium text-white text-sm">{account.name}</h4>
                        <p className="text-xs text-forest-400 font-body capitalize">{account.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {account.isVisible && showBalances && (
                      <p className="text-sm font-numbers font-bold text-white">
                        <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                        {account.balance.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            
            <button 
              onClick={() => navigate('/overview')}
              className="p-2 rounded-xl hover:bg-forest-600/20 transition-colors"
              title="Overview"
            >
              <BarChart3 size={18} className="text-forest-300 sm:w-5 sm:h-5" />
            </button>
              
              {(accounts || []).length > 4 && (
                <button
                  onClick={() => navigate('/accounts-hub')}
                  className="bg-forest-700/20 rounded-xl p-3 border border-forest-600/20 hover:bg-forest-600/20 transition-colors flex items-center justify-center"
                >
                  <span className="text-forest-300 font-body text-sm">View All ({(accounts || []).length})</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Account Actions */}
          {(accounts || []).length >= 2 && (
            <div className="mt-4 flex space-x-2">
              <Button
                onClick={() => setShowTransferModal(true)}
                size="sm"
                variant="outline"
                className="flex-1 border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
              >
                <ArrowLeftRight size={14} className="mr-2" />
                Transfer
              </Button>
            </div>
          )}
        </div>

        {/* Hero Financial Health Card */}
        <div className="bg-gradient-to-br from-forest-700/80 to-forest-600/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 relative overflow-hidden border border-forest-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-forest-600/20 to-forest-500/20"></div>
          <div className="relative z-10">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-forest-100 text-sm sm:text-base font-body font-medium">{t('dashboard.net_worth')}</span>
                {!isNewUser && (
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs sm:text-sm flex items-center font-body ${
                      netChange >= 0 ? 'text-success-400' : 'text-error-400'
                    }`}>
                      {netChange >= 0 ? (
                        <TrendingUp size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <TrendingUp size={12} className="mr-1 sm:w-3.5 sm:h-3.5 rotate-180" />
                      )}
                      {Math.abs(netChange).toFixed(1)} {t('dashboard.vs_last_month')}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-3xl sm:text-5xl font-numbers font-bold text-white mb-2">
                {formatCurrency(netWorth)}
              </p>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-forest-200 text-xs sm:text-sm font-body">{t('dashboard.health_score')}:</span>
                  <span className="text-white text-sm sm:text-base font-numbers font-semibold">
                    {Math.round(financialHealthScore)}/1000
                  </span>
                </div>
                <span className="text-forest-200 text-xs font-body">
                  {financialHealthScore >= 750 ? t('dashboard.excellent') : 
                   financialHealthScore >= 500 ? t('dashboard.good') : 
                   isNewUser ? t('dashboard.getting_started') : t('dashboard.needs_work')}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => navigate('/add-transaction')}
                className="flex-1 bg-white text-forest-600 py-2.5 sm:py-3 px-4 rounded-xl font-heading font-semibold hover:bg-forest-50 transition-colors text-sm sm:text-base flex items-center justify-center"
              >
                <Plus size={16} className="mr-2" />
                {t('quick_add')}
              </button>
              <button 
                onClick={() => navigate('/transaction-history')}
                className="flex-1 border border-forest-400/30 text-white py-2.5 sm:py-3 px-4 rounded-xl font-heading font-semibold hover:bg-forest-600/10 transition-colors text-sm sm:text-base flex items-center justify-center"
              >
                <History size={16} className="mr-2" />
                {t('history')}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-heading font-semibold text-white">{t('dashboard.financial_overview')}</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-forest-900/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-forest-600/20 hover:bg-forest-800/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-success-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-forest-400 font-body">{t('dashboard.this_month')}</span>
              </div>
              <p className="text-xs sm:text-sm text-forest-300 mb-1 font-body">{t('dashboard.income')}</p>
              <p className="text-base sm:text-xl font-numbers font-bold text-white">
                {formatCurrency(stats.monthlyIncome)}
              </p>
            </div>

            <div className="bg-forest-900/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-forest-600/20 hover:bg-forest-800/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-error-500/20 rounded-lg flex items-center justify-center">
                  <Receipt size={16} className="text-error-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-forest-400 font-body">{t('dashboard.this_month')}</span>
              </div>
              <p className="text-xs sm:text-sm text-forest-300 mb-1 font-body">{t('dashboard.expenses')}</p>
              <p className="text-base sm:text-xl font-numbers font-bold text-white">
                {formatCurrency(stats.monthlyExpenses)}
              </p>
            </div>

            <div className="bg-forest-900/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-forest-600/20 hover:bg-forest-800/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={16} className="text-warning-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-forest-400 font-body">{t('dashboard.total_debt')}</span>
              </div>
              <p className="text-xs sm:text-sm text-forest-300 mb-1 font-body">Liabilities</p>
              <p className="text-base sm:text-xl font-numbers font-bold text-white">
                {formatCurrency(stats.totalLiabilities)}
              </p>
            </div>

            <div className="bg-forest-900/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-forest-600/20 hover:bg-forest-800/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-forest-500/20 rounded-lg flex items-center justify-center">
                  <Target size={16} className="text-forest-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-forest-400 font-body">{t('dashboard.saved')}</span>
              </div>
              <p className="text-xs sm:text-sm text-forest-300 mb-1 font-body">{t('dashboard.goal_progress')}</p>
              <p className="text-base sm:text-xl font-numbers font-bold text-white">
                {formatCurrency(stats.totalSavings)}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <div className="bg-forest-900/20 backdrop-blur-md rounded-2xl p-4 border border-forest-600/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-white">Upcoming Bills</h3>
              <button 
                onClick={() => navigate('/recurring-transactions')}
                className="text-forest-400 text-sm font-body hover:text-forest-300"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-forest-800/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-warning-500/20 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-warning-400" />
                    </div>
                    <div>
                      <p className="font-body font-medium text-white text-sm">{bill.description}</p>
                      <p className="text-xs text-forest-400 font-body">{bill.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers font-semibold text-warning-400">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className="text-xs text-forest-400 font-body">Due soon</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-heading font-semibold text-white">{t('dashboard.quick_actions')}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/add-transaction')}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-forest-500/30 hover:border-forest-500/50 hover:bg-forest-600/5 transition-all duration-200 hover:scale-105"
            >
              <Plus size={20} className="text-forest-400 mb-2" />
              <span className="text-xs font-body font-medium text-forest-300 text-center">Add Transaction</span>
            </button>
            
            <button
              onClick={() => navigate('/analytics')}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-success-500/30 hover:border-success-500/50 hover:bg-success-500/5 transition-all duration-200 hover:scale-105"
            >
              <BarChart3 size={20} className="text-success-400 mb-2" />
              <span className="text-xs font-body font-medium text-forest-300 text-center">View Analytics</span>
            </button>
            
            <button
              onClick={() => setShowGoalModal(true)}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-warning-500/30 hover:border-warning-500/50 hover:bg-warning-500/5 transition-all duration-200 hover:scale-105"
            >
              <Target size={20} className="text-warning-400 mb-2" />
              <span className="text-xs font-body font-medium text-forest-300 text-center">Set Goal</span>
            </button>
            
            <button
              onClick={() => setShowRecurringModal(true)}
              className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-forest-500/30 hover:border-forest-500/50 hover:bg-forest-500/5 transition-all duration-200 hover:scale-105"
            >
              <Repeat size={20} className="text-forest-400 mb-2" />
              <span className="text-xs font-body font-medium text-forest-300 text-center">Recurring</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        {transactions && transactions.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-heading font-semibold text-white">{t('dashboard.recent_activity')}</h3>
              <button 
                onClick={() => navigate('/transaction-history')}
                className="text-forest-400 text-xs sm:text-sm font-body font-medium hover:text-forest-300"
              >
                {t('dashboard.view_all')}
              </button>
            </div>
            
            <div className="space-y-3">
              {(showSearch ? searchResults : transactions).slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-forest-900/20 backdrop-blur-md rounded-xl hover:bg-forest-800/30 transition-colors border border-forest-600/20"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income' 
                        ? 'bg-success-500/20' 
                        : 'bg-error-500/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp size={14} className="text-success-400 sm:w-4 sm:h-4" />
                      ) : (
                        <Receipt size={14} className="text-error-400 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-body font-medium text-white text-sm sm:text-base">
                        {transaction.description}
                      </p>
                      <p className="text-xs sm:text-sm text-forest-400 font-body">
                        {transaction.category} • {transaction.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-numbers font-semibold text-sm sm:text-base ${
                      transaction.type === 'income' 
                        ? 'text-success-400' 
                        : 'text-error-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Health Overview */}
        {(budgets || []).length > 0 && (
          <div className="bg-forest-900/20 backdrop-blur-md rounded-2xl p-4 border border-forest-600/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-white">Budget Health</h3>
              <button 
                onClick={() => navigate('/budgets')}
                className="text-forest-400 text-sm font-body hover:text-forest-300"
              >
                Manage
              </button>
            </div>
            
            <div className="space-y-3">
              {(budgets || []).slice(0, 3).map((budget) => {
                const utilization = (budget.spent / budget.amount) * 100;
                return (
                  <div key={budget.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-body text-white">{budget.category}</span>
                        <span className="text-xs font-numbers text-forest-400">
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-forest-700/30 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            utilization >= 100 ? 'bg-error-500' :
                            utilization >= 80 ? 'bg-warning-500' : 'bg-success-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Create New Goal"
      >
        <GoalForm
          onSubmit={handleAddGoal}
          onCancel={() => setShowGoalModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showLiabilityModal}
        onClose={() => setShowLiabilityModal(false)}
        title="Add New Liability"
      >
        <LiabilityForm
          onSubmit={handleAddLiability}
          onCancel={() => setShowLiabilityModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        title="Create Recurring Transaction"
      >
        <RecurringTransactionForm
          onSubmit={handleAddRecurringTransaction}
          onCancel={() => setShowRecurringModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Add Financial Account"
      >
        <AccountForm
          onSubmit={handleAddAccount}
          onCancel={() => setShowAccountModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Between Accounts"
      >
        <TransferForm
          accounts={accounts || []}
          onSubmit={handleTransfer}
          onCancel={() => setShowTransferModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      {/* Profile Menu */}
      <ProfileMenu 
        isOpen={showProfileMenu} 
        onClose={() => setShowProfileMenu(false)}
        onOpenNotifications={() => {
          setShowNotifications(true);
          setShowProfileMenu(false);
        }}
      />
    </div>
  );
};