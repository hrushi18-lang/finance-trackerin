import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Target, Receipt, Building, Clock, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Tag } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinanceSafe } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
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
  
  const { accounts, goals, bills, budgets } = financeContext;
  const { formatCurrency } = useInternationalization();
  const [budgetProgress, setBudgetProgress] = useState<any>(null);
  const [goalProgress, setGoalProgress] = useState<any>(null);
  const [billStatus, setBillStatus] = useState<any>(null);

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
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-gray-400" />
                  {/* Main amount - Original currency if different from primary */}
                  {transaction.originalCurrency && transaction.originalCurrency !== transaction.currencycode ? (
                    <div className="space-y-1">
                      <span className={`text-2xl font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.originalAmount || transaction.amount, transaction.originalCurrency)}
                      </span>
                      {/* Description - Primary currency */}
                      <div className="text-sm text-gray-500">
                        ≈ {formatCurrency(transaction.amount, transaction.currencycode)}
                      </div>
                    </div>
                  ) : (
                    <span className={`text-2xl font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account</label>
                <div className="flex items-center space-x-2">
                  <Building size={16} className="text-gray-400" />
                  <span className="text-gray-900">{account?.name || 'Unknown Account'}</span>
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

          {/* Currency Information */}
          {(transaction.originalAmount && transaction.originalCurrency) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Currency Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Original Amount</label>
                  <p className="text-sm font-medium">
                    {formatCurrency(transaction.originalAmount, transaction.originalCurrency)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Exchange Rate</label>
                  <p className="text-sm font-medium">
                    1 {transaction.originalCurrency} = {transaction.exchangeRate?.toFixed(4)} USD
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Bill Status */}
          {billStatus && (
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard size={16} className="text-orange-600" />
                <h3 className="text-sm font-medium text-orange-800">Bill Payment Status</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <div className="flex items-center space-x-2">
                    {getBillStatusIcon()}
                    <span className={`text-sm font-medium capitalize ${
                      billStatus.status === 'paid_on_time' ? 'text-green-600' :
                      billStatus.status === 'paid_early' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {billStatus.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Due Date</label>
                    <p className="font-medium">
                      {format(new Date(billStatus.bill.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-600">Paid Date</label>
                    <p className="font-medium">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-600">Days Difference</label>
                    <p className={`font-medium ${
                      billStatus.daysDifference > 0 ? 'text-red-600' : 
                      billStatus.daysDifference < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {billStatus.daysDifference > 0 ? '+' : ''}{billStatus.daysDifference} days
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-600">Bill Amount</label>
                    <p className="font-medium">{formatCurrency(billStatus.bill.amount)}</p>
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
