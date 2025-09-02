import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Target, CreditCard, AlertCircle, Trash2, Link, Unlink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CategorySelector } from '../components/common/CategorySelector';
import { toNumber } from '../utils/validation';
import { TopNavigation } from '../components/layout/TopNavigation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

interface TransactionFormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  category: string;
  accountId: string;
  transferToAccountId?: string;
  linkedGoalId?: string;
  linkedBillId?: string;
  linkedLiabilityId?: string;
  affectsBalance: boolean;
}

interface SplitFormData {
  category: string;
  amount: number;
  description: string;
}

export const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const { currency, formatCurrency } = useInternationalization();
  const { 
    addTransaction, 
    userCategories, 
    accounts, 
    goals, 
    bills, 
    liabilities,
    updateGoal,
    updateBill,
    updateLiability
  } = useFinance();
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [isSplitTransaction, setIsSplitTransaction] = useState(false);
  const [splits, setSplits] = useState<SplitFormData[]>([{ category: '', amount: 0, description: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLinkOptions, setShowLinkOptions] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      category: '',
      affectsBalance: true,
    },
  });

  const type = watch('type');
  const category = watch('category');
  const linkedGoalId = watch('linkedGoalId');
  const linkedBillId = watch('linkedBillId');
  const linkedLiabilityId = watch('linkedLiabilityId');

  // Get categories based on type (with fallback to default categories)
  const defaultCategories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other'],
    expense: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'],
    transfer: ['Transfer', 'Internal Transfer', 'Account Transfer']
  };
  
  const userCategoriesForType = userCategories.filter(c => c.type === type);
  const availableCategories = userCategoriesForType.length > 0 
    ? userCategoriesForType.map(c => ({ id: c.id, name: c.name }))
    : defaultCategories[type].map(name => ({ id: name, name }));

  // Set default category when type changes
  React.useEffect(() => {
    if (availableCategories.length > 0 && !category) {
      setValue('category', availableCategories[0].name);
    }
  }, [type, availableCategories, category, setValue]);

  // Filter available goals, bills, and liabilities based on transaction type
  const availableGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const availableBills = bills.filter(b => b.isActive && type === 'expense');
  const availableLiabilities = liabilities.filter(l => l.remainingAmount > 0 && type === 'expense');

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (isSplitTransaction) {
        // For split transactions, create individual transactions for each split
        const totalSplitAmount = splits.reduce((sum, split) => sum + toNumber(split.amount), 0);
        const mainAmount = toNumber(data.amount);
        
        if (Math.abs(totalSplitAmount - mainAmount) > 0.01) {
          setError(`Split amounts must equal the total amount (${mainAmount})`);
          setIsSubmitting(false);
          return;
        }

        // Create individual transactions for each split
        for (const split of splits) {
          const transactionData = {
            type: data.type as 'income' | 'expense',
            amount: toNumber(split.amount),
            description: split.description || data.description,
            category: split.category || data.category,
            date: new Date(data.date),
            accountId: data.accountId,
            affectsBalance: data.affectsBalance,
            status: 'completed' as const
          };

          await addTransaction(transactionData);
        }
      } else {
        // Create the complete transaction object
        const transactionData = {
          type: data.type as 'income' | 'expense',
          amount: toNumber(data.amount),
          description: data.description,
          category: data.category,
          date: new Date(data.date),
          accountId: data.accountId,
          affectsBalance: data.affectsBalance,
          status: 'completed' as const
        };

        // Submit the main transaction
        await addTransaction(transactionData);

        // Handle linked entities
        if (linkedGoalId && type === 'expense') {
          const goal = goals.find(g => g.id === linkedGoalId);
          if (goal) {
            const newAmount = Math.min(
              (Number(goal.currentAmount) || 0) + (Number(data.amount) || 0), 
              (Number(goal.targetAmount) || 0)
            );
            await updateGoal(linkedGoalId, { currentAmount: newAmount });
          }
        }

        if (linkedBillId && type === 'expense') {
          const bill = bills.find(b => b.id === linkedBillId);
          if (bill) {
            // Mark bill as paid and update next due date
            const nextDueDate = new Date(bill.nextDueDate);
            nextDueDate.setDate(nextDueDate.getDate() + 
              (bill.frequency === 'weekly' ? 7 :
               bill.frequency === 'bi_weekly' ? 14 :
               bill.frequency === 'monthly' ? 30 :
               bill.frequency === 'quarterly' ? 90 :
               bill.frequency === 'semi_annual' ? 180 :
               bill.frequency === 'annual' ? 365 : 30)
            );
            
            await updateBill(linkedBillId, {
              lastPaidDate: new Date(),
              nextDueDate: nextDueDate
            });
          }
        }

        if (linkedLiabilityId && type === 'expense') {
          const liability = liabilities.find(l => l.id === linkedLiabilityId);
          if (liability) {
            const newAmount = Math.max(
              (Number(liability.remainingAmount) || 0) - (Number(data.amount) || 0), 
              0
            );
            await updateLiability(linkedLiabilityId, { 
              remainingAmount: newAmount,
              status: newAmount === 0 ? 'paid_off' : liability.status
            });
          }
        }
      }

      // Success - navigate back
      navigate(-1);
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      setError(error.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSplit = () => {
    setSplits([...splits, { category: '', amount: 0, description: '' }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index));
    }
  };

  const updateSplit = (index: number, field: keyof SplitFormData, value: string | number) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const getLinkedEntityName = (type: string, id: string) => {
    switch (type) {
      case 'goal':
        const goal = goals.find(g => g.id === id);
        return goal ? goal.title : 'Unknown Goal';
      case 'bill':
        const bill = bills.find(b => b.id === id);
        return bill ? bill.title : 'Unknown Bill';
      case 'liability':
        const liability = liabilities.find(l => l.id === id);
        return liability ? liability.name : 'Unknown Liability';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title="Add Transaction" />
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        {/* Transaction Type Selector */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
          <h3 className="text-lg font-heading font-semibold text-white mb-4">Transaction Type</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'expense', icon: Minus, label: 'Expense', color: 'text-red-400' },
              { type: 'income', icon: Plus, label: 'Income', color: 'text-green-400' },
              { type: 'transfer', icon: ArrowLeft, label: 'Transfer', color: 'text-blue-400' }
            ].map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => setTransactionType(type as any)}
                className={`p-4 rounded-xl border transition-all ${
                  transactionType === type
                    ? 'bg-forest-600/50 border-forest-500 text-white'
                    : 'bg-forest-800/30 border-forest-600/30 text-forest-300 hover:bg-forest-700/30'
                }`}
              >
                <Icon size={24} className={`mx-auto mb-2 ${color}`} />
                <p className="text-sm font-medium">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Transaction Form */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
          <h3 className="text-lg font-heading font-semibold text-white mb-4">Transaction Details</h3>
          
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Amount
              </label>
              <div className="relative">
                <CurrencyIcon currencyCode={currency.code} size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-400" />
                <Input
                  {...register('amount', { required: 'Amount is required' })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              {errors.amount && (
                <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Description
              </label>
              <Input
                {...register('description', { required: 'Description is required' })}
                placeholder="Enter transaction description"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Category
              </label>
              <CategorySelector
                value={watch('category')}
                onChange={(category) => setValue('category', category)}
                type="transaction"
                placeholder="Select a category"
                error={errors.category?.message}
              />
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Account
              </label>
              <select
                {...register('accountId', { required: 'Account is required' })}
                className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="text-red-400 text-sm mt-1">{errors.accountId.message}</p>
              )}
            </div>

            {/* Transfer To Account (for transfers) */}
            {transactionType === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-forest-300 mb-2">
                  Transfer To
                </label>
                <select
                  {...register('transferToAccountId', { required: 'Transfer account is required' })}
                  className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  <option value="">Select destination account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance)}
                    </option>
                  ))}
                </select>
                {errors.transferToAccountId && (
                  <p className="text-red-400 text-sm mt-1">{errors.transferToAccountId.message}</p>
                )}
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Date
              </label>
              <Input
                {...register('date', { required: 'Date is required' })}
                type="date"
              />
              {errors.date && (
                <p className="text-red-400 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            {/* Link Options */}
            <div className="border-t border-forest-600/30 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-white">Link to Other Items</h4>
                <button
                  type="button"
                  onClick={() => setShowLinkOptions(!showLinkOptions)}
                  className="flex items-center gap-2 text-forest-400 hover:text-white transition-colors"
                >
                  {showLinkOptions ? <Unlink size={16} /> : <Link size={16} />}
                  {showLinkOptions ? 'Hide' : 'Show'} Links
                </button>
              </div>

              {showLinkOptions && (
                <div className="space-y-4">
                  {/* Link to Goal */}
                  {type === 'expense' && availableGoals.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-forest-300 mb-2">
                        Link to Goal (Optional)
                      </label>
                      <select
                        {...register('linkedGoalId')}
                        className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                      >
                        <option value="">No goal linked</option>
                        {availableGoals.map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title} - {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Link to Bill */}
                  {type === 'expense' && availableBills.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-forest-300 mb-2">
                        Link to Bill (Optional)
                      </label>
                      <select
                        {...register('linkedBillId')}
                        className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                      >
                        <option value="">No bill linked</option>
                        {availableBills.map((bill) => (
                          <option key={bill.id} value={bill.id}>
                            {bill.title} - {formatCurrency(bill.amount)} (Due: {new Date(bill.nextDueDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Link to Liability */}
                  {type === 'expense' && availableLiabilities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-forest-300 mb-2">
                        Link to Liability (Optional)
                      </label>
                      <select
                        {...register('linkedLiabilityId')}
                        className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                      >
                        <option value="">No liability linked</option>
                        {availableLiabilities.map((liability) => (
                          <option key={liability.id} value={liability.id}>
                            {liability.name} - {formatCurrency(liability.remainingAmount)} remaining
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Show linked entities */}
              {(linkedGoalId || linkedBillId || linkedLiabilityId) && (
                <div className="mt-4 p-3 bg-forest-800/20 rounded-lg">
                  <p className="text-sm font-medium text-forest-200 mb-2">Linked Items:</p>
                  <div className="space-y-1">
                    {linkedGoalId && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target size={14} className="text-blue-400" />
                        <span className="text-forest-300">Goal: {getLinkedEntityName('goal', linkedGoalId)}</span>
                      </div>
                    )}
                    {linkedBillId && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard size={14} className="text-orange-400" />
                        <span className="text-forest-300">Bill: {getLinkedEntityName('bill', linkedBillId)}</span>
                      </div>
                    )}
                    {linkedLiabilityId && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle size={14} className="text-red-400" />
                        <span className="text-forest-300">Liability: {getLinkedEntityName('liability', linkedLiabilityId)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Split Transaction Toggle */}
            <div className="border-t border-forest-600/30 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-medium text-white">Split Transaction</h4>
                  <p className="text-sm text-forest-400">Split this transaction into multiple categories</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSplitTransaction(!isSplitTransaction)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isSplitTransaction
                      ? 'bg-forest-600 text-white'
                      : 'bg-forest-800/50 text-forest-300 hover:bg-forest-700/50'
                  }`}
                >
                  {isSplitTransaction ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            {/* Affects Balance Toggle */}
            <div className="border-t border-forest-600/30 pt-4">
              <div className="bg-forest-800/20 rounded-lg p-4 border border-forest-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-md font-medium text-white">Affects Balance</h4>
                    <p className="text-sm text-forest-400">Disable for record-only entries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('affectsBalance')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-forest-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Split Transaction Form */}
            {isSplitTransaction && (
              <div className="space-y-4 p-4 bg-forest-800/20 rounded-lg">
                <h5 className="text-sm font-medium text-white">Split Details</h5>
                {splits.map((split, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3">
                    <CategorySelector
                      value={split.category}
                      onChange={(category) => updateSplit(index, 'category', category)}
                      type="transaction"
                      placeholder="Category"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={split.amount}
                      onChange={(e) => updateSplit(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={split.description}
                        onChange={(e) => updateSplit(index, 'description', e.target.value)}
                      />
                      {splits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSplit(index)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSplit}
                  className="flex items-center gap-2 text-forest-400 hover:text-white transition-colors"
                >
                  <Plus size={16} />
                  Add Split
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate(-1)}
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
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </Button>
            </div>
          </form>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-6 left-6 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};