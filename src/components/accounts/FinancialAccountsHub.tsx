import React, { useState } from 'react';
import { Plus, Eye, EyeOff, CreditCard, Wallet, Building, Smartphone, TrendingUp, Edit3, Trash2, ArrowLeftRight, DollarSign } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { AccountForm } from '../forms/AccountForm';
import { TransferForm } from '../forms/TransferForm';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { FinancialAccount } from '../../types';

export const FinancialAccountsHub: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, transferBetweenAccounts } = useFinance();
  const { formatCurrency, currency } = useInternationalizationContext();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

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

  const handleEditAccount = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
        setEditingAccount(null);
        setShowAccountModal(false);
      }
    } catch (error) {
      console.error('Error updating account:', error);
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
    } catch (error) {
      console.error('Error deleting account:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Financial Accounts Hub</h3>
              <p className="text-sm text-blue-200">Manage all your accounts in one place</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
            <Button
              onClick={() => setShowAccountModal(true)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus size={16} className="mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Total Balance */}
        {showBalances && (
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-white">
              <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
              {totalBalance.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{visibleAccounts.length} visible accounts</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setShowTransferModal(true)}
          variant="outline"
          className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
          disabled={(accounts || []).length < 2}
        >
          <ArrowLeftRight size={16} className="mr-2" />
          Transfer Funds
        </Button>
        <Button
          onClick={() => setShowAccountModal(true)}
          variant="outline"
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <Plus size={16} className="mr-2" />
          New Account
        </Button>
      </div>

      {/* Accounts List */}
      {(accounts || []).length === 0 ? (
        <div className="text-center py-12 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
          <Wallet size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No accounts added</h3>
          <p className="text-gray-400 mb-6">Add your first financial account to start tracking</p>
          <Button onClick={() => setShowAccountModal(true)}>
            <Plus size={18} className="mr-2" />
            Add First Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(accounts || []).map((account) => {
            const AccountIcon = getAccountIcon(account.type);
            
            return (
              <div key={account.id} className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${getAccountColor(account.type)} flex items-center justify-center`}>
                      <AccountIcon size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{account.name}</h4>
                      <p className="text-xs text-gray-400">{getAccountTypeName(account.type)}</p>
                      {account.institution && (
                        <p className="text-xs text-gray-500">{account.institution}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateAccount(account.id, { isVisible: !account.isVisible })}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title={account.isVisible ? "Hide from dashboard" : "Show on dashboard"}
                    >
                      {account.isVisible ? (
                        <Eye size={14} className="text-primary-400" />
                      ) : (
                        <EyeOff size={14} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAccount(account);
                        setShowAccountModal(true);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-error-400" />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                {(account.isVisible || showBalances) && (
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Balance</p>
                    <p className="text-lg font-bold text-white">
                      <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                      {account.balance.toLocaleString()}
                    </p>
                  </div>
                )}

                {!account.isVisible && (
                  <div className="bg-gray-500/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400">Hidden from dashboard</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Account Form Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setEditingAccount(null);
        }}
        title={editingAccount ? 'Edit Account' : 'Add Financial Account'}
      >
        <AccountForm
          initialData={editingAccount}
          onSubmit={editingAccount ? handleEditAccount : handleAddAccount}
          onCancel={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Transfer Modal */}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setAccountToDelete(null);
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this account? This will also remove all associated transactions.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setAccountToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteAccount}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};