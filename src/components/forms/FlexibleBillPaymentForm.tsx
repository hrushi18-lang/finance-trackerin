import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { Bill, FinancialAccount } from '../../types';

interface FlexibleBillPaymentFormData {
  amount: number;
  accountId: string;
  description: string;
  paymentType: 'full' | 'partial' | 'extra' | 'skip';
  skipReason?: string;
}

interface FlexibleBillPaymentFormProps {
  bill: Bill;
  accounts: FinancialAccount[];
  onSubmit: (data: FlexibleBillPaymentFormData) => void;
  onCancel: () => void;
}

export const FlexibleBillPaymentForm: React.FC<FlexibleBillPaymentFormProps> = ({ 
  bill, 
  accounts, 
  onSubmit, 
  onCancel 
}) => {
  const { currency, formatCurrency } = useInternationalization();
  const [paymentImpact, setPaymentImpact] = useState<{
    newBalance: number;
    accountName: string;
    paymentStatus: string;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FlexibleBillPaymentFormData>({
    defaultValues: {
      description: `Payment for ${bill.title}`,
      amount: bill.amount,
      accountId: bill.defaultAccountId || accounts?.[0]?.id || '',
      paymentType: 'full',
      skipReason: ''
    },
  });

  const watchedAmount = watch('amount');
  const watchedAccountId = watch('accountId');
  const watchedPaymentType = watch('paymentType');

  // Calculate payment impact when amount, account, or payment type changes
  useEffect(() => {
    if (bill && watchedAmount && watchedAccountId && watchedPaymentType !== 'skip') {
      const paymentAmount = Number(watchedAmount) || 0;
      const selectedAccount = accounts.find(a => a.id === watchedAccountId);
      
      if (paymentAmount > 0 && selectedAccount && !isNaN(paymentAmount)) {
        const currentBalance = Number(selectedAccount.balance) || 0;
        const newBalance = currentBalance - paymentAmount;
        
        let paymentStatus = '';
        if (watchedPaymentType === 'full') {
          paymentStatus = paymentAmount === bill.amount ? 'Full payment' : 'Custom amount';
        } else if (watchedPaymentType === 'partial') {
          paymentStatus = `Partial payment (${((paymentAmount / bill.amount) * 100).toFixed(1)}%)`;
        } else if (watchedPaymentType === 'extra') {
          paymentStatus = `Extra payment (+${formatCurrency(paymentAmount - bill.amount)})`;
        }
        
        setPaymentImpact({ newBalance, accountName: selectedAccount.name, paymentStatus });
      } else {
        setPaymentImpact(null);
      }
    } else if (watchedPaymentType === 'skip') {
      setPaymentImpact(null);
    } else {
      setPaymentImpact(null);
    }
  }, [watchedAmount, watchedAccountId, watchedPaymentType, bill, accounts, formatCurrency]);

  const handleFormSubmit = (data: FlexibleBillPaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      const amount = Number(data.amount) || 0;
      const selectedAccount = accounts.find(a => a.id === data.accountId);
      
      if (data.paymentType !== 'skip' && amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }
      
      if (data.paymentType !== 'skip' && !selectedAccount) {
        throw new Error('Please select an account');
      }
      
      // Check if account has sufficient balance (only for non-skip payments)
      if (data.paymentType !== 'skip' && selectedAccount) {
        const currentBalance = Number(selectedAccount.balance) || 0;
        if (amount > currentBalance) {
          const confirmed = window.confirm(`Payment of ${formatCurrency(amount)} exceeds account balance of ${formatCurrency(currentBalance)}. Continue anyway?`);
          if (!confirmed) {
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      onSubmit({
        amount: data.paymentType === 'skip' ? 0 : amount,
        accountId: data.accountId,
        description: data.description || `Payment for ${bill.title}`,
        paymentType: data.paymentType,
        skipReason: data.skipReason
      });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setValue('amount', amount);
  };

  const handlePaymentTypeChange = (type: 'full' | 'partial' | 'extra' | 'skip') => {
    setValue('paymentType', type);
    if (type === 'full') {
      setValue('amount', bill.amount);
    } else if (type === 'skip') {
      setValue('amount', 0);
    }
  };

  if (!bill) return null;

  return (
    <div className="space-y-6">
      {/* Bill Information */}
      <div className="bg-gray-50 dark:bg-forest-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-forest-100 mb-2">
          {bill.title}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-forest-400">Amount Due:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-forest-100">
              {formatCurrency(bill.amount)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-forest-400">Due Date:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-forest-100">
              {bill.nextDueDate.toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-forest-400">Category:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-forest-100">
              {bill.category}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-forest-400">Frequency:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-forest-100 capitalize">
              {bill.frequency}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Type Selection */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-forest-100">
          Payment Type
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handlePaymentTypeChange('full')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              watchedPaymentType === 'full'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-forest-700 hover:border-gray-300 dark:hover:border-forest-600'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-forest-100">
              Full Payment
            </div>
            <div className="text-xs text-gray-600 dark:text-forest-400">
              Pay {formatCurrency(bill.amount)}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handlePaymentTypeChange('partial')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              watchedPaymentType === 'partial'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-forest-700 hover:border-gray-300 dark:hover:border-forest-600'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-forest-100">
              Partial Payment
            </div>
            <div className="text-xs text-gray-600 dark:text-forest-400">
              Pay less than due
            </div>
          </button>

          <button
            type="button"
            onClick={() => handlePaymentTypeChange('extra')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              watchedPaymentType === 'extra'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-forest-700 hover:border-gray-300 dark:hover:border-forest-600'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-forest-100">
              Extra Payment
            </div>
            <div className="text-xs text-gray-600 dark:text-forest-400">
              Pay more than due
            </div>
          </button>

          <button
            type="button"
            onClick={() => handlePaymentTypeChange('skip')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              watchedPaymentType === 'skip'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-forest-700 hover:border-gray-300 dark:hover:border-forest-600'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-forest-100">
              Skip Payment
            </div>
            <div className="text-xs text-gray-600 dark:text-forest-400">
              Skip this month
            </div>
          </button>
        </div>
      </div>

      {/* Payment Amount (hidden for skip) */}
      {watchedPaymentType !== 'skip' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-forest-300 mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-forest-400">
                {currency.symbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { 
                  required: 'Payment amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-forest-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-forest-700 dark:text-forest-100"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-forest-300">
              Quick Amounts
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(bill.amount * 0.25)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-forest-700 text-gray-700 dark:text-forest-300 rounded-md hover:bg-gray-200 dark:hover:bg-forest-600"
              >
                25% ({formatCurrency(bill.amount * 0.25)})
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(bill.amount * 0.5)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-forest-700 text-gray-700 dark:text-forest-300 rounded-md hover:bg-gray-200 dark:hover:bg-forest-600"
              >
                50% ({formatCurrency(bill.amount * 0.5)})
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(bill.amount * 0.75)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-forest-700 text-gray-700 dark:text-forest-300 rounded-md hover:bg-gray-200 dark:hover:bg-forest-600"
              >
                75% ({formatCurrency(bill.amount * 0.75)})
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(bill.amount)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-forest-700 text-gray-700 dark:text-forest-300 rounded-md hover:bg-gray-200 dark:hover:bg-forest-600"
              >
                Full ({formatCurrency(bill.amount)})
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(bill.amount * 1.5)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-forest-700 text-gray-700 dark:text-forest-300 rounded-md hover:bg-gray-200 dark:hover:bg-forest-600"
              >
                150% ({formatCurrency(bill.amount * 1.5)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Reason (only for skip payment) */}
      {watchedPaymentType === 'skip' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-forest-300 mb-2">
            Reason for Skipping (Optional)
          </label>
          <textarea
            {...register('skipReason')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-forest-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-forest-700 dark:text-forest-100"
            placeholder="e.g., Financial hardship, payment delayed, etc."
          />
        </div>
      )}

      {/* Account Selection (hidden for skip) */}
      {watchedPaymentType !== 'skip' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-forest-300 mb-2">
            Payment Account
          </label>
          <select
            {...register('accountId', { required: 'Please select an account' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-forest-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-forest-700 dark:text-forest-100"
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {formatCurrency(account.balance)}
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.accountId.message}
            </p>
          )}
        </div>
      )}

      {/* Payment Impact */}
      {paymentImpact && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Payment Impact
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <div>Account: {paymentImpact.accountName}</div>
            <div>New Balance: {formatCurrency(paymentImpact.newBalance)}</div>
            <div>Status: {paymentImpact.paymentStatus}</div>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-forest-300 mb-2">
          Description
        </label>
        <input
          type="text"
          {...register('description')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-forest-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-forest-700 dark:text-forest-100"
          placeholder="Payment description"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-forest-300 bg-gray-100 dark:bg-forest-700 hover:bg-gray-200 dark:hover:bg-forest-600 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            watchedPaymentType === 'skip'
              ? 'bg-red-600 hover:bg-red-700'
              : watchedPaymentType === 'partial'
              ? 'bg-orange-600 hover:bg-orange-700'
              : watchedPaymentType === 'extra'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-purple-600 hover:bg-purple-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'Processing...' : 
           watchedPaymentType === 'skip' ? 'Skip Payment' :
           watchedPaymentType === 'partial' ? 'Make Partial Payment' :
           watchedPaymentType === 'extra' ? 'Make Extra Payment' :
           'Pay Bill'}
        </button>
      </div>
    </div>
  );
};
