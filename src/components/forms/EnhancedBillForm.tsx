import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Bell, CreditCard, AlertCircle, Clock, Repeat, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useFinance } from '../../contexts/FinanceContext';

interface EnhancedBillFormData {
  title: string;
  description?: string;
  category: string;
  billType: 'fixed' | 'variable' | 'one_time' | 'liability_linked';
  amount: number;
  estimatedAmount?: number;
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom' | 'one_time';
  customFrequencyDays?: number;
  dueDate: string;
  defaultAccountId?: string;
  autoPay: boolean;
  linkedLiabilityId?: string;
  isEmi: boolean;
  isEssential: boolean;
  reminderDaysBefore: number;
  sendDueDateReminder: boolean;
  sendOverdueReminder: boolean;
  activityScope: 'general' | 'account_specific' | 'category_based';
  accountIds: string[];
  targetCategory?: string;
}

interface EnhancedBillFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const billCategories = [
  'Housing', 'Utilities', 'Internet', 'Phone', 'Subscriptions', 
  'Insurance', 'Loan EMI', 'Credit Card', 'Transportation', 'Other'
];

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly', description: 'Every week' },
  { value: 'bi_weekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Every month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
  { value: 'semi_annual', label: 'Semi-annual', description: 'Every 6 months' },
  { value: 'annual', label: 'Annual', description: 'Every year' },
  { value: 'custom', label: 'Custom', description: 'Custom interval' },
  { value: 'one_time', label: 'One-time', description: 'Single payment' }
];

export const EnhancedBillForm: React.FC<EnhancedBillFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { currency, formatCurrency } = useInternationalization();
  const { accounts, liabilities } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EnhancedBillFormData>({
    defaultValues: initialData || {
      billType: 'fixed',
      frequency: 'monthly',
      dueDate: new Date().toISOString().split('T')[0],
      autoPay: false,
      isEmi: false,
      isEssential: false,
      reminderDaysBefore: 3,
      sendDueDateReminder: true,
      sendOverdueReminder: true,
      activityScope: 'general',
      accountIds: []
    }
  });

  const billType = watch('billType');
  const frequency = watch('frequency');
  const autoPay = watch('autoPay');
  const isEmi = watch('isEmi');
  const linkedLiabilityId = watch('linkedLiabilityId');

  const handleFormSubmit = async (data: EnhancedBillFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const formattedData = {
        ...data,
        amount: Number(data.amount),
        estimatedAmount: data.estimatedAmount ? Number(data.estimatedAmount) : undefined,
        customFrequencyDays: data.customFrequencyDays ? Number(data.customFrequencyDays) : undefined,
        dueDate: new Date(data.dueDate),
        nextDueDate: new Date(data.dueDate)
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
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2">
          {initialData ? 'Edit Bill' : 'Create New Bill'}
        </h3>
        <p className="text-gray-300 text-sm">
          Set up payment reminders and automation for your bills.
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <Input
          label="Bill Title"
          type="text"
          placeholder="e.g., Netflix Subscription, Rent Payment"
          icon={<CreditCard size={18} className="text-blue-400" />}
          {...register('title', { required: 'Bill title is required' })}
          error={errors.title?.message}
          className="bg-black/20 border-white/20 text-white"
        />

        <Input
          label="Description (Optional)"
          type="text"
          placeholder="Additional details about this bill"
          {...register('description')}
          className="bg-black/20 border-white/20 text-white"
        />
      </div>

      {/* Bill Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Bill Type</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'fixed', label: 'Fixed Amount', description: 'Same amount every time' },
            { value: 'variable', label: 'Variable Amount', description: 'Amount changes' },
            { value: 'one_time', label: 'One-time', description: 'Single payment' },
            { value: 'liability_linked', label: 'Linked to Debt', description: 'EMI or debt payment' }
          ].map((type) => (
            <label key={type.value} className="cursor-pointer">
              <input
                type="radio"
                value={type.value}
                {...register('billType')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                billType === type.value 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs opacity-80">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={billType === 'variable' ? 'Estimated Amount' : 'Amount'}
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

        {billType === 'variable' && (
          <Input
            label="Typical Amount"
            type="number"
            step="0.01"
            placeholder="Average amount"
            icon={<CurrencyIcon currencyCode={currency.code} className="text-warning-400" />}
            {...register('estimatedAmount')}
            className="bg-black/20 border-white/20 text-white"
          />
        )}
      </div>

      {/* Activity Scope Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Bill Type
        </label>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="general"
              value="general"
              {...register('activityScope')}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="general" className="text-sm text-gray-300">
              <span className="font-medium">General Bill</span>
              <span className="block text-xs text-gray-400">Not tied to any specific account</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="account_specific"
              value="account_specific"
              {...register('activityScope')}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="account_specific" className="text-sm text-gray-300">
              <span className="font-medium">Account-Specific Bill</span>
              <span className="block text-xs text-gray-400">Linked to one or more specific accounts</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="category_based"
              value="category_based"
              {...register('activityScope')}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="category_based" className="text-sm text-gray-300">
              <span className="font-medium">Category-Based Bill</span>
              <span className="block text-xs text-gray-400">For a specific spending category</span>
            </label>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Category</label>
        <CategorySelector
          value={watch('category')}
          onChange={(category) => setValue('category', category)}
          type="bill"
          placeholder="Select category"
          error={errors.category?.message}
        />
      </div>

      {/* Frequency */}
      {billType !== 'one_time' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Frequency</label>
          <select
            {...register('frequency')}
            className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
          >
            {frequencyOptions.filter(f => f.value !== 'one_time').map((option) => (
              <option key={option.value} value={option.value} className="bg-black/90">
                {option.label} - {option.description}
              </option>
            ))}
          </select>

          {frequency === 'custom' && (
            <Input
              label="Custom Frequency (Days)"
              type="number"
              min="1"
              {...register('customFrequencyDays', {
                required: frequency === 'custom' ? 'Custom frequency is required' : false
              })}
              error={errors.customFrequencyDays?.message}
              className="bg-black/20 border-white/20 text-white mt-3"
            />
          )}
        </div>
      )}

      {/* Due Date */}
      <Input
        label="Due Date"
        type="date"
        icon={<Calendar size={18} className="text-purple-400" />}
        {...register('dueDate', { required: 'Due date is required' })}
        error={errors.dueDate?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Account Selection - Only show if account_specific is selected */}
      {watch('activityScope') === 'account_specific' && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select Accounts (Multiple Selection)
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(accounts || []).map((account) => (
              <div key={account.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`account-${account.id}`}
                  value={account.id}
                  {...register('accountIds')}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor={`account-${account.id}`} className="text-sm text-gray-300 flex-1">
                  <span className="font-medium">{account.name}</span>
                  <span className="block text-xs text-gray-400">
                    {formatCurrency(account.balance)} • {account.type}
                  </span>
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Select one or more accounts to link this bill to. You can change this later.
          </p>
        </div>
      )}

      {/* Target Category - Only show if category_based is selected */}
      {watch('activityScope') === 'category_based' && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Category
          </label>
          <CategorySelector
            value={watch('targetCategory')}
            onChange={(category) => setValue('targetCategory', category)}
            type="expense"
            placeholder="Select spending category"
            error={errors.targetCategory?.message}
          />
          <p className="text-xs text-gray-400 mt-1">
            This bill will track spending for the selected category across all accounts.
          </p>
        </div>
      )}

      {/* Payment Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Default Payment Account</label>
          <select
            {...register('defaultAccountId')}
            className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
          >
            <option value="">Select payment account</option>
            {(accounts || []).map((account) => (
              <option key={account.id} value={account.id} className="bg-black/90">
                {account.name} - {formatCurrency(account.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Link to Liability */}
        {billType === 'liability_linked' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Linked Liability</label>
            <select
              {...register('linkedLiabilityId')}
              className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
            >
              <option value="">Select liability</option>
              {(liabilities || []).filter(l => l.remainingAmount > 0).map((liability) => (
                <option key={liability.id} value={liability.id} className="bg-black/90">
                  {liability.name} - {formatCurrency(liability.remainingAmount)} remaining
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <div className="bg-black/20 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Essential Bill</h4>
              <p className="text-sm text-gray-400">Mark as essential (rent, utilities, etc.)</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('isEssential', !watch('isEssential'))}
            >
              {watch('isEssential') ? (
                <ToggleRight size={32} className="text-primary-400" />
              ) : (
                <ToggleLeft size={32} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Auto Pay</h4>
              <p className="text-sm text-gray-400">Automatically pay from default account</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('autoPay', !autoPay)}
            >
              {autoPay ? (
                <ToggleRight size={32} className="text-green-400" />
              ) : (
                <ToggleLeft size={32} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">EMI Payment</h4>
              <p className="text-sm text-gray-400">This is an EMI or installment payment</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('isEmi', !isEmi)}
            >
              {isEmi ? (
                <ToggleRight size={32} className="text-orange-400" />
              ) : (
                <ToggleLeft size={32} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="bg-black/20 rounded-lg p-4 border border-white/10">
        <h4 className="font-medium text-white mb-3">Reminder Settings</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Remind me (days before)"
            type="number"
            min="0"
            max="30"
            {...register('reminderDaysBefore')}
            className="bg-black/40 border-white/20 text-white"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Due date reminders</span>
            <button
              type="button"
              onClick={() => setValue('sendDueDateReminder', !watch('sendDueDateReminder'))}
            >
              {watch('sendDueDateReminder') ? (
                <ToggleRight size={24} className="text-blue-400" />
              ) : (
                <ToggleLeft size={24} className="text-gray-500" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Overdue reminders</span>
            <button
              type="button"
              onClick={() => setValue('sendOverdueReminder', !watch('sendOverdueReminder'))}
            >
              {watch('sendOverdueReminder') ? (
                <ToggleRight size={24} className="text-red-400" />
              ) : (
                <ToggleLeft size={24} className="text-gray-500" />
              )}
            </button>
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
          {initialData ? 'Update' : 'Create'} Bill
        </Button>
      </div>
    </form>
  );
};