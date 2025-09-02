import React, { useState } from 'react';
import { Plus, Eye, EyeOff, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SmartAccountForm } from '../components/forms/SmartAccountForm';
import { ContextualHelp } from '../components/common/ContextualHelp';
import { TransferForm } from '../components/forms/TransferForm';
import { TransactionForm } from '../components/forms/TransactionForm';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { FinancialAccount, Transaction } from '../types';
import { AccountCard } from '../components/accounts/AccountCard';

export const FinancialAccountsHub: React.FC = () => {
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount, 
    transferBetweenAccounts, 
    transactions, 
    goals,
    addTransaction 
  } = useFinance();
  const { currency } = useInternationalization();
  
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

  const handleMockTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addTransaction({
        ...data,
        accountId: selectedAccountForMock,
        affectsBalance: true,
        status: 'completed'
      });
      setShowMockTransactionModal(false);
      setSelectedAccountForMock(null);
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      setError(error.message || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const visibleAccounts = (accounts || []).filter(a => a.isVisible);
  const totalBalance = visibleAccounts.reduce((sum, account) => sum + account.balance, 0);

  const getAccountTransactions = (accountId: string): Transaction[] => {
    return (transactions || [])
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-20">
      {/* Immersive Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 pt-12 pb-8 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading text-gray-900">💳 Your Money Accounts</h1>
          <button
            onClick={() => setShowAccountModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        </div>
      </div>
      
      <div className="px-6 space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm sm:text-base">
            🏦 Manage all your payment methods like a pro
          </p>
          <div className="flex items-center space-x-2">
            <ContextualHelp context="accounts" />
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
              const isSelected = selectedAccountId === account.id;
              const accountTransactions = getAccountTransactions(account.id);
              const goalsVaultBreakdown = account.type === 'goals_vault' ? {
                totalAllocated: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
                goalBreakdown: goals.map(goal => ({
                  goalId: goal.id,
                  title: goal.title,
                  amount: goal.currentAmount,
                  progress: (goal.currentAmount / goal.targetAmount) * 100
                }))
              } : undefined;
              
              return (
                <AccountCard
                  key={account.id}
                  account={account}
                  isSelected={isSelected}
                  onSelect={() => setSelectedAccountId(isSelected ? null : account.id)}
                  onEdit={() => {
                    setEditingAccount(account);
                    setShowAccountModal(true);
                  }}
                  onDelete={() => handleDeleteAccount(account.id)}
                  onToggleVisibility={() => updateAccount(account.id, { isVisible: !account.isVisible })}
                  onTransfer={() => setShowTransferModal(true)}
                  onAddTransaction={() => {
                    setSelectedAccountForMock(account.id);
                    setShowMockTransactionModal(true);
                  }}
                  recentTransactions={accountTransactions.slice(0, 5)}
                  showBalances={showBalances}
                  goalsVaultBreakdown={goalsVaultBreakdown}
                />
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
                <span className="text-blue-400">🏦</span>
                <span className="text-forest-200 font-body">Bank Accounts (SBI, HDFC, ICICI)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-orange-400">📱</span>
                <span className="text-forest-200 font-body">Digital Wallets (PayTM, PhonePe)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-red-400">💳</span>
                <span className="text-forest-200 font-body">Credit Cards (Student Cards)</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-gray-400">💵</span>
                <span className="text-forest-200 font-body">Cash Wallet (Pocket Money)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-yellow-400">📈</span>
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

      {/* Add Account Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setEditingAccount(null);
        }}
        title={editingAccount ? "Edit Account" : "Add New Account"}
      >
        <SmartAccountForm
          initialData={editingAccount || undefined}
          isSubmitting={isSubmitting}
          onSubmit={editingAccount ? handleEditAccount : handleAddAccount}
          onCancel={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
          }}
        />
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Money"
      >
        <TransferForm
          accounts={accounts || []}
          isSubmitting={isSubmitting}
          onSubmit={handleTransfer}
          onCancel={() => setShowTransferModal(false)}
        />
      </Modal>

      {/* Mock Transaction Modal */}
      <Modal
        isOpen={showMockTransactionModal}
        onClose={() => {
          setShowMockTransactionModal(false);
          setSelectedAccountForMock(null);
        }}
        title="Add Transaction"
      >
        <TransactionForm
          onSubmit={handleMockTransaction}
          onCancel={() => {
            setShowMockTransactionModal(false);
            setSelectedAccountForMock(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setAccountToDelete(null);
        }}
        title="Delete Account"
      >
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Are you sure?</h3>
          <p className="text-forest-300 mb-6">
            This action cannot be undone. All transactions for this account will be lost.
          </p>
          <div className="flex space-x-4">
            <Button
              onClick={() => {
                setShowDeleteConfirm(false);
                setAccountToDelete(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteAccount}
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
