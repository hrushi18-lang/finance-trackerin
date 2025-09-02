import React, { useState, useEffect } from 'react';
import { Building, Smartphone, Wallet, CreditCard, TrendingUp, Target, Plus, Check, ArrowRight, Info } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface AccountData {
  name: string;
  type: string;
  balance: number;
  institution?: string;
  platform?: string;
  isRecommended?: boolean;
  description?: string;
}

interface OnboardingSmartAccountsProps {
  onNext: (data: { accounts: AccountData[] }) => void;
  onPrev: () => void;
  initialData?: { accounts?: AccountData[]; userType?: string; primaryFocus?: string[] };
  canGoBack?: boolean;
}

export const OnboardingSmartAccounts: React.FC<OnboardingSmartAccountsProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true 
}) => {
  const { currency, formatCurrency } = useInternationalization();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<string>('bank_savings');
  const [newAccountInstitution, setNewAccountInstitution] = useState('');

  // Smart account recommendations based on user type and focus
  const getRecommendedAccounts = (userType: string, primaryFocus: string[]) => {
    const baseAccounts = [
      {
        name: 'Main Savings Account',
        type: 'bank_savings',
        balance: 0,
        institution: 'Your Bank',
        isRecommended: true,
        description: 'Primary savings account for your money'
      },
      {
        name: 'Digital Wallet',
        type: 'digital_wallet',
        balance: 0,
        platform: 'PayTM, PhonePe, etc.',
        isRecommended: true,
        description: 'For quick payments and transfers'
      },
      {
        name: 'Cash',
        type: 'cash',
        balance: 0,
        isRecommended: true,
        description: 'Physical cash on hand'
      }
    ];

    const recommendations: Record<string, AccountData[]> = {
      student: [
        ...baseAccounts,
        {
          name: 'Student Loan Account',
          type: 'liability',
          balance: 0,
          institution: 'Education Loan Provider',
          isRecommended: primaryFocus.includes('pay_off_debt'),
          description: 'Track your student loan balance'
        }
      ],
      young_professional: [
        ...baseAccounts,
        {
          name: 'Emergency Fund',
          type: 'bank_savings',
          balance: 0,
          institution: 'High-yield savings',
          isRecommended: primaryFocus.includes('save_more'),
          description: '3-6 months of expenses'
        },
        {
          name: 'Investment Account',
          type: 'investment',
          balance: 0,
          platform: 'Zerodha, Groww, etc.',
          isRecommended: primaryFocus.includes('invest_better'),
          description: 'For SIPs and investments'
        }
      ],
      freelancer: [
        ...baseAccounts,
        {
          name: 'Business Account',
          type: 'bank_current',
          balance: 0,
          institution: 'Business Bank',
          isRecommended: true,
          description: 'Separate business finances'
        },
        {
          name: 'Tax Savings Account',
          type: 'bank_savings',
          balance: 0,
          institution: 'Tax-friendly bank',
          isRecommended: true,
          description: 'Set aside money for taxes'
        },
        {
          name: 'Investment Portfolio',
          type: 'investment',
          balance: 0,
          platform: 'Investment platform',
          isRecommended: primaryFocus.includes('invest_better'),
          description: 'Long-term wealth building'
        }
      ],
      business_owner: [
        ...baseAccounts,
        {
          name: 'Business Current Account',
          type: 'bank_current',
          balance: 0,
          institution: 'Business Bank',
          isRecommended: true,
          description: 'Primary business account'
        },
        {
          name: 'Investment Portfolio',
          type: 'investment',
          balance: 0,
          platform: 'Professional platform',
          isRecommended: true,
          description: 'Business and personal investments'
        },
        {
          name: 'Credit Card',
          type: 'credit_card',
          balance: 0,
          institution: 'Business credit card',
          isRecommended: true,
          description: 'Business expenses and rewards'
        }
      ],
      family: [
        ...baseAccounts,
        {
          name: 'Family Emergency Fund',
          type: 'bank_savings',
          balance: 0,
          institution: 'Family bank',
          isRecommended: true,
          description: '6-12 months of family expenses'
        },
        {
          name: 'Children\'s Education Fund',
          type: 'investment',
          balance: 0,
          platform: 'Education savings',
          isRecommended: primaryFocus.includes('plan_future'),
          description: 'Long-term education planning'
        },
        {
          name: 'Family Credit Card',
          type: 'credit_card',
          balance: 0,
          institution: 'Family credit card',
          isRecommended: true,
          description: 'Family expenses and rewards'
        }
      ],
      retiree: [
        ...baseAccounts,
        {
          name: 'Retirement Account',
          type: 'investment',
          balance: 0,
          platform: 'Retirement fund',
          isRecommended: true,
          description: 'Your retirement savings'
        },
        {
          name: 'Healthcare Fund',
          type: 'bank_savings',
          balance: 0,
          institution: 'Healthcare savings',
          isRecommended: true,
          description: 'Medical expenses and insurance'
        }
      ]
    };

    return recommendations[userType] || baseAccounts;
  };

  // Initialize accounts based on user type
  useEffect(() => {
    if (initialData?.userType && initialData?.primaryFocus) {
      const recommendedAccounts = getRecommendedAccounts(
        initialData.userType, 
        initialData.primaryFocus
      );
      setAccounts(recommendedAccounts);
    } else if (initialData?.accounts) {
      setAccounts(initialData.accounts);
    } else {
      // Default accounts
      setAccounts([
        { name: 'Main Savings Account', type: 'bank_savings', balance: 0, isRecommended: true },
        { name: 'Digital Wallet', type: 'digital_wallet', balance: 0, isRecommended: true },
        { name: 'Cash', type: 'cash', balance: 0, isRecommended: true }
      ]);
    }
  }, [initialData]);

  const updateAccountBalance = (index: number, balance: number) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[index].balance = balance;
    setAccounts(updatedAccounts);
  };

  const removeAccount = (index: number) => {
    const updatedAccounts = accounts.filter((_, i) => i !== index);
    setAccounts(updatedAccounts);
  };

  const addCustomAccount = () => {
    if (newAccountName.trim()) {
      const newAccount: AccountData = {
        name: newAccountName,
        type: newAccountType,
        balance: 0,
        institution: newAccountInstitution || undefined,
        isRecommended: false
      };
      setAccounts([...accounts, newAccount]);
      setNewAccountName('');
      setNewAccountInstitution('');
      setShowAddForm(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank_savings':
      case 'bank_current':
        return Building;
      case 'digital_wallet':
        return Smartphone;
      case 'cash':
        return Wallet;
      case 'credit_card':
        return CreditCard;
      case 'investment':
        return TrendingUp;
      case 'liability':
        return Target;
      default:
        return Wallet;
    }
  };

  const getAccountTypeName = (type: string) => {
    return type.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleContinue = () => {
    onNext({ accounts });
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const recommendedAccounts = accounts.filter(acc => acc.isRecommended);
  const customAccounts = accounts.filter(acc => !acc.isRecommended);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-white mb-2">
          Set Up Your Accounts
        </h2>
        <p className="text-gray-300 font-body">
          We've recommended accounts based on your profile. Add your current balances.
        </p>
      </div>

      {/* Smart Recommendations Info */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-semibold mb-1">Smart Recommendations</h3>
            <p className="text-blue-300 text-sm">
              Based on your profile as a {initialData?.userType?.replace('_', ' ')} focusing on {initialData?.primaryFocus?.join(', ')}, 
              we've suggested the most relevant accounts for your financial journey.
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Accounts */}
      {recommendedAccounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-white flex items-center">
            <Check size={20} className="text-green-400 mr-2" />
            Recommended for You
          </h3>
          <div className="space-y-3">
            {recommendedAccounts.map((account, index) => {
              const IconComponent = getAccountIcon(account.type);
              const accountIndex = accounts.findIndex(acc => acc === account);
              
              return (
                <div key={index} className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <IconComponent size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{account.name}</h4>
                        <p className="text-sm text-gray-400">{getAccountTypeName(account.type)}</p>
                        {account.description && (
                          <p className="text-xs text-green-300 mt-1">{account.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Current Balance</p>
                      <div className="flex items-center space-x-2">
                        <CurrencyIcon currencyCode={currency.code} size={16} className="text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={account.balance || ''}
                          onChange={(e) => updateAccountBalance(accountIndex, Number(e.target.value) || 0)}
                          className="w-24 bg-black/20 border border-gray-600/30 rounded-lg px-2 py-1 text-white text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Accounts */}
      {customAccounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-heading font-semibold text-white">
            Your Additional Accounts
          </h3>
          <div className="space-y-3">
            {customAccounts.map((account, index) => {
              const IconComponent = getAccountIcon(account.type);
              const accountIndex = accounts.findIndex(acc => acc === account);
              
              return (
                <div key={index} className="bg-gray-800/30 border border-gray-600/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                        <IconComponent size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{account.name}</h4>
                        <p className="text-sm text-gray-400">{getAccountTypeName(account.type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Current Balance</p>
                        <div className="flex items-center space-x-2">
                          <CurrencyIcon currencyCode={currency.code} size={16} className="text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={account.balance || ''}
                            onChange={(e) => updateAccountBalance(accountIndex, Number(e.target.value) || 0)}
                            className="w-24 bg-black/20 border border-gray-600/30 rounded-lg px-2 py-1 text-white text-sm focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeAccount(accountIndex)}
                        className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Remove account"
                      >
                        <span className="text-red-400 text-sm">×</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Account Form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 border-2 border-dashed border-gray-500/50 rounded-xl text-gray-300 hover:border-primary-400 hover:text-primary-300 transition-all flex items-center justify-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Another Account</span>
        </button>
      ) : (
        <div className="bg-gray-800/30 border border-gray-600/30 rounded-xl p-4 space-y-4">
          <h4 className="text-white font-semibold">Add Custom Account</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Account Name"
              type="text"
              placeholder="e.g., HDFC Savings"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="bg-black/20 border-gray-600/30 text-white"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                className="w-full bg-black/20 border border-gray-600/30 text-white rounded-lg px-3 py-2 focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
              >
                <option value="bank_savings">Bank Savings</option>
                <option value="bank_current">Current Account</option>
                <option value="digital_wallet">Digital Wallet</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="investment">Investment</option>
                <option value="liability">Loan/Debt</option>
              </select>
            </div>
          </div>
          <Input
            label="Institution/Platform (Optional)"
            type="text"
            placeholder="e.g., HDFC Bank, PayTM"
            value={newAccountInstitution}
            onChange={(e) => setNewAccountInstitution(e.target.value)}
            className="bg-black/20 border-gray-600/30 text-white"
          />
          <div className="flex space-x-3">
            <Button
              onClick={addCustomAccount}
              size="sm"
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              disabled={!newAccountName.trim()}
            >
              Add Account
            </Button>
            <Button
              onClick={() => setShowAddForm(false)}
              size="sm"
              variant="outline"
              className="flex-1 border-gray-500/30 text-gray-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Total Balance Summary */}
      <div className="bg-gradient-to-r from-primary-500/20 to-primary-600/20 border border-primary-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 font-semibold">Total Balance</h3>
            <p className="text-sm text-primary-300">Across all your accounts</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-numbers font-bold text-white">
              <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-4">
        {canGoBack && (
          <Button
            onClick={onPrev}
            variant="outline"
            className="flex-1 border-gray-500/30 text-gray-300"
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleContinue}
          className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          Continue
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};
