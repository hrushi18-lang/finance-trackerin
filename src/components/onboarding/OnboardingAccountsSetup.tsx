import React, { useState } from 'react';
import { Wallet, Building, DollarSign, Plus, Banknote } from 'lucide-react';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface AccountData {
  name: string;
  type: 'digital_wallet' | 'cash' | 'bank_savings';
  balance: number;
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
  const [accounts, setAccounts] = useState<AccountData[]>(
    initialData?.accounts || [
      { name: 'Wallet', type: 'digital_wallet', balance: 0 },
      { name: 'Cash', type: 'cash', balance: 0 },
      { name: 'Bank Account', type: 'bank_savings', balance: 0 }
    ]
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'digital_wallet' | 'cash' | 'bank_savings'>('digital_wallet');

  const updateAccountBalance = (index: number, balance: number) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[index].balance = balance;
    setAccounts(updatedAccounts);
  };

  const addCustomAccount = () => {
    if (newAccountName.trim()) {
      setAccounts([...accounts, {
        name: newAccountName,
        type: newAccountType,
        balance: 0
      }]);
      setNewAccountName('');
      setShowAddForm(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'digital_wallet': return '💳';
      case 'cash': return '💵';
      case 'bank_savings': return '🏦';
      default: return '💰';
    }
  };

  const handleContinue = () => {
    onNext({ accounts });
  };

  return (
    <div className="min-h-screen bg-forest-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-forest-700/80 backdrop-blur-md rounded-3xl p-8 border border-forest-600/30 shadow-2xl">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-forest-800 font-bold text-sm">✓</span>
              </div>
              <span className="text-white text-sm font-body">Welcome</span>
            </div>
            <div className="w-8 h-1 bg-forest-500 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-forest-800 font-bold text-sm">2</span>
              </div>
              <span className="text-white text-sm font-body">Accounts</span>
            </div>
            <div className="w-8 h-1 bg-forest-500/30 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-forest-500/30 rounded-full flex items-center justify-center">
                <span className="text-forest-300 font-bold text-sm">3</span>
              </div>
              <span className="text-forest-300 text-sm font-body">Categories</span>
            </div>
            <div className="w-8 h-1 bg-forest-500/30 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-forest-500/30 rounded-full flex items-center justify-center">
                <span className="text-forest-300 font-bold text-sm">4</span>
              </div>
              <span className="text-forest-300 font-bold text-sm">Budget</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Set Up Your Accounts
            </h2>
            <p className="text-forest-200 font-body">
              Start by adding your accounts. You can add more later.
            </p>
          </div>

          {/* Account Setup */}
          <div className="space-y-4 mb-8">
            {accounts.map((account, index) => (
              <div key={index} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl">{getAccountIcon(account.type)}</span>
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <CurrencyIcon currencyCode={currency?.code || 'USD'} size={16} className="text-forest-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter initial balance"
                  value={account.balance || ''}
                  onChange={(e) => updateAccountBalance(index, Number(e.target.value) || 0)}
                  className="w-full pl-16 pr-12 py-4 bg-forest-600/30 border border-forest-500/30 rounded-2xl text-white placeholder-forest-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 transition-all font-body"
                />
                <div className="absolute inset-y-0 left-16 flex items-center pointer-events-none">
                  <span className="text-white font-body font-medium">{account.name}</span>
                </div>
              </div>
            ))}

            {/* Add Account Button */}
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 border-2 border-dashed border-forest-500/50 rounded-2xl text-forest-300 hover:border-forest-400 hover:text-forest-200 transition-all flex items-center justify-center space-x-2 font-body"
              >
                <Plus size={18} />
                <span>Add Account</span>
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Account name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full px-4 py-3 bg-forest-600/30 border border-forest-500/30 rounded-xl text-white placeholder-forest-300 focus:border-forest-400 transition-all font-body"
                />
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-forest-600/30 border border-forest-500/30 rounded-xl text-white focus:border-forest-400 transition-all font-body"
                >
                  <option value="digital_wallet" className="bg-forest-800">Digital Wallet</option>
                  <option value="cash" className="bg-forest-800">Cash</option>
                  <option value="bank_savings" className="bg-forest-800">Bank Account</option>
                </select>
                <div className="flex space-x-2">
                  <Button
                    onClick={addCustomAccount}
                    size="sm"
                    className="flex-1 bg-forest-600 hover:bg-forest-700"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-forest-500/30 text-forest-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full py-4 text-lg font-heading font-semibold bg-white text-forest-800 hover:bg-forest-50 rounded-2xl shadow-lg transition-all"
            disabled={accounts.every(acc => acc.balance === 0)}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
