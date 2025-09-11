import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Target, FileText, Calendar } from 'lucide-react';
import { validateGoal, sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { Goal } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { formatCurrency, getCurrencyInfo } from '../../utils/currency-converter';
import { AlertCircle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

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

const goalTypes = [
  { 
    id: 'general', 
    name: 'Random Goal', 
    description: 'Personal goals like "Travel to India", "Buy something"', 
    icon: '🎯',
    examples: ['Travel to India', 'Buy a new laptop', 'Save for vacation']
  },
  { 
    id: 'account_specific', 
    name: 'Account-Specific', 
    description: 'Goals linked to a specific account', 
    icon: '🏦',
    examples: ['Save $5000 in SBI account', 'Build emergency fund in checking']
  },
  { 
    id: 'category_based', 
    name: 'Category-Based', 
    description: 'Goals based on spending categories', 
    icon: '📊',
    examples: ['Reduce food spending', 'Save on entertainment']
  }
];

export const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { currency } = useInternationalization();
  const { accounts } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalCurrency, setGoalCurrency] = useState(initialData?.currencyCode || 'USD');
  const [selectedGoalType, setSelectedGoalType] = useState<'general' | 'account_specific' | 'category_based'>(
    initialData?.activityScope || 'general'
  );
  
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
      currencyCode: initialData?.currencyCode || 'USD'
    },
  });

  const handleFormSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields
      const sanitizedData = sanitizeFinancialData(data, ['targetAmount', 'currentAmount']);
      
      // Transform to snake_case for validation
      const validationData = {
        title: sanitizedData.title,
        description: sanitizedData.description,
        target_amount: toNumber(sanitizedData.targetAmount),
        current_amount: toNumber(sanitizedData.currentAmount),
        target_date: new Date(data.targetDate),
        category: sanitizedData.category,
        account_id: sanitizedData.accountIds?.[0] || undefined, // Use first selected account or undefined
        // Add missing fields for validation
        activity_scope: data.activityScope,
        account_ids: data.accountIds || [],
        target_category: data.targetCategory || undefined,
      };
      
      // Validate using schema
      const validatedData = validateGoal(validationData);
      
      await onSubmit({
        // Map validated snake_case data to camelCase for the API
        title: validatedData.title,
        description: validatedData.description,
        targetAmount: validatedData.target_amount,
        currentAmount: validatedData.current_amount,
        targetDate: new Date(data.targetDate),
        category: validatedData.category,
        accountId: validatedData.account_id,
        currencyCode: goalCurrency,
        // Add scoping fields from validated data
        activityScope: selectedGoalType,
        accountIds: selectedGoalType === 'account_specific' ? (data.accountIds || []) : [],
        targetCategory: selectedGoalType === 'category_based' ? data.targetCategory : undefined,
        goalType: selectedGoalType === 'account_specific' ? 'account_specific' : 
                 selectedGoalType === 'category_based' ? 'category_based' : 'general_savings',
        priority: validatedData.priority,
        status: 'active'
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

      {/* Goal Type Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="text-md font-semibold text-white mb-4">Goal Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {goalTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setSelectedGoalType(type.id as any);
                setValue('activityScope', type.id as any);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedGoalType === type.id
                  ? 'border-primary-500 bg-primary-500/20'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{type.icon}</div>
                <h5 className="font-semibold text-white text-sm mb-1">{type.name}</h5>
                <p className="text-xs text-gray-400 mb-2">{type.description}</p>
                <div className="text-xs text-gray-500">
                  Examples: {type.examples.slice(0, 2).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
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

      {/* Target Amount - Enhanced */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 text-lg">🎯</span>
          </div>
          <div>
            <label className="text-lg font-semibold text-gray-800">
              Target Amount *
            </label>
            <p className="text-sm text-gray-600">
              How much do you want to save?
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-600">
              {getCurrencyInfo(goalCurrency)?.symbol || '$'}
            </span>
            <Input
              type="number"
              placeholder="0.00"
              value={watch('targetAmount') || ''}
              onChange={(e) => setValue('targetAmount', parseFloat(e.target.value) || 0)}
              error={errors.targetAmount?.message}
              className="flex-1 text-lg"
            />
          </div>
          
          {/* Currency Selection */}
          <select
            value={goalCurrency}
            onChange={(e) => setGoalCurrency(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="USD">🇺🇸 USD - US Dollar</option>
            <option value="EUR">🇪🇺 EUR - Euro</option>
            <option value="GBP">🇬🇧 GBP - British Pound</option>
            <option value="INR">🇮🇳 INR - Indian Rupee</option>
            <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
            <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
            <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
            <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
          </select>
        </div>
        
        {/* Quick Amount Buttons */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('targetAmount', 10000)}
              className="text-xs"
            >
              ₹10K
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('targetAmount', 50000)}
              className="text-xs"
            >
              ₹50K
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('targetAmount', 100000)}
              className="text-xs"
            >
              ₹1L
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('targetAmount', 500000)}
              className="text-xs"
            >
              ₹5L
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('targetAmount', 1000000)}
              className="text-xs"
            >
              ₹10L
            </Button>
          </div>
        </div>
      </div>

      {/* Current Amount - Enhanced */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-lg">💰</span>
          </div>
          <div>
            <label className="text-lg font-semibold text-gray-800">
              Current Amount
            </label>
            <p className="text-sm text-gray-600">
              How much have you already saved?
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-600">
            {getCurrencyInfo(goalCurrency)?.symbol || '$'}
          </span>
          <Input
            type="number"
            placeholder="0.00"
            value={watch('currentAmount') || ''}
            onChange={(e) => setValue('currentAmount', parseFloat(e.target.value) || 0)}
            error={errors.currentAmount?.message}
            className="flex-1 text-lg"
          />
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Leave as 0 if you're starting fresh
        </p>
      </div>

      {/* Conversion preview removed for simplified currency system */}

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
      {selectedGoalType === 'account_specific' && (
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
      {selectedGoalType === 'category_based' && (
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
