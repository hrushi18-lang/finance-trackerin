import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Minus, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { useFinance } from '../../contexts/FinanceContext';
import { 
  convertTransactionCurrency, 
  generateTransactionDisplayText, 
  generateStorageData,
  formatCurrencyAmount,
  type CurrencyConversionResult,
  type MultiCurrencyTransaction 
} from '../../utils/multi-currency-converter';
import { getCurrencyInfo } from '../../utils/currency-converter';

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
    userCategories,
    getUserCurrency 
  } = useFinance();
  
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>(defaultType);
  const [transactionCurrency, setTransactionCurrency] = useState(primaryCurrency);
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [conversionResult, setConversionResult] = useState<CurrencyConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const primaryCurrency = getUserCurrency();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      type: defaultType,
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      accountId: defaultAccountId || '',
      affectsBalance: true,
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
  
  // Perform currency conversion when amount, currency, or account changes
  useEffect(() => {
    if (amount > 0 && transactionCurrency && selectedAccount) {
      performCurrencyConversion();
    } else {
      setConversionResult(null);
    }
  }, [amount, transactionCurrency, selectedAccount]);
  
  const performCurrencyConversion = async () => {
    if (!amount || !transactionCurrency || !selectedAccount) return;
    
    setIsConverting(true);
    setError(null);
    
    try {
      const result = await convertTransactionCurrency(
        amount,
        transactionCurrency,
        selectedAccount.currencycode || primaryCurrency,
        primaryCurrency
      );
      
      setConversionResult(result);
    } catch (err) {
      console.error('Currency conversion error:', err);
      setError('Failed to convert currency. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleFormSubmit = async (data: TransactionFormData) => {
    if (!conversionResult) {
      setError('Please wait for currency conversion to complete.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Generate storage data for database
      const storageData = generateStorageData(conversionResult);
      
      // Create transaction data
      const transactionData = {
        type: data.type,
        amount: conversionResult.accountAmount, // Use account currency amount
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        accountId: data.accountId,
        transferToAccountId: data.transferToAccountId,
        affectsBalance: data.affectsBalance,
        status: 'completed' as const,
        notes: data.notes,
        // Currency fields
        currencycode: conversionResult.primaryCurrency,
        native_amount: storageData.native_amount,
        native_currency: storageData.native_currency,
        native_symbol: storageData.native_symbol,
        converted_amount: storageData.converted_amount,
        converted_currency: storageData.converted_currency,
        converted_symbol: storageData.converted_symbol,
        exchange_rate: storageData.exchange_rate,
        exchange_rate_used: storageData.exchange_rate_used,
        // Linked entities
        goalId: linkedGoalId,
        billId: linkedBillId,
        liabilityId: linkedLiabilityId,
      };
      
      await addTransaction(transactionData);
      onClose();
    } catch (err) {
      console.error('Transaction creation error:', err);
      setError('Failed to create transaction. Please try again.');
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount & Currency</h3>
              
              <div className="space-y-4">
                {/* Amount Input */}
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-800">
                    {getCurrencyInfo(transactionCurrency)?.symbol || '$'}
                  </span>
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
                    className="flex-1 text-xl font-semibold"
                    required
                  />
                </div>
                
                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Currency
                  </label>
                  <select
                    value={transactionCurrency}
                    onChange={(e) => setTransactionCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {account.name} ({account.type.replace('_', ' ')}) - {formatCurrencyAmount(account.balance, account.currencycode || primaryCurrency, getCurrencyInfo(account.currencycode || primaryCurrency)?.symbol || '$')}
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
              )}
            </div>
            
            {/* Currency Conversion Display */}
            {conversionResult && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Conversion</h3>
                
                {isConverting ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="animate-spin text-blue-500 mr-2" size={20} />
                    <span className="text-gray-600">Converting currencies...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Transaction Display */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction Amount</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrencyAmount(
                          conversionResult.transactionAmount,
                          conversionResult.transactionCurrency,
                          conversionResult.transactionSymbol
                        )}
                      </p>
                      <p className="text-sm text-gray-600">What you entered</p>
                    </div>
                    
                    {/* Account Display */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Account Balance</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrencyAmount(
                          conversionResult.accountAmount,
                          conversionResult.accountCurrency,
                          conversionResult.accountSymbol
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Will be added to {selectedAccount?.name}</p>
                    </div>
                    
                    {/* Primary Display */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Total Impact</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrencyAmount(
                          conversionResult.primaryAmount,
                          conversionResult.primaryCurrency,
                          conversionResult.primarySymbol
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Added to your total balance</p>
                    </div>
                    
                    {/* Conversion Note */}
                    <div className="bg-blue-100 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Case {conversionResult.case}:</strong> {generateTransactionDisplayText(conversionResult).conversionNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
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
