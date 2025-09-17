import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { formatCurrency, CURRENCIES } from '../../utils/currency-converter';
import { currencyService } from '../../services/currencyService';
import { FinancialAccount, CreateAccountData } from '../../lib/finance-manager';
import { useProfile } from '../../contexts/ProfileContext';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountData) => Promise<void>;
  account?: FinancialAccount | null;
  loading?: boolean;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  account,
  loading = false
}) => {
  const { profile } = useProfile();
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    type: 'bank_savings',
    balance: 0,
    institution: '',
    platform: '',
    account_number: '',
    currency: profile?.primaryCurrency || 'USD'
  });

  const [showInitialBalance, setShowInitialBalance] = useState(false);
  const [conversionInfo, setConversionInfo] = useState<{
    needsConversion: boolean;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        institution: account.institution || '',
        platform: account.platform || '',
        account_number: account.account_number || '',
        currency: account.currency
      });
      setShowInitialBalance(false);
    } else {
      setFormData({
        name: '',
        type: 'bank_savings',
        balance: 0,
        institution: '',
        platform: '',
        account_number: '',
        currency: profile?.primaryCurrency || 'USD'
      });
      setShowInitialBalance(true);
    }
    setErrors({});
  }, [account, isOpen, profile?.primaryCurrency]);

  // Calculate conversion when form data or profile changes
  useEffect(() => {
    if (profile?.primaryCurrency && (formData.balance || 0) > 0) {
      calculateCurrencyConversion();
    }
  }, [formData.currency, formData.balance, profile?.primaryCurrency]);

  const handleInputChange = (field: keyof CreateAccountData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Calculate currency conversion when currency or balance changes
    if ((field === 'currency' || field === 'balance') && profile?.primaryCurrency) {
      calculateCurrencyConversion();
    }
  };

  const calculateCurrencyConversion = async () => {
    if (!profile?.primaryCurrency || !formData.balance) {
      setConversionInfo(null);
      return;
    }

    const needsConversion = formData.currency !== profile.primaryCurrency;
    if (!needsConversion) {
      setConversionInfo({
        needsConversion: false,
        convertedAmount: formData.balance || 0,
        convertedCurrency: profile.primaryCurrency,
        exchangeRate: 1.0
      });
      return;
    }

    // Ensure we have fresh rates before conversion
    await currencyService.refreshRates();
    
    const conversionData = currencyService.processAccountCreation(
      formData.currency || 'USD',
      formData.balance || 0,
      profile.primaryCurrency
    );

    setConversionInfo({
      needsConversion: conversionData.needsConversion,
      convertedAmount: conversionData.convertedAmount,
      convertedCurrency: conversionData.convertedCurrency,
      exchangeRate: conversionData.exchangeRate
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    // Allow negative balances for credit cards and investment accounts
    const allowsNegativeBalance = ['credit_card', 'investment'].includes(formData.type);
    if (!allowsNegativeBalance && (formData.balance || 0) < 0) {
      newErrors.balance = 'Balance cannot be negative for this account type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting account:', error);
    }
  };

  const accountTypes: { value: FinancialAccount['type']; label: string }[] = [
    { value: 'bank_savings', label: 'Savings Account' },
    { value: 'bank_current', label: 'Current Account' },
    { value: 'bank_student', label: 'Student Account' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'investment', label: 'Investment Account' }
  ];


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Edit Account' : 'Add New Account'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Account Name *
          </label>
          <Input
            type="text"
            placeholder="e.g., My Savings Account"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name || ''}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Account Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as FinancialAccount['type'])}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)'
            }}
          >
            {accountTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">💰</span>
              </div>
              <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Initial Balance *
              </label>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Current amount in account
              </span>
            </div>
            {!account && (
              <button
                type="button"
                onClick={() => setShowInitialBalance(!showInitialBalance)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {showInitialBalance ? 'Hide' : 'Set Initial Balance'}
              </button>
            )}
          </div>
          
          {showInitialBalance && (
            <>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-600">
                  {formatCurrency(1, formData.currency || 'USD').charAt(0)}
                </span>
                <Input
                  type="number"
                  placeholder={['credit_card', 'investment'].includes(formData.type) ? "-0.00" : "0.00"}
                  value={formData.balance || ''}
                  onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                  error={errors.balance || ''}
                  className="flex-1"
                />
              </div>
              
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">
                  {['credit_card', 'investment'].includes(formData.type) 
                    ? "Enter current balance (negative for debt/overdrawn accounts)"
                    : "This will be your starting balance for this account"
                  }
                </p>
                
                {/* Currency Conversion Display */}
                {conversionInfo && (formData.balance || 0) > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Account Balance:</span>
                      <span className="font-medium">
                        {formatCurrency(formData.balance || 0, formData.currency || 'USD')}
                      </span>
                    </div>
                    {conversionInfo.needsConversion && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Converted to Primary:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(conversionInfo.convertedAmount, conversionInfo.convertedCurrency)}
                        </span>
                      </div>
                    )}
                    {conversionInfo.needsConversion && (
                      <div className="text-xs text-gray-500 mt-1">
                        Exchange Rate: 1 {formData.currency} = {conversionInfo.exchangeRate.toFixed(4)} {conversionInfo.convertedCurrency}
                      </div>
                    )}
                  </div>
                )}
                
                {errors.balance && (
                  <p className="text-xs text-red-600">{errors.balance}</p>
                )}
              </div>
            </>
          )}
          
          {!showInitialBalance && !account && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">Start with zero balance</p>
              <button
                type="button"
                onClick={() => setShowInitialBalance(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Or set initial balance
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Account Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)'
            }}
          >
            {CURRENCIES.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.flag} {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose the currency for this specific account
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Institution (Optional)
          </label>
          <Input
            type="text"
            placeholder="e.g., Chase Bank, PayPal"
            value={formData.institution}
            onChange={(e) => handleInputChange('institution', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Platform (Optional)
          </label>
          <Input
            type="text"
            placeholder="e.g., Mobile App, Online Banking"
            value={formData.platform}
            onChange={(e) => handleInputChange('platform', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Account Number (Optional)
          </label>
          <Input
            type="text"
            placeholder="Last 4 digits or reference"
            value={formData.account_number}
            onChange={(e) => handleInputChange('account_number', e.target.value)}
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            {account ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
