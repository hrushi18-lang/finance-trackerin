import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Calendar, Percent, Wallet, Plus, ToggleLeft, ToggleRight, AlertCircle, Calculator } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface EnhancedLiabilityFormData {
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'purchase' | 'other';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  due_date: string;
  start_date: string;
  createMockTransaction: boolean;
  mockTransactionType: 'down_payment' | 'initial_payment' | 'setup_fee';
  mockTransactionAmount?: number;
  accountId?: string;
  autoSchedulePayments: boolean;
}

interface EnhancedLiabilityFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export const EnhancedLiabilityForm: React.FC<EnhancedLiabilityFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { currency, formatCurrency } = useInternationalization();
  const { accounts } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EnhancedLiabilityFormData>({
    defaultValues: initialData || {
      type: 'loan',
      interestRate: 0,
      due_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      createMockTransaction: false,
      autoSchedulePayments: true
    }
  });

  const selectedType = watch('type');
  const totalAmount = watch('totalAmount');
  const interestRate = watch('interestRate');
  const monthlyPayment = watch('monthlyPayment');
  const createMockTransaction = watch('createMockTransaction');
  const mockTransactionType = watch('mockTransactionType');
  const autoSchedulePayments = watch('autoSchedulePayments');

  const liabilityTypes = [
    { value: 'loan', label: 'Personal Loan', icon: '💰', description: 'Bank loans, personal loans' },
    { value: 'credit_card', label: 'Credit Card', icon: '💳', description: 'Credit card debt' },
    { value: 'mortgage', label: 'Mortgage', icon: '🏠', description: 'Home loan, property loan' },
    { value: 'purchase', label: 'Purchase on Credit', icon: '🛍️', description: 'EMI purchases, installments' },
    { value: 'other', label: 'Other', icon: '📝', description: 'Other types of debt' }
  ];

  const mockTransactionTypes = [
    { value: 'down_payment', label: 'Down Payment', description: 'Initial payment made' },
    { value: 'initial_payment', label: 'Initial Payment', description: 'First installment paid' },
    { value: 'setup_fee', label: 'Setup Fee', description: 'Processing or setup charges' }
  ];

  const handleFormSubmit = async (data: EnhancedLiabilityFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const formattedData = {
        ...data,
        totalAmount: Number(data.totalAmount),
        remainingAmount: Number(data.remainingAmount),
        interestRate: Number(data.interestRate),
        monthlyPayment: Number(data.monthlyPayment),
        mockTransactionAmount: data.mockTransactionAmount ? Number(data.mockTransactionAmount) : undefined,
        due_date: new Date(data.due_date),
        start_date: new Date(data.start_date)
      };

      await onSubmit(formattedData);
    } catch (error: any) {
      console.error('Error submitting liability:', error);
      setError(error.message || 'Failed to save liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEMI = () => {
    if (totalAmount && interestRate && monthlyPayment) {
      const principal = totalAmount;
      const rate = interestRate / 100 / 12;
      const months = principal / monthlyPayment; // Simplified calculation
      
      return {
        totalMonths: Math.ceil(months),
        totalInterest: (monthlyPayment * months) - principal,
        totalPayable: monthlyPayment * months
      };
    }
    return null;
  };

  const emiCalculation = calculateEMI();

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30">
        <h3 className="text-lg font-semibold text-white mb-2">Enhanced Debt Tracking</h3>
        <p className="text-gray-300 text-sm">
          Add comprehensive debt information with automated payment scheduling.
        </p>
      </div>

      {/* Liability Name */}
      <Input
        label="Debt Name"
        type="text"
        placeholder="e.g., Car Loan, Credit Card"
        icon={<CreditCard size={18} className="text-red-400" />}
        {...register('name', { required: 'Name is required' })}
        error={errors.name?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Liability Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Debt Type</label>
        <div className="grid grid-cols-2 gap-3">
          {liabilityTypes.map((type) => (
            <label key={type.value} className="cursor-pointer">
              <input
                type="radio"
                value={type.value}
                {...register('type', { required: 'Type is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                selectedType === type.value
                  ? 'border-red-500 bg-red-500/20 text-red-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="text-xl mb-1">{type.icon}</div>
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs opacity-80">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount Fields */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Total Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-error-400" />}
          {...register('totalAmount', {
            required: 'Total amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' }
          })}
          error={errors.totalAmount?.message}
          className="bg-black/20 border-white/20 text-white"
        />

        <Input
          label="Remaining Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-orange-400" />}
          {...register('remainingAmount', {
            required: 'Remaining amount is required',
            min: { value: 0, message: 'Amount cannot be negative' }
          })}
          error={errors.remainingAmount?.message}
          className="bg-black/20 border-white/20 text-white"
        />
      </div>

      {/* Interest and Payment */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Interest Rate (%)"
          type="number"
          step="0.01"
          icon={<Percent size={18} className="text-purple-400" />}
          {...register('interestRate', {
            required: 'Interest rate is required',
            min: { value: 0, message: 'Rate cannot be negative' }
          })}
          error={errors.interestRate?.message}
          className="bg-black/20 border-white/20 text-white"
        />

        <Input
          label="Monthly Payment"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-blue-400" />}
          {...register('monthlyPayment', {
            required: 'Monthly payment is required',
            min: { value: 0.01, message: 'Payment must be greater than 0' }
          })}
          error={errors.monthlyPayment?.message}
          className="bg-black/20 border-white/20 text-white"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          icon={<Calendar size={18} className="text-green-400" />}
          {...register('start_date', { required: 'Start date is required' })}
          error={errors.start_date?.message}
          className="bg-black/20 border-white/20 text-white"
        />

        <Input
          label="Next Due Date"
          type="date"
          icon={<Calendar size={18} className="text-red-400" />}
          {...register('due_date', { required: 'Due date is required' })}
          error={errors.due_date?.message}
          className="bg-black/20 border-white/20 text-white"
        />
      </div>

      {/* Mock Transaction Toggle */}
      <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-white">Create Mock Transaction</h4>
            <p className="text-sm text-yellow-300">
              Create a placeholder transaction for down payments or setup fees
            </p>
          </div>
          <button
            type="button"
            onClick={() => setValue('createMockTransaction', !createMockTransaction)}
          >
            {createMockTransaction ? (
              <ToggleRight size={32} className="text-yellow-400" />
            ) : (
              <ToggleLeft size={32} className="text-gray-500" />
            )}
          </button>
        </div>

        {createMockTransaction && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mock Transaction Type</label>
              <select
                {...register('mockTransactionType')}
                className="block w-full rounded-lg border-white/20 bg-black/40 text-white py-2 px-3 text-sm"
              >
                {mockTransactionTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-black/90">
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Mock Transaction Amount"
              type="number"
              step="0.01"
              icon={<CurrencyIcon currencyCode={currency.code} className="text-yellow-400" />}
              {...register('mockTransactionAmount')}
              className="bg-black/40 border-white/20 text-white"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account</label>
              <select
                {...register('accountId')}
                className="block w-full rounded-lg border-white/20 bg-black/40 text-white py-2 px-3 text-sm"
              >
                <option value="">Select account</option>
                {(accounts || []).map((account) => (
                  <option key={account.id} value={account.id} className="bg-black/90">
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Auto Schedule Payments */}
      <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">Auto-Schedule Recurring Payments</h4>
            <p className="text-sm text-green-300">
              Automatically create recurring transactions for monthly payments
            </p>
          </div>
          <button
            type="button"
            onClick={() => setValue('autoSchedulePayments', !autoSchedulePayments)}
          >
            {autoSchedulePayments ? (
              <ToggleRight size={32} className="text-green-400" />
            ) : (
              <ToggleLeft size={32} className="text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* EMI Calculation Preview */}
      {emiCalculation && (
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center text-blue-400 mb-2">
            <Calculator size={16} className="mr-2" />
            <span className="font-medium">Payment Calculation</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/30 p-3 rounded">
              <p className="text-gray-400 mb-1">Total Interest</p>
              <p className="text-error-400 font-medium">{formatCurrency(emiCalculation.totalInterest)}</p>
            </div>
            <div className="bg-black/30 p-3 rounded">
              <p className="text-gray-400 mb-1">Payoff Time</p>
              <p className="text-primary-400 font-medium">{emiCalculation.totalMonths} months</p>
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
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={isSubmitting}
        >
          {initialData ? 'Update' : 'Add'} Liability
        </Button>
      </div>
    </form>
  );
};