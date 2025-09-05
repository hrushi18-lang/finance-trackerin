import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Calendar, DollarSign, Tag, Repeat, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CategorySelector } from '../components/common/CategorySelector';
import { TopNavigation } from '../components/layout/TopNavigation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';

interface GoalFormData {
  title: string;
  description: string;
  targetAmount: number;
  targetDate: string;
  category: string;
  goalType: 'account_specific' | 'category_based' | 'general_savings';
  targetCategory?: string;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  customPeriodDays?: number;
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  accountId?: string;
  priority: 'low' | 'medium' | 'high';
}

export const CreateGoal: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { addGoal, accounts } = useFinance();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GoalFormData>({
    defaultValues: {
      goalType: 'general_savings',
      periodType: 'monthly',
      isRecurring: false,
      priority: 'medium',
    },
  });

  const goalType = watch('goalType');
  const periodType = watch('periodType');
  const isRecurring = watch('isRecurring');
  const targetAmount = watch('targetAmount');
  const targetDate = watch('targetDate');

  // Calculate period information
  const getPeriodInfo = () => {
    const targetDateObj = new Date(targetDate);
    const today = new Date();
    const diffTime = targetDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { periods: 0, periodAmount: 0 };
    
    let periods = 0;
    switch (periodType) {
      case 'weekly':
        periods = Math.ceil(diffDays / 7);
        break;
      case 'monthly':
        periods = Math.ceil(diffDays / 30);
        break;
      case 'quarterly':
        periods = Math.ceil(diffDays / 90);
        break;
      case 'yearly':
        periods = Math.ceil(diffDays / 365);
        break;
      case 'custom':
        periods = Math.ceil(diffDays / (watch('customPeriodDays') || 30));
        break;
    }
    
    const periodAmount = targetAmount ? targetAmount / periods : 0;
    return { periods, periodAmount };
  };

  const { periods, periodAmount } = getPeriodInfo();

  const onSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const goalData = {
        ...data,
        targetAmount: Number(data.targetAmount),
        targetDate: new Date(data.targetDate),
        customPeriodDays: data.periodType === 'custom' ? Number(data.customPeriodDays) : undefined,
        currentAmount: 0,
        status: 'active' as const,
      };

      await addGoal(goalData);
      navigate('/goals');
    } catch (error: any) {
      console.error('Error creating goal:', error);
      setError(error.message || 'Failed to create goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGoalTypeDescription = (type: string) => {
    switch (type) {
      case 'account_specific':
        return 'Save money in a specific account';
      case 'category_based':
        return 'Save money for a specific category (e.g., vacation, car)';
      case 'general_savings':
        return 'General savings goal without specific account or category';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      <TopNavigation title="Create Goal" showBack />
      
      <div className="px-6 py-4 space-y-6">
        {/* Goal Type Selection */}
        <div 
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Goal Type
          </h3>
          <div className="space-y-3">
            {[
              {
                type: 'general_savings',
                title: 'General Savings',
                icon: Target,
                description: 'Save money for any purpose',
                color: 'text-blue-600'
              },
              {
                type: 'account_specific',
                title: 'Account Specific',
                icon: DollarSign,
                description: 'Save money in a specific account',
                color: 'text-green-600'
              },
              {
                type: 'category_based',
                title: 'Category Based',
                icon: Tag,
                description: 'Save for a specific category',
                color: 'text-purple-600'
              }
            ].map(({ type, title, icon: Icon, description, color }) => (
              <button
                key={type}
                onClick={() => setValue('goalType', type as any)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  goalType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: goalType === type ? 'var(--primary)' : 'var(--background)' }}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={20} className={color} />
                  <div className="text-left">
                    <h4 className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </h4>
                    <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                      {description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal Details Form */}
        <div 
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Goal Details
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Goal Title
              </label>
              <Input
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., Emergency Fund, Vacation, New Car"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Description (Optional)
              </label>
              <Input
                {...register('description')}
                placeholder="Add more details about your goal"
              />
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Target Amount
              </label>
              <div className="relative">
                <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <Input
                  {...register('targetAmount', { required: 'Target amount is required' })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              {errors.targetAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.targetAmount.message}</p>
              )}
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Target Date
              </label>
              <div className="relative">
                <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <Input
                  {...register('targetDate', { required: 'Target date is required' })}
                  type="date"
                  className="pl-10"
                />
              </div>
              {errors.targetDate && (
                <p className="text-red-500 text-sm mt-1">{errors.targetDate.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Category
              </label>
              <CategorySelector
                value={watch('category')}
                onChange={(category) => setValue('category', category)}
                type="goal"
                placeholder="Select a category"
                error={errors.category?.message}
              />
            </div>

            {/* Account Selection (for account-specific goals) */}
            {goalType === 'account_specific' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Target Account
                </label>
                <select
                  {...register('accountId', { required: goalType === 'account_specific' ? 'Account is required' : false })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance || 0)}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
                )}
              </div>
            )}

            {/* Target Category (for category-based goals) */}
            {goalType === 'category_based' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Target Category
                </label>
                <Input
                  {...register('targetCategory', { required: goalType === 'category_based' ? 'Target category is required' : false })}
                  placeholder="e.g., Vacation, Car, House, Education"
                />
                {errors.targetCategory && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetCategory.message}</p>
                )}
              </div>
            )}

            {/* Period Type */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Savings Period
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['weekly', 'monthly', 'quarterly', 'yearly', 'custom'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setValue('periodType', period as any)}
                    className={`p-3 rounded-lg border transition-all ${
                      periodType === period
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              {periodType === 'custom' && (
                <div className="mt-2">
                  <Input
                    {...register('customPeriodDays', { required: periodType === 'custom' ? 'Custom period is required' : false })}
                    type="number"
                    min="1"
                    placeholder="Number of days"
                  />
                </div>
              )}
            </div>

            {/* Recurring Goal */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--background)' }}>
              <div className="flex items-center space-x-3">
                <Repeat size={20} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <h4 className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                    Recurring Goal
                  </h4>
                  <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                    Restart this goal after completion
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isRecurring')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Recurring Frequency */}
            {isRecurring && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Recurring Frequency
                </label>
                <select
                  {...register('recurringFrequency', { required: isRecurring ? 'Recurring frequency is required' : false })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  {['weekly', 'monthly', 'quarterly', 'yearly'].map((freq) => (
                    <option key={freq} value={freq}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'low', label: 'Low', color: 'text-green-600' },
                  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
                  { value: 'high', label: 'High', color: 'text-red-600' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('priority', value as any)}
                    className={`p-3 rounded-lg border transition-all ${
                      watch('priority') === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={color}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Section */}
            {targetAmount && targetDate && (
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                <h4 className="font-heading font-semibold mb-2">Goal Preview</h4>
                <div className="space-y-1 text-sm">
                  <p>Target: {formatCurrency(targetAmount)}</p>
                  <p>Periods: {periods} {periodType}</p>
                  <p>Amount per period: {formatCurrency(periodAmount)}</p>
                  <p>Type: {getGoalTypeDescription(goalType)}</p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate('/goals')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} className="text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
