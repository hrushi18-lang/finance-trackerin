import React, { useState } from 'react';
import { Wallet, Building, Smartphone, CreditCard, TrendingUp, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useForm } from 'react-hook-form';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface AccountData {
  name: string;
  type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment';
  balance: number;
  institution?: string;
  platform?: string;
  isVisible: boolean;
}

interface OnboardingAccountsSetupProps {
  onNext: (data: { accounts: AccountData[] }) => void;
  onPrev: () => void;
  initialData?: { accounts?: AccountData[] };
  canGoBack?: boolean;
}

export const OnboardingAccountsSetup: React.FC<OnboardingAccountsSetupProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { currency } = useInternationalization();
  const [accounts, setAccounts] = useState<AccountData[]>(initialData?.accounts || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AccountData>({
    defaultValues: {
      type: 'bank_savings',
      balance: 0,
      isVisible: true
    }
  });

  const selectedType = watch('type');

  const accountTypes = [
    { 
      value: 'bank_savings', 
      label: 'Bank Savings', 
      icon: Building, 
      color: 'blue',
      description: 'SBI, HDFC, ICICI Savings',
      examples: ['HDFC Savings', 'SBI Savings', 'ICICI Savings']
    },
    { 
      value: 'bank_current', 
      label: 'Bank Current', 
      icon: Building, 
      color: 'green',
      description: 'Business checking account',
      examples: ['HDFC Current', 'SBI Current', 'Axis Current']
    },
    { 
      value: 'bank_student', 
      label: 'Student Account', 
      icon: Building, 
      color: 'purple',
      description: 'Student banking benefits',
      examples: ['SBI Student', 'HDFC Student Plus']
    },
    { 
      value: 'digital_wallet', 
      label: 'Digital Wallet', 
      icon: Smartphone, 
      color: 'orange',
      description: 'UPI and digital payments',
      examples: ['PayTM Wallet', 'PhonePe', 'Google Pay', 'Amazon Pay']
    },
    { 
      value: 'cash', 
      label: 'Cash Wallet', 
      icon: Wallet, 
      color: 'gray',
      description: 'Physical cash tracking',
      examples: ['Cash in Hand', 'Petty Cash']
    },
    { 
      value: 'credit_card', 
      label: 'Credit Card', 
      icon: CreditCard, 
      color: 'red',
      description: 'Credit cards and limits',
      examples: ['HDFC Regalia', 'SBI SimplyCLICK', 'Axis Ace']
    },
    { 
      value: 'investment', 
      label: 'Investment', 
      icon: TrendingUp, 
      color: 'yellow',
      description: 'Stocks, SIP, Mutual Funds',
      examples: ['Zerodha', 'Groww', 'SIP Portfolio']
    }
  ];

  const handleAddAccount = (data: AccountData) => {
    if (editingIndex !== null) {
      const updatedAccounts = [...accounts];
      updatedAccounts[editingIndex] = data;
      setAccounts(updatedAccounts);
      setEditingIndex(null);
    } else {
      setAccounts([...accounts, data]);
    }
    setShowAddForm(false);
    reset();
  };

  const handleEditAccount = (index: number) => {
    const account = accounts[index];
    setEditingIndex(index);
    reset(account);
    setShowAddForm(true);
  };

  const handleDeleteAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    onNext({ accounts });
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/20 hover:border-blue-400/50',
      green: isSelected ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 hover:border-green-400/50',
      purple: isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-white/20 hover:border-purple-400/50',
      orange: isSelected ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/20 hover:border-orange-400/50',
      gray: isSelected ? 'border-gray-500 bg-gray-500/20 text-gray-400' : 'border-white/20 hover:border-gray-400/50',
      red: isSelected ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/20 hover:border-red-400/50',
      yellow: isSelected ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-white/20 hover:border-yellow-400/50',
    };
    return colors[color as keyof typeof colors];
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet size={32} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Set up your accounts</h2>
        <p className="text-gray-400">Add your payment methods and financial accounts</p>
      </div>

      {/* Current Accounts */}
      {accounts.length > 0 && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Your Accounts ({accounts.length})</h3>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Balance</p>
              <p className="text-lg font-bold text-white">
                <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                {totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {accounts.map((account, index) => {
              const accountType = accountTypes.find(t => t.value === account.type);
              const AccountIcon = accountType?.icon || Wallet;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${
                      accountType?.color === 'blue' ? 'bg-blue-500' :
                      accountType?.color === 'green' ? 'bg-green-500' :
                      accountType?.color === 'purple' ? 'bg-purple-500' :
                      accountType?.color === 'orange' ? 'bg-orange-500' :
                      accountType?.color === 'red' ? 'bg-red-500' :
                      accountType?.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    } flex items-center justify-center`}>
                      <AccountIcon size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{account.name}</h4>
                      <p className="text-xs text-gray-400">{accountType?.label}</p>
                      {account.institution && (
                        <p className="text-xs text-gray-500">{account.institution}</p>
                      )}
                      {account.platform && (
                        <p className="text-xs text-gray-500">{account.platform}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-medium text-white">
                        <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                        {account.balance.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-1">
                        {account.isVisible ? (
                          <Eye size={12} className="text-primary-400" />
                        ) : (
                          <EyeOff size={12} className="text-gray-400" />
                        )}
                        <span className="text-xs text-gray-400">
                          {account.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditAccount(index)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(index)}
                      className="p-1 hover:bg-error-500/20 rounded transition-colors"
                    >
                      <Trash2 size={14} className="text-error-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Account Button */}
      {!showAddForm && (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-gradient-to-r from-primary-500 to-blue-500"
        >
          <Plus size={18} className="mr-2" />
          {accounts.length === 0 ? 'Add Your First Account' : 'Add Another Account'}
        </Button>
      )}

      {/* Add Account Form */}
      {showAddForm && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-4">
            {editingIndex !== null ? 'Edit Account' : 'Add New Account'}
          </h4>
          
          <form onSubmit={handleSubmit(handleAddAccount)} className="space-y-4">
            {/* Account Name */}
            <Input
              label="Account Name"
              type="text"
              placeholder="e.g., HDFC Credit Card, PayTM Wallet"
              icon={<Wallet size={18} className="text-blue-400" />}
              {...register('name', { 
                required: 'Account name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              error={errors.name?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {accountTypes.map((type) => {
                  const isSelected = selectedType === type.value;
                  const IconComponent = type.icon;
                  
                  return (
                    <label key={type.value} className="cursor-pointer">
                      <input
                        type="radio"
                        value={type.value}
                        {...register('type', { required: 'Account type is required' })}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-lg border-2 transition-colors ${getColorClasses(type.color, isSelected)}`}>
                        <div className="flex items-center space-x-3">
                          <IconComponent size={20} />
                          <div>
                            <p className="font-medium text-sm">{type.label}</p>
                            <p className="text-xs opacity-80">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.type && (
                <p className="text-sm text-error-400 mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* Institution/Platform */}
            {(selectedType?.includes('bank') || selectedType === 'digital_wallet' || selectedType === 'credit_card') && (
              <Input
                label={
                  selectedType?.includes('bank') ? 'Bank Name' : 
                  selectedType === 'credit_card' ? 'Card Provider' :
                  'Platform Name'
                }
                type="text"
                placeholder={
                  selectedType?.includes('bank') ? 'e.g., State Bank of India, HDFC Bank' : 
                  selectedType === 'credit_card' ? 'e.g., HDFC Bank, SBI Cards' :
                  'e.g., PayTM, PhonePe, Google Pay'
                }
                icon={selectedType?.includes('bank') || selectedType === 'credit_card' ? 
                  <Building size={18} className="text-green-400" /> : 
                  <Smartphone size={18} className="text-orange-400" />
                }
                {...register(selectedType?.includes('bank') || selectedType === 'credit_card' ? 'institution' : 'platform')}
                className="bg-black/20 border-white/20 text-white"
              />
            )}

            {/* Current Balance */}
            <Input
              label="Current Balance"
              type="number"
              step="0.01"
              placeholder="0"
              icon={<CurrencyIcon currencyCode={currency.code} className="text-success-400" />}
              {...register('balance', {
                required: 'Balance is required',
                min: { value: 0, message: 'Balance cannot be negative' }
              })}
              error={errors.balance?.message}
              className="bg-black/20 border-white/20 text-white"
              helpText="Current balance in this account"
            />

            {/* Visibility */}
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Show on Dashboard</p>
                  <p className="text-sm text-gray-400">Include this account in total balance calculations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    {...register('isVisible')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingIndex(null);
                  reset();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Account
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Account Type Examples */}
      {!showAddForm && accounts.length === 0 && (
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <h4 className="font-medium text-blue-400 mb-3">Popular Account Types in India</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-blue-300 font-medium">🏦 Bank Accounts:</p>
              <p className="text-blue-200 text-xs">HDFC Savings, SBI Current, ICICI Student Account</p>
            </div>
            <div className="space-y-1">
              <p className="text-blue-300 font-medium">💳 Credit Cards:</p>
              <p className="text-blue-200 text-xs">HDFC Regalia, SBI SimplyCLICK, Axis Ace Credit Card</p>
            </div>
            <div className="space-y-1">
              <p className="text-blue-300 font-medium">📱 Digital Wallets:</p>
              <p className="text-blue-200 text-xs">PayTM Wallet, PhonePe, Google Pay, Amazon Pay</p>
            </div>
            <div className="space-y-1">
              <p className="text-blue-300 font-medium">📈 Investments:</p>
              <p className="text-blue-200 text-xs">Zerodha Portfolio, Groww SIP, Mutual Fund Account</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex space-x-3 pt-4">
        {canGoBack && (
          <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
            Back
          </Button>
        )}
        <Button 
          onClick={handleContinue} 
          className="flex-1"
          disabled={accounts.length === 0}
        >
          Continue {accounts.length > 0 && `(${accounts.length} accounts)`}
        </Button>
      </div>
    </div>
  );
};