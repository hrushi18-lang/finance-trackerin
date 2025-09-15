import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, DollarSign, CreditCard, Wallet, Target, AlertCircle, ArrowRightLeft, Loader2, CheckCircle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';
// Removed ManualCurrencyEntry - only 4 currencies supported
import { Decimal } from 'decimal.js';

export interface UniversalPaymentData {
  amount: number;
  description: string;
  accountId: string;
  deductFromBalance: boolean;
  paymentType: 'contribution' | 'payment' | 'transfer' | 'withdrawal';
  category: string;
  notes?: string;
  currency: string;
}

interface UniversalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UniversalPaymentData) => Promise<void>;
  title: string;
  submitText: string;
  defaultValues?: Partial<UniversalPaymentData>;
  paymentType?: 'contribution' | 'payment' | 'transfer' | 'withdrawal';
  linkedEntity?: {
    type: 'goal' | 'bill' | 'liability';
    id: string;
    name: string;
  };
}

export const UniversalPaymentModal: React.FC<UniversalPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitText,
  defaultValues = {},
  paymentType = 'payment',
  linkedEntity
}) => {
  const { accounts, executeCurrencyTransaction, executeBillPayment, executeLiabilityPayment, executeGoalContribution } = useFinance();
  const { primaryCurrency, formatCurrency } = useInternationalization();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(defaultValues.currency || primaryCurrency.code);
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [conversionPreview, setConversionPreview] = useState<{
    accountAmount: number;
    accountCurrency: string;
    primaryAmount: number;
    primaryCurrency: string;
    exchangeRate: number;
    conversionCase: string;
  } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  // Removed manual entry state - only 4 currencies supported

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UniversalPaymentData>({
    defaultValues: {
      amount: 0,
      description: '',
      accountId: '',
      deductFromBalance: true,
      paymentType,
      category: 'General',
      notes: '',
      currency: selectedCurrency,
      ...defaultValues
    }
  });

  const watchedAmount = watch('amount');
  const watchedAccountId = watch('accountId');
  const watchedDeductFromBalance = watch('deductFromBalance');

  // Update selected account when accountId changes
  useEffect(() => {
    if (watchedAccountId) {
      const account = accounts.find(acc => acc.id === watchedAccountId);
      setSelectedAccount(account || null);
    }
  }, [watchedAccountId, accounts]);

  // Update currency when account changes
  useEffect(() => {
    if (selectedAccount) {
      setSelectedCurrency(selectedAccount.currencycode);
      setValue('currency', selectedAccount.currencycode);
    }
  }, [selectedAccount, setValue]);

  // Generate conversion preview
  useEffect(() => {
    if (watchedAmount && selectedCurrency && selectedAccount) {
      generateConversionPreview();
    } else {
      setConversionPreview(null);
      setConversionError(null);
    }
  }, [watchedAmount, selectedCurrency, selectedAccount]);

  const generateConversionPreview = async () => {
    if (!watchedAmount || !selectedCurrency || !selectedAccount) return;

    try {
      setConversionError(null);
      
      // All currencies are supported now (only 4 currencies)

      // Use simple currency service for conversion
      const conversion = simpleCurrencyService.convertForTransaction(
        Number(watchedAmount),
        selectedCurrency,
        selectedAccount.currencycode,
        primaryCurrency.code
      );
      
      setConversionPreview({
        accountAmount: conversion.accountAmount,
        accountCurrency: conversion.accountCurrency,
        primaryAmount: conversion.primaryAmount,
        primaryCurrency: conversion.primaryCurrency,
        exchangeRate: conversion.exchangeRate,
        conversionCase: 'hardcoded'
      });
    } catch (error: any) {
      console.error('Conversion preview error:', error);
      setConversionError(error.message);
    }
  };

  const handleFormSubmit = async (data: UniversalPaymentData) => {
    try {
      setIsSubmitting(true);
      
      const amount = Number(data.amount) || 0;
      
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (!data.accountId) {
        throw new Error('Please select an account');
      }

      // Use simple currency service for all supported currencies
      const account = accounts.find(acc => acc.id === data.accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const conversion = simpleCurrencyService.convertForTransaction(
        amount,
        selectedCurrency,
        account.currencycode,
        primaryCurrency.code
      );
      
      const conversionData = {
        ...data,
        amount: conversion.accountAmount,
        currency: account.currencycode,
        originalAmount: amount,
        originalCurrency: selectedCurrency,
        primaryAmount: conversion.primaryAmount,
        exchangeRate: conversion.exchangeRate,
        conversionSource: 'hardcoded'
      };
      
      await onSubmit(conversionData);
      onClose();
      return;

      // All currencies are now handled by simple currency service above
    } catch (error: any) {
      console.error('Payment execution error:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConversionCaseDescription = (caseType: string) => {
    switch (caseType) {
      case 'all_same':
        return 'No conversion needed - all currencies match';
      case 'amount_account_same':
        return 'Amount matches account currency, converting to primary for net worth';
      case 'amount_primary_same':
        return 'Amount matches primary currency, converting to account currency';
      case 'account_primary_same':
        return 'Account and primary currencies match, converting amount';
      case 'all_different':
        return 'All currencies different - converting to both account and primary';
      case 'amount_different_others_same':
        return 'Amount currency different, account and primary match';
      default:
        return 'Currency conversion';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Linked Entity Display */}
        {linkedEntity && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <Target size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {linkedEntity.type === 'goal' ? 'Goal Contribution' : 
                   linkedEntity.type === 'bill' ? 'Bill Payment' : 'Liability Payment'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{linkedEntity.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Amount & Currency</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                icon={<DollarSign size={18} className="text-blue-500" />}
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                error={errors.amount?.message}
                className="text-lg font-semibold"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Select
                label="Currency"
                value={selectedCurrency}
                onChange={(value) => {
                  setSelectedCurrency(value);
                  setValue('currency', value);
                }}
                options={[
                  { value: 'INR', label: 'INR - Indian Rupee' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' }
                ]}
                icon={<CurrencyIcon currency={selectedCurrency} size={18} />}
              />
            </div>
          </div>
        </div>

        {/* Conversion Preview */}
        {conversionPreview && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <h4 className="font-medium text-green-900 dark:text-green-100">Conversion Preview</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">You're paying:</span>
                <span className="font-medium">
                  {simpleCurrencyService.formatAmount(watchedAmount, selectedCurrency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">From account:</span>
                <span className="font-medium">
                  {simpleCurrencyService.formatAmount(conversionPreview.accountAmount, conversionPreview.accountCurrency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Net worth impact:</span>
                <span className="font-medium">
                  {simpleCurrencyService.formatAmount(conversionPreview.primaryAmount, conversionPreview.primaryCurrency)}
                </span>
              </div>
              
              {conversionPreview.exchangeRate !== 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Exchange rate:</span>
                  <span className="font-medium">
                    1 {selectedCurrency} = {conversionPreview.exchangeRate.toFixed(4)} {conversionPreview.accountCurrency}
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t border-green-200 dark:border-green-700">
                <p className="text-xs text-green-700 dark:text-green-300">
                  Rates based on INR: 1 USD = ₹88.20, 1 EUR = ₹103.60, 1 GBP = ₹118.50
                </p>
              </div>
              
              {conversionPreview.rateTimestamp && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rate as of:</span>
                  <span className="font-medium text-xs">
                    {new Date(conversionPreview.rateTimestamp).toISOString().split('T')[0]} {new Date(conversionPreview.rateTimestamp).toTimeString().split(' ')[0]} UTC
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t border-green-200 dark:border-green-700">
                <p className="text-xs text-green-700 dark:text-green-300">
                  {getConversionCaseDescription(conversionPreview.conversionCase)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Currency Entry removed - only 4 currencies supported */}

        {/* Conversion Error */}
        {conversionError && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                Conversion failed: {conversionError}
              </span>
            </div>
          </div>
        )}

        {/* Account Selection */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h3>
          
          <Select
            label="Pay From Account"
            value={watchedAccountId}
            onChange={(value) => setValue('accountId', value)}
            options={accounts.map(account => ({
              value: account.id,
              label: `${account.name} - ${currencyConversionService.formatAmount(new Decimal(account.balance), account.currencycode)} (${account.type.replace('_', ' ')})`
            }))}
            icon={<Wallet size={18} className="text-gray-500" />}
            error={errors.accountId?.message}
          />
        </div>

        {/* Description */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
          
          <Input
            label="Description"
            type="text"
            icon={<CreditCard size={18} className="text-gray-500" />}
            {...register('description', { required: 'Description is required' })}
            error={errors.description?.message}
            placeholder="e.g., Monthly bill payment"
          />
        </div>

        {/* Payment Options */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Options</h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('deductFromBalance')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Deduct from account balance
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || !conversionPreview || !!conversionError}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};