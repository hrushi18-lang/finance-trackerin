import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Eye, EyeOff, ArrowLeft, BarChart3, PieChart, TrendingUp, TrendingDown, DollarSign, Calendar, Clock } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountForm } from '../components/accounts/AccountForm';
import { GoalsVaultManager } from '../components/accounts/GoalsVaultManager';
import { TransferModal } from '../components/accounts/TransferModal';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { AnalyticsEngine } from '../utils/analytics-engine';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useEnhancedCurrency } from '../contexts/EnhancedCurrencyContext';
import { useNavigate } from 'react-router-dom';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';
import { CurrencySelector } from '../components/currency/CurrencySelector';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount,
    duplicateAccount,
    archiveAccount,
    restoreAccount,
    softDeleteAccount,
    toggleAccountVisibility,
    toggleAccountPin,
    transferBetweenAccounts,
    getAccountSummary,
    getAccountTransfers,
    getAccountAnalytics,
    transactions,
    goals,
    bills,
    liabilities,
    budgets,
    userCategories,
    isLoading,
    error 
  } = useFinance();
  const { formatCurrency } = useInternationalization();
  const { 
    displayCurrency, 
    setDisplayCurrency, 
    convertAmount, 
    formatCurrency: formatCurrencyEnhanced,
    getCurrencySymbol,
    supportedCurrencies 
  } = useEnhancedCurrency();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromAccount, setTransferFromAccount] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

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

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'lastMonth':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1))
        };
      case 'last3Months':
        return {
          start: startOfMonth(subMonths(now, 3)),
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

  // Get account analytics
  const accountAnalytics = useMemo(() => {
    if (selectedAccount === 'all') {
      return accounts.map(account => 
        analyticsEngine.getAccountAnalytics(account.id, startDate, endDate)
      ).filter(Boolean);
    } else {
      const analytics = analyticsEngine.getAccountAnalytics(selectedAccount, startDate, endDate);
      return analytics ? [analytics] : [];
    }
  }, [analyticsEngine, selectedAccount, startDate, endDate, accounts]);

  // Filter accounts based on search and visibility
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.platform?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by visibility
    if (!showHidden) {
      filtered = filtered.filter(account => account.is_visible !== false);
    }

    return filtered;
  }, [accounts, searchTerm, showHidden]);

  // Calculate total balance with currency conversion
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => {
      if (account.is_visible !== false) {
        const accountBalance = account.balance || 0;
        const accountCurrency = account.currency_code || 'USD';
        
        // Convert to display currency if different
        const convertedBalance = accountCurrency !== displayCurrency 
          ? (convertAmount(accountBalance, accountCurrency, displayCurrency) || accountBalance)
          : accountBalance;
        
        return account.type === 'credit_card' ? sum - convertedBalance : sum + convertedBalance;
      }
      return sum;
    }, 0);
  }, [accounts, displayCurrency, convertAmount]);

  const handleCreateAccount = async (data: any) => {
    try {
      await addAccount(data);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const handleUpdateAccount = async (data: any) => {
    if (!editingAccount) return;

    try {
      await updateAccount(editingAccount.id, data);
      setEditingAccount(null);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async (account: any) => {
    if (!confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAccount(account.id);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Cannot delete account with existing transactions');
    }
  };

  const handleToggleVisibility = async (account: any) => {
    try {
      await updateAccount(account.id, {
        is_visible: !account.is_visible
      });
    } catch (error) {
      console.error('Error updating account visibility:', error);
    }
  };

  // New handler functions for account actions
  const handleDuplicateAccount = async (account: any) => {
    try {
      await duplicateAccount(account.id);
    } catch (error) {
      console.error('Error duplicating account:', error);
    }
  };

  const handleTransfer = (account: any) => {
    setTransferFromAccount(account);
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (transferData: any) => {
    try {
      await transferBetweenAccounts({
        fromAccountId: transferData.fromAccountId,
        toAccountId: transferData.toAccountId,
        amount: transferData.amount,
        fromCurrency: transferData.fromCurrency,
        toCurrency: transferData.toCurrency,
        convertedAmount: transferData.convertedAmount,
        exchangeRate: transferData.exchangeRate,
        description: transferData.description,
        transferType: 'manual',
        status: 'completed',
        notes: transferData.notes
      });
      setShowTransferModal(false);
    } catch (error) {
      console.error('Error processing transfer:', error);
    }
  };

  const handleViewHistory = (account: any) => {
    // Navigate to transaction history filtered by account
    navigate(`/transactions?account=${account.id}`);
  };

  const handleViewAnalytics = (account: any) => {
    // Navigate to analytics page filtered by account
    navigate(`/analytics?account=${account.id}`);
  };

  const handleTogglePin = async (account: any) => {
    try {
      await toggleAccountPin(account.id);
    } catch (error) {
      console.error('Error updating account pin status:', error);
    }
  };

  const handleArchiveAccount = async (account: any) => {
    try {
      await archiveAccount(account.id);
    } catch (error) {
      console.error('Error archiving account:', error);
    }
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            Loading accounts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="relative">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div>
                <h1 className="text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                  Accounts
                </h1>
                <p className="text-sm font-body mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Manage your financial accounts
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Account</span>
            </Button>
          </div>

          {/* Total Balance Hero Card */}
          <div 
            className="relative overflow-hidden rounded-3xl p-8 mb-6"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #2d5016 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div className="text-center text-white">
              <p className="text-lg font-body mb-2 opacity-90">Total Net Worth</p>
              <p className="text-4xl font-serif font-bold mb-2">
                {formatCurrencyEnhanced(totalBalance, displayCurrency)}
              </p>
              <p className="text-sm font-medium opacity-90">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
          </div>
        </div>
      </div>

      {/* Account Analytics Section */}
      <div className="px-4 mb-6">
        <div className="card-neumorphic p-4 slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              Account Analytics
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-3 py-1 rounded-lg text-sm border border-gray-300 bg-white text-gray-900"
              >
                <option value="all">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 rounded-lg text-sm border border-gray-300 bg-white text-gray-900"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
              </select>
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
              {/* Account Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {accountAnalytics.slice(0, 4).map((analytics) => (
                  <div key={analytics.accountId} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {analytics.accountName}
                      </h3>
                      <span className="text-xs text-gray-500">{analytics.currency}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Balance</span>
                        <span className="font-numbers">{formatCurrency(analytics.balance)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Net Flow</span>
                        <span className={`font-numbers ${analytics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.netFlow >= 0 ? '+' : ''}{formatCurrency(analytics.netFlow)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Transactions</span>
                        <span className="font-numbers">{analytics.transactionCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Category Breakdown */}
              {accountAnalytics.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Spending by Category
                    </h3>
                    {accountAnalytics[0].categoryBreakdown.length > 0 ? (
                      <RingChart
                        data={accountAnalytics[0].categoryBreakdown.map((cat, index) => ({
                          label: cat.category,
                          value: cat.amount,
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

                  {/* Monthly Trend */}
                  <div>
                    <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Monthly Trend
                    </h3>
                    {accountAnalytics[0].monthlyTrend.length > 0 ? (
                      <BarChart
                        data={accountAnalytics[0].monthlyTrend.map(trend => ({
                          month: trend.month,
                          income: trend.income,
                          spending: trend.expenses
                        }))}
                        interactive={true}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No trend data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Largest Transactions */}
              {accountAnalytics.length > 0 && accountAnalytics[0].largestTransactions.length > 0 && (
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Largest Transactions
                  </h3>
                  <div className="space-y-2">
                    {accountAnalytics[0].largestTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-numbers">{formatCurrency(transaction.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {format(transaction.date, 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center space-x-2"
          >
            {showHidden ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showHidden ? 'Hide' : 'Show'} Hidden</span>
          </Button>
        </div>

        {/* Goals Vault Manager */}
        <GoalsVaultManager />

        {/* Accounts List */}
        <div className="space-y-4">
          {filteredAccounts.length === 0 ? (
            <div
              className="p-8 rounded-2xl text-center"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--background)' }}>
                <LuxuryCategoryIcon category="Primary Banking" size={24} variant="luxury" />
              </div>
              <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                {searchTerm ? 'No accounts found' : 'No accounts yet'}
              </h3>
              <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Add your first financial account to get started'
                }
              </p>
              {!searchTerm && (
                <Button
                  variant="primary"
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Add Account</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                  onDuplicate={handleDuplicateAccount}
                  onTransfer={handleTransfer}
                  onViewHistory={handleViewHistory}
                  onViewAnalytics={handleViewAnalytics}
                  onToggleVisibility={handleToggleVisibility}
                  onTogglePin={handleTogglePin}
                  onArchive={handleArchiveAccount}
                  showBalance={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Form Modal */}
      <AccountForm
        isOpen={showForm || !!editingAccount}
        onClose={() => {
          setShowForm(false);
          setEditingAccount(null);
        }}
        onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
        account={editingAccount}
        loading={false}
      />

      {/* Transfer Modal */}
      {transferFromAccount && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setTransferFromAccount(null);
          }}
          fromAccount={transferFromAccount}
          accounts={accounts}
          onTransfer={handleTransferSubmit}
        />
      )}
    </div>
  );
};

export default Accounts;
