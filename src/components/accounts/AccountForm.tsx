import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { CurrencySelector } from '../currency/CurrencySelector';
import { CurrencyInput } from '../currency/CurrencyInput';
import { LiveRateDisplay } from '../currency/LiveRateDisplay';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { FinancialAccount, CreateAccountData } from '../../lib/finance-manager';

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
  const { displayCurrency, formatCurrency } = useEnhancedCurrency();
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    type: 'bank_savings',
    balance: 0,
    institution: '',
    platform: '',
    account_number: '',
    currency: displayCurrency
  });

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
    } else {
      setFormData({
        name: '',
        type: 'bank_savings',
        balance: 0,
        institution: '',
        platform: '',
        account_number: '',
        currency: displayCurrency
      });
    }
    setErrors({});
  }, [account, isOpen]);

  const handleInputChange = (field: keyof CreateAccountData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Balance cannot be negative';
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
            error={!!errors.name}
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
          <div className="flex items-center space-x-2 mb-3">
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
          
          <CurrencyInput
            value={formData.balance}
            currencyCode={formData.currency}
            onValueChange={(value) => handleInputChange('balance', value)}
            onCurrencyChange={(currency) => handleInputChange('currency', currency)}
            placeholder="Enter current balance"
            error={!!errors.balance}
            className="w-full"
          />
          
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-600">
              This will be your starting balance for this account
            </p>
            {errors.balance && (
              <p className="text-xs text-red-600">{errors.balance}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Currency
          </label>
          <CurrencySelector
            value={formData.currency}
            onChange={(currency) => handleInputChange('currency', currency)}
            showFlag={true}
            showFullName={true}
            popularOnly={false}
          />
          {formData.currency !== displayCurrency && (
            <div className="mt-2">
              <LiveRateDisplay
                fromCurrency={formData.currency}
                toCurrency={displayCurrency}
                amount={formData.balance}
                showTrend={true}
                showLastUpdated={true}
              />
            </div>
          )}
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
