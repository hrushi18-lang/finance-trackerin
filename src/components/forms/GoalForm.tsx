import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Target, FileText, Calendar, CheckCircle, AlertCircle, Loader2, DollarSign } from 'lucide-react';
import { validateGoal, sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { Select } from '../common/Select';
import { Goal } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useFinance } from '../../contexts/FinanceContext';
import { currencyConversionService } from '../../services/currencyConversionService';
import { Decimal } from 'decimal.js';

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
  // Currency conversion fields
  targetCurrency: string;
  primaryCurrency: string;
}

interface GoalFormProps {
  onSubmit: (data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<GoalFormData>;
}

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
    examples: ['Spend less than $200 on dining', 'Save $1000 from salary']
  }
];

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' }
];

export const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { currency } = useInternationalization();
  const { accounts, userCategories, executeGoalCreation } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get primary currency code with proper fallback
  const userPrimaryCurrency = currency?.code || 'USD';
  
  const [targetCurrency, setTargetCurrency] = useState(initialData?.targetCurrency || userPrimaryCurrency);
  const [selectedGoalType, setSelectedGoalType] = useState<'general' | 'account_specific' | 'category_based'>(
    initialData?.activityScope || 'general'
  );
  
  // Currency conversion state
  const [conversionPreview, setConversionPreview] = useState<{
    primaryAmount: number;
    primaryCurrency: string;
    exchangeRate: number;
    conversionCase: string;
  } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GoalFormData>({
    mode: 'onChange',
    defaultValues: {
      currentAmount: 0,
      title: '',
      description: '',
      targetAmount: undefined,
      targetDate: '',
      category: '',
      activityScope: 'general',
      accountIds: [],
      targetCategory: '',
      currencyCode: userPrimaryCurrency,
      targetCurrency: userPrimaryCurrency,
      primaryCurrency: userPrimaryCurrency
    },
  });

  const watchedTargetAmount = watch('targetAmount');
  const watchedTargetCurrency = watch('targetCurrency');

  // Generate conversion preview when target amount or currency changes
  useEffect(() => {
    if (watchedTargetAmount && watchedTargetCurrency) {
      generateConversionPreview();
    } else {
      setConversionPreview(null);
      setConversionError(null);
    }
  }, [watchedTargetAmount, watchedTargetCurrency]);

  const generateConversionPreview = async () => {
    if (!watchedTargetAmount || !watchedTargetCurrency) return;

    try {
      setConversionError(null);
      
      // Create a preview request
      const previewRequest = {
        amount: 0, // No initial amount for goal creation
        currency: watchedTargetCurrency,
        accountId: 'preview', // Dummy account for preview
        operation: 'create' as const,
        description: 'Preview',
        goalName: 'Preview Goal',
        targetAmount: watchedTargetAmount,
        targetCurrency: watchedTargetCurrency
      };

      // Use the execution engine to get conversion preview
      const accountBalances = accounts.map(acc => ({
        id: acc.id,
        balance: acc.balance,
        currency: acc.currencycode,
        name: acc.name,
        type: acc.type
      }));

      const { CurrencyExecutionEngine } = await import('../../services/currencyExecutionEngine');
      const engine = new CurrencyExecutionEngine(accountBalances, userPrimaryCurrency);
      
      const result = await engine.executeGoalCreation(previewRequest);
      
      if (result.success) {
        setConversionPreview({
          primaryAmount: result.primaryAmount,
          primaryCurrency: result.primaryCurrency,
          exchangeRate: result.exchangeRate || 1,
          conversionCase: result.auditData.conversionCase
        });
      } else {
        setConversionError(result.error || 'Conversion failed');
      }
    } catch (error: any) {
      console.error('Conversion preview error:', error);
      setConversionError(error.message);
    }
  };

  const getConversionCaseDescription = (caseType: string) => {
    switch (caseType) {
      case 'all_same':
        return 'No conversion needed - all currencies match';
      case 'amount_account_same':
        return 'Amount matches account currency, converting to primary for net worth';
      case 'amount_primary_same':
        return 'Amount matches primary currency, converting to account currency';
      case 'account_primary_same':
        return 'Account and primary currencies match, converting amount';
      case 'all_different':
        return 'All currencies different - converting to both account and primary';
      case 'amount_different_others_same':
        return 'Amount currency different, account and primary match';
      default:
        return 'Currency conversion';
    }
  };

  const handleFormSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      console.log('Form data received:', data);

      // Check if required fields have values
      if (!data.targetAmount || data.targetAmount <= 0) {
        setError('Please enter a valid target amount greater than 0');
        setIsSubmitting(false);
        return;
      }

      if (!data.targetDate) {
        setError('Please select a target date');
        setIsSubmitting(false);
        return;
      }

      if (!data.category) {
        setError('Please select a category');
        setIsSubmitting(false);
        return;
      }

      // Validate the goal data with snake_case field names
      const validationData = {
        title: data.title,
        description: data.description || '',
        target_amount: Number(data.targetAmount),
        current_amount: Number(data.currentAmount || 0),
        target_date: new Date(data.targetDate),
        category: data.category,
        activity_scope: data.activityScope || 'general',
        account_ids: data.accountIds || [],
        target_category: data.targetCategory || undefined,
        currency_code: data.currencyCode || data.targetCurrency || userPrimaryCurrency
      };

      console.log('Validation data:', validationData);

      try {
        validateGoal(validationData);
      } catch (validationError: any) {
        console.error('Validation error:', validationError);
        setError(validationError.message || 'Validation failed');
        return;
      }

      // Use currency execution engine for goal creation
      const executionRequest = {
        amount: 0, // No initial amount for goal creation
        currency: data.targetCurrency,
        accountId: data.accountIds[0] || 'default', // Use first selected account or default
        operation: 'create' as const,
        description: data.description,
        goalName: data.title,
        targetAmount: data.targetAmount,
        targetCurrency: data.targetCurrency,
        category: data.category
      };

      const result = await executeGoalCreation(executionRequest);

      if (result.success) {
        // Create goal data with converted amounts
        const goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          title: data.title,  // ✅ Changed from 'name' to 'title'
          description: data.description || '',
          targetAmount: result.accountAmount, // Use account currency amount for goal target
          currentAmount: data.currentAmount || 0,
          targetDate: new Date(data.targetDate),
          category: data.category,
          priority: 'medium',
          status: 'active',
          goalType: 'general_savings',
          currencycode: data.targetCurrency || userPrimaryCurrency,
          periodType: 'monthly',
          isRecurring: false,
          // Multi-currency data
          native_amount: result.auditData.originalAmount,
          native_currency: result.auditData.originalCurrency,
          converted_amount: result.primaryAmount, // Primary currency for net worth tracking
          converted_currency: result.primaryCurrency,
          exchange_rate: result.exchangeRate || 1,
          conversion_source: result.conversionSource || 'manual'
        };

        await onSubmit(goalData);
      } else {
        throw new Error(result.error || 'Goal creation failed');
      }
    } catch (error: any) {
      console.error('Goal creation error:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center">
          <Target className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
          Create Financial Goal
        </h2>
        <p className="text-blue-50 text-sm sm:text-base">
          Set a financial goal with multi-currency support. Your goal will be tracked in your primary currency ({userPrimaryCurrency}).
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-6">
        {/* Goal Type Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Goal Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {goalTypes.map((type) => (
              <div
                key={type.id}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                  selectedGoalType === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow'
                }`}
                onClick={() => {
                  setSelectedGoalType(type.id as any);
                  setValue('activityScope', type.id as any);
                }}
              >
                <div className="text-xl sm:text-2xl mb-2">{type.icon}</div>
                <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-1">{type.name}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">{type.description}</p>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Examples:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                    {type.examples.map((example, index) => (
                      <li key={index} className="truncate">• {example}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Goal Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Goal Title"
              type="text"
              icon={<Target size={18} className="text-blue-500" />}
              {...register('title', { required: 'Goal title is required' })}
              error={errors.title?.message}
              placeholder="e.g., Emergency Fund"
            />
            
            <Input
              label="Description"
              type="text"
              icon={<FileText size={18} className="text-blue-500" />}
              {...register('description')}
              error={errors.description?.message}
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Goal Amounts with Currency */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-green-200 dark:border-green-800 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Goal Amounts</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Input
                label="Target Amount *"
                type="number"
                step="0.01"
                min="0.01"
                icon={<DollarSign size={18} className="text-green-600" />}
                {...register('targetAmount', { 
                  required: 'Target amount is required',
                  min: { value: 0.01, message: 'Target amount must be greater than 0' },
                  valueAsNumber: true
                })}
                error={errors.targetAmount?.message}
                className="text-base sm:text-lg font-semibold"
                placeholder="e.g., 10000.00"
              />
            </div>
            
            <div>
              <Input
                label="Current Amount"
                type="number"
                step="0.01"
                min="0"
                icon={<DollarSign size={18} className="text-blue-600" />}
                {...register('currentAmount', { 
                  min: { value: 0, message: 'Current amount cannot be negative' },
                  valueAsNumber: true
                })}
                error={errors.currentAmount?.message}
                className="text-base sm:text-lg"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Optional: If you've already saved some amount
              </p>
            </div>
          </div>
          
          <div className="mt-3 sm:mt-4">
            <Select
              label="Currency *"
              value={targetCurrency}
              onChange={(value) => {
                setTargetCurrency(value);
                setValue('targetCurrency', value);
              }}
              options={currencyOptions}
              icon={<DollarSign size={18} className="text-green-600" />}
            />
          </div>
        </div>

        {/* Conversion Preview */}
        {conversionPreview && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <h4 className="font-medium text-sm sm:text-base text-green-900 dark:text-green-100">Conversion Preview</h4>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600 dark:text-gray-400">Your goal target:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currencyConversionService.formatAmount(new Decimal(watchedTargetAmount), watchedTargetCurrency)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-600 dark:text-gray-400">Tracked in primary currency:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currencyConversionService.formatAmount(new Decimal(conversionPreview.primaryAmount), conversionPreview.primaryCurrency)}
                </span>
              </div>
              
              {conversionPreview.exchangeRate !== 1 && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-gray-600 dark:text-gray-400">Exchange rate:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    1 {watchedTargetCurrency} = {conversionPreview.exchangeRate.toFixed(6)} {conversionPreview.primaryCurrency}
                  </span>
                </div>
              )}
              
              <div className="pt-2 border-t border-green-200 dark:border-green-700">
                <p className="text-xs text-green-700 dark:text-green-300">
                  {getConversionCaseDescription(conversionPreview.conversionCase)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conversion Error */}
        {conversionError && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-red-200 dark:border-red-800 shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                Conversion failed: {conversionError}
              </span>
            </div>
          </div>
        )}

        {/* Target Date */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Target Date</h3>
          
          <Input
            label="When do you want to achieve this goal?"
            type="date"
            icon={<Calendar size={18} className="text-blue-500" />}
            {...register('targetDate', { required: 'Target date is required' })}
            error={errors.targetDate?.message}
          />
        </div>

        {/* Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Category</h3>
          
          <CategorySelector
            type="goal"
            value={watch('category')}
            onChange={(category) => setValue('category', category)}
            placeholder="Select a goal category"
            error={errors.category?.message}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-red-200 dark:border-red-800 shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2 sm:pt-4 sticky bottom-0 sm:static bg-white dark:bg-gray-900 sm:bg-transparent p-4 sm:p-0 -mx-4 sm:mx-0 border-t sm:border-0 border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Goal'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};