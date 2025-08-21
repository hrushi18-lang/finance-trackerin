import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Repeat, CreditCard, Calendar, Bell, Zap, AlertTriangle, Clock, Target } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface SmartRecurringFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  isBill: boolean;
  paymentMethod?: string;
  reminderDays: number;
  autoProcess: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface SmartRecurringTransactionFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const SmartRecurringTransactionForm: React.FC<SmartRecurringTransactionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { currency } = useInternationalization();
  const [currentStep, setCurrentStep] = useState(1);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SmartRecurringFormData>({
    defaultValues: initialData || {
      type: 'expense',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      isBill: false,
      reminderDays: 3,
      autoProcess: true,
      priority: 'medium'
    }
  });

  const type = watch('type');
  const frequency = watch('frequency');
  const isBill = watch('isBill');
  const amount = watch('amount');

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', description: 'Every day', example: 'Coffee, commute' },
    { value: 'weekly', label: 'Weekly', description: 'Every week', example: 'Groceries, fuel' },
    { value: 'bi-weekly', label: 'Bi-weekly', description: 'Every 2 weeks', example: 'Salary, rent' },
    { value: 'monthly', label: 'Monthly', description: 'Every month', example: 'Rent, subscriptions' },
    { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months', example: 'Insurance, taxes' },
    { value: 'yearly', label: 'Yearly', description: 'Every year', example: 'Annual fees' },
  ];

  const categoryOptions = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Rental', 'Other'],
    expense: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Bills', 'Subscriptions', 'Insurance', 'Healthcare', 'Other']
  };

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Other'];

  const getEstimatedMonthlyImpact = () => {
    if (!amount || !frequency) return 0;
    
    const multipliers = {
      daily: 30,
      weekly: 4.33,
      'bi-weekly': 2.17,
      monthly: 1,
      quarterly: 1/3,
      yearly: 1/12
    };
    
    return amount * multipliers[frequency as keyof typeof multipliers];
  };

  const handleFormSubmit = (data: SmartRecurringFormData) => {
    const processedData = {
      ...data,
      amount: Number(data.amount),
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      nextOccurrenceDate: new Date(data.startDate),
      currentOccurrences: 0,
      isActive: true,
    };
    
    onSubmit(processedData);
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step < currentStep
                ? 'bg-primary-500 text-white'
                : step === currentStep
                ? 'bg-primary-500/70 text-white ring-4 ring-primary-500/30'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {step}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Transaction Details</h3>
              <p className="text-sm text-gray-400">Basic information about this recurring transaction</p>
            </div>

            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="income"
                  {...register('type')}
                  className="sr-only"
                />
                <div className={`p-6 rounded-xl border-2 text-center transition-colors ${
                  type === 'income' 
                    ? 'border-success-500 bg-success-500/20 text-success-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <TrendingUp size={24} className="mx-auto mb-2" />
                  <span className="font-medium">Income</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="expense"
                  {...register('type')}
                  className="sr-only"
                />
                <div className={`p-6 rounded-xl border-2 text-center transition-colors ${
                  type === 'expense' 
                    ? 'border-error-500 bg-error-500/20 text-error-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <TrendingDown size={24} className="mx-auto mb-2" />
                  <span className="font-medium">Expense</span>
                </div>
              </label>
            </div>

            {/* Amount */}
            <Input
              label="Amount"
              type="number"
              step="0.01"
              icon={<CurrencyIcon currencyCode={currency.code} className={type === 'income' ? 'text-success-400' : 'text-error-400'} />}
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              error={errors.amount?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            {/* Description */}
            <Input
              label="Description"
              type="text"
              {...register('description', { required: 'Description is required' })}
              error={errors.description?.message}
              className="bg-black/20 border-white/20 text-white"
              placeholder={type === 'income' ? 'e.g., Monthly salary' : 'e.g., Netflix subscription'}
            />

            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full"
              disabled={!watch('amount') || !watch('description')}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Schedule & Category */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Schedule & Category</h3>
              <p className="text-sm text-gray-400">When and how to categorize this transaction</p>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Frequency</label>
              <div className="grid grid-cols-2 gap-3">
                {frequencyOptions.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={option.value}
                      {...register('frequency')}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 transition-colors ${
                      frequency === option.value 
                        ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                        : 'border-white/20 hover:border-white/30 text-gray-300'
                    }`}>
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs opacity-80">{option.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{option.example}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Category</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
              >
                <option value="">Select category</option>
                {categoryOptions[type].map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <Input
              label="Start Date"
              type="date"
              icon={<Calendar size={18} className="text-purple-400" />}
              {...register('startDate', { required: 'Start date is required' })}
              error={errors.startDate?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            {/* Monthly Impact Preview */}
            {amount && (
              <div className="bg-primary-500/20 rounded-lg p-4 border border-primary-500/30">
                <div className="flex items-center text-primary-400 mb-2">
                  <Zap size={16} className="mr-2" />
                  <span className="font-medium">Monthly Impact</span>
                </div>
                <p className="text-sm text-primary-300">
                  This will {type === 'income' ? 'add' : 'subtract'} approximately{' '}
                  <span className="font-semibold">
                    {formatCurrency(getEstimatedMonthlyImpact())}
                  </span>{' '}
                  per month to your budget.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1"
                disabled={!watch('category') || !watch('startDate')}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Advanced Settings */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Advanced Settings</h3>
              <p className="text-sm text-gray-400">Configure reminders and smart features</p>
            </div>

            {/* Bill Toggle */}
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Mark as Bill</h4>
                  <p className="text-sm text-gray-400">Enable bill-specific features and reminders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    {...register('isBill')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            {/* Payment Method (if expense) */}
            {type === 'expense' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
                <select
                  {...register('paymentMethod')}
                  className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
                >
                  <option value="">Select payment method</option>
                  {['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Other'].map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'high', label: 'High', color: 'error', description: 'Critical bills' },
                  { value: 'medium', label: 'Medium', color: 'warning', description: 'Regular expenses' },
                  { value: 'low', label: 'Low', color: 'success', description: 'Optional spending' }
                ].map((priority) => (
                  <label key={priority.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={priority.value}
                      {...register('priority')}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      watch('priority') === priority.value 
                        ? `border-${priority.color}-500 bg-${priority.color}-500/20 text-${priority.color}-400` 
                        : 'border-white/20 hover:border-white/30 text-gray-300'
                    }`}>
                      <p className="font-medium text-sm">{priority.label}</p>
                      <p className="text-xs opacity-80">{priority.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reminder Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Reminder (days before)</label>
              <select
                {...register('reminderDays')}
                className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
              >
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
                <option value={14}>2 weeks before</option>
              </select>
            </div>

            {/* Auto Process */}
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Auto-process transactions</h4>
                  <p className="text-sm text-gray-400">Automatically create transactions when due</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    {...register('autoProcess')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center text-blue-400 mb-2">
                <Target size={16} className="mr-2" />
                <span className="font-medium">Summary</span>
              </div>
              <p className="text-sm text-blue-300">
                {type === 'income' ? 'Receive' : 'Pay'} {formatCurrency(amount || 0)} for{' '}
                <span className="font-semibold">{watch('category')}</span> {frequency}
                {isBill && ' (marked as bill)'}
              </p>
              <p className="text-xs text-blue-200 mt-1">
                Monthly impact: {type === 'income' ? '+' : '-'}{formatCurrency(getEstimatedMonthlyImpact())}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                {initialData ? 'Update' : 'Create'} Recurring Transaction
              </Button>
            </div>
          </div>
        )}

        {/* Navigation for other steps */}
        {currentStep < 3 && (
          <div className="pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full text-gray-400 hover:text-gray-300"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};