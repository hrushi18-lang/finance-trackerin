import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Target, Receipt, Building, Clock, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Tag, ArrowRightLeft } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinanceSafe } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useProfile } from '../../contexts/ProfileContext';
import { formatTransactionForDisplay, getDetailedDisplay } from '../../utils/transactionDisplayHelper';
import { getCurrencySystem } from '../../services/universalCurrencySystem';
import { format } from 'date-fns';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const financeContext = useFinanceSafe();
  
  // Return null if context is not available yet
  if (!financeContext) {
    return null;
  }
  
  const { accounts, goals, bills, budgets, liabilities } = financeContext;
  const { formatCurrency } = useInternationalization();
  const { profile } = useProfile();
  const [budgetProgress, setBudgetProgress] = useState<any>(null);
  const [goalProgress, setGoalProgress] = useState<any>(null);
  const [billStatus, setBillStatus] = useState<any>(null);
  const [liabilityInfo, setLiabilityInfo] = useState<any>(null);
  const [transferInfo, setTransferInfo] = useState<any>(null);

  useEffect(() => {
    if (transaction && isOpen) {
      loadRelatedData();
    }
  }, [transaction, isOpen]);

  const loadRelatedData = async () => {
    if (!transaction) return;

    // Load budget progress if transaction has a category
    if (transaction.category) {
      const budget = budgets.find(b => 
        b.category === transaction.category && 
        b.startDate && b.endDate &&
        new Date(transaction.date) >= new Date(b.startDate) &&
        new Date(transaction.date) <= new Date(b.endDate)
      );
      
      if (budget) {
        setBudgetProgress({
          budget,
          spentBefore: budget.spent || 0,
          spentAfter: (budget.spent || 0) + (transaction.type === 'expense' ? transaction.amount : 0),
          remainingBefore: budget.amount - (budget.spent || 0),
          remainingAfter: budget.amount - ((budget.spent || 0) + (transaction.type === 'expense' ? transaction.amount : 0)),
          progressBefore: ((budget.spent || 0) / budget.amount) * 100,
          progressAfter: (((budget.spent || 0) + (transaction.type === 'expense' ? transaction.amount : 0)) / budget.amount) * 100
        });
      }
    }

    // Load goal progress if transaction is linked to a goal
    if (transaction.goalId) {
      const goal = goals.find(g => g.id === transaction.goalId);
      if (goal) {
        const amountContributed = transaction.type === 'income' ? transaction.amount : 0;
        setGoalProgress({
          goal,
          currentBefore: goal.currentAmount || 0,
          currentAfter: (goal.currentAmount || 0) + amountContributed,
          progressBefore: ((goal.currentAmount || 0) / goal.targetAmount) * 100,
          progressAfter: (((goal.currentAmount || 0) + amountContributed) / goal.targetAmount) * 100,
          remainingBefore: goal.targetAmount - (goal.currentAmount || 0),
          remainingAfter: goal.targetAmount - ((goal.currentAmount || 0) + amountContributed)
        });
      }
    }

    // Load bill status if transaction is linked to a bill
    if (transaction.billId) {
      const bill = bills.find(b => b.id === transaction.billId);
      if (bill) {
        const isOnTime = new Date(transaction.date) <= new Date(bill.dueDate);
        const daysDifference = Math.ceil((new Date(transaction.date).getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        
        setBillStatus({
          bill,
          isOnTime,
          daysDifference,
          status: isOnTime ? 'paid_on_time' : daysDifference > 0 ? 'paid_late' : 'paid_early'
        });
      }
    }
    
    // Load liability info if transaction is linked to a liability
    if (transaction.liabilityId) {
      const liability = liabilities.find(l => l.id === transaction.liabilityId);
      if (liability) {
        setLiabilityInfo({
          liability,
          paymentAmount: transaction.amount,
          remainingBefore: (liability.remainingAmount || 0) + transaction.amount,
          remainingAfter: liability.remainingAmount || 0,
          progressBefore: (((liability.totalAmount || 0) - ((liability.remainingAmount || 0) + transaction.amount)) / (liability.totalAmount || 0)) * 100,
          progressAfter: (((liability.totalAmount || 0) - (liability.remainingAmount || 0)) / (liability.totalAmount || 0)) * 100
        });
      }
    }
    
    // Load transfer info if transaction is a transfer
    if (transaction.transfer_to_account_id || transaction.type === 'transfer') {
      const targetAccount = accounts.find(a => a.id === transaction.transfer_to_account_id);
      setTransferInfo({
        fromAccount: account,
        toAccount: targetAccount,
        transferAmount: transaction.amount
      });
    }
  };

  if (!isOpen || !transaction) return null;

  const account = accounts.find(a => a.id === transaction.accountId);
  const getTransactionIcon = () => {
    if (transaction.type === 'income') {
      return <TrendingUp size={24} className="text-green-500" />;
    }
    return <TrendingDown size={24} className="text-red-500" />;
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'scheduled':
        return <Calendar size={16} className="text-blue-500" />;
      case 'cancelled':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getBillStatusIcon = () => {
    if (!billStatus) return null;
    
    switch (billStatus.status) {
      case 'paid_on_time':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'paid_early':
        return <CheckCircle size={16} className="text-blue-500" />;
      case 'paid_late':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getTransactionIcon()}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
              <p className="text-sm text-gray-500">
                {format(new Date(transaction.date), 'MMM dd, yyyy • h:mm a')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-lg font-semibold text-gray-900">
                  {transaction.description || 'No description'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <div className="flex items-center space-x-2">
                  <Tag size={16} className="text-gray-400" />
                  <span className="text-gray-900">{transaction.category}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <div className="flex flex-col space-y-2">
                  {(() => {
                    const primaryCurrency = profile?.primaryCurrency || 'USD';
                    const display = formatTransactionForDisplay(transaction, primaryCurrency);
                    const detailed = getDetailedDisplay(transaction, primaryCurrency);
                    const system = getCurrencySystem();
                    
                    return (
                      <>
                        {/* Main Display: Symbol of original currency + Amount in primary currency */}
                        <div className="flex items-center space-x-2">
                          <DollarSign size={16} className="text-gray-400" />
                          <span className={`text-3xl font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {display.formatted}
                          </span>
                        </div>
                        
                        {/* Show original amount if conversion happened */}
                        {display.needsConversion && detailed.note && (
                          <div className="pl-6 bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                            <div className="flex items-center space-x-2">
                              <ArrowRightLeft size={14} className="text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Original: {system.formatCurrency(
                                  Math.abs(transaction.native_amount || transaction.amount),
                                  display.originalCurrency
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              Converted to {display.primaryCurrency} for display
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {transaction.type === 'transfer' ? 'From Account' : 'Account'}
                </label>
                <div className="flex items-center space-x-2">
                  <Building size={16} className="text-gray-400" />
                  <span className="text-gray-900">{account?.name || 'Unknown Account'}</span>
                  {account?.currencycode && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {account.currencycode}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <div className="flex items-center space-x-2">
                  {transaction.type === 'income' ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : transaction.type === 'transfer' ? (
                    <ArrowRightLeft size={16} className="text-blue-500" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                  <span className="text-gray-900 capitalize font-medium">{transaction.type}</span>
                  {transaction.payment_source && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {transaction.payment_source.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className="text-gray-900 capitalize">{transaction.status}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-900">
                    {format(new Date(transaction.date), 'EEEE, MMMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Enhanced Multi-Currency Breakdown */}
          {(() => {
            const primaryCurrency = profile?.primaryCurrency || 'USD';
            const display = formatTransactionForDisplay(transaction, primaryCurrency);
            const system = getCurrencySystem();
            
            if (!display.needsConversion) return null;
            
            const nativeAmount = transaction.native_amount || transaction.amount || 0;
            const convertedAmount = transaction.converted_amount || transaction.amount || 0;
            const primaryAmount = transaction.primary_amount || convertedAmount;
            
            const nativeCurrency = transaction.native_currency || transaction.currency_code || primaryCurrency;
            const accountCurrency = transaction.converted_currency || transaction.currency_code || primaryCurrency;
            const exchangeRate = transaction.exchange_rate || 1;
            
            return (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                  <ArrowRightLeft size={18} className="text-blue-600 mr-2" />
                  Multi-Currency Transaction Breakdown
                </h3>
                
                <div className="space-y-3">
                  {/* Step 1: Original Transaction */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        1. What You Paid
                      </label>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Original
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {system.formatCurrency(Math.abs(nativeAmount), nativeCurrency)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{nativeCurrency} - Transaction Currency</p>
                  </div>
                  
                  {/* Step 2: Account Deduction (if different) */}
                  {accountCurrency !== nativeCurrency && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          2. Deducted From Account
                        </label>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          Account
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        -{system.formatCurrency(Math.abs(convertedAmount), accountCurrency)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {accountCurrency} - Account Currency
                      </p>
                      {exchangeRate && exchangeRate !== 1 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-mono">
                            Rate: 1 {nativeCurrency} = {exchangeRate.toFixed(4)} {accountCurrency}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Step 3: Dashboard Display */}
                  {primaryCurrency !== nativeCurrency && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          3. Shown on Dashboard
                        </label>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          Base
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {system.formatCurrency(Math.abs(primaryAmount), primaryCurrency)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{primaryCurrency} - Your Primary Currency</p>
                    </div>
                  )}
                  
                  {/* Conversion Summary */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-2">Conversion Path:</p>
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <span className="font-bold text-green-700">{nativeCurrency}</span>
                      <span className="text-gray-400">→</span>
                      {accountCurrency !== nativeCurrency && (
                        <>
                          <span className="font-bold text-red-700">{accountCurrency}</span>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <span className="font-bold text-blue-700">{primaryCurrency}</span>
                    </div>
                    {transaction.conversion_source && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Source: {transaction.conversion_source}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Budget Progress */}
          {budgetProgress && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Receipt size={16} className="text-blue-600" />
                <h3 className="text-sm font-medium text-blue-800">Budget Impact</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900">
                      {budgetProgress.progressAfter.toFixed(1)}% 
                      {budgetProgress.progressBefore !== budgetProgress.progressAfter && (
                        <span className={`ml-1 ${
                          budgetProgress.progressAfter > budgetProgress.progressBefore ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ({budgetProgress.progressAfter > budgetProgress.progressBefore ? '+' : ''}
                          {(budgetProgress.progressAfter - budgetProgress.progressBefore).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(budgetProgress.progressAfter, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Spent Before</label>
                    <p className="font-medium">{formatCurrency(budgetProgress.spentBefore)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Spent After</label>
                    <p className="font-medium">{formatCurrency(budgetProgress.spentAfter)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Remaining Before</label>
                    <p className="font-medium">{formatCurrency(budgetProgress.remainingBefore)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Remaining After</label>
                    <p className="font-medium">{formatCurrency(budgetProgress.remainingAfter)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Goal Progress */}
          {goalProgress && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target size={16} className="text-green-600" />
                <h3 className="text-sm font-medium text-green-800">Goal Progress</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900">
                      {goalProgress.progressAfter.toFixed(1)}%
                      {goalProgress.progressBefore !== goalProgress.progressAfter && (
                        <span className="text-green-600 ml-1">
                          (+{(goalProgress.progressAfter - goalProgress.progressBefore).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(goalProgress.progressAfter, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Before Payment</label>
                    <p className="font-medium">{formatCurrency(goalProgress.currentBefore)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">After Payment</label>
                    <p className="font-medium">{formatCurrency(goalProgress.currentAfter)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Remaining Before</label>
                    <p className="font-medium">{formatCurrency(goalProgress.remainingBefore)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Remaining After</label>
                    <p className="font-medium">{formatCurrency(goalProgress.remainingAfter)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bill Payment Status */}
          {billStatus && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border-2 border-orange-200">
              <div className="flex items-center space-x-2 mb-3">
                <Receipt size={18} className="text-orange-600" />
                <h3 className="text-sm font-bold text-orange-800">Bill Payment</h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 font-medium">Payment Status</span>
                    <div className="flex items-center space-x-2">
                      {getBillStatusIcon()}
                      <span className={`text-sm font-bold capitalize ${
                        billStatus.status === 'paid_on_time' ? 'text-green-600' :
                        billStatus.status === 'paid_early' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {billStatus.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                    <div>
                      <label className="text-gray-500">Bill: {billStatus.bill.title}</label>
                      <p className="font-semibold text-gray-900">{formatCurrency(billStatus.bill.amount)}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Due Date</label>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(billStatus.bill.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {billStatus.daysDifference !== 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className={`text-xs font-medium ${
                        billStatus.daysDifference > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {billStatus.daysDifference > 0 
                          ? `⚠️ Paid ${billStatus.daysDifference} days late`
                          : `✅ Paid ${Math.abs(billStatus.daysDifference)} days early`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Liability Payment Info */}
          {liabilityInfo && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard size={18} className="text-purple-600" />
                <h3 className="text-sm font-bold text-purple-800">Liability Payment</h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <label className="text-xs text-gray-500 font-medium">Liability: {liabilityInfo.liability.name}</label>
                  <p className="text-lg font-bold text-purple-900 mb-2">
                    Payment: {formatCurrency(liabilityInfo.paymentAmount)}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-gray-500">Before Payment</label>
                      <p className="font-semibold text-gray-900">{formatCurrency(liabilityInfo.remainingBefore)}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">After Payment</label>
                      <p className="font-semibold text-green-700">{formatCurrency(liabilityInfo.remainingAfter)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Paid Off</span>
                      <span className="text-gray-900 font-medium">{liabilityInfo.progressAfter.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(liabilityInfo.progressAfter, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Transfer Info */}
          {transferInfo && transferInfo.toAccount && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border-2 border-teal-200">
              <div className="flex items-center space-x-2 mb-3">
                <ArrowRightLeft size={18} className="text-teal-600" />
                <h3 className="text-sm font-bold text-teal-800">Account Transfer</h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs">
                      <label className="text-gray-500 font-medium">From Account</label>
                      <p className="font-semibold text-gray-900">{transferInfo.fromAccount?.name || 'Unknown'}</p>
                    </div>
                    <ArrowRightLeft size={16} className="text-gray-400" />
                    <div className="text-xs text-right">
                      <label className="text-gray-500 font-medium">To Account</label>
                      <p className="font-semibold text-gray-900">{transferInfo.toAccount.name}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Transfer Amount</span>
                      <span className="font-bold text-teal-700">
                        {formatCurrency(transferInfo.transferAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600">Transaction ID</label>
                <p className="font-mono text-xs text-gray-500">{transaction.id}</p>
              </div>
              <div>
                <label className="text-gray-600">Created</label>
                <p className="text-gray-900">
                  {transaction.createdAt ? format(new Date(transaction.createdAt), 'MMM dd, yyyy • h:mm a') : 'Unknown'}
                </p>
              </div>
              {transaction.reason && (
                <div className="md:col-span-2">
                  <label className="text-gray-600">Reason</label>
                  <p className="text-gray-900">{transaction.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
