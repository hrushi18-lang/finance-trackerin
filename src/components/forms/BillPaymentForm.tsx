import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Calculator, Info, AlertTriangle, CreditCard, ArrowRightLeft } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Bill, FinancialAccount } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { CurrencyConversionModal } from '../modals/CurrencyConversionModal';
import { useCurrencyConversion } from '../../hooks/useCurrencyConversion';

interface BillPaymentFormData {
  amount: number;
  description: string;
  accountId: string;
}

interface BillPaymentFormProps {
  bill?: Bill;
  accounts: FinancialAccount[];
  onSubmit: (data: BillPaymentFormData) => void;
  onCancel: () => void;
}

export const BillPaymentForm: React.FC<BillPaymentFormProps> = ({ bill, accounts, onSubmit, onCancel }) => {
  const { currency, formatCurrency } = useInternationalization();
  const { needsConversion, convertAmount, formatCurrencyAmount } = useCurrencyConversion();
  const [paymentImpact, setPaymentImpact] = useState<{
    newBalance: number;
    accountName: string;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [conversionData, setConversionData] = useState<{
    originalAmount: number;
    convertedAmount: number;
    originalCurrency: string;
    targetCurrency: string;
  } | null>(null);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BillPaymentFormData>({
    defaultValues: {
      description: bill ? `Bill payment: ${bill.title}` : '',
      amount: bill?.amount || 0,
      accountId: bill?.defaultAccountId || accounts?.[0]?.id || '',
    },
  });

  const watchedAmount = watch('amount');
  const watchedAccountId = watch('accountId');

  // Check if currency conversion is needed
  const selectedAccount = accounts.find(a => a.id === watchedAccountId);
  const billCurrency = bill?.currencyCode || currency.code;
  const accountCurrency = selectedAccount?.currency || currency.code;
  const needsCurrencyConversion = needsConversion(billCurrency, accountCurrency);

  // Calculate payment impact when amount or account changes
  React.useEffect(() => {
    if (bill && watchedAmount && watchedAccountId) {
      const paymentAmount = Number(watchedAmount) || 0;
      const selectedAccount = accounts.find(a => a.id === watchedAccountId);
      
      if (paymentAmount > 0 && selectedAccount && !isNaN(paymentAmount)) {
        const currentBalance = Number(selectedAccount.balance) || 0;
        const newBalance = currentBalance - paymentAmount;
        setPaymentImpact({ newBalance, accountName: selectedAccount.name });
      } else {
        setPaymentImpact(null);
      }
    } else {
      setPaymentImpact(null);
    }
  }, [watchedAmount, watchedAccountId, bill, accounts]);

  const handleCurrencyConversion = async () => {
    if (!bill || !selectedAccount) return;

    const amount = Number(watchedAmount) || 0;
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const conversion = await convertAmount(amount, billCurrency, accountCurrency);
      setConversionData({
        originalAmount: conversion.originalAmount,
        convertedAmount: conversion.convertedAmount,
        originalCurrency: conversion.originalCurrency,
        targetCurrency: conversion.targetCurrency
      });
      setShowConversionModal(true);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Failed to convert currency');
    }
  };

  const handleConversionConfirm = (convertedAmount: number, originalAmount: number, rate: number) => {
    // Update the form with the converted amount
    setValue('amount', convertedAmount);
    setConversionData(null);
  };

  const handleFormSubmit = (data: BillPaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      const amount = Number(data.amount) || 0;
      const selectedAccount = accounts.find(a => a.id === data.accountId);
      
      if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }
      
      if (!selectedAccount) {
        throw new Error('Please select an account');
      }
      
      // Check if account has sufficient balance
      const currentBalance = Number(selectedAccount.balance) || 0;
      if (amount > currentBalance) {
        const confirmed = window.confirm(`Payment of ${formatCurrency(amount)} exceeds account balance of ${formatCurrency(currentBalance)}. Continue anyway?`);
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }
      
      onSubmit({
        amount: Number(amount) || 0,
        description: data.description || `Bill payment: ${bill?.title}`,
        accountId: data.accountId,
      });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setIsSubmitting(false);
    } finally {
      // Don't reset here as parent handles it
    }
  };

  const handleQuickAmount = (amount: number) => {
    setValue('amount', amount);
  };

  if (!bill) return null;

  return (
    <div className="space-y-6">
      {/* Header with Info */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <CreditCard size={20} className="mr-2 text-blue-400" />
          Pay Bill
        </h3>
        <p className="text-gray-300 text-sm">
          Pay your {bill.category} bill and update your account balance.
        </p>
      </div>

      {/* Bill Info */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="font-semibold text-white mb-3">{bill.title}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-black/20 p-3 rounded-lg">
            <span className="text-gray-400">Amount:</span>
            <span className="font-medium ml-2 text-white">
              <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
              {formatCurrency(bill.amount)}
            </span>
          </div>
          <div className="bg-black/20 p-3 rounded-lg">
            <span className="text-gray-400">Category:</span>
            <span className="font-medium ml-2 text-white">{bill.category}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Account Selection */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Pay From Account
          </label>
          <select
            {...register('accountId', { required: 'Please select an account' })}
            className="w-full bg-black/40 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {formatCurrency(account.balance)} ({account.type.replace('_', ' ')})
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="text-red-400 text-sm mt-1">{errors.accountId.message}</p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Quick Amounts
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(bill.amount)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Full Amount
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(bill.amount * 0.5)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Half Amount
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(bill.amount * 1.5)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
              1.5x
            </Button>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            icon={<CurrencyIcon currencyCode={currency.code} className="text-success-400" />}
            {...register('amount', {
              required: 'Payment amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
            })}
            error={errors.amount?.message}
            className="bg-black/40 border-white/20 text-white"
            placeholder={`e.g., ${bill.amount}`}
          />
          
          {/* Currency Conversion Button */}
          {needsCurrencyConversion && watchedAmount && watchedAmount > 0 && (
            <div className="mt-3">
              <Button
                type="button"
                onClick={handleCurrencyConversion}
                variant="outline"
                className="w-full bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Convert {formatCurrencyAmount(Number(watchedAmount), billCurrency)} to {accountCurrency}
              </Button>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Bill is in {billCurrency}, account is in {accountCurrency}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Description (Optional)"
            type="text"
            icon={<FileText size={18} className="text-blue-400" />}
            {...register('description')}
            error={errors.description?.message}
            className="bg-black/40 border-white/20 text-white"
            placeholder="e.g., Monthly bill payment"
          />
        </div>

        {/* Payment Impact Preview */}
        {paymentImpact && watchedAmount && !isNaN(Number(watchedAmount)) && Number(watchedAmount) > 0 && (
          <div className="bg-success-500/20 rounded-lg p-4 border border-success-500/30">
            <div className="flex items-center text-success-400 mb-2">
              <Calculator size={16} className="mr-2" />
              <span className="font-medium">Payment Impact</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Account:</span>
                <span className="font-medium text-white">{paymentImpact.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">New Balance:</span>
                <span className={`font-medium ${paymentImpact.newBalance < 0 ? 'text-red-400' : 'text-white'}`}>
                  {formatCurrency(paymentImpact.newBalance)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center text-blue-400 mb-2">
            <Info size={16} className="mr-2" />
            <span className="font-medium">Payment Impact</span>
          </div>
          <p className="text-sm text-blue-300">
            This payment will be recorded as a bill payment expense in your transactions. 
            Your selected account balance will be reduced by the payment amount.
          </p>
        </div>

        {/* Warning for insufficient balance */}
        {paymentImpact && paymentImpact.newBalance < 0 && (
          <div className="bg-warning-500/20 rounded-lg p-4 border border-warning-500/30">
            <div className="flex items-start space-x-2">
              <AlertTriangle size={16} className="text-warning-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-warning-400 font-medium">Insufficient Balance</p>
                <p className="text-warning-300">
                  This payment will result in a negative account balance. 
                  Please confirm this is intentional.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Pay Bill'}
          </Button>
        </div>
      </form>

      {/* Currency Conversion Modal */}
      {conversionData && (
        <CurrencyConversionModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onConfirm={handleConversionConfirm}
          originalAmount={conversionData.originalAmount}
          originalCurrency={conversionData.originalCurrency}
          targetCurrency={conversionData.targetCurrency}
          billTitle={bill?.title}
          paymentType="payment"
        />
      )}
    </div>
  );
};
