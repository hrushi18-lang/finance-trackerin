import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calculator, Tag, Calendar, AlertCircle, CheckCircle, Loader2, DollarSign, Bell, RefreshCw, Info } from 'lucide-react';
import { validateBudget, sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { Select } from '../common/Select';
import { Budget, BudgetType, BudgetRecurrence } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useFinance } from '../../contexts/FinanceContext';
import { currencyConversionService } from '../../services/currencyConversionService';
import { Decimal } from 'decimal.js';

interface BudgetFormData {
  // Basic Details
  name?: string;
  description?: string;
  category: string;
  budgetType: BudgetType;
  
  // Financial Limits
  amount: number;
  budgetCurrency: string;
  primaryCurrency: string;
  alertThreshold: number;
  alertEnabled: boolean;
  
  // Time Frame
  period: 'weekly' | 'monthly' | 'yearly';
  recurrence: BudgetRecurrence;
  startDate: string;
  endDate?: string;
  
  // Scoping
  activityScope: 'general' | 'account_specific' | 'category_based';
  accountIds: string[];
  targetCategory?: string;
  
  // Rollover
  allowRollover: boolean;
}

interface BudgetFormProps {
  initialData?: Budget;
  categoryId?: string; // Added categoryId
  onSubmit: (data: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => Promise<void>;
  onCancel: () => void;
}

const budgetTypeOptions = [
  { 
    value: 'fixed_expense' as BudgetType, 
    label: '🏠 Fixed Expense Budget', 
    description: 'Regular recurring bills (rent, utilities, subscriptions)',
    icon: '🏠'
  },
  { 
    value: 'variable_expense' as BudgetType, 
    label: '📊 Variable Expense Budget', 
    description: 'Fluctuating costs (groceries, dining, entertainment)',
    icon: '📊'
  },
  { 
    value: 'debt_repayment' as BudgetType, 
    label: '💳 Debt Repayment Budget', 
    description: 'Paying off loans or credit cards',
    icon: '💳'
  },
  { 
    value: 'savings' as BudgetType, 
    label: '🏦 Savings Budget', 
    description: 'Emergency fund or general savings',
    icon: '🏦'
  },
  { 
    value: 'goal_oriented' as BudgetType, 
    label: '🎯 Goal-Oriented Budget', 
    description: 'Targeted spending for specific goals',
    icon: '🎯'
  },
  { 
    value: 'cash_envelope' as BudgetType, 
    label: '💰 Cash Envelope Budget', 
    description: 'Divide money into category envelopes',
    icon: '💰'
  },
  { 
    value: 'income_allocation' as BudgetType, 
    label: '📈 Income Allocation Budget', 
    description: 'Percentage-based (e.g., 50/30/20 rule)',
    icon: '📈'
  },
  { 
    value: 'zero_based' as BudgetType, 
    label: '🎲 Zero-Based Budget', 
    description: 'Every dollar is allocated',
    icon: '🎲'
  },
  { 
    value: 'rolling' as BudgetType, 
    label: '🔄 Rolling Budget', 
    description: 'Unused budget carries over',
    icon: '🔄'
  },
  { 
    value: 'custom' as BudgetType, 
    label: '⚙️ Custom Budget', 
    description: 'User-defined budget type',
    icon: '⚙️'
  }
];

const recurrenceOptions = [
  { value: 'once' as BudgetRecurrence, label: 'One-Time', description: 'Non-recurring budget' },
  { value: 'daily' as BudgetRecurrence, label: 'Daily', description: 'Resets every day' },
  { value: 'weekly' as BudgetRecurrence, label: 'Weekly', description: 'Resets every week' },
  { value: 'bi-weekly' as BudgetRecurrence, label: 'Bi-Weekly', description: 'Every two weeks' },
  { value: 'monthly' as BudgetRecurrence, label: 'Monthly', description: 'Most common choice' },
  { value: 'quarterly' as BudgetRecurrence, label: 'Quarterly', description: 'Every 3 months' },
  { value: 'yearly' as BudgetRecurrence, label: 'Yearly', description: 'Annual planning' }
];

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
  const { currency } = useInternationalization();
  const { userCategories, accounts, executeBudgetCreation } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get primary currency code with proper fallback
  const userPrimaryCurrency = currency?.code || 'USD';
  
  // Currency conversion state
  const [budgetCurrency, setBudgetCurrency] = useState(initialData?.currency || userPrimaryCurrency);
  const [conversionPreview, setConversionPreview] = useState<{
    primaryAmount: number;
    primaryCurrency: string;
    exchangeRate: number;
    conversionCase: string;
  } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BudgetFormData>({
    defaultValues: initialData ? {
      // Basic Details
      name: initialData.name || '',
      description: initialData.description || '',
      category: initialData.category,
      budgetType: initialData.budgetType || 'variable_expense',
      
      // Financial Limits
      amount: initialData.amount,
      budgetCurrency: initialData.currency || userPrimaryCurrency,
      primaryCurrency: userPrimaryCurrency,
      alertThreshold: initialData.alertThreshold || 80,
      alertEnabled: initialData.alertEnabled !== false,
      
      // Time Frame
      period: initialData.period,
      recurrence: initialData.recurrence || 'monthly',
      startDate: initialData.startDate || new Date().toISOString().split('T')[0],
      endDate: initialData.endDate || '',
      
      // Scoping
      activityScope: initialData.activityScope || 'general',
      accountIds: initialData.accountIds || [],
      targetCategory: initialData.targetCategory || '',
      
      // Rollover
      allowRollover: initialData.allowRollover || false
    } : {
      // Basic Details
      name: '',
      description: '',
      budgetType: 'variable_expense' as BudgetType,
      
      // Financial Limits
      budgetCurrency: userPrimaryCurrency,
      primaryCurrency: userPrimaryCurrency,
      alertThreshold: 80,
      alertEnabled: true,
      
      // Time Frame
      period: 'monthly',
      recurrence: 'monthly' as BudgetRecurrence,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      
      // Scoping
      activityScope: 'general',
      accountIds: [],
      
      // Rollover
      allowRollover: false
    },
  });

  const selectedPeriod = watch('period');
  const selectedBudgetType = watch('budgetType');
  const selectedRecurrence = watch('recurrence');
  const alertEnabled = watch('alertEnabled');
  const allowRollover = watch('allowRollover');
  
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
      const engine = new CurrencyExecutionEngine([], userPrimaryCurrency);
      
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

      console.log('Budget form data received:', data);
      
      // Validate required fields
      if (!data.category) {
        setError('Please select a category');
        setIsSubmitting(false);
        return;
      }

      if (!data.amount || data.amount <= 0) {
        setError('Please enter a valid budget amount');
        setIsSubmitting(false);
        return;
      }

      const currency = data.budgetCurrency || budgetCurrency || userPrimaryCurrency;

      if (!currency) {
        setError('Currency is required');
        setIsSubmitting(false);
        return;
      }
      
      // Sanitize and validate data
      const sanitizedData = sanitizeFinancialData(data, ['amount']);
      
      // Use currency execution engine for budget creation
      const executionRequest = {
        amount: 0, // No initial amount for budget creation
        currency: currency,
        accountId: data.accountIds?.[0] || 'default',
        operation: 'create' as const,
        description: `Budget for ${data.category}`,
        budgetName: `${data.category} Budget`,
        budgetAmount: toNumber(sanitizedData.amount),
        budgetCurrency: currency,
        budgetPeriod: data.period,
        category: data.category
      };

      console.log('Budget execution request:', executionRequest);

      const result = await executeBudgetCreation(executionRequest);

      if (result.success) {
        await onSubmit({
          // Basic Details
          name: data.name,
          description: data.description,
          category: data.category,
          budgetType: data.budgetType,
          
          // Financial Limits
          amount: result.accountAmount, // Use converted amount from engine
          spent: initialData?.spent || 0,
          currency: data.budgetCurrency,
          alertThreshold: data.alertThreshold,
          alertEnabled: data.alertEnabled,
          
          // Time Frame
          period: data.period,
          recurrence: data.recurrence,
          startDate: data.startDate,
          endDate: data.endDate || null,
          
          // Scoping
          activityScope: data.activityScope || 'general',
          accountIds: data.accountIds || [],
          targetCategory: data.targetCategory,
          
          // Rollover
          allowRollover: data.allowRollover,
          rolledOverAmount: 0,
          
          // Multi-currency fields from execution result
          native_amount: result.auditData.originalAmount,
          native_currency: result.auditData.originalCurrency,
          converted_amount: result.primaryAmount,
          converted_currency: result.primaryCurrency,
          exchange_rate: result.exchangeRate || 1,
          conversion_source: result.conversionSource || 'manual',
          conversion_case: result.auditData.conversionCase,
          execution_id: result.auditData.executionId
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
          Create comprehensive budgets with spending limits, alerts, and automatic tracking.
        </p>
      </div>

      {/* Budget Name & Description */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
          <Tag size={16} className="mr-2 text-blue-400" />
          Basic Information
        </h4>
        <div className="space-y-4">
          <Input
            label="Budget Name (Optional)"
            type="text"
            {...register('name')}
            placeholder="e.g., October Grocery Budget"
            className="bg-black/40 border-white/20 text-white"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description / Notes (Optional)
            </label>
            <textarea
              {...register('description')}
              placeholder="Add any additional notes about this budget..."
              rows={3}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Budget Type Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
          <Info size={16} className="mr-2 text-purple-400" />
          Budget Type
        </h4>
        <p className="text-xs text-gray-400 mb-3">
          Choose the type that best matches your budgeting goal
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {budgetTypeOptions.map((option) => (
            <label key={option.value} className="cursor-pointer block">
              <input
                type="radio"
                value={option.value}
                {...register('budgetType', { required: 'Budget type is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-all ${
                selectedBudgetType === option.value 
                  ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/20' 
                  : 'border-white/20 hover:border-white/30 hover:bg-white/5'
              }`}>
                <div className="flex items-start space-x-2">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{option.label.replace(option.icon + ' ', '')}</p>
                    <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.budgetType && (
          <p className="text-sm text-error-400 mt-2">{errors.budgetType.message}</p>
        )}
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
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 relative z-50">
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
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 relative z-10">
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
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 relative z-40">
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

      {/* Budget Amount and Currency */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Budget Amount"
              type="number"
              step="0.01"
              icon={<CurrencyIcon currencyCode={budgetCurrency} className="text-green-400" />}
              {...register('amount', {
                required: 'Budget amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              })}
              error={errors.amount?.message}
              className="bg-black/40 border-white/20 text-white"
              placeholder={`e.g., 500`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget Currency
            </label>
            <select
              value={budgetCurrency}
              onChange={(e) => {
                setBudgetCurrency(e.target.value);
                setValue('budgetCurrency', e.target.value);
              }}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={userPrimaryCurrency}>{userPrimaryCurrency} - Primary Currency</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recurrence Pattern */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <RefreshCw size={16} className="mr-2 text-purple-400" />
          Recurrence Pattern
        </label>
        <p className="text-xs text-gray-400 mb-3">
          How often should this budget reset?
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {recurrenceOptions.map((option) => (
            <label key={option.value} className="cursor-pointer block">
              <input
                type="radio"
                value={option.value}
                {...register('recurrence', { required: 'Recurrence is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors text-center ${
                selectedRecurrence === option.value 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs opacity-70 mt-1">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.recurrence && (
          <p className="text-sm text-error-400 mt-2">{errors.recurrence.message}</p>
        )}
      </div>

      {/* Period Selection (Legacy - for compatibility) */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Calendar size={16} className="mr-2 text-purple-400" />
          Budget Period (Display)
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

      {/* Date Range */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Calendar size={16} className="mr-2 text-blue-400" />
          Budget Date Range
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Start Date"
              type="date"
              {...register('startDate', {
                required: 'Start date is required'
              })}
              error={errors.startDate?.message}
              className="bg-black/40 border-white/20 text-white"
            />
          </div>
          <div>
            <Input
              label="End Date (Optional)"
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
              className="bg-black/40 border-white/20 text-white"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          The budget will be active from the start date. If an end date is set, the budget will automatically expire after that date.
        </p>
      </div>

      {/* Alert Settings */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
          <Bell size={16} className="mr-2 text-yellow-400" />
          Alert Settings
        </h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="alertEnabled"
              {...register('alertEnabled')}
              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="alertEnabled" className="text-sm text-gray-300 flex-1">
              <span className="font-medium">Enable Budget Alerts</span>
              <span className="block text-xs text-gray-400 mt-1">
                Get notified when you're close to your budget limit
              </span>
            </label>
          </div>
          
          {alertEnabled && (
            <div className="pl-8">
              <Input
                label="Alert Threshold (%)"
                type="number"
                min="1"
                max="100"
                step="1"
                {...register('alertThreshold', {
                  min: { value: 1, message: 'Minimum 1%' },
                  max: { value: 100, message: 'Maximum 100%' }
                })}
                error={errors.alertThreshold?.message}
                className="bg-black/40 border-white/20 text-white"
                placeholder="80"
              />
              <p className="text-xs text-gray-400 mt-2">
                You'll be alerted when you reach {watch('alertThreshold') || 80}% of your budget
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rollover Settings (for Rolling Budget Type) */}
      {selectedBudgetType === 'rolling' && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
            <RefreshCw size={16} className="mr-2 text-green-400" />
            Rollover Settings
          </h4>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allowRollover"
              {...register('allowRollover')}
              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="allowRollover" className="text-sm text-gray-300 flex-1">
              <span className="font-medium">Allow Budget Rollover</span>
              <span className="block text-xs text-gray-400 mt-1">
                Unused budget will carry over to the next period
              </span>
            </label>
          </div>
          {allowRollover && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-300">
                ✨ Any unspent amount at the end of the period will be added to next period's budget automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center text-blue-400 mb-2">
          <span className="mr-2">🎯</span>
          <span className="font-medium">Smart Budgeting</span>
        </div>
        <p className="text-sm text-blue-300">
          Every time you track an expense in this category, we'll update your budget automatically. 
          Track your spending in real-time and get alerts when you're approaching your limit!
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
