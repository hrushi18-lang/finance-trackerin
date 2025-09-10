import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountForm } from '../components/accounts/AccountForm';
import { GoalsVaultManager } from '../components/accounts/GoalsVaultManager';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useEnhancedCurrency } from '../contexts/EnhancedCurrencyContext';
import { useNavigate } from 'react-router-dom';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';
import { CurrencySelector } from '../components/currency/CurrencySelector';

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount,
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
                <div
                  key={account.id}
                  className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <LuxuryCategoryIcon 
                        category={account.type === 'bank_current' ? 'Primary Banking' : 
                                 account.type === 'bank_savings' ? 'Savings' :
                                 account.type === 'credit_card' ? 'Credit' :
                                 account.type === 'digital_wallet' ? 'Digital Wallet' : 'Other Account'}
                        size={20}
                        variant="luxury"
                      />
                      <div>
                        <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                          {account.name}
                        </h3>
                        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                          {account.institution || account.platform || 'Personal Account'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingAccount(account)}
                        className="p-1 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <Filter size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(account)}
                        className="p-1 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {account.is_visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrencyEnhanced(account.balance || 0, account.currency_code || 'USD')}
                        </p>
                        {account.currency_code && account.currency_code !== displayCurrency && (
                          <span className="text-xs text-gray-500">
                            ({formatCurrencyEnhanced(
                              convertAmount(account.balance || 0, account.currency_code, displayCurrency) || account.balance || 0,
                              displayCurrency
                            )})
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                        {account.type?.replace('_', ' ').toUpperCase() || 'ACCOUNT'} • {account.currency_code || 'USD'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount(account)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: 'var(--error)' }}
                    >
                      <Filter size={14} />
                    </button>
                  </div>
                </div>
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
    </div>
  );
};

export default Accounts;
