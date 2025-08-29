import React, { useState } from 'react';
import { Plus, Eye, EyeOff, CreditCard, Wallet, Building, Smartphone, TrendingUp, Edit3, Trash2, ArrowLeftRight, DollarSign, Calendar, BarChart3, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AccountForm } from '../components/forms/AccountForm';
import { TransferForm } from '../components/forms/TransferForm';
import { TransactionForm } from '../components/forms/TransactionForm';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { FinancialAccount, Transaction } from '../types';

export const FinancialAccountsHub: React.FC = () => {
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount, 
    transferBetweenAccounts, 
    transactions, 
    goals, 
    liabilities, 
    budgets,
    addTransaction 
  } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMockTransactionModal, setShowMockTransactionModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [selectedAccountForMock, setSelectedAccountForMock] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddAccount = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addAccount(data);
      setShowAccountModal(false);
    } catch (error: any) {
      console.error('Error adding account:', error);
      setError(error.message || 'Failed to add account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
        setEditingAccount(null);
        setShowAccountModal(false);
      }
    } catch (error: any) {
      console.error('Error updating account:', error);
      setError(error.message || 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccountToDelete(accountId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsSubmitting(true);
      if (accountToDelete) {
        await deleteAccount(accountToDelete);
        setAccountToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setError(error.message || 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await transferBetweenAccounts(data.fromAccountId, data.toAccountId, data.amount, data.description);
      setShowTransferModal(false);
    } catch (error: any) {
      console.error('Error transferring funds:', error);
      setError(error.message || 'Failed to transfer funds');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMockTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Add mock transaction that doesn't affect balance
      await addTransaction({
        ...data,
        accountId: selectedAccountForMock,
        affectsBalance: false,
        reason: 'Historical transaction - account setup'
      });
      
      setShowMockTransactionModal(false);
      setSelectedAccountForMock(null);
    } catch (error: any) {
      console.error('Error adding mock transaction:', error);
      setError(error.message || 'Failed to add mock transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountIcon = (type: string) => {
    const icons = {
      bank_savings: Building,
      bank_current: Building,
      bank_student: Building,
      digital_wallet: Smartphone,
      cash: Wallet,
      credit_card: CreditCard,
      investment: TrendingUp
    };
    return icons[type as keyof typeof icons] || Wallet;
  };

  const getAccountColor = (type: string) => {
    const colors = {
      bank_savings: 'bg-blue-500',
      bank_current: 'bg-green-500',
      bank_student: 'bg-purple-500',
      digital_wallet: 'bg-orange-500',
      cash: 'bg-gray-500',
      credit_card: 'bg-red-500',
      investment: 'bg-yellow-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getAccountTypeName = (type: string) => {
    const names = {
      bank_savings: 'Savings Account',
      bank_current: 'Current Account',
      bank_student: 'Student Account',
      digital_wallet: 'Digital Wallet',
      cash: 'Cash',
      credit_card: 'Credit Card',
      investment: 'Investment Account'
    };
    return names[type as keyof typeof names] || 'Account';
  };

  const totalBalance = (accounts || [])
    .filter(account => account.isVisible)
    .reduce((sum, account) => sum + (Number(account.balance) || 0), 0);

  const visibleAccounts = (accounts || []).filter(account => account.isVisible);

  // Get transactions for specific account
  const getAccountTransactions = (accountId: string) => {
    return (transactions || [])
      .filter(t => t.accountId === accountId)
      .slice(0, 5);
  };

  // Get goals linked to account
  const getAccountGoals = (accountId: string) => {
    return (goals || []).filter(g => g.accountId === accountId);
  };

  // Get liabilities linked to account
  const getAccountLiabilities = (accountId: string) => {
    return (liabilities || []).filter(l => l.accountId === accountId);
  };

  // Get budgets linked to account
  const getAccountBudgets = (accountId: string) => {
    return (budgets || []).filter(b => b.accountId === accountId);
  };

  const selectedAccount = selectedAccountId ? accounts?.find(a => a.id === selectedAccountId) : null;
  const selectedAccountTransactions = selectedAccountId ? getAccountTransactions(selectedAccountId) : [];
  const selectedAccountGoals = selectedAccountId ? getAccountGoals(selectedAccountId) : [];
  const selectedAccountLiabilities = selectedAccountId ? getAccountLiabilities(selectedAccountId) : [];
  const selectedAccountBudgets = selectedAccountId ? getAccountBudgets(selectedAccountId) : [];

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="💳 Your Money Accounts" 
        showAdd 
        onAdd={() => setShowAccountModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm sm:text-base">
            🏦 Manage all your payment methods like a pro
          </p>
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={showBalances ? "Hide balances" : "Show balances"}
          >
            {showBalances ? (
              <EyeOff size={18} className="text-gray-400" />
            ) : (
              <Eye size={18} className="text-gray-400" />
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} className="text-error-400" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Header with Total Balance */}
        <div className="bg-gradient-to-r from-forest-700/80 to-forest-600/80 backdrop-blur-md rounded-2xl p-6 border border-forest-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">💰</span>
              <div>
                <h3 className="text-xl font-heading font-bold text-white">Your Money Dashboard</h3>
                <p className="text-sm text-forest-200 font-body">Track every rupee across all accounts</p>
              </div>
            </div>
          </div>

          {/* Total Balance */}
          {showBalances && (
            <div className="bg-forest-800/30 rounded-xl p-4 text-center">
              <p className="text-sm text-forest-300 mb-2 font-body">Total Money Available</p>
              <p className="text-3xl font-numbers font-bold text-white">
                <CurrencyIcon currencyCode={currency.code} size={24} className="inline mr-2" />
                {totalBalance.toLocaleString()}
              </p>
              <p className="text-xs text-forest-400 font-body">{visibleAccounts.length} active accounts</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowTransferModal(true)}
            variant="outline"
            className="border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
            disabled={(accounts || []).length < 2}
          >
            <ArrowLeftRight size={16} className="mr-2" />
            Move Money
          </Button>
          <Button
            onClick={() => setShowAccountModal(true)}
            className="bg-forest-600 hover:bg-forest-700"
          >
            <Plus size={16} className="mr-2" />
            Add Account
          </Button>
        </div>

        {/* Accounts List */}
        {(accounts || []).length === 0 ? (
          <div className="text-center py-16 bg-forest-900/30 backdrop-blur-md rounded-2xl border border-forest-600/20">
            <span className="text-6xl mb-6 block">🏦</span>
            <h3 className="text-xl font-heading font-bold text-white mb-3">Set up your first account!</h3>
            <p className="text-forest-300 mb-6 font-body max-w-md mx-auto">
              Add your cash wallet, bank account, or digital wallet to start tracking your money like a pro
            </p>
            <Button 
              onClick={() => setShowAccountModal(true)}
              className="bg-forest-600 hover:bg-forest-700"
            >
              <span className="mr-2">🚀</span>
              Add First Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(accounts || []).map((account) => {
              const AccountIcon = getAccountIcon(account.type);
              const isSelected = selectedAccountId === account.id;
              
              return (
                <div 
                  key={account.id} 
                  className={`bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'border-forest-500 bg-forest-600/10 shadow-xl transform scale-105' 
                      : 'border-forest-600/20 hover:border-forest-500/40 hover:bg-forest-800/30'
                  }`}
                  onClick={() => setSelectedAccountId(isSelected ? null : account.id)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-xl ${getAccountColor(account.type)} flex items-center justify-center shadow-lg`}>
                        <AccountIcon size={28} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-heading font-bold text-white">{account.name}</h4>
                        <p className="text-sm text-forest-300 font-body">{getAccountTypeName(account.type)}</p>
                        {account.institution && (
                          <p className="text-xs text-forest-400 font-body">{account.institution}</p>
                        )}
                        {account.platform && (
                          <p className="text-xs text-forest-400 font-body">{account.platform}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateAccount(account.id, { isVisible: !account.isVisible });
                        }}
                        className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
                        title={account.isVisible ? "Hide from dashboard" : "Show on dashboard"}
                      >
                        {account.isVisible ? (
                          <Eye size={16} className="text-forest-400" />
                        ) : (
                          <EyeOff size={16} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAccount(account);
                          setShowAccountModal(true);
                        }}
                        className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} className="text-forest-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(account.id);
                        }}
                        className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-error-400" />
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  {(account.isVisible || showBalances) && (
                    <div className="bg-forest-800/30 rounded-xl p-4 mb-4">
                      <p className="text-xs text-forest-400 mb-2 font-body">Current Balance</p>
                      <p className="text-2xl font-numbers font-bold text-white">
                        <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
                        {account.balance.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {!account.isVisible && (
                    <div className="bg-gray-500/20 rounded-xl p-4 text-center mb-4 border border-gray-500/30">
                      <p className="text-sm text-gray-400 font-body">Hidden from dashboard</p>
                    </div>
                  )}

                  {/* Mock Transaction Button */}
                  <div className="mb-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccountForMock(account.id);
                        setShowMockTransactionModal(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
                    >
                      <Plus size={14} className="mr-2" />
                      Add Past Transaction
                    </Button>
                  </div>

                  {/* Account-Specific Data when Selected */}
                  {isSelected && (
                    <div className="pt-4 border-t border-forest-600/20 space-y-4">
                      {/* Recent Transactions */}
                      {selectedAccountTransactions.length > 0 && (
                        <div>
                          <h5 className="text-sm font-heading font-medium text-white mb-3 flex items-center">
                            <BarChart3 size={16} className="mr-2 text-forest-400" />
                            Recent Activity
                          </h5>
                          <div className="space-y-2">
                            {selectedAccountTransactions.map((transaction) => (
                              <div key={transaction.id} className="flex items-center justify-between p-3 bg-forest-800/20 rounded-lg border border-forest-600/20">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    transaction.type === 'income' ? 'bg-success-500/20' : 'bg-error-500/20'
                                  }`}>
                                    <span className={`text-xs font-bold ${
                                      transaction.type === 'income' ? 'text-success-400' : 'text-error-400'
                                    }`}>
                                      {transaction.type === 'income' ? '+' : '-'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-body font-medium text-white">{transaction.description}</p>
                                    <p className="text-xs text-forest-400 font-body">{transaction.category}</p>
                                  </div>
                                </div>
                                <span className={`text-sm font-numbers font-medium ${
                                  transaction.type === 'income' ? 'text-success-400' : 'text-error-400'
                                }`}>
                                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Goals */}
                      {selectedAccountGoals.length > 0 && (
                        <div>
                          <h5 className="text-sm font-heading font-medium text-white mb-3 flex items-center">
                            <Target size={16} className="mr-2 text-forest-400" />
                            Goals for This Account ({selectedAccountGoals.length})
                          </h5>
                          <div className="space-y-2">
                            {selectedAccountGoals.map((goal) => (
                              <div key={goal.id} className="p-3 bg-forest-600/10 rounded-lg border border-forest-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-body text-white">{goal.title}</span>
                                  <span className="text-xs text-forest-400 font-numbers">
                                    {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Liabilities */}
                      {selectedAccountLiabilities.length > 0 && (
                        <div>
                          <h5 className="text-sm font-heading font-medium text-white mb-3 flex items-center">
                            <CreditCard size={16} className="mr-2 text-error-400" />
                            Debts on This Account ({selectedAccountLiabilities.length})
                          </h5>
                          <div className="space-y-2">
                            {selectedAccountLiabilities.map((liability) => (
                              <div key={liability.id} className="p-3 bg-error-500/10 rounded-lg border border-error-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-body text-white">{liability.name}</span>
                                  <span className="text-xs text-error-400 font-numbers">
                                    {formatCurrency(liability.remainingAmount)} left
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Budgets */}
                      {selectedAccountBudgets.length > 0 && (
                        <div>
                          <h5 className="text-sm font-heading font-medium text-white mb-3 flex items-center">
                            <DollarSign size={16} className="mr-2 text-warning-400" />
                            Budgets for This Account ({selectedAccountBudgets.length})
                          </h5>
                          <div className="space-y-2">
                            {selectedAccountBudgets.map((budget) => (
                              <div key={budget.id} className="p-3 bg-warning-500/10 rounded-lg border border-warning-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-body text-white">{budget.category}</span>
                                  <span className="text-xs text-warning-400 font-numbers">
                                    {((budget.spent / budget.amount) * 100).toFixed(1)}% used
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Student Guide */}
        <div className="bg-forest-600/20 rounded-xl p-6 border border-forest-500/30">
          <h4 className="font-heading font-medium text-forest-300 mb-4">🎓 Student Account Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Building size={16} className="text-blue-400" />
                <span className="text-forest-200 font-body">Bank Accounts (SBI, HDFC, ICICI)</span>
              </div>
              <div className="flex items-center space-x-3">
                <Smartphone size={16} className="text-orange-400" />
                <span className="text-forest-200 font-body">Digital Wallets (PayTM, PhonePe)</span>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard size={16} className="text-red-400" />
                <span className="text-forest-200 font-body">Credit Cards (Student Cards)</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Wallet size={16} className="text-gray-400" />
                <span className="text-forest-200 font-body">Cash Wallet (Pocket Money)</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp size={16} className="text-yellow-400" />
                <span className="text-forest-200 font-body">Investment (SIP, Stocks)</span>
              </div>
            </div>
          </div>
          
          {/* Student Tip */}
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm">
              💡 <strong>Pro Tip:</strong> Start with just 2-3 accounts (Cash + Bank + Digital Wallet). 
              You can always add more as your financial life grows!
            </p>
          </div>
        </div>
      </div>

      {/* Account Form Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setEditingAccount(null);
          setError(null);
        }}
        title={editingAccount ? 'Edit Account' : '🏦 Add New Account'}
      >
        <AccountForm
          initialData={editingAccount}
          onSubmit={editingAccount ? handleEditAccount : handleAddAccount}
          onCancel={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
            setError(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setError(null);
        }}
        title="💸 Move Money Between Accounts"
      >
        <TransferForm
          accounts={accounts || []}
          onSubmit={handleTransfer}
          onCancel={() => {
            setShowTransferModal(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Mock Transaction Modal */}
      <Modal
        isOpen={showMockTransactionModal}
        onClose={() => {
          setShowMockTransactionModal(false);
          setSelectedAccountForMock(null);
          setError(null);
        }}
        title="📝 Add Past Transaction"
      >
        <div className="space-y-4">
          <div className="bg-forest-600/20 rounded-lg p-4 border border-forest-500/30">
            <div className="flex items-start space-x-3">
              <Info size={18} className="text-forest-400 mt-0.5" />
              <div>
                <p className="text-forest-300 font-body font-medium text-sm">Historical Transaction</p>
                <p className="text-forest-200 font-body text-xs mt-1">
                  This won't change your current balance - it's just for tracking past expenses 
                  to help you understand your spending patterns better.
                </p>
              </div>
            </div>
          </div>
          
          <TransactionForm
            onSubmit={handleAddMockTransaction}
            onCancel={() => {
              setShowMockTransactionModal(false);
              setSelectedAccountForMock(null);
              setError(null);
            }}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setAccountToDelete(null);
          setError(null);
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="bg-error-500/20 rounded-lg p-4 border border-error-500/30">
            <div className="flex items-start space-x-3">
              <AlertCircle size={18} className="text-error-400 mt-0.5" />
              <div>
                <p className="text-error-400 font-body font-medium text-sm">⚠️ This can't be undone!</p>
                <p className="text-error-300 font-body text-xs mt-1">
                  Deleting this account will remove all transactions, goals, and budgets linked to it.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-forest-200 font-body">
            Are you sure you want to delete this account? All your financial data for this account will be lost forever.
          </p>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setAccountToDelete(null);
              }}
              className="flex-1 border-forest-500/30 text-forest-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteAccount}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isSubmitting}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};