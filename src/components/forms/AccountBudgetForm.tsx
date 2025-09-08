import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { sanitizeFinancialData, toNumber } from '../../utils/validation';
import { DEFAULT_CATEGORIES } from '../../utils/categories';

interface AccountBudgetFormData {
  accountId: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  description?: string;
  alertThreshold: number; // Percentage (e.g., 80 for 80%)
}

interface AccountBudgetFormProps {
  onSubmit: (data: AccountBudgetFormData) => Promise<void>;
  onCancel: () => void;
  accountId?: string;
  initialData?: Partial<AccountBudgetFormData>;
}

export const AccountBudgetForm: React.FC<AccountBudgetFormProps> = ({
  onSubmit,
  onCancel,
  accountId,
  initialData
}) => {
  const { accounts } = useFinance();
  const { currency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AccountBudgetFormData>({
    defaultValues: {
      accountId: initialData?.accountId || accountId || '',
      category: initialData?.category || '',
      amount: initialData?.amount || undefined,
      period: initialData?.period || 'monthly',
      description: initialData?.description || '',
      alertThreshold: initialData?.alertThreshold || 80
    },
  });

  const handleFormSubmit = async (data: AccountBudgetFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields
      const sanitizedData = sanitizeFinancialData(data, ['amount', 'alertThreshold']);
      
      await onSubmit({
        ...sanitizedData,
        amount: toNumber(sanitizedData.amount),
        alertThreshold: toNumber(sanitizedData.alertThreshold),
      });
      
    } catch (error: any) {
      console.error('Error submitting account budget:', error);
      setError(error.message || 'Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === watch('accountId'));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Account Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Account *
        </label>
        <select
          {...register('accountId', { required: 'Please select an account' })}
          className="modal-input w-full"
        >
          <option value="">Select an account</option>
          {accounts?.map(account => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.type.replace('_', ' ').toUpperCase()})
            </option>
          ))}
        </select>
        {errors.accountId && (
          <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
        )}
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Category *
        </label>
        <select
          {...register('category', { required: 'Please select a category' })}
          className="modal-input w-full"
        >
          <option value="">Select a category</option>
          {DEFAULT_CATEGORIES.TRANSACTION.EXPENSE.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Budget Amount */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Budget Amount *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {currency.symbol}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('amount', { 
              required: 'Budget amount is required',
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

      {/* Period */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Budget Period *
        </label>
        <select
          {...register('period', { required: 'Please select a period' })}
          className="modal-input w-full"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        {errors.period && (
          <p className="mt-1 text-sm text-red-600">{errors.period.message}</p>
        )}
      </div>

      {/* Alert Threshold */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Alert Threshold (%)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          {...register('alertThreshold', { 
            min: { value: 1, message: 'Threshold must be at least 1%' },
            max: { value: 100, message: 'Threshold cannot exceed 100%' }
          })}
          className="modal-input w-full"
          placeholder="80"
        />
        <p className="mt-1 text-xs text-gray-500">
          Get notified when you've spent this percentage of your budget
        </p>
        {errors.alertThreshold && (
          <p className="mt-1 text-sm text-red-600">{errors.alertThreshold.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-black">
          Description (Optional)
        </label>
        <input
          {...register('description')}
          className="modal-input w-full"
          placeholder="e.g., Save $X this month, Use only $T this week on trip"
        />
      </div>

      {/* Account Balance Info */}
      {selectedAccount && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-elevated)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Current balance: <span className="font-medium">{currency.symbol} {selectedAccount.balance.toFixed(2)}</span>
          </p>
        </div>
      )}

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
          {isSubmitting ? 'Creating...' : 'Create Budget'}
        </button>
      </div>
    </form>
  );
};
