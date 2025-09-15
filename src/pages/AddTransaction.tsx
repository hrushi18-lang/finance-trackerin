import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Minus, Target, CreditCard, AlertCircle, Trash2, Link, Unlink, Clock, Calendar, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CategorySelector } from '../components/common/CategorySelector';
import { toNumber } from '../utils/validation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { convertCurrency, formatCurrency, needsConversion, getCurrencyInfo } from '../utils/currency-converter';
import { 
  convertTransactionCurrency, 
  generateTransactionDisplayText, 
  generateStorageData,
  type CurrencyConversionResult
} from '../utils/multi-currency-converter';

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
  notes?: string;
}

interface SplitFormData {
  category: string;
  amount: number;
  description: string;
}

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get display currency from user profile
  const { currency } = useInternationalization();
  const displayCurrency = currency.code;
  const { 
    addTransaction, 
    userCategories, 
    accounts, 
    goals, 
    bills, 
    liabilities,
    updateGoal,
    updateBill,
    updateLiability,
    transferBetweenAccounts
  } = useFinance();
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [isSplitTransaction, setIsSplitTransaction] = useState(false);
  const [splits, setSplits] = useState<SplitFormData[]>([{ category: '', amount: 0, description: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionCurrency, setTransactionCurrency] = useState(displayCurrency);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [showLinkOptions, setShowLinkOptions] = useState(false);
  const [conversionResult, setConversionResult] = useState<CurrencyConversionResult | null>(null);
  
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

  // Update selected account when accountId changes
  useEffect(() => {
    if (watch('accountId')) {
      const account = accounts.find(acc => acc.id === watch('accountId'));
      setSelectedAccount(account || null);
    }
  }, [watch('accountId'), accounts]);

  // Handle currency conversion when amount, currency, or account changes
  useEffect(() => {
    const amount = watch('amount');
    const accountId = watch('accountId');
    
    const performConversion = async () => {
      if (amount && transactionCurrency && accountId) {
        const account = accounts.find(acc => acc.id === accountId);
        if (account) {
          try {
            const result = await convertTransactionCurrency(
              Number(amount) || 0,
              transactionCurrency,
              account.currencycode || displayCurrency,
              displayCurrency
            );
            setConversionResult(result);
          } catch (error) {
            console.error('Currency conversion error:', error);
            setConversionResult(null);
          }
        } else {
          setConversionResult(null);
        }
      } else {
        setConversionResult(null);
      }
    };
    
    performConversion();
  }, [watch('amount'), transactionCurrency, watch('accountId'), accounts, displayCurrency]);

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
      
      // Debug: Log the raw form data
      console.log('Raw form data received:', data);
      console.log('Amount type:', typeof data.amount, 'Value:', data.amount);
      
      // Ensure amount is a valid number
      const numericAmount = Number(data.amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setError('Please enter a valid amount greater than 0');
        setIsSubmitting(false);
        return;
      }
      
      // Update data with numeric amount
      data.amount = numericAmount;
      
      // For historical transactions, don't affect current balance
      const affectsBalance = !isHistorical;
      
      // Generate multi-currency data if conversion is available
      let multiCurrencyData = {};
      if (conversionResult) {
        const storageData = generateStorageData(conversionResult);
        multiCurrencyData = {
          native_amount: storageData.nativeAmount,
          native_currency: storageData.nativeCurrency,
          native_symbol: storageData.nativeSymbol,
          converted_amount: storageData.convertedAmount,
          converted_currency: storageData.convertedCurrency,
          converted_symbol: storageData.convertedSymbol,
          exchange_rate: storageData.exchangeRate,
          exchange_rate_used: storageData.exchangeRateUsed
        };
      }

      // Use converted amount for the transaction with validation
      let finalAmount = data.amount;
      
      if (conversionResult && 
          conversionResult.convertedAmount !== null && 
          conversionResult.convertedAmount !== undefined &&
          !isNaN(conversionResult.convertedAmount) &&
          conversionResult.convertedAmount > 0) {
        finalAmount = conversionResult.convertedAmount;
        console.log('Using converted amount:', finalAmount);
      } else {
        console.log('Using original amount (no valid conversion):', data.amount);
        finalAmount = data.amount;
      }
      
      // Final validation of amount
      if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount)) {
        console.error('Invalid final amount:', { 
          finalAmount, 
          originalAmount: data.amount, 
          conversionResult: conversionResult?.convertedAmount 
        });
        setError('Invalid transaction amount. Please check the amount and try again.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Final amount validated:', { 
        originalAmount: data.amount, 
        conversionResult: conversionResult?.convertedAmount,
        finalAmount,
        type: typeof finalAmount
      });
      
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
            ? convertCurrency(splitAmount, transactionCurrency, displayCurrency) || splitAmount
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
            currencycode: displayCurrency,
            originalAmount: splitAmount,
            originalCurrency: transactionCurrency,
            exchangeRateUsed: exchangeRateUsed
          };

          await addTransaction(transactionData);
        }
      } else {
        // Handle transfer transactions
        if (data.type === 'transfer' && data.transferToAccountId) {
          // Get source and destination accounts
          const fromAccount = accounts.find(acc => acc.id === data.accountId);
          const toAccount = accounts.find(acc => acc.id === data.transferToAccountId);
          
          if (!fromAccount || !toAccount) {
            setError('Invalid account selection for transfer');
            setIsSubmitting(false);
            return;
          }

          // Check if conversion is needed
          const needsConv = needsConversion(fromAccount.currency, toAccount.currency);
          let convertedAmount = finalAmount;
          let exchangeRate = 1.0;

          if (needsConv) {
            const converted = convertCurrency(finalAmount, fromAccount.currency, toAccount.currency);
            if (converted === null) {
              setError('Unable to convert currency for transfer');
              setIsSubmitting(false);
              return;
            }
            convertedAmount = converted;
            exchangeRate = convertCurrency(1, fromAccount.currency, toAccount.currency) || 1.0;
          }

          // Use the transferBetweenAccounts function
          await transferBetweenAccounts(
            data.accountId,
            data.transferToAccountId,
            finalAmount,
            data.description
          );

          // Show success message
          console.log(`✅ Transfer completed: ${formatCurrency(finalAmount, fromAccount.currency)} → ${formatCurrency(convertedAmount, toAccount.currency)}`);
        } else {
          // Create the complete transaction object for income/expense
          const transactionData = {
            type: data.type as 'income' | 'expense',
            amount: finalAmount,
            description: data.description,
            category: data.category,
            date: new Date(data.date),
            accountId: data.accountId,
            affectsBalance: affectsBalance,
            status: isScheduled ? 'scheduled' as const : 'completed' as const,
            currencycode: displayCurrency,
            notes: data.notes,
            ...multiCurrencyData
          };

          // Validate transaction data before submission
          const validationErrors = [];
          
          // Check each field individually with detailed logging
          if (!transactionData.type) {
            validationErrors.push('type');
            console.error('Missing type:', transactionData.type);
          }
          
          if (!transactionData.amount || transactionData.amount <= 0 || isNaN(transactionData.amount)) {
            validationErrors.push('amount');
            console.error('Invalid amount:', { 
              amount: transactionData.amount, 
              type: typeof transactionData.amount,
              isNaN: isNaN(transactionData.amount),
              isPositive: transactionData.amount > 0
            });
          }
          
          if (!transactionData.description || transactionData.description.trim() === '') {
            validationErrors.push('description');
            console.error('Missing description:', transactionData.description);
          }
          
          if (!transactionData.category || transactionData.category.trim() === '') {
            validationErrors.push('category');
            console.error('Missing category:', transactionData.category);
          }
          
          if (!transactionData.accountId || transactionData.accountId.trim() === '') {
            validationErrors.push('accountId');
            console.error('Missing accountId:', transactionData.accountId);
          }
          
          if (!transactionData.date || isNaN(transactionData.date.getTime())) {
            validationErrors.push('date');
            console.error('Invalid date:', transactionData.date);
          }
          
          if (transactionData.affectsBalance === undefined || transactionData.affectsBalance === null) {
            validationErrors.push('affectsBalance');
            console.error('Missing affectsBalance:', transactionData.affectsBalance);
          }
          
          if (!transactionData.status || transactionData.status.trim() === '') {
            validationErrors.push('status');
            console.error('Missing status:', transactionData.status);
          }

          if (validationErrors.length > 0) {
            console.error('Transaction validation failed:', validationErrors);
            console.error('Full transaction data:', JSON.stringify(transactionData, null, 2));
            setError(`Missing required fields: ${validationErrors.join(', ')}`);
            setIsSubmitting(false);
            return;
          }

          // Debug: Log the transaction data before submission
          console.log('Transaction data being submitted:', transactionData);

          // Submit the main transaction
          await addTransaction(transactionData);
        }

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
      
      // Enhanced error handling for missing fields
      if (error.message && error.message.includes('Missing required transaction fields')) {
        const missingFields = error.message.replace('Missing required transaction fields: ', '').split(', ');
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      } else {
        setError(error.message || 'Failed to save transaction. Please try again.');
      }
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
      case 'goal': {
        const goal = goals.find(g => g.id === id);
        return goal ? goal.title : 'Unknown Goal';
      }
      case 'bill': {
        const bill = bills.find(b => b.id === id);
        return bill ? bill.title : 'Unknown Bill';
      }
      case 'liability': {
        const liability = liabilities.find(l => l.id === id);
        return liability ? liability.name : 'Unknown Liability';
      }
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
                onClick={() => {
                  setTransactionType(type as any);
                  setValue('type', type as any);
                }}
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
          
          {/* Form Completion Status */}
          <div className="bg-forest-800/20 rounded-lg p-4 mb-6 border border-forest-600/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-forest-200 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                Form Status
              </h3>
              <div className="text-xs text-forest-300">
                {(() => {
                  const requiredFields = ['amount', 'description', 'category', 'accountId', 'date'];
                  if (transactionType === 'transfer') requiredFields.push('transferToAccountId');
                  
                  const completedFields = requiredFields.filter(field => {
                    const value = watch(field);
                    return value && value.toString().trim() !== '';
                  });
                  
                  return `${completedFields.length}/${requiredFields.length} completed`;
                })()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['amount', 'description', 'category', 'accountId', 'date'].map(field => {
                const value = watch(field);
                const isCompleted = value && value.toString().trim() !== '';
                const isError = errors[field];
                
                return (
                  <div key={field} className={`flex items-center p-2 rounded ${
                    isError ? 'bg-red-100 text-red-700' : 
                    isCompleted ? 'bg-green-100 text-green-700' : 
                    'text-forest-300'
                  }`}>
                    <span className={`mr-2 ${isError ? 'text-red-500' : isCompleted ? 'text-green-500' : 'text-red-400'}`}>
                      {isError ? '❌' : isCompleted ? '✅' : '⭕'}
                    </span>
                    <span className="capitalize">{field === 'accountId' ? 'Account' : field}</span>
                  </div>
                );
              })}
              {transactionType === 'transfer' && (
                <div className={`flex items-center p-2 rounded ${
                  errors.transferToAccountId ? 'bg-red-100 text-red-700' : 
                  watch('transferToAccountId') ? 'bg-green-100 text-green-700' : 
                  'text-forest-300'
                }`}>
                  <span className={`mr-2 ${
                    errors.transferToAccountId ? 'text-red-500' : 
                    watch('transferToAccountId') ? 'text-green-500' : 
                    'text-red-400'
                  }`}>
                    {errors.transferToAccountId ? '❌' : watch('transferToAccountId') ? '✅' : '⭕'}
                  </span>
                  <span>Transfer To</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Amount - Enhanced */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">💰</span>
                </div>
                <div>
                  <label className="text-lg font-semibold text-gray-800">
                    Transaction Amount *
                  </label>
                  <p className="text-sm text-gray-600">
                    Enter the amount for this {transactionType}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-forest-300">
                    {getCurrencyInfo(transactionCurrency)?.symbol || '$'}
                  </span>
                  <Input
                    {...register('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' },
                      valueAsNumber: true
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    error={errors.amount?.message}
                    className="flex-1 text-lg"
                    style={{
                      backgroundColor: 'var(--background)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)'
                    }}
                  />
                </div>
                
                {/* Currency Selection */}
                <select
                  value={transactionCurrency}
                  onChange={(e) => setTransactionCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-forest-600/30 bg-forest-800/50 text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
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
                
                {/* Multi-Currency Conversion Display */}
                {conversionResult && (
                  <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Globe size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Currency Conversion</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      {(() => {
                        const displayText = generateTransactionDisplayText(conversionResult);
                        return (
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Transaction:</span> {displayText.transactionDisplay}
                            </div>
                            <div>
                              <span className="font-medium">Account:</span> {displayText.accountDisplay}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> {displayText.totalDisplay}
                            </div>
                            <div className="text-xs text-blue-600 mt-2">
                              {displayText.conversionNote}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('amount', 100, { shouldValidate: true })}
                    className="text-xs"
                  >
                    ₹100
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('amount', 500, { shouldValidate: true })}
                    className="text-xs"
                  >
                    ₹500
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('amount', 1000, { shouldValidate: true })}
                    className="text-xs"
                  >
                    ₹1,000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('amount', 5000, { shouldValidate: true })}
                    className="text-xs"
                  >
                    ₹5,000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('amount', 10000, { shouldValidate: true })}
                    className="text-xs"
                  >
                    ₹10,000
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Rate Display */}
            {transactionCurrency !== displayCurrency && watch('amount') && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-1">Live Conversion</h4>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(watch('amount') || 0, transactionCurrency)} = {' '}
                      {convertCurrency(watch('amount') || 0, transactionCurrency, displayCurrency) 
                        ? formatCurrency(convertCurrency(watch('amount') || 0, transactionCurrency, displayCurrency)!, displayCurrency)
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <Input
                {...register('description', { 
                  required: 'Description is required',
                  minLength: {
                    value: 3,
                    message: 'Description must be at least 3 characters long'
                  }
                })}
                placeholder="Enter transaction description"
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Category - Hidden for transfers */}
            {transactionType !== 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-forest-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <CategorySelector
                  key={`category-${watch('type')}`}
                  value={watch('category')}
                  onChange={(category) => setValue('category', category, { shouldValidate: true })}
                  type="transaction"
                  transactionType={watch('type')}
                  placeholder="Select a category"
                  error={errors.category?.message}
                />
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.category.message}
                  </p>
                )}
              </div>
            )}

            {/* Account Selection */}
            <div className="bg-forest-800/30 rounded-xl p-4 border border-forest-600/20">
              <label className="block text-sm font-medium text-forest-300 mb-3 flex items-center">
                <CreditCard size={16} className="mr-2" />
                {transactionType === 'transfer' ? 'From Account' : 'Select Bank Account'} <span className="text-red-400">*</span>
              </label>
              <select
                {...register('accountId', { required: 'Please select an account' })}
                className={`w-full bg-forest-800/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                  errors.accountId ? 'border-red-500' : 'border-forest-600/30'
                }`}
              >
                <option value="">Choose your bank account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type.replace('_', ' ')}) - {formatCurrency(account.balance, account.currency)} {account.currency}
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
                  Transfer To Account <span className="text-red-400">*</span>
                </label>
                <select
                  {...register('transferToAccountId', { required: 'Please select destination account' })}
                  className={`w-full bg-forest-800/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                    errors.transferToAccountId ? 'border-red-500' : 'border-forest-600/30'
                  }`}
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

                {/* Transfer Conversion Display */}
                {(() => {
                  const fromAccount = accounts.find(acc => acc.id === watch('accountId'));
                  const toAccount = accounts.find(acc => acc.id === watch('transferToAccountId'));
                  const amount = watch('amount') || 0;
                  
                  if (fromAccount && toAccount && amount > 0) {
                    const needsConv = needsConversion(fromAccount.currency, toAccount.currency);
                    if (needsConv) {
                      const convertedAmount = convertCurrency(amount, fromAccount.currency, toAccount.currency);
                      const exchangeRate = convertCurrency(1, fromAccount.currency, toAccount.currency) || 1.0;
                      
                      return (
                        <div className="mt-3 bg-blue-100 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">💱</span>
                            </div>
                            <span className="text-sm font-medium text-blue-800">Currency Conversion</span>
                          </div>
                          <div className="text-sm text-blue-700">
                            <p className="font-medium">
                              {formatCurrency(amount, fromAccount.currency)} → {formatCurrency(convertedAmount || 0, toAccount.currency)}
                            </p>
                            <p className="text-xs mt-1">
                              Exchange Rate: 1 {fromAccount.currency} = {exchangeRate.toFixed(4)} {toAccount.currency}
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-3 bg-green-100 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-sm font-medium text-green-800">
                              Same Currency - No conversion needed
                            </span>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Date <span className="text-red-400">*</span>
              </label>
              <Input
                {...register('date', { required: 'Date is required' })}
                type="date"
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-forest-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                placeholder="Add any additional notes about this transaction..."
                className="w-full bg-forest-800/50 border border-forest-600/30 rounded-lg px-4 py-3 text-white placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors resize-none"
                rows={3}
              />
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

            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  Please fix the following errors:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.amount && (
                    <li>• Amount: {errors.amount.message}</li>
                  )}
                  {errors.description && (
                    <li>• Description: {errors.description.message}</li>
                  )}
                  {errors.category && (
                    <li>• Category: {errors.category.message}</li>
                  )}
                  {errors.accountId && (
                    <li>• Account: {errors.accountId.message}</li>
                  )}
                  {errors.transferToAccountId && (
                    <li>• Transfer To Account: {errors.transferToAccountId.message}</li>
                  )}
                  {errors.date && (
                    <li>• Date: {errors.date.message}</li>
                  )}
                </ul>
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
                disabled={isSubmitting || Object.keys(errors).length > 0}
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
