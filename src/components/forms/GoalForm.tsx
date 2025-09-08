import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Target, FileText, Calendar } from 'lucide-react';
import { validateGoal, sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { Goal } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { CurrencyInput } from '../currency/CurrencyInput';
import { LiveRateDisplay } from '../currency/LiveRateDisplay';
import { AlertCircle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContextOffline';

interface GoalFormData {
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  activityScope: 'general' | 'account_specific' | 'category_based';
  accountIds: string[];
  targetCategory?: string;
  currencyCode: string;
}

interface GoalFormProps {
  onSubmit: (data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>; // Changed to Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  onCancel: () => void;
  initialData?: Partial<GoalFormData>;
}

const goalCategories = ['Emergency', 'Travel', 'Education', 'Home', 'Investment', 'Other'];

export const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { currency } = useInternationalization();
  const { displayCurrency, formatCurrency, convertAmount } = useEnhancedCurrency();
  const { accounts } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalCurrency, setGoalCurrency] = useState(initialData?.currencyCode || displayCurrency);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GoalFormData>({
    defaultValues: {
      currentAmount: initialData?.currentAmount || 0,
      title: initialData?.title || '',
      description: initialData?.description || '',
      targetAmount: initialData?.targetAmount || undefined,
      targetDate: initialData?.targetDate || '',
      category: initialData?.category || '',
      activityScope: initialData?.activityScope || 'general',
      accountIds: initialData?.accountIds || [],
      targetCategory: initialData?.targetCategory || '',
      currencyCode: initialData?.currencyCode || displayCurrency
    },
  });

  const handleFormSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields
      const sanitizedData = sanitizeFinancialData(data, ['targetAmount', 'currentAmount']);
      
      // Validate using schema
      const validatedData = validateGoal({
        ...sanitizedData,
        targetAmount: toNumber(sanitizedData.targetAmount),
        currentAmount: toNumber(sanitizedData.currentAmount),
      });
      
      await onSubmit({
        ...validatedData,
        targetDate: new Date(data.targetDate),
        currencyCode: goalCurrency,
      });
      
    } catch (error: any) {
      console.error('Error submitting goal:', error);
      setError(error.message || 'Failed to save goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Tip Section */}
      <div className="bg-gradient-to-r from-blue-500/20 to-primary-500/20 rounded-xl p-4 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <span className="text-blue-400 mt-0.5">🎯</span>
          <div>
            <p className="text-blue-400 font-medium">Goal Setting Tip</p>
            <p className="text-gray-300 text-sm mt-1">
              Set realistic goals that motivate you! Start small and celebrate every milestone. 
              Manual tracking helps you stay connected to your progress.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Header with Info */}
      <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-xl p-4 mb-6 border border-primary-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Target size={20} className="mr-2 text-primary-400" />
          {initialData ? 'Edit Financial Goal' : 'New Financial Goal'}
        </h3>
        <p className="text-gray-300 text-sm">
          {initialData 
            ? 'Update your goal details to stay on track with your financial journey.'
            : 'Set clear targets for your financial journey. Track your progress and stay motivated!'}
        </p>
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Goal Title"
          type="text"
          icon={<Target size={18} className="text-primary-400" />}
          {...register('title', { required: 'Goal title is required' })}
          error={errors.title?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., Dream Vacation, New Car"
        />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Description"
          type="text"
          icon={<FileText size={18} className="text-blue-400" />}
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="What are you saving for?"
        />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <CurrencyInput
          label="Target Amount"
          value={watch('targetAmount')}
          currency={goalCurrency}
          onValueChange={(value) => setValue('targetAmount', value)}
          onCurrencyChange={setGoalCurrency}
          placeholder="e.g., 5000"
          showConversion={goalCurrency !== displayCurrency}
          targetCurrency={displayCurrency}
          error={errors.targetAmount?.message}
          className="text-white"
        />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <CurrencyInput
          label="Current Amount"
          value={watch('currentAmount')}
          currency={goalCurrency}
          onValueChange={(value) => setValue('currentAmount', value)}
          onCurrencyChange={setGoalCurrency}
          placeholder="0"
          showConversion={goalCurrency !== displayCurrency}
          targetCurrency={displayCurrency}
          error={errors.currentAmount?.message}
          className="text-white"
        />
        <p className="text-xs text-gray-400 mt-1">How much have you already saved towards this goal?</p>
      </div>

      {/* Live Rate Display */}
      {goalCurrency !== displayCurrency && watch('targetAmount') && (
        <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-1">Live Conversion</h4>
              <p className="text-xs text-gray-300">
                {formatCurrency(watch('targetAmount') || 0, goalCurrency)} = {' '}
                {convertAmount(watch('targetAmount') || 0, goalCurrency, displayCurrency) 
                  ? formatCurrency(convertAmount(watch('targetAmount') || 0, goalCurrency, displayCurrency)!, displayCurrency)
                  : 'N/A'
                }
              </p>
            </div>
            <LiveRateDisplay
              fromCurrency={goalCurrency}
              toCurrency={displayCurrency}
              amount={1}
              compact={true}
              showTrend={true}
              showLastUpdated={false}
            />
          </div>
        </div>
      )}

      {/* Activity Scope Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Goal Type
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
              <span className="font-medium">General Goal</span>
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
              <span className="font-medium">Account-Specific Goal</span>
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
              <span className="font-medium">Category-Based Goal</span>
              <span className="block text-xs text-gray-400">For a specific spending category</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    {currency.symbol}{account.balance.toLocaleString()} • {account.type}
                  </span>
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Select one or more accounts to link this goal to. You can change this later.
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
            This goal will track spending for the selected category across all accounts.
          </p>
        </div>
      )}

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Target Date"
          type="date"
          icon={<Calendar size={18} className="text-purple-400" />}
          {...register('targetDate', { required: 'Target date is required' })}
          error={errors.targetDate?.message}
          className="bg-black/40 border-white/20 text-white"
        />
      </div>

      <div className="flex space-x-4 pt-4">
        <Button
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1 border-white/20 text-white hover:bg-white/10"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit" 
          className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          loading={isSubmitting}
        >
          {initialData ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
};
