import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, TrendingDown, Calendar, DollarSign, BarChart3, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContextOffline';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useTheme } from '../contexts/ThemeContext';

import { ProgressBar } from '../components/analytics/ProgressBar';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { TrendChart } from '../components/analytics/TrendChart';
import Modal from '../components/common/Modal';
import { AccountBudgetForm } from '../components/forms/AccountBudgetForm';
import { MockTransactionForm } from '../components/forms/MockTransactionForm';

interface BudgetDetailProps {}

const BudgetDetail: React.FC<BudgetDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { currency, formatCurrency, formatDate } = useInternationalization();
  const { 
    budgets, 
    accounts, 
    transactions, 
    updateBudget, 
    deleteBudget, 
    addTransaction,
    getBudgetTransactions,
    getBudgetSpending
  } = useFinance();

  const [budget, setBudget] = useState<any>(null);
  const [budgetTransactions, setBudgetTransactions] = useState<any[]>([]);
  const [budgetSpending, setBudgetSpending] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    if (id && budgets) {
      const foundBudget = budgets.find(b => b.id === id);
      if (foundBudget) {
        setBudget(foundBudget);
        setSelectedAccount(foundBudget.account_id || '');
        
        // Get budget-specific transactions
        const budgetTrans = getBudgetTransactions(id);
        setBudgetTransactions(budgetTrans);
        
        // Get budget spending data
        const spending = getBudgetSpending(id);
        setBudgetSpending(spending);
      }
    }
  }, [id, budgets, getBudgetTransactions, getBudgetSpending]);

  const handleEditBudget = (updatedBudget: any) => {
    updateBudget(updatedBudget);
    setBudget(updatedBudget);
    setIsEditModalOpen(false);
  };

  const handleDeleteBudget = () => {
    if (budget && window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(budget.id);
      navigate('/budgets');
    }
  };

  const handleAddTransaction = (transaction: any) => {
    const newTransaction = {
      ...transaction,
      budget_id: budget?.id,
      account_id: selectedAccount,
      type: 'expense'
    };
    addTransaction(newTransaction);
    setIsTransactionModalOpen(false);
    
    // Refresh data
    const budgetTrans = getBudgetTransactions(budget?.id);
    setBudgetTransactions(budgetTrans);
  };

  if (!budget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 dark:from-forest-900 dark:to-forest-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-forest-300">Loading budget details...</p>
        </div>
      </div>
    );
  }

  const totalSpent = budgetTransactions.reduce((sum, trans) => sum + trans.amount, 0);
  const remainingAmount = budget.amount - totalSpent;
  const spendingPercentage = (totalSpent / budget.amount) * 100;
  const isOverBudget = totalSpent > budget.amount;

  // Calculate analytics data
  const monthlySpending = budgetTransactions.reduce((acc, trans) => {
    const month = new Date(trans.date).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryBreakdown = budgetTransactions.reduce((acc, trans) => {
    acc[trans.category] = (acc[trans.category] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  const dailySpending = budgetTransactions.reduce((acc, trans) => {
    const day = new Date(trans.date).toISOString().slice(0, 10);
    acc[day] = (acc[day] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 dark:from-forest-900 dark:to-forest-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-forest-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/budgets')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-forest-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-forest-300" />
              </button>
              <div>
                <h1 className="text-xl font-heading text-gray-900 dark:text-forest-100">
                  {budget.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-forest-400">
                  Budget Details & Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-forest-700 transition-colors"
              >
                <Edit className="h-5 w-5 text-gray-600 dark:text-forest-300" />
              </button>
              <button
                onClick={handleDeleteBudget}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Budget Card */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Budget Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-3 rounded-xl ${
                  isOverBudget 
                    ? 'bg-red-100 dark:bg-red-900/20' 
                    : 'bg-blue-100 dark:bg-blue-900/20'
                }`}>
                  <PieChart className={`h-8 w-8 ${
                    isOverBudget 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                <div>
                  <h2 className="text-2xl font-heading text-gray-900 dark:text-forest-100">
                    {budget.name}
                  </h2>
                  <p className="text-gray-600 dark:text-forest-400">
                    {budget.description}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                    Spending Progress
                  </span>
                  <span className={`text-sm font-numbers ${
                    isOverBudget 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-900 dark:text-forest-100'
                  }`}>
                    {spendingPercentage.toFixed(1)}%
                  </span>
                </div>
                <ProgressBar 
                  value={Math.min(spendingPercentage, 100)} 
                  max={100}
                  className={`h-3 ${
                    isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-forest-400">
                  <span>{formatCurrency(totalSpent, currency)}</span>
                  <span>{formatCurrency(budget.amount, currency)}</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-xl p-4 ${
                  isOverBudget 
                    ? 'bg-red-50 dark:bg-red-900/10' 
                    : 'bg-green-50 dark:bg-green-900/10'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className={`h-5 w-5 ${
                      isOverBudget 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                      {isOverBudget ? 'Over Budget' : 'Remaining'}
                    </span>
                  </div>
                  <p className={`text-xl font-numbers ${
                    isOverBudget 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {formatCurrency(Math.abs(remainingAmount), currency)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-forest-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-olive-600 dark:text-forest-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                      Period
                    </span>
                  </div>
                  <p className="text-xl font-numbers text-gray-900 dark:text-forest-100">
                    {budget.period}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Stats */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-forest-700 dark:to-forest-600 rounded-xl p-6">
                <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100 mb-4">
                  Budget Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Date Created</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatDate(budget.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Budget Amount</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(budget.amount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Transactions</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {budgetTransactions.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Total Spent</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(totalSpent, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`rounded-xl p-6 ${
                isOverBudget 
                  ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' 
                  : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {isOverBudget ? (
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  )}
                  <div>
                    <h4 className={`font-heading ${
                      isOverBudget 
                        ? 'text-red-800 dark:text-red-300' 
                        : 'text-green-800 dark:text-green-300'
                    }`}>
                      {isOverBudget ? 'Over Budget' : 'On Track'}
                    </h4>
                    <p className={`text-sm ${
                      isOverBudget 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {isOverBudget 
                        ? `Exceeded by ${formatCurrency(Math.abs(remainingAmount), currency)}`
                        : `${formatCurrency(remainingAmount, currency)} remaining`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Spending */}
          <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Monthly Spending
              </h3>
            </div>
            <BarChart
              data={Object.entries(monthlySpending).map(([month, amount]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                value: amount
              }))}
              height={200}
            />
          </div>

          {/* Category Breakdown */}
          <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <PieChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Category Breakdown
              </h3>
            </div>
            {Object.keys(categoryBreakdown).length > 0 ? (
              <RingChart
                data={Object.entries(categoryBreakdown).map(([category, amount]) => ({
                  name: category,
                  value: amount,
                  color: `hsl(${Math.random() * 360}, 70%, 50%)`
                }))}
                size={120}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-forest-400">No category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Spending Trend */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
              Spending Trend
            </h3>
          </div>
          <TrendChart
            data={Object.entries(dailySpending).map(([date, amount]) => ({
              date,
              value: amount
            }))}
            height={200}
          />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Recent Expenses
              </h3>
            </div>
            <span className="text-sm text-gray-500 dark:text-forest-400">
              {budgetTransactions.length} transactions
            </span>
          </div>

          {budgetTransactions.length > 0 ? (
            <div className="space-y-3">
              {budgetTransactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-forest-700/50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-forest-100">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-forest-400">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers text-red-600 dark:text-red-400">
                      -{formatCurrency(transaction.amount, currency)}
                    </p>
                    {transaction.account_name && (
                      <p className="text-sm text-gray-500 dark:text-forest-400">
                        {transaction.account_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-100 dark:bg-forest-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <PieChart className="h-8 w-8 text-gray-400 dark:text-forest-500" />
              </div>
              <p className="text-gray-500 dark:text-forest-400 mb-4">
                No expenses recorded yet
              </p>
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Add First Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Budget"
        size="lg"
      >
        <AccountBudgetForm
          initialData={budget}
          onSubmit={handleEditBudget}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Add Expense"
        size="md"
      >
        <MockTransactionForm
          onSubmit={handleAddTransaction}
          onCancel={() => setIsTransactionModalOpen(false)}
          defaultAccount={selectedAccount}
          transactionType="expense"
        />
      </Modal>
    </div>
  );
};

export default BudgetDetail;
