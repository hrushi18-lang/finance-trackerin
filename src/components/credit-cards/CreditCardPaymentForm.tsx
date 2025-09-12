import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, DollarSign, Calendar, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useCreditCardBills } from '../../contexts/CreditCardBillContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CreditCardPaymentFormData, CreditCardBillCycle } from '../../types/credit_card_bills';

interface CreditCardPaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreditCardPaymentFormData) => Promise<void>;
  billCycle: CreditCardBillCycle;
}

export const CreditCardPaymentForm: React.FC<CreditCardPaymentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  billCycle
}) => {
  const { accounts } = useFinance();
  const { formatCurrency, convertCurrency } = useInternationalization();
  const { calculateMinimumDue } = useCreditCardBills();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'full' | 'minimum' | 'partial' | 'overpayment'>('minimum');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [needsConversion, setNeedsConversion] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<CreditCardPaymentFormData>({
    defaultValues: {
      billCycleId: billCycle.id,
      paymentAmount: 0,
      paymentType: 'minimum',
      paymentMethod: 'bank_transfer',
      sourceAccountId: '',
      notes: ''
    }
  });

  const watchedSourceAccount = watch('sourceAccountId');
  const watchedAmount = watch('paymentAmount');

  // Get available payment accounts (non-credit card accounts)
  const paymentAccounts = accounts.filter(account => 
    account.type !== 'credit_card' && 
    account.isVisible && 
    account.balance > 0
  );

  // Calculate payment amounts
  const minimumDue = billCycle.minimumDue;
  const fullBalance = billCycle.remainingBalance;
  const suggestedAmounts = {
    minimum: minimumDue,
    full: fullBalance,
    partial: Math.min(fullBalance * 0.5, fullBalance), // 50% of balance
    overpayment: fullBalance * 1.1 // 10% over
  };

  // Handle payment type change
  useEffect(() => {
    if (paymentType === 'minimum') {
      setValue('paymentAmount', minimumDue);
      setCustomAmount(minimumDue);
    } else if (paymentType === 'full') {
      setValue('paymentAmount', fullBalance);
      setCustomAmount(fullBalance);
    } else if (paymentType === 'partial') {
      setValue('paymentAmount', suggestedAmounts.partial);
      setCustomAmount(suggestedAmounts.partial);
    } else if (paymentType === 'overpayment') {
      setValue('paymentAmount', suggestedAmounts.overpayment);
      setCustomAmount(suggestedAmounts.overpayment);
    }
  }, [paymentType, minimumDue, fullBalance, suggestedAmounts, setValue]);

  // Handle custom amount change
  useEffect(() => {
    if (paymentType === 'partial' && customAmount > 0) {
      setValue('paymentAmount', customAmount);
    }
  }, [customAmount, paymentType, setValue]);

  // Check if currency conversion is needed
  useEffect(() => {
    if (watchedSourceAccount && watchedAmount > 0) {
      const sourceAccount = accounts.find(acc => acc.id === watchedSourceAccount);
      if (sourceAccount && sourceAccount.currency !== billCycle.currencyCode) {
        setNeedsConversion(true);
        const converted = convertCurrency(watchedAmount, sourceAccount.currency, billCycle.currencyCode);
        setConvertedAmount(converted || 0);
      } else {
        setNeedsConversion(false);
        setConvertedAmount(watchedAmount);
      }
    }
  }, [watchedSourceAccount, watchedAmount, accounts, billCycle.currencyCode, convertCurrency]);

  const handleFormSubmit = async (data: CreditCardPaymentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate payment amount
      if (data.paymentAmount <= 0) {
        setError('Payment amount must be greater than 0');
        return;
      }
      
      if (data.paymentAmount > fullBalance && paymentType !== 'overpayment') {
        setError('Payment amount cannot exceed the remaining balance');
        return;
      }
      
      if (!data.sourceAccountId) {
        setError('Please select a source account');
        return;
      }
      
      // Check if source account has sufficient balance
      const sourceAccount = accounts.find(acc => acc.id === data.sourceAccountId);
      if (sourceAccount && data.paymentAmount > sourceAccount.balance) {
        setError('Insufficient balance in source account');
        return;
      }
      
      await onSubmit(data);
      reset();
      onClose();
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setPaymentType('minimum');
    setCustomAmount(0);
    onClose();
  };

  const handlePaymentTypeChange = (type: 'full' | 'minimum' | 'partial' | 'overpayment') => {
    setPaymentType(type);
    setValue('paymentType', type);
  };

  const handleCustomAmountChange = (amount: number) => {
    setCustomAmount(amount);
    if (paymentType === 'partial') {
      setValue('paymentAmount', amount);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Make Credit Card Payment">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bill Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Bill Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Remaining Balance:</span>
              <p className="font-medium">{formatCurrency(billCycle.remainingBalance, billCycle.currencyCode)}</p>
            </div>
            <div>
              <span className="text-gray-600">Minimum Due:</span>
              <p className="font-medium">{formatCurrency(billCycle.minimumDue, billCycle.currencyCode)}</p>
            </div>
            <div>
              <span className="text-gray-600">Due Date:</span>
              <p className="font-medium">{billCycle.dueDate.toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <p className="font-medium capitalize">{billCycle.paymentStatus.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Payment Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handlePaymentTypeChange('minimum')}
              className={`p-3 rounded-lg border text-left transition-colors ${
                paymentType === 'minimum'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Minimum Due</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(minimumDue, billCycle.currencyCode)}
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handlePaymentTypeChange('full')}
              className={`p-3 rounded-lg border text-left transition-colors ${
                paymentType === 'full'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Full Balance</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(fullBalance, billCycle.currencyCode)}
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handlePaymentTypeChange('partial')}
              className={`p-3 rounded-lg border text-left transition-colors ${
                paymentType === 'partial'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Partial Payment</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(suggestedAmounts.partial, billCycle.currencyCode)}
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handlePaymentTypeChange('overpayment')}
              className={`p-3 rounded-lg border text-left transition-colors ${
                paymentType === 'overpayment'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Overpayment</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(suggestedAmounts.overpayment, billCycle.currencyCode)}
              </div>
            </button>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Amount
          </label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('paymentAmount', { 
                required: 'Please enter payment amount',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              placeholder="0.00"
              onChange={(e) => {
                const amount = parseFloat(e.target.value) || 0;
                if (paymentType === 'partial') {
                  handleCustomAmountChange(amount);
                }
              }}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{billCycle.currencyCode}</span>
            </div>
          </div>
          {errors.paymentAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentAmount.message}</p>
          )}
          
          {needsConversion && convertedAmount > 0 && (
            <p className="mt-1 text-sm text-gray-600">
              ≈ {formatCurrency(convertedAmount, billCycle.currencyCode)} (converted)
            </p>
          )}
        </div>

        {/* Source Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Account
          </label>
          <select
            {...register('sourceAccountId', { required: 'Please select a source account' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select payment account</option>
            {paymentAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} - {formatCurrency(account.balance, account.currency)} ({account.currency})
              </option>
            ))}
          </select>
          {errors.sourceAccountId && (
            <p className="mt-1 text-sm text-red-600">{errors.sourceAccountId.message}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            {...register('paymentMethod')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="online_banking">Online Banking</option>
            <option value="mobile_app">Mobile App</option>
            <option value="auto_pay">Auto Pay</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add any notes about this payment..."
          />
        </div>

        {/* Payment Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Payment Amount:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(watchedAmount || 0, billCycle.currencyCode)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Remaining After Payment:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(Math.max(0, billCycle.remainingBalance - (watchedAmount || 0)), billCycle.currencyCode)}
              </span>
            </div>
            {watchedAmount && watchedAmount >= minimumDue && (
              <div className="flex items-center text-green-700">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Minimum due requirement met</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !watchedAmount || watchedAmount <= 0}
            className="flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Make Payment
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
