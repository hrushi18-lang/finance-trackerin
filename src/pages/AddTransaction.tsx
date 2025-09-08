import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Minus, Target, CreditCard, AlertCircle, Trash2, Link, Unlink, Clock, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CategorySelector } from '../components/common/CategorySelector';
import { toNumber } from '../utils/validation';
import { useFinance } from '../contexts/FinanceContext';
import { useEnhancedCurrency } from '../contexts/EnhancedCurrencyContext';
import { CurrencyInput } from '../components/currency/CurrencyInput';
import { LiveRateDisplay } from '../components/currency/LiveRateDisplay';

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
  currencyCode: string;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRateUsed?: number;
}

interface SplitFormData {
  category: string;
  amount: number;
  description: string;
}

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { displayCurrency, formatCurrency, convertAmount, saveConversionLog } = useEnhancedCurrency();
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
  const [transactionCurrency, setTransactionCurrency] = useState(displayCurrency);
  const [showLinkOptions, setShowLinkOptions] = useState(false);
  
  // Handle location state for historical and scheduled transactions
  const { accountId, isHistorical, isScheduled } = location.state || {};

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      category: '',
      affectsBalance: true,
      currencyCode: displayCurrency,
    },
  });

  // Set default values based on state
  useEffect(() => {
    if (accountId) {
      setValue('accountId', accountId);
    }
    if (isHistorical) {
      // For historical transactions, set date to a past date
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      setValue('date', pastDate.toISOString().split('T')[0]);
    } else if (isScheduled) {
      // For scheduled transactions, set date to a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      setValue('date', futureDate.toISOString().split('T')[0]);
    }
  }, [accountId, isHistorical, isScheduled]);

  // Sync transaction type when tabs are clicked
  useEffect(() => {
    setValue('type', transactionType);
  }, [transactionType]);

  const type = watch('type');
  const linkedGoalId = watch('linkedGoalId');
  const linkedBillId = watch('linkedBillId');
  const linkedLiabilityId = watch('linkedLiabilityId');

  // Get categories based on type (with fallback to default categories)
  const defaultCategories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other'],
    expense: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'],
    transfer: ['Transfer', 'Internal Transfer', 'Account Transfer']
  };
  
  // Memoize categories to prevent infinite re-renders
  const userCategoriesForType = useMemo(() => {
    return userCategories.filter(c => c.type === type);
  }, [userCategories, type]);

  // Clear and set default category when type changes
  React.useEffect(() => {
    // Clear the current category when type changes
    setValue('category', '');
    
    // Set a default category after a brief delay to allow CategorySelector to re-render
    const timer = setTimeout(() => {
      const categories = userCategoriesForType.length > 0 
        ? userCategoriesForType.map(c => ({ id: c.id, name: c.name }))
        : defaultCategories[type].map(name => ({ id: name, name }));
        
      if (categories.length > 0) {
        setValue('category', categories[0].name);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [type, userCategoriesForType]);

  // Filter available goals, bills, and liabilities based on transaction type
  const availableGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const availableBills = bills.filter(b => b.isActive && type === 'expense');
  const availableLiabilities = liabilities.filter(l => l.remainingAmount > 0 && type === 'expense');

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // For historical transactions, don't affect current balance
      const affectsBalance = !isHistorical;
      
      // Handle currency conversion if needed
      let finalAmount = data.amount;
      let originalAmount = data.amount;
      let originalCurrency = transactionCurrency;
      let exchangeRateUsed = 1.0;
      
      if (transactionCurrency !== displayCurrency) {
        const convertedAmount = convertAmount(data.amount, transactionCurrency, displayCurrency);
        if (convertedAmount === null) {
          setError('Unable to convert currency. Please try again.');
          setIsSubmitting(false);
          return;
        }
        
        finalAmount = convertedAmount;
        exchangeRateUsed = convertAmount(1, transactionCurrency, displayCurrency) || 1.0;
        
        // Log the conversion
        await saveConversionLog({
          from_currency: transactionCurrency,
          to_currency: displayCurrency,
          original_amount: originalAmount,
          converted_amount: finalAmount,
          exchange_rate: exchangeRateUsed,
          conversion_fee: 0, // No fee for now
          transaction_id: undefined // Will be set after transaction is created
        });
      }
      
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
          const splitAmount = toNumber(split.amount);
          const convertedSplitAmount = transactionCurrency !== displayCurrency 
            ? convertAmount(splitAmount, transactionCurrency, displayCurrency) || splitAmount
            : splitAmount;
            
          const transactionData = {
            type: data.type as 'income' | 'expense',
            amount: convertedSplitAmount,
            description: split.description || data.description,
            category: split.category || data.category,
            date: new Date(data.date),
            accountId: data.accountId,
            affectsBalance: affectsBalance,
            status: isScheduled ? 'scheduled' as const : 'completed' as const,
            currencyCode: displayCurrency,
            originalAmount: splitAmount,
            originalCurrency: transactionCurrency,
            exchangeRateUsed: exchangeRateUsed
          };

          await addTransaction(transactionData);
        }
      } else {
        // Create the complete transaction object
        const transactionData = {
          type: data.type as 'income' | 'expense',
          amount: finalAmount,
          description: data.description,
          category: data.category,
          date: new Date(data.date),
          accountId: data.accountId,
          affectsBalance: affectsBalance,
          status: isScheduled ? 'scheduled' as const : 'completed' as const,
          currencyCode: displayCurrency,
          originalAmount: originalAmount,
          originalCurrency: originalCurrency,
          exchangeRateUsed: exchangeRateUsed
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Immersive Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Add Transaction</h1>
          </div>
        </div>
      </div>
      
      {/* Transaction Type Indicator */}
      {(isHistorical || isScheduled) && (
        <div className="px-4 py-2">
          <div className={`p-3 rounded-xl flex items-center space-x-2 ${
            isHistorical ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
          }`}>
            {isHistorical ? (
              <>
                <Clock size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Historical Transaction - Won't affect current balance
                </span>
              </>
            ) : (
              <>
                <Calendar size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Scheduled Transaction - Will be processed on the selected date
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="px-4 py-4 sm:py-6 space-y-6 pb-20">
        {/* Transaction Type Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Type</h3>
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
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={24} className={`mx-auto mb-2 ${color}`} />
                <p className="text-sm font-medium">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Transaction Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
          
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Amount */}
            <CurrencyInput
              label="Amount"
              value={typeof watch('amount') === 'number' ? watch('amount') : ''}
              currency={transactionCurrency}
              onValueChange={(value) => setValue('amount', typeof value === 'number' ? value : 0)}
              onCurrencyChange={setTransactionCurrency}
              placeholder="0.00"
              showConversion={transactionCurrency !== displayCurrency}
              targetCurrency={displayCurrency}
              error={errors.amount?.message}
            />

            {/* Live Rate Display */}
            {transactionCurrency !== displayCurrency && watch('amount') && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-1">Live Conversion</h4>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(watch('amount') || 0, transactionCurrency)} = {' '}
                      {convertAmount(watch('amount') || 0, transactionCurrency, displayCurrency) 
                        ? formatCurrency(convertAmount(watch('amount') || 0, transactionCurrency, displayCurrency)!, displayCurrency)
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <LiveRateDisplay
                    fromCurrency={transactionCurrency}
                    toCurrency={displayCurrency}
                    amount={1}
                    compact={true}
                    showTrend={true}
                    showLastUpdated={false}
                  />
                </div>
              </div>
            )}

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
                key={`category-${watch('type')}`}
                value={watch('category')}
                onChange={(category) => setValue('category', category)}
                type="transaction"
                transactionType={watch('type')}
                placeholder="Select a category"
                error={errors.category?.message}
              />
            </div>

            {/* Account Selection */}
            <div className="bg-forest-800/30 rounded-xl p-4 border border-forest-600/20">
              <label className="block text-sm font-medium text-forest-300 mb-3 flex items-center">
                <CreditCard size={16} className="mr-2" />
                Select Bank Account
              </label>
              <select
                {...register('accountId', { required: 'Please select an account' })}
                className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
              >
                <option value="">Choose your bank account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type.replace('_', ' ')}) - {formatCurrency(account.balance, displayCurrency)}
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.accountId.message}
                </p>
              )}
              {accounts.length === 0 && (
                <p className="text-yellow-400 text-sm mt-2 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  No accounts found. Please add an account first.
                </p>
              )}
            </div>

            {/* Transfer To Account (for transfers) */}
            {transactionType === 'transfer' && (
              <div className="bg-forest-800/30 rounded-xl p-4 border border-forest-600/20">
                <label className="block text-sm font-medium text-forest-300 mb-3 flex items-center">
                  <ArrowLeft size={16} className="mr-2" />
                  Transfer To Account
                </label>
                <select
                  {...register('transferToAccountId', { required: 'Please select destination account' })}
                  className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
                >
                  <option value="">Choose destination account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type.replace('_', ' ')}) - {formatCurrency(account.balance, displayCurrency)}
                    </option>
                  ))}
                </select>
                {errors.transferToAccountId && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.transferToAccountId.message}
                  </p>
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
                            {goal.title} - {formatCurrency(goal.currentAmount, displayCurrency)} / {formatCurrency(goal.targetAmount, displayCurrency)}
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
                            {bill.title} - {formatCurrency(bill.amount, displayCurrency)} (Due: {new Date(bill.nextDueDate).toLocaleDateString()})
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
                            {liability.name} - {formatCurrency(liability.remainingAmount, displayCurrency)} remaining
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

export default AddTransaction;