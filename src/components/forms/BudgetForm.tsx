import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calculator, Tag, Calendar, AlertCircle, CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { validateBudget, sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { Select } from '../common/Select';
import { Budget } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useFinance } from '../../contexts/FinanceContext';
import { currencyConversionService } from '../../services/currencyConversionService';
import { Decimal } from 'decimal.js';

interface BudgetFormData {
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  activityScope: 'general' | 'account_specific' | 'category_based';
  accountIds: string[];
  targetCategory?: string;
  // Currency conversion fields
  budgetCurrency: string;
  primaryCurrency: string;
}

interface BudgetFormProps {
  initialData?: Budget;
  categoryId?: string; // Added categoryId
  onSubmit: (data: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => Promise<void>;
  onCancel: () => void;
}

const periodOptions = [
  { value: 'weekly', label: 'Weekly', description: 'Reset every week' },
  { value: 'monthly', label: 'Monthly', description: 'Most common choice' },
  { value: 'yearly', label: 'Yearly', description: 'Annual planning' }
];

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' }
];

export const BudgetForm: React.FC<BudgetFormProps> = ({ initialData, categoryId, onSubmit, onCancel }) => {
  const { primaryCurrency } = useInternationalization();
  const { userCategories, accounts, executeBudgetCreation } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Currency conversion state
  const [budgetCurrency, setBudgetCurrency] = useState(initialData?.currency || primaryCurrency.code);
  const [conversionPreview, setConversionPreview] = useState<{
    primaryAmount: number;
    primaryCurrency: string;
    exchangeRate: number;
    conversionCase: string;
  } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BudgetFormData>({
    defaultValues: initialData ? {
      category: initialData.category,
      amount: initialData.amount,
      period: initialData.period,
      activityScope: (initialData as any).activityScope || 'general',
      accountIds: (initialData as any).accountIds || [],
      targetCategory: (initialData as any).targetCategory || ''
    } : {
      period: 'monthly',
      activityScope: 'general',
      accountIds: []
    },
  });

  const selectedPeriod = watch('period');
  
  // Get expense categories (with fallback to default categories)
  const defaultExpenseCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];
  const userExpenseCategories = userCategories.filter(c => c.type === 'expense');
  const expenseCategories = userExpenseCategories.length > 0 
    ? userExpenseCategories.map(c => c.name)
    : defaultExpenseCategories;

  // Generate conversion preview when amount or currency changes
  useEffect(() => {
    const watchedAmount = watch('amount');
    const watchedCurrency = watch('budgetCurrency');
    
    if (watchedAmount && watchedCurrency) {
      generateConversionPreview(watchedAmount, watchedCurrency);
    } else {
      setConversionPreview(null);
      setConversionError(null);
    }
  }, [watch('amount'), watch('budgetCurrency')]);

  const generateConversionPreview = async (amount: number, currency: string) => {
    if (!amount || !currency) return;

    try {
      setConversionError(null);
      
      // Create a preview request
      const previewRequest = {
        amount: 0, // No initial amount for budget creation
        currency: currency,
        accountId: 'preview', // Dummy account for preview
        operation: 'create' as const,
        description: 'Preview',
        budgetName: 'Preview Budget',
        budgetAmount: amount,
        budgetCurrency: currency,
        budgetPeriod: 'monthly'
      };

      // Use the execution engine to get conversion preview
      const { CurrencyExecutionEngine } = await import('../../services/currencyExecutionEngine');
      const engine = new CurrencyExecutionEngine([], primaryCurrency.code);
      
      const result = await engine.executeBudgetCreation(previewRequest);
      
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

  const handleFormSubmit = async (data: BudgetFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize and validate data
      const sanitizedData = sanitizeFinancialData(data, ['amount']);
      
      // Use currency execution engine for budget creation
      const executionRequest = {
        amount: 0, // No initial amount for budget creation
        currency: data.budgetCurrency,
        accountId: data.accountIds?.[0] || 'default',
        operation: 'create' as const,
        description: `Budget for ${data.category}`,
        budgetName: `${data.category} Budget`,
        budgetAmount: toNumber(sanitizedData.amount),
        budgetCurrency: data.budgetCurrency,
        budgetPeriod: data.period,
        category: data.category
      };

      const result = await executeBudgetCreation(executionRequest);

      if (result.success) {
        // Transform to snake_case for validation
        const validationData = {
          category: sanitizedData.category,
          amount: result.accountAmount, // Use account currency amount for budget
          spent: 0, // New budget starts with 0 spent
          period: sanitizedData.period,
          start_date: new Date(), // Start from today
          end_date: new Date(Date.now() + (sanitizedData.period === 'weekly' ? 7 : sanitizedData.period === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000), // Calculate end date
          account_id: sanitizedData.accountIds?.[0] || undefined, // Use first selected account
          // Add missing fields for validation
          activity_scope: data.activityScope,
          account_ids: data.accountIds || [],
          target_category: data.targetCategory || undefined,
        };
        
        const validatedData = validateBudget(validationData);
        
        await onSubmit({
          // Map validated snake_case data to camelCase for the API
          category: validatedData.category,
          amount: validatedData.amount,
          period: validatedData.period,
          startDate: validatedData.start_date,
          endDate: validatedData.end_date,
          accountId: validatedData.account_id,
          categoryId: categoryId || '', // Added categoryId
          spent: initialData?.spent || 0,
          // Add scoping fields from validated data
          activityScope: validatedData.activity_scope,
          accountIds: validatedData.account_ids || [],
          targetCategory: validatedData.target_category,
          currencyCode: result.primaryCurrency // Use primary currency
        });
      } else {
        throw new Error(result.error || 'Budget creation failed');
      }
      
    } catch (error: any) {
      console.error('Error submitting budget:', error);
      setError(error.message || 'Failed to save budget. Please try again.');
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
      
      {/* Header with Info */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Calculator size={20} className="mr-2 text-blue-400" />
          {initialData ? 'Update Budget' : 'Create New Budget'}
        </h3>
        <p className="text-gray-300 text-sm">
          Set spending limits for different categories to keep your finances on track.
        </p>
      </div>

      {/* Activity Scope Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Budget Type
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
              <span className="font-medium">General Budget</span>
              <span className="block text-xs text-gray-400">Track spending across all accounts (recommended for most users)</span>
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
              <span className="font-medium">Account-Specific Budget</span>
              <span className="block text-xs text-gray-400">Limit spending from specific accounts (e.g., credit card only)</span>
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
              <span className="font-medium">Category-Based Budget</span>
              <span className="block text-xs text-gray-400">Set limits for specific spending categories (e.g., dining out)</span>
            </label>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300">
            <strong>💡 Tip:</strong> Choose "Monthly" for most budgets. Weekly is good for short-term goals, 
            Yearly for annual planning. The budget will reset automatically at the end of each period.
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Tag size={16} className="mr-2 text-yellow-400" />
          Category
        </label>
        <CategorySelector
          value={watch('category')}
          onChange={(category) => setValue('category', category)}
          type="budget"
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
            Select one or more accounts to link this budget to. You can change this later.
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
            This budget will track spending for the selected category across all accounts.
          </p>
        </div>
      )}

      {/* Budget Amount */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Budget Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-green-400" />}
          {...register('amount', {
            required: 'Budget amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
          error={errors.amount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder={`e.g., 500`}
        />
      </div>

      {/* Period Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Calendar size={16} className="mr-2 text-purple-400" />
          Budget Period
        </label>
        <div className="space-y-2">
          {periodOptions.map((option) => (
            <label key={option.value} className="cursor-pointer block">
              <input
                type="radio"
                value={option.value}
                {...register('period', { required: 'Period is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                selectedPeriod === option.value 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm opacity-80">{option.description}</p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.period && (
          <p className="text-sm text-error-400 mt-1">{errors.period.message}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center text-blue-400 mb-2">
          <span className="mr-2">🎯</span>
          <span className="font-medium">Smart Budgeting</span>
        </div>
        <p className="text-sm text-blue-300">
          Every time you manually track an expense in this category, we'll update your budget automatically. 
          This helps you see exactly how much you have left to spend!
        </p>
      </div>

      {/* Actions */}
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
          {initialData ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
};
