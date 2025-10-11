import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Minus, CreditCard, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { useFinance } from '../../contexts/FinanceContext';
import { unifiedCurrencyService } from '../../services/unifiedCurrencyService';
import { simpleCurrencyService } from '../../services/simpleCurrencyService';
import { useProfile } from '../../contexts/ProfileContext';

interface TransactionFormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  category: string;
  accountId: string;
  transferToAccountId?: string;
  affectsBalance: boolean;
  notes?: string;
  currency?: string;
  // Multi-currency fields
  native_amount?: number;
  native_currency?: string;
  native_symbol?: string;
  converted_amount?: number;
  converted_currency?: string;
  converted_symbol?: string;
  exchange_rate?: number;
  exchange_rate_used?: number;
  conversion_source?: string;
}

interface EnhancedTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense' | 'transfer';
  defaultAccountId?: string;
  linkedGoalId?: string;
  linkedBillId?: string;
  linkedLiabilityId?: string;
}

export const EnhancedTransactionForm: React.FC<EnhancedTransactionFormProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  defaultAccountId,
  linkedGoalId,
  linkedBillId,
  linkedLiabilityId
}) => {
  const { 
    accounts, 
    addTransaction, 
    getUserCurrency,
    user 
  } = useFinance();
  
  const { profile } = useProfile();
  
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>(defaultType);
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionCurrency, setTransactionCurrency] = useState<string>(getUserCurrency());
  const [conversionPreview, setConversionPreview] = useState<any | null>(null);
  const [lockedConversion, setLockedConversion] = useState<any | null>(null);
  
  const primaryCurrency = profile?.primaryCurrency || getUserCurrency();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      type: defaultType,
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      accountId: defaultAccountId || '',
      affectsBalance: true,
      currency: primaryCurrency
    },
  });
  
  const amount = watch('amount');
  const accountId = watch('accountId');
  
  // Update selected account when accountId changes
  useEffect(() => {
    if (accountId) {
      const account = accounts.find(acc => acc.id === accountId);
      setSelectedAccount(account || null);
    } else {
      setSelectedAccount(null);
    }
  }, [accountId, accounts]);
  
  // ✅ UPDATED: Calculate conversion preview using unified service
  useEffect(() => {
    const calculatePreview = async () => {
      if (amount && transactionCurrency && selectedAccount && amount > 0) {
        try {
          const preview = await unifiedCurrencyService.convert({
            enteredAmount: Number(amount),
            enteredCurrency: transactionCurrency,
            accountId: selectedAccount.id,
            accountCurrency: selectedAccount.currencycode || primaryCurrency,
            primaryCurrency: primaryCurrency,
            operation: 'preview', // Preview mode (no logging)
            operationType: 'transaction',
            userId: user?.id
          });
          
          if (preview.success) {
            setConversionPreview(preview);
            console.log('💡 Conversion preview:', preview.displayText);
          } else {
            setConversionPreview(null);
            console.error('Preview failed:', preview.error);
          }
        } catch (error) {
          console.error('Preview calculation failed:', error);
          setConversionPreview(null);
        }
      } else {
        setConversionPreview(null);
      }
    };
    
    calculatePreview();
  }, [amount, transactionCurrency, selectedAccount, primaryCurrency, user]);
  
  const handleFormSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!selectedAccount) {
        throw new Error('Please select an account');
      }
      
      // ✅ UPDATED: Execute conversion with unified service
      const execution = await unifiedCurrencyService.convert({
        enteredAmount: Number(data.amount),
        enteredCurrency: transactionCurrency,
        accountId: selectedAccount.id,
        accountCurrency: selectedAccount.currencycode || primaryCurrency,
        primaryCurrency: primaryCurrency,
        operation: 'execute', // Execute mode (logs to database)
        operationType: 'transaction',
        userId: user?.id,
        description: data.description,
        linkedEntityId: linkedGoalId || linkedBillId || linkedLiabilityId,
        linkedEntityType: linkedGoalId ? 'goal' : linkedBillId ? 'bill' : linkedLiabilityId ? 'liability' : undefined
      });
      
      if (!execution.success) {
        throw new Error(execution.error || 'Currency conversion failed');
      }
      
      setLockedConversion(execution);
      
      console.log('🔒 Executed conversion:', {
        entered: execution.displayText.entered,
        account: execution.displayText.account,
        primary: execution.displayText.primary
      });
      
      // ✅ UPDATED: Pass complete conversion data to addTransaction
      const transactionData = {
        type: data.type,
        amount: execution.accountAmount, // Account currency amount
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        accountId: data.accountId,
        transferToAccountId: data.transferToAccountId,
        affectsBalance: data.affectsBalance,
        status: 'completed' as const,
        notes: data.notes,
        currencycode: execution.accountCurrency,
        // ✅ Pass complete conversion data from unified service
        ...execution.dbPayload,
        // Linked entities
        goalId: linkedGoalId,
        billId: linkedBillId,
        liabilityId: linkedLiabilityId,
      };
      
      console.log(`💳 EnhancedTransactionForm: Submitting with executed conversion`);
      
      await addTransaction(transactionData);
      
      onClose();
    } catch (err) {
      console.error('Transaction creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCategoriesForType = (type: string) => {
    switch (type) {
      case 'income':
        return ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Refund', 'Other'];
      case 'expense':
        return ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Groceries', 'Gas', 'Rent', 'Insurance', 'Other'];
      case 'transfer':
        return ['Transfer', 'Internal Transfer', 'Account Transfer', 'Other'];
      default:
        return ['Other'];
    }
  };
  
  const categories = getCategoriesForType(transactionType);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Transaction</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
          
            {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="text-red-400 mr-2" size={20} />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
          
          {/* ✅ NEW: Conversion Preview */}
          {conversionPreview && conversionPreview.conversionCase !== 'T=A=P' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">💱 Currency Conversion Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">You're spending:</span>
                  <span className="font-semibold text-blue-900">{conversionPreview.displayText.entered}</span>
                </div>
                {conversionPreview.enteredCurrency !== conversionPreview.accountCurrency && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Will deduct from account:</span>
                      <span className="font-semibold text-blue-900">{conversionPreview.displayText.account}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      Rate: 1 {conversionPreview.enteredCurrency} = {conversionPreview.enteredToAccountRate.toFixed(4)} {conversionPreview.accountCurrency}
                    </div>
                  </>
                )}
                {conversionPreview.enteredCurrency !== conversionPreview.primaryCurrency && (
                  <>
                    <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                      <span className="text-blue-700">Net worth impact:</span>
                      <span className="font-semibold text-blue-900">{conversionPreview.displayText.primary}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      Rate: 1 {conversionPreview.enteredCurrency} = {conversionPreview.enteredToPrimaryRate.toFixed(4)} {conversionPreview.primaryCurrency}
                    </div>
                  </>
                )}
              </div>
              <div className="mt-3 text-xs text-blue-600 italic">
                {conversionPreview.displayText.conversionNote}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Transaction Type */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Type</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'expense', icon: Minus, label: 'Expense', color: 'text-red-500' },
                  { type: 'income', icon: Plus, label: 'Income', color: 'text-green-500' },
                  { type: 'transfer', icon: ArrowLeft, label: 'Transfer', color: 'text-blue-500' }
                ].map(({ type, icon: Icon, label, color }) => (
                  <button
                    key={type}
                    type="button"
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
            
            {/* Amount and Currency */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount</h3>
              
              <div className="space-y-4">
                {/* Amount Input */}
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Enter Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={amount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setValue('amount', value);
                      }}
                      error={errors.amount?.message}
                      className="text-xl font-semibold"
                      required
                    />
                  </div>
                  
                  {/* ✅ NEW: Currency Selector */}
                  <div className="w-32">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Currency
                    </label>
                    <select
                      value={transactionCurrency}
                      onChange={(e) => setTransactionCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                    >
                      <option value="USD">$ USD</option>
                      <option value="INR">₹ INR</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                  </div>
                </div>
                
                {/* Show what user is entering */}
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">You're entering:</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {simpleCurrencyService.getCurrencySymbol(transactionCurrency)}{amount || '0.00'} {transactionCurrency}
                  </p>
                </div>
              </div>
            </div>


            
            {/* Account Selection */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard size={20} className="text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  {transactionType === 'transfer' ? 'From Account' : 'Select Account'}
                </label>
              </div>
              <select
                {...register('accountId', { required: 'Please select an account' })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose your account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type.replace('_', ' ')}) - {simpleCurrencyService.getCurrencySymbol(account.currencycode || primaryCurrency)}{account.balance.toLocaleString()}
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
              )}
            </div>
            
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Input
                {...register('description', { required: 'Description is required' })}
                placeholder="Enter transaction description"
                error={errors.description?.message}
              />
            </div>
            
            {/* Category */}
            {transactionType !== 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <CategorySelector
                  value={watch('category')}
                  onChange={(category) => setValue('category', category)}
                  type="transaction"
                  transactionType={transactionType}
                  placeholder="Select a category"
                  error={errors.category?.message}
                />
              </div>
            )}
            
            {/* Transfer Target Account */}
            {transactionType === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Account
                </label>
                <select
                  {...register('transferToAccountId', { required: 'Please select target account' })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose target account...</option>
                  {accounts.filter(acc => acc.id !== accountId).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type.replace('_', ' ')}) - {formatCurrencyAmount(account.balance, account.currencycode || primaryCurrency, getCurrencyInfo(account.currencycode || primaryCurrency)?.symbol || '$')}
                    </option>
                  ))}
                </select>
                {errors.transferToAccountId && (
                  <p className="text-red-500 text-sm mt-1">{errors.transferToAccountId.message}</p>
                )}
              </div>
            )}
            
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <Input
                type="date"
                {...register('date', { required: 'Date is required' })}
                error={errors.date?.message}
              />
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                placeholder="Add any additional notes..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                loading={isSubmitting}
                disabled={!conversionResult || isConverting}
              >
                {isSubmitting ? 'Creating...' : 'Create Transaction'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
