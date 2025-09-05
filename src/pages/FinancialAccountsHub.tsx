import React, { useState } from 'react';
import { Plus, Eye, EyeOff, ArrowLeftRight, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading">💳 Your Money Accounts</h1>
          <button
            onClick={() => setShowAccountModal(true)}
            className="btn-primary flex items-center space-x-2 px-4 py-2"
          >
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
            🏦 Manage all your payment methods like a pro
          </p>
          <div className="flex items-center space-x-2">
            <ContextualHelp context="accounts" />
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--background-secondary)' }}
              title={showBalances ? "Hide balances" : "Show balances"}
            >
              {showBalances ? (
                <EyeOff size={16} className="text-gray-400" />
              ) : (
                <Eye size={16} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card p-4" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} />
              <p className="text-sm font-body">{error}</p>
            </div>
          </div>
        )}

        {/* Header with Total Balance */}
        <div className="card-neumorphic p-4 slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="text-lg font-heading font-bold">Your Money Dashboard</h3>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Track every rupee across all accounts</p>
              </div>
            </div>
          </div>

          {/* Total Balance */}
          {showBalances && (
            <div className="p-4 text-center rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <p className="text-sm font-body mb-2" style={{ color: 'var(--text-tertiary)' }}>Total Money Available</p>
              <p className="text-2xl font-numbers font-bold">
                <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
                {totalBalance.toLocaleString()}
              </p>
              <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>{visibleAccounts.length} active accounts</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="btn-secondary flex items-center justify-center"
            disabled={(accounts || []).length < 2}
          >
            <ArrowLeftRight size={16} className="mr-2" />
            Move Money
          </button>
          <button
            onClick={() => setShowAccountModal(true)}
            className="btn-primary flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" />
            Add Account
          </button>
        </div>

        {/* Accounts List */}
        {(accounts || []).length === 0 ? (
          <div className="text-center py-12 card">
            <span className="text-4xl mb-4 block">🏦</span>
            <h3 className="text-lg font-heading font-bold mb-3">Set up your first account!</h3>
            <p className="text-sm font-body mb-6 max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Add your cash wallet, bank account, or digital wallet to start tracking your money like a pro
            </p>
            <button 
              onClick={() => setShowAccountModal(true)}
              className="btn-primary"
            >
              <span className="mr-2">🚀</span>
              Add First Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
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
