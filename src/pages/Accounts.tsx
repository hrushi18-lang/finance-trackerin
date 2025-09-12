import React, { useState, useMemo } from 'react';
import { Plus, Search, Eye, EyeOff, ArrowLeft, BarChart3, Shield, CreditCard } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountForm } from '../components/accounts/AccountForm';
import { GoalsVaultManager } from '../components/accounts/GoalsVaultManager';
import { TransferModal } from '../components/accounts/TransferModal';
// import { RingChart } from '../components/analytics/RingChart'; // Unused import
// import { BarChart } from '../components/analytics/BarChart'; // Unused import
import { AnalyticsEngine } from '../utils/analytics-engine';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useEnhancedCurrency } from '../contexts/EnhancedCurrencyContext';
import { useNavigate } from 'react-router-dom';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';
// import { CurrencySelector } from '../components/currency/CurrencySelector'; // Unused import
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
    // restoreAccount, // Unused
    // softDeleteAccount, // Unused
    // toggleAccountVisibility, // Unused
    toggleAccountPin,
    transferBetweenAccounts,
    // getAccountSummary, // Unused
    // getAccountTransfers, // Unused
    // getAccountAnalytics, // Unused
    transactions,
    goals,
    bills,
    liabilities,
    budgets,
    userCategories,
    isLoading,
    // error // Unused
  } = useFinance();
  const { formatCurrency } = useInternationalization();
  const { 
    displayCurrency, 
    // setDisplayCurrency, // Unused
    convertAmount, 
    formatCurrency: formatCurrencyEnhanced,
    // getCurrencySymbol, // Unused
    // supportedCurrencies // Unused
  } = useEnhancedCurrency();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Record<string, unknown> | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromAccount, setTransferFromAccount] = useState<Record<string, unknown> | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [activeTab, setActiveTab] = useState<'accounts' | 'cards'>('accounts');

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

  const handleCreateAccount = async (data: Record<string, unknown>) => {
    try {
      await addAccount(data);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const handleUpdateAccount = async (data: Record<string, unknown>) => {
    if (!editingAccount) return;

    try {
      await updateAccount(editingAccount.id, data);
      setEditingAccount(null);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async (account: Record<string, unknown>) => {
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

  const handleToggleVisibility = async (account: Record<string, unknown>) => {
    try {
      await updateAccount(account.id, {
        is_visible: !account.is_visible
      });
    } catch (error) {
      console.error('Error updating account visibility:', error);
    }
  };

  // New handler functions for account actions
  const handleDuplicateAccount = async (account: Record<string, unknown>) => {
    try {
      await duplicateAccount(account.id);
    } catch (error) {
      console.error('Error duplicating account:', error);
    }
  };

  const handleTransfer = (account: Record<string, unknown>) => {
    setTransferFromAccount(account);
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (transferData: Record<string, unknown>) => {
    try {
      await transferBetweenAccounts(
        transferData.fromAccountId,
        transferData.toAccountId,
        transferData.amount,
        transferData.description
      );
      setShowTransferModal(false);
    } catch (error) {
      console.error('Error processing transfer:', error);
    }
  };

  const handleViewHistory = (account: Record<string, unknown>) => {
    // Navigate to transaction history filtered by account
    navigate(`/transactions?account=${account.id}`);
  };

  const handleViewAnalytics = (account: Record<string, unknown>) => {
    // Navigate to analytics page filtered by account
    navigate(`/analytics?account=${account.id}`);
  };

  const handleTogglePin = async (account: Record<string, unknown>) => {
    try {
      await toggleAccountPin(account.id);
    } catch (error) {
      console.error('Error updating account pin status:', error);
    }
  };

  const handleArchiveAccount = async (account: Record<string, unknown>) => {
    try {
      await archiveAccount(account.id);
    } catch (error) {
      console.error('Error archiving account:', error);
    }
  };

  const handleEditAccount = (account: Record<string, unknown>) => {
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
    <div className="min-h-screen pb-20 mobile-container" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile-optimized Header */}
      <div className="mobile-header">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="mobile-touch-target p-2 rounded-xl transition-all duration-200 active:scale-95"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="mobile-text-display font-heading font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                Accounts
              </h1>
              <p className="mobile-text-small font-body truncate" style={{ color: 'var(--text-secondary)' }}>
                {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(true)}
            className="mobile-button flex items-center space-x-1 px-3 py-2"
          >
            <Plus size={14} />
            <span className="text-sm">Add</span>
          </Button>
        </div>

        {/* Mobile-optimized Total Balance Card */}
        <div 
          className="mobile-card relative overflow-hidden rounded-2xl p-4 mb-4"
          style={{
            background: '#fef7ed',
            border: '1px solid #fed7aa'
          }}
        >
          <div className="text-center text-black">
            <p className="mobile-text-small font-body mb-1 opacity-90">Total Net Worth</p>
            <p className="mobile-text-hero font-serif font-bold">
              {formatCurrencyEnhanced(totalBalance, displayCurrency)}
            </p>
          </div>
          {/* Simplified decorative elements */}
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-20" style={{ backgroundColor: '#fed7aa' }}></div>
        </div>
      </div>

      {/* Mobile-optimized Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`mobile-touch-target flex-1 py-3 px-4 rounded-lg mobile-text-medium font-medium transition-all duration-200 ${
              activeTab === 'accounts'
                ? 'text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'accounts' ? 'var(--primary)' : 'transparent'
            }}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`mobile-touch-target flex-1 py-3 px-4 rounded-lg mobile-text-medium font-medium transition-all duration-200 ${
              activeTab === 'cards'
                ? 'text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'cards' ? 'var(--primary)' : 'transparent'
            }}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Mobile-Optimized Analytics Section */}
      <div className="px-4 mb-4">
        <div className="card-neumorphic p-3 slide-in-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-heading" style={{ color: 'var(--text-primary)' }}>
              Analytics
            </h2>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="p-2 rounded-lg active:bg-gray-100 transition-colors"
              title={showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            >
              <BarChart3 size={16} className={showAnalytics ? 'text-blue-600' : 'text-gray-600'} />
            </button>
          </div>

          {/* Mobile-friendly filter controls */}
          {showAnalytics && (
            <div className="mb-4 space-y-2">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-900"
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
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-900"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
              </select>
            </div>
          )}

          {showAnalytics && (
            <div className="space-y-4">
              {/* Mobile Account Overview Cards */}
              <div className="space-y-3">
                {accountAnalytics.slice(0, 3).map((analytics) => (
                  <div key={analytics.accountId} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {analytics.accountName}
                      </h3>
                      <span className="text-xs text-gray-500">{analytics.currency}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p style={{ color: 'var(--text-secondary)' }}>Balance</p>
                        <p className="font-numbers text-sm">{formatCurrency(analytics.balance)}</p>
                      </div>
                      <div className="text-center">
                        <p style={{ color: 'var(--text-secondary)' }}>Net Flow</p>
                        <p className={`font-numbers text-sm ${analytics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.netFlow >= 0 ? '+' : ''}{formatCurrency(analytics.netFlow)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p style={{ color: 'var(--text-secondary)' }}>Transactions</p>
                        <p className="font-numbers text-sm">{analytics.transactionCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simplified Category Breakdown for Mobile */}
              {accountAnalytics.length > 0 && accountAnalytics[0].categoryBreakdown.length > 0 && (
                <div>
                  <h3 className="text-sm font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Top Categories
                  </h3>
                  <div className="space-y-2">
                    {accountAnalytics[0].categoryBreakdown.slice(0, 5).map((cat, index) => (
                      <div key={cat.category} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {cat.category}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-numbers">{formatCurrency(cat.amount)}</span>
                          <span className="text-xs text-gray-500 ml-2">({cat.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile-friendly Largest Transactions */}
              {accountAnalytics.length > 0 && accountAnalytics[0].largestTransactions.length > 0 && (
                <div>
                  <h3 className="text-sm font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Recent Large Transactions
                  </h3>
                  <div className="space-y-2">
                    {accountAnalytics[0].largestTransactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.category}</p>
                        </div>
                        <div className="text-right ml-2">
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

      <div className="px-4 space-y-4">
        {/* Mobile-Optimized Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
              className="flex items-center space-x-1 px-3 py-2"
            >
              {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="text-sm">{showHidden ? 'Hide' : 'Show'} Hidden</span>
            </Button>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {filteredAccounts.length} of {accounts.length} accounts
            </div>
          </div>
        </div>

        {/* Goals Vault Manager */}
        <GoalsVaultManager />

        {/* Tab Content */}
        {activeTab === 'accounts' && (
          <>
            {/* Mobile-Optimized Accounts List */}
            <div className="space-y-3">
          {filteredAccounts.length === 0 ? (
            <div
              className="p-6 rounded-2xl text-center"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--background)' }}>
                <LuxuryCategoryIcon category="Primary Banking" size={20} variant="luxury" />
              </div>
              <h3 className="text-base font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
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
                  className="flex items-center space-x-2 mx-auto px-4 py-2"
                >
                  <Plus size={14} />
                  <span className="text-sm">Add Account</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
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
                  showDualCurrency={true}
                />
              ))}
            </div>
          )}
            </div>
          </>
        )}

        {activeTab === 'cards' && (
          <div className="space-y-4">
            {/* Cards Section */}
            <div className="px-4">
              <h2 className="text-lg font-heading text-white mb-4">Credit Cards</h2>
              {accounts.filter(acc => acc.type === 'credit_card').length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Credit Cards</h3>
                  <p className="text-gray-400 mb-4">Add a credit card to start tracking your spending</p>
                  <Button
                    variant="primary"
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 mx-auto"
                  >
                    <Plus size={16} />
                    <span>Add Credit Card</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts
                    .filter(acc => acc.type === 'credit_card')
                    .map((account) => {
                      const utilization = account.creditLimit > 0 ? (Math.abs(account.balance) / account.creditLimit) * 100 : 0;
                      const isOverLimit = account.balance < 0 && Math.abs(account.balance) > account.creditLimit;
                      
                      return (
                        <div 
                          key={account.id}
                          className="p-4 rounded-2xl border-2 border-white/20 bg-white/5"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                                <CreditCard size={20} className="text-white" />
                              </div>
                              <div>
                                <h3 className="font-heading text-white">{account.name}</h3>
                                <p className="text-sm text-gray-400">**** {account.accountNumber?.slice(-4) || '1234'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400">Balance</p>
                              <p className={`font-numbers text-lg ${account.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                                {formatCurrencyEnhanced(account.balance, account.currency_code || 'USD')}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Credit Limit</span>
                              <span className="text-white">{formatCurrencyEnhanced(account.creditLimit || 0, account.currency_code || 'USD')}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Available</span>
                              <span className="text-green-400">
                                {formatCurrencyEnhanced((account.creditLimit || 0) - Math.abs(account.balance || 0), account.currency_code || 'USD')}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Utilization</span>
                                <span className={`${utilization > 80 ? 'text-red-400' : utilization > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                                  {utilization.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    utilization > 80 ? 'bg-red-400' : utilization > 50 ? 'bg-yellow-400' : 'bg-green-400'
                                  }`}
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                            </div>

                            {isOverLimit && (
                              <div className="flex items-center space-x-2 text-red-400 text-sm">
                                <Shield size={14} />
                                <span>Over Credit Limit</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg active:scale-95 transition-all duration-200"
        >
          <Plus size={24} />
        </Button>
      </div>
    </div>
  );
};

export default Accounts;
