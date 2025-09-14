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
  const [goalCurrency, setGoalCurrency] = useState(initialData?.currencyCode || currency.code);
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
      currencyCode: initialData?.currencyCode || currency.code
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
        currencycode: goalCurrency, // Use lowercase to match addGoal function
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

      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Header with Info - Simplified */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Target size={20} className="mr-2 text-blue-400" />
          {initialData ? 'Edit Goal' : 'Create Goal'}
        </h3>
        <p className="text-gray-300 text-sm">
          {initialData 
            ? 'Update your goal details.'
            : 'Set your financial target and track progress.'}
        </p>
      </div>

      {/* Goal Type Selection - Simplified */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <h4 className="text-sm font-medium text-white mb-3">Goal Type</h4>
        <div className="space-y-2">
          {goalTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setSelectedGoalType(type.id as any);
                setValue('activityScope', type.id as any);
              }}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                selectedGoalType === type.id
                  ? 'border-blue-400 bg-blue-400/20 text-blue-100'
                  : 'border-white/20 hover:border-white/40 text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{type.icon}</span>
                <div>
                  <h5 className="font-medium text-sm">{type.name}</h5>
                  <p className="text-xs opacity-75">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <Input
          label="Goal Title"
          type="text"
          icon={<Target size={18} className="text-blue-400" />}
          {...register('title', { required: 'Goal title is required' })}
          error={errors.title?.message}
          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
          placeholder="e.g., Dream Vacation, New Car"
        />
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <Input
          label="Description"
          type="text"
          icon={<FileText size={18} className="text-blue-400" />}
          {...register('description')}
          error={errors.description?.message}
          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
          placeholder="What are you saving for? (optional)"
        />
      </div>

      {/* Target Amount - Simplified */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <label className="block text-sm font-medium text-white mb-3">
          Target Amount *
        </label>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-white">
              {getCurrencyInfo(goalCurrency)?.symbol || '$'}
            </span>
            <Input
              type="number"
              placeholder="0.00"
              value={watch('targetAmount') || ''}
              onChange={(e) => setValue('targetAmount', parseFloat(e.target.value) || 0)}
              error={errors.targetAmount?.message}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>
          
          {/* Currency Selection */}
          <select
            value={goalCurrency}
            onChange={(e) => setGoalCurrency(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* Current Amount - Simplified */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <label className="block text-sm font-medium text-white mb-3">
          Current Amount
        </label>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-white">
            {getCurrencyInfo(goalCurrency)?.symbol || '$'}
          </span>
          <Input
            type="number"
            placeholder="0.00"
            value={watch('currentAmount') || ''}
            onChange={(e) => setValue('currentAmount', parseFloat(e.target.value) || 0)}
            error={errors.currentAmount?.message}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
          />
        </div>
        
        <p className="text-xs text-gray-400 mt-2">
          Leave as 0 if you're starting fresh
        </p>
      </div>

      {/* Conversion preview removed for simplified currency system */}


      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <label className="block text-sm font-medium text-white mb-3">
          Category
        </label>
        <div className="relative z-10">
          <CategorySelector
            value={watch('category')}
            onChange={(category) => setValue('category', category)}
            type="goal"
            placeholder="Select a category"
            error={errors.category?.message}
          />
        </div>
      </div>

      {/* Account Selection - Only show if account_specific is selected */}
      {selectedGoalType === 'account_specific' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <label className="block text-sm font-medium text-white mb-3">
            Select Accounts
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(accounts || []).map((account) => (
              <div key={account.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`account-${account.id}`}
                  value={account.id}
                  {...register('accountIds')}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <label htmlFor={`account-${account.id}`} className="text-sm text-white flex-1">
                  <span className="font-medium">{account.name}</span>
                  <span className="block text-xs text-gray-400">
                    {currency.symbol}{account.balance.toLocaleString()} • {account.type}
                  </span>
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Select accounts to link this goal to.
          </p>
        </div>
      )}

      {/* Target Category - Only show if category_based is selected */}
      {selectedGoalType === 'category_based' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <label className="block text-sm font-medium text-white mb-3">
            Target Category
          </label>
          <div className="relative z-10">
            <CategorySelector
              value={watch('targetCategory')}
              onChange={(category) => setValue('targetCategory', category)}
              type="expense"
              placeholder="Select spending category"
              error={errors.targetCategory?.message}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            This goal will track spending for the selected category.
          </p>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <Input
          label="Target Date"
          type="date"
          icon={<Calendar size={18} className="text-blue-400" />}
          {...register('targetDate', { required: 'Target date is required' })}
          error={errors.targetDate?.message}
          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
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
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          loading={isSubmitting}
        >
          {initialData ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
};
