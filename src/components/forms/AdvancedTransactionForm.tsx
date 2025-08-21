import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Tag, Calendar, Wallet, ToggleLeft, ToggleRight, AlertCircle, Info, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { Transaction, FinancialAccount } from '../../types';

interface AdvancedTransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  accountId: string;
  affectsBalance: boolean;
  reason?: string;
  transferToAccountId?: string;
}

interface AdvancedTransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  onCancel: () => void;
  initialType?: 'income' | 'expense';
  initialData?: Transaction;
}

export const AdvancedTransactionForm: React.FC<AdvancedTransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialType = 'expense',
  initialData
}) => {
  const { accounts, userCategories } = useFinance();
  const { currency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdvancedTransactionFormData>({
    defaultValues: initialData ? {
      type: initialData.type,
      amount: initialData.amount,
      category: initialData.category,
      description: initialData.description,
      date: initialData.date.toISOString().split('T')[0],
      accountId: initialData.accountId || '',
      affectsBalance: initialData.affectsBalance ?? true,
      reason: initialData.reason || '',
      transferToAccountId: initialData.transferToAccountId || ''
    } : {
      type: initialType,
      date: new Date().toISOString().split('T')[0],
      affectsBalance: true
    }
  });

  const type = watch('type');
  const affectsBalance = watch('affectsBalance');
  const accountId = watch('accountId');
  const transferToAccountId = watch('transferToAccountId');
  const amount = watch('amount');

  // Get available categories based on type
  const defaultCategories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Transfer', 'Other'],
    expense: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Transfer', 'Other']
  };
  
  const userCategoriesForType = (userCategories || []).filter(c => c.type === type);
  const availableCategories = userCategoriesForType.length > 0 
    ? userCategoriesForType.map(c => c.name)
    : defaultCategories[type];

  const selectedAccount = (accounts || []).find(a => a.id === accountId);
  const transferAccount = (accounts || []).find(a => a.id === transferToAccountId);

  const handleFormSubmit = async (data: AdvancedTransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate balance impact logic
      if (!data.affectsBalance && !data.reason?.trim()) {
        setError('Reason is required when transaction does not affect balance');
        return;
      }

      // Validate account balance for expenses
      if (data.type === 'expense' && data.affectsBalance && selectedAccount) {
        if (Number(data.amount) > selectedAccount.balance) {
          setError(`Insufficient balance in ${selectedAccount.name}. Available: ${formatCurrency(selectedAccount.balance)}`);
          return;
        }
      }

      await onSubmit({
        ...data,
        amount: Number(data.amount),
        date: new Date(data.date),
        affectsBalance: data.affectsBalance,
        reason: data.affectsBalance ? undefined : data.reason
      });
      
      onCancel();
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      setError(error.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTransfer = transferToAccountId && transferToAccountId !== accountId;

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
        <h3 className="text-lg font-semibold text-white mb-2">Advanced Transaction</h3>
        <p className="text-gray-300 text-sm">
          Create transactions with account linking and balance control.
        </p>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Transaction Type</label>
        <div className="grid grid-cols-2 gap-4">
          <label className="cursor-pointer">
            <input
              type="radio"
              value="income"
              {...register('type')}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 text-center transition-colors ${
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
            <div className={`p-4 rounded-xl border-2 text-center transition-colors ${
              type === 'expense' 
                ? 'border-error-500 bg-error-500/20 text-error-400' 
                : 'border-white/20 hover:border-white/30 text-gray-300'
            }`}>
              <TrendingDown size={24} className="mx-auto mb-2" />
              <span className="font-medium">Expense</span>
            </div>
          </label>
        </div>
      </div>

      {/* Account Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Wallet size={16} className="mr-2 text-blue-400" />
          Account
        </label>
        <select
          {...register('accountId', { required: 'Account is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="">Select account</option>
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

      {/* Transfer To Account (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <ArrowLeftRight size={16} className="mr-2 text-purple-400" />
          Transfer To (Optional)
        </label>
        <select
          {...register('transferToAccountId')}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="">Not a transfer</option>
          {(accounts || []).filter(a => a.id !== accountId).map((account) => (
            <option key={account.id} value={account.id} className="bg-black/90">
              {account.name} - {formatCurrency(account.balance)}
            </option>
          ))}
        </select>
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

      {/* Balance Impact Toggle */}
      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-white">Affects Account Balance</h4>
            <p className="text-sm text-blue-300">
              {affectsBalance 
                ? 'This transaction will change your account balance'
                : 'This transaction is for tracking only (no balance change)'
              }
            </p>
          </div>
          <button
            type="button"
            onClick={() => setValue('affectsBalance', !affectsBalance)}
          >
            {affectsBalance ? (
              <ToggleRight size={32} className="text-blue-400" />
            ) : (
              <ToggleLeft size={32} className="text-gray-500" />
            )}
          </button>
        </div>

        {!affectsBalance && (
          <Input
            label="Reason (Required)"
            type="text"
            placeholder="e.g., Reimbursable expense, Business transaction"
            {...register('reason', { 
              required: affectsBalance ? false : 'Reason is required when balance is not affected'
            })}
            error={errors.reason?.message}
            className="bg-black/40 border-white/20 text-white"
          />
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Tag size={16} className="mr-2 text-yellow-400" />
          Category
        </label>
        <select
          {...register('category', { required: 'Category is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="">Select category</option>
          {availableCategories.map((category) => (
            <option key={category} value={category} className="bg-black/90">
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-error-400 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Description */}
      <Input
        label="Description"
        type="text"
        icon={<FileText size={18} className="text-blue-400" />}
        {...register('description', { required: 'Description is required' })}
        error={errors.description?.message}
        className="bg-black/20 border-white/20 text-white"
        placeholder={`e.g., ${type === 'income' ? 'Salary payment' : 'Grocery shopping'}`}
      />

      {/* Date */}
      <Input
        label="Date"
        type="date"
        icon={<Calendar size={18} className="text-purple-400" />}
        {...register('date', { required: 'Date is required' })}
        error={errors.date?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Transfer Preview */}
      {isTransfer && selectedAccount && transferAccount && amount && (
        <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center text-purple-400 mb-2">
            <ArrowLeftRight size={16} className="mr-2" />
            <span className="font-medium">Transfer Transaction</span>
          </div>
          <p className="text-sm text-purple-300">
            This will create two transactions: one expense from {selectedAccount.name} and one income to {transferAccount.name}.
          </p>
        </div>
      )}

      {/* Balance Impact Info */}
      {selectedAccount && affectsBalance && (
        <div className="bg-gray-500/20 rounded-lg p-4 border border-gray-500/30">
          <div className="flex items-start space-x-2">
            <Info size={16} className="text-gray-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-gray-400 font-medium">Balance Impact</p>
              <p className="text-gray-300">
                {selectedAccount.name} balance will change from {formatCurrency(selectedAccount.balance)} to{' '}
                {type === 'income' 
                  ? formatCurrency(selectedAccount.balance + (Number(amount) || 0))
                  : formatCurrency(selectedAccount.balance - (Number(amount) || 0))
                }
              </p>
            </div>
          </div>
        </div>
      )}

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
          className={`flex-1 ${
            type === 'income' 
              ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700' 
              : 'bg-gradient-to-r from-error-500 to-error-600 hover:from-error-600 hover:to-error-700'
          }`}
          loading={isSubmitting}
        >
          {initialData ? 'Update' : 'Add'} {isTransfer ? 'Transfer' : 'Transaction'}
        </Button>
      </div>
    </form>
  );

  function formatCurrency(amount: number): string {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
};