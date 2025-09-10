import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { CategorySelector } from '../common/CategorySelector';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface MockTransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  affectsBalance: boolean;
  reason?: string; // Required when affectsBalance is false
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
}

interface MockTransactionFormProps {
  onSubmit: (data: MockTransactionFormData) => Promise<void>;
  onCancel: () => void;
  accountId: string;
  initialData?: Partial<MockTransactionFormData>;
}

export const MockTransactionForm: React.FC<MockTransactionFormProps> = ({
  onSubmit,
  onCancel,
  accountId,
  initialData
}) => {
  const { accounts } = useFinance();
  const { currency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MockTransactionFormData>({
    defaultValues: {
      type: initialData?.type || 'expense',
      amount: initialData?.amount || undefined,
      category: initialData?.category || '',
      description: initialData?.description || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      affectsBalance: initialData?.affectsBalance ?? true,
      reason: initialData?.reason || '',
      isRecurring: initialData?.isRecurring || false,
      recurringFrequency: initialData?.recurringFrequency || 'monthly',
      recurringEndDate: initialData?.recurringEndDate || ''
    },
  });

  const handleFormSubmit = async (data: MockTransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields
      const sanitizedData = sanitizeFinancialData(data, ['amount']);
      
      await onSubmit({
        ...sanitizedData,
        amount: toNumber(sanitizedData.amount),
      });
      
    } catch (error: any) {
      console.error('Error submitting mock transaction:', error);
      setError(error.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === accountId);
  const affectsBalance = watch('affectsBalance');
  const isRecurring = watch('isRecurring');
  const transactionType = watch('type');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Account Info */}
      {selectedAccount && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Account: {selectedAccount.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Current balance: {currency.symbol} {selectedAccount.balance.toFixed(2)}
          </p>
        </div>
      )}

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Transaction Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              transactionType === 'income'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-green-600 font-medium">Income</div>
              <div className="text-xs text-gray-500">Money in</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              transactionType === 'expense'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-red-600 font-medium">Expense</div>
              <div className="text-xs text-gray-500">Money out</div>
            </div>
          </button>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Amount *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-numbers">
            {currency.symbol}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('amount', { 
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' }
            })}
            className="modal-input pl-10 w-full"
            placeholder="0.00"
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Category *
        </label>
        <CategorySelector
          value={watch('category')}
          onChange={(category) => setValue('category', category)}
          type="transaction"
          transactionType={transactionType}
          placeholder="Select a category"
          error={errors.category?.message}
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Description *
        </label>
        <input
          {...register('description', { required: 'Description is required' })}
          className="modal-input w-full"
          placeholder="Enter transaction description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Date *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="modal-input pl-10 w-full"
          />
        </div>
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      {/* Affects Balance Toggle */}
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            {...register('affectsBalance')}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-black">
              Affects Account Balance
            </span>
            <p className="text-xs text-gray-600">
              Uncheck for informational transactions (pending, future, etc.)
            </p>
          </div>
        </label>
      </div>

      {/* Reason (when balance is not affected) */}
      {!affectsBalance && (
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            Reason for not affecting balance *
          </label>
          <input
            {...register('reason', { 
              required: !affectsBalance ? 'Reason is required when balance is not affected' : false 
            })}
            className="modal-input w-full"
            placeholder="e.g., Pending payment, Future transaction, etc."
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
          )}
        </div>
      )}

      {/* Recurring Transaction */}
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            {...register('isRecurring')}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div>
            <span className="text-sm font-medium text-black">
              Make this a recurring transaction
            </span>
            <p className="text-xs text-gray-600">
              Automatically create similar transactions
            </p>
          </div>
        </label>
      </div>

      {/* Recurring Options */}
      {isRecurring && (
        <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }}>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Frequency *
            </label>
            <select
              {...register('recurringFrequency', { 
                required: isRecurring ? 'Frequency is required for recurring transactions' : false 
              })}
              className="modal-input w-full"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              End Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                {...register('recurringEndDate')}
                className="modal-input pl-10 w-full"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for indefinite recurring transactions
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="text-blue-600 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Mock Transaction</p>
            <p>This is a test transaction for planning and budgeting purposes. It won't affect your real financial data.</p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="modal-button-secondary flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="modal-button-primary flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Mock Transaction'}
        </button>
      </div>
    </form>
  );
};
