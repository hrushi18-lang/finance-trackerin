import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { FinancialAccount } from '../../types';
import { formatCurrency, convertCurrency, needsConversion } from '../../utils/currency-converter';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromAccount: FinancialAccount;
  accounts: FinancialAccount[];
  onTransfer: (data: TransferData) => Promise<void>;
}

interface TransferData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount?: number;
  exchangeRate?: number;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  fromAccount,
  accounts,
  onTransfer
}) => {
  const [formData, setFormData] = useState<TransferData>({
    fromAccountId: fromAccount.id,
    toAccountId: '',
    amount: 0,
    description: '',
    fromCurrency: fromAccount.currency,
    toCurrency: '',
    convertedAmount: 0,
    exchangeRate: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableAccounts = accounts.filter(acc => acc.id !== fromAccount.id);

  useEffect(() => {
    if (formData.toAccountId) {
      const toAccount = accounts.find(acc => acc.id === formData.toAccountId);
      if (toAccount) {
        setFormData(prev => ({
          ...prev,
          toCurrency: toAccount.currency,
          exchangeRate: 1
        }));
      }
    }
  }, [formData.toAccountId, accounts]);

  useEffect(() => {
    if (formData.amount > 0 && formData.toCurrency) {
      const needsConv = needsConversion(formData.fromCurrency, formData.toCurrency);
      if (needsConv) {
        const converted = convertCurrency(formData.amount, formData.fromCurrency, formData.toCurrency);
        const rate = converted ? converted / formData.amount : 1;
        setFormData(prev => ({
          ...prev,
          convertedAmount: converted || 0,
          exchangeRate: rate
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          convertedAmount: formData.amount,
          exchangeRate: 1
        }));
      }
    }
  }, [formData.amount, formData.fromCurrency, formData.toCurrency]);

  const handleInputChange = (field: keyof TransferData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.toAccountId) {
      newErrors.toAccountId = 'Please select destination account';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.amount > fromAccount.balance) {
      newErrors.amount = 'Insufficient funds in source account';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onTransfer(formData);
      onClose();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsConversionCheck = needsConversion(formData.fromCurrency, formData.toCurrency);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Between Accounts"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* From Account */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            From Account
          </label>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{fromAccount.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {fromAccount.type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(fromAccount.balance, fromAccount.currency)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Available Balance
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Arrow */}
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ArrowRightLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        {/* To Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To Account
          </label>
          <select
            value={formData.toAccountId}
            onChange={(e) => handleInputChange('toAccountId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select destination account...</option>
            {availableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type.replace('_', ' ')}) - {formatCurrency(account.balance, account.currency)}
              </option>
            ))}
          </select>
          {errors.toAccountId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.toAccountId}</p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transfer Amount
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
              {formatCurrency(1, formData.fromCurrency).charAt(0)}
            </span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              error={errors.amount}
              className="flex-1"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
          )}
        </div>

        {/* Currency Conversion Display */}
        {needsConversionCheck && formData.amount > 0 && formData.toCurrency && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Currency Conversion
              </span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              <p>
                {formatCurrency(formData.amount, formData.fromCurrency)} → {formatCurrency(formData.convertedAmount || 0, formData.toCurrency)}
              </p>
              <p className="text-xs mt-1">
                Exchange Rate: 1 {formData.fromCurrency} = {formData.exchangeRate?.toFixed(4)} {formData.toCurrency}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <Input
            type="text"
            placeholder="e.g., Transfer to savings, Emergency fund transfer"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            error={errors.description}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
        </div>

        {/* Warning for insufficient funds */}
        {formData.amount > fromAccount.balance && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">
                Insufficient funds. Available: {formatCurrency(fromAccount.balance, fromAccount.currency)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting || formData.amount > fromAccount.balance}
          >
            {isSubmitting ? 'Processing...' : 'Transfer Funds'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
