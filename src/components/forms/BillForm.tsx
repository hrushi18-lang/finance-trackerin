import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Bell, CreditCard, AlertCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useFinance } from '../../contexts/FinanceContext';

interface BillFormData {
  description: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  accountId: string;
  reminderDays: number;
}

interface BillFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const billCategories = [
  'Rent', 'Utilities', 'Internet', 'Phone', 'Subscriptions', 
  'Insurance', 'Loan EMI', 'Credit Card', 'Other'
];

export const BillForm: React.FC<BillFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { currency } = useInternationalization();
  const { accounts } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BillFormData>({
    defaultValues: initialData || {
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      reminderDays: 3
    }
  });

  const frequency = watch('frequency');

  const handleFormSubmit = async (data: BillFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const formattedData = {
        ...data,
        amount: Number(data.amount),
        startDate: new Date(data.startDate),
        nextOccurrenceDate: new Date(data.startDate),
        endDate: undefined,
        dayOfWeek: undefined,
        dayOfMonth: undefined,
        monthOfYear: undefined,
        maxOccurrences: undefined
      };
      
      await onSubmit(formattedData);
    } catch (error: any) {
      console.error('Error submitting bill:', error);
      setError(error.message || 'Failed to save bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2">
          {initialData ? 'Edit Bill' : 'Add New Bill'}
        </h3>
        <p className="text-gray-300 text-sm">
          Track your recurring payments and never miss a due date again!
        </p>
      </div>

      {/* Bill Description */}
      <Input
        label="Bill Name"
        type="text"
        placeholder="e.g., Netflix Subscription, Rent Payment"
        icon={<CreditCard size={18} className="text-blue-400" />}
        {...register('description', { required: 'Bill name is required' })}
        error={errors.description?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Amount */}
      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="e.g., 500"
        icon={<CurrencyIcon currencyCode={currency.code} className="text-success-400" />}
        {...register('amount', {
          required: 'Amount is required',
          min: { value: 0.01, message: 'Amount must be greater than 0' }
        })}
        error={errors.amount?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Category</label>
        <select
          {...register('category', { required: 'Category is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="">Select category</option>
          {billCategories.map((category) => (
            <option key={category} value={category} className="bg-black/90">
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-error-400 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
        <select
          {...register('accountId', { required: 'Payment method is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="">Select payment method</option>
          {(accounts || []).map((account) => (
            <option key={account.id} value={account.id} className="bg-black/90">
              {account.name} - {formatCurrency(account.balance)}
            </option>
          ))}
        </select>
        {errors.accountId && (
          <p className="text-sm text-error-400 mt-1">{errors.accountId.message}</p>
        )}
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">How Often?</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'weekly', label: 'Weekly', description: 'Every week' },
            { value: 'monthly', label: 'Monthly', description: 'Most common' },
            { value: 'yearly', label: 'Yearly', description: 'Once per year' }
          ].map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                value={option.value}
                {...register('frequency')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                frequency === option.value 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs opacity-80">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Start Date */}
      <Input
        label="First Due Date"
        type="date"
        icon={<Calendar size={18} className="text-purple-400" />}
        {...register('startDate', { required: 'Due date is required' })}
        error={errors.startDate?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Reminder Days */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Remind Me</label>
        <select
          {...register('reminderDays')}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value={1}>1 day before</option>
          <option value={3}>3 days before</option>
          <option value={7}>1 week before</option>
        </select>
      </div>

      {/* Student Tip */}
      <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
        <div className="flex items-start space-x-2">
          <Bell size={16} className="text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium text-sm">💡 Student Tip</p>
            <p className="text-yellow-300 text-sm">
              Set reminders a few days early so you can plan your spending and ensure you have enough money in your account!
            </p>
          </div>
        </div>
      </div>

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
          {initialData ? 'Update' : 'Add'} Bill
        </Button>
      </div>
    </form>
  );
};