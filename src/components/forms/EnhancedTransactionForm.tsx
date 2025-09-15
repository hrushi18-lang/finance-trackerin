import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Minus, CreditCard, AlertCircle, RefreshCw, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CategorySelector } from '../common/CategorySelector';
import { useFinance } from '../../contexts/FinanceContext';
import { useCurrencyConversion } from '../../hooks/useCurrencyConversion';
import { ConversionResult } from '../../services/currencyConversionService';
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
    userCategories,
    getUserCurrency 
  } = useFinance();
  
  const { 
    convertCurrency, 
    formatAmount, 
    getCurrencySymbol, 
    getCurrencyPrecision,
    isLoading: isConverting,
    error: conversionError 
  } = useCurrencyConversion();
  
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>(defaultType);
  const [selectedCurrency, setSelectedCurrency] = useState(getUserCurrency());
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
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
  
  // 6-Case Currency Conversion Logic
  const performCurrencyConversion = useCallback(async () => {
    if (!amount || !selectedCurrency || !selectedAccount) {
      setConversionResult(null);
      return;
    }

    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setConversionResult(null);
      return;
    }

    try {
      console.log(`🔄 EnhancedTransactionForm: Converting ${amountValue} ${selectedCurrency}`, {
        enteredCurrency: selectedCurrency,
        accountCurrency: selectedAccount.currencycode,
        primaryCurrency: primaryCurrency
      });

      const result = await convertCurrency({
        amount: amountValue,
        enteredCurrency: selectedCurrency,
        accountCurrency: selectedAccount.currencycode,
        primaryCurrency: primaryCurrency,
        includeFees: true,
        feePercentage: 0.0025, // 0.25% fee
        auditContext: 'transaction_form'
      });

      console.log(`✅ EnhancedTransactionForm: Conversion result:`, {
        case: result.conversionCase,
        entered: `${result.enteredSymbol}${result.enteredAmount.toFixed(getCurrencyPrecision(result.enteredCurrency))}`,
        account: `${result.accountSymbol}${result.accountAmount.toFixed(getCurrencyPrecision(result.accountCurrency))}`,
        primary: `${result.primarySymbol}${result.primaryAmount.toFixed(getCurrencyPrecision(result.primaryCurrency))}`,
        rate: result.exchangeRate.toFixed(6),
        source: result.conversionSource
      });

      setConversionResult(result);
    } catch (error: any) {
      console.error('❌ EnhancedTransactionForm: Conversion failed:', error);
      setConversionResult(null);
    }
  }, [amount, selectedCurrency, selectedAccount, primaryCurrency, convertCurrency, getCurrencyPrecision]);

  // Perform conversion when dependencies change
  useEffect(() => {
    performCurrencyConversion();
  }, [performCurrencyConversion]);
  
  // Old conversion logic removed - now handled by new system
  
  const handleFormSubmit = async (data: TransactionFormData) => {
    if (!conversionResult) {
      setError('Please wait for currency conversion to complete.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // CORRECT LOGIC: Use account currency amount for actual deduction
      const accountAmount = conversionResult.accountAmount.toNumber();
      const primaryAmount = conversionResult.primaryAmount.toNumber();
      
      // Create transaction data with correct conversion logic
      const transactionData = {
        type: data.type,
        amount: accountAmount, // Use account currency amount for actual deduction
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        accountId: data.accountId,
        transferToAccountId: data.transferToAccountId,
        affectsBalance: data.affectsBalance,
        status: 'completed' as const,
        notes: data.notes,
        // Currency fields
        currencycode: conversionResult.accountCurrency, // Use account currency for the transaction
        // Include conversion data for tracking
        native_amount: conversionResult.enteredAmount.toNumber(), // Original entered amount
        native_currency: conversionResult.enteredCurrency, // Original entered currency
        native_symbol: conversionResult.enteredSymbol,
        converted_amount: primaryAmount, // Converted to primary currency for net worth
        converted_currency: conversionResult.primaryCurrency, // Primary currency
        converted_symbol: conversionResult.primarySymbol,
        exchange_rate: conversionResult.exchangeRate.toNumber(),
        exchange_rate_used: conversionResult.exchangeRateUsed.toNumber(),
        conversion_source: conversionResult.conversionSource,
        // Linked entities
        goalId: linkedGoalId,
        billId: linkedBillId,
        liabilityId: linkedLiabilityId,
      };
      
      console.log(`💳 EnhancedTransactionForm: Submitting transaction with conversion:`, {
        originalAmount: amount,
        accountAmount: accountAmount,
        primaryAmount: primaryAmount,
        accountCurrency: selectedAccount?.currencycode,
        conversionCase: conversionResult.conversionCase,
        exchangeRate: conversionResult.exchangeRate.toFixed(6)
      });
      
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
                    {getCurrencySymbol(selectedCurrency)}
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
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
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
                    <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                    <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Currency Conversion Display */}
            {conversionResult && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <ArrowRightLeft size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Live Currency Conversion
                  </span>
                  {isConverting && <Loader2 size={16} className="animate-spin text-blue-600" />}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">You Entered:</span>
                    <span className="font-medium text-gray-900">
                      {formatAmount(conversionResult.enteredAmount, conversionResult.enteredCurrency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Will Receive:</span>
                    <span className="font-medium text-gray-900">
                      {formatAmount(conversionResult.accountAmount, conversionResult.accountCurrency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Currency Value:</span>
                    <span className="font-medium text-gray-900">
                      {formatAmount(conversionResult.primaryAmount, conversionResult.primaryCurrency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange Rate:</span>
                    <span className="font-medium text-gray-900">
                      1 {conversionResult.enteredCurrency} = {conversionResult.exchangeRate.toFixed(6)} {conversionResult.accountCurrency}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate Source:</span>
                    <span className="font-medium text-gray-900">
                      {conversionResult.conversionSource}
                    </span>
                  </div>
                  
                  {conversionResult.conversionFee.gt(0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversion Fee:</span>
                      <span className="font-medium text-gray-900">
                        {formatAmount(conversionResult.conversionFee, conversionResult.primaryCurrency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conversion Error Display */}
            {conversionError && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-sm text-red-800">
                    Conversion failed: {conversionError}
                  </span>
                </div>
              </div>
            )}
            
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
