import React, { useState } from 'react';
import { TrendingUp, Wallet, CreditCard, Target, Calendar, BarChart3, Eye, EyeOff, ArrowLeftRight, Plus, ChevronLeft, ChevronRight, PieChart, Building, Smartphone, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '../components/layout/TopNavigation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { format } from 'date-fns';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { 
    accounts, 
    transactions, 
    goals, 
    liabilities, 
    budgets,
    recurringTransactions,
    stats 
  } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  
  const [showBalances, setShowBalances] = useState(true);

  // Calculate net worth
  const netWorth = React.useMemo(() => {
    const totalAssets = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.remainingAmount || 0), 0);
    return totalAssets - totalLiabilities;
  }, [accounts, liabilities]);

  // Calculate monthly income and expenses
  const monthlyStats = React.useMemo(() => {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses };
  }, [transactions]);

  // Get recent transactions
  const recentTransactions = React.useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Get account icon
  const getAccountIcon = (account: any) => {
    switch (account.type) {
      case 'checking':
      case 'primary_banking':
        return <Building size={16} className="text-blue-600" />;
      case 'savings':
        return <Target size={16} className="text-green-600" />;
      case 'credit':
        return <CreditCard size={16} className="text-purple-600" />;
      case 'digital_wallet':
        return <Smartphone size={16} className="text-orange-600" />;
      default:
        return <Wallet size={16} className="text-gray-600" />;
    }
  };

  // Get transaction icon
  const getTransactionIcon = (transaction: any) => {
    if (transaction.type === 'income') {
      return <TrendingUp size={20} className="text-green-500" />;
    } else {
      return <TrendingUp size={20} className="text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-20">
      <TopNavigation title="Financial Overview" showBack />
      
      <div className="px-6 py-6 space-y-8">
        {/* Net Worth Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Net Worth</h2>
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{showBalances ? 'Show' : 'Hide'} Balance</span>
            </button>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {showBalances ? formatCurrency(netWorth) : '••••••'}
            </p>
            <p className="text-sm text-gray-500">
              {accounts.length} accounts • {liabilities.length} liabilities
            </p>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Income</p>
            <p className="text-lg font-semibold text-gray-900">
              {showBalances ? formatCurrency(monthlyStats.income) : '••••'}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} className="text-red-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Expenses</p>
            <p className="text-lg font-semibold text-gray-900">
              {showBalances ? formatCurrency(monthlyStats.expenses) : '••••'}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              monthlyStats.net >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign size={24} className={monthlyStats.net >= 0 ? 'text-green-600' : 'text-red-600'} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Net</p>
            <p className={`text-lg font-semibold ${
              monthlyStats.net >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {showBalances ? formatCurrency(monthlyStats.net) : '••••'}
            </p>
          </div>
        </div>

        {/* Accounts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Accounts</h3>
            <button
              onClick={() => navigate('/accounts')}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              View All
            </button>
          </div>
          
          {accounts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {accounts.slice(0, 4).map((account) => (
                <div key={account.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-3">
                    {getAccountIcon(account)}
                    <span className="text-sm font-medium text-gray-700">
                      {account.name}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {showBalances ? formatCurrency(account.balance || 0) : '••••••'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Wallet size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Accounts Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your first account to start tracking your finances
                  </p>
                  <button
                    onClick={() => navigate('/accounts')}
                    className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Add Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
            <button
              onClick={() => navigate('/goals')}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              View All
            </button>
          </div>
          
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Target size={20} className="text-blue-600" />
                        <span className="font-medium text-gray-900">{goal.title}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{showBalances ? formatCurrency(goal.currentAmount) : '••••'}</span>
                      <span>{showBalances ? formatCurrency(goal.targetAmount) : '••••'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Target size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Set your first financial goal to start saving
                  </p>
                  <button
                    onClick={() => navigate('/goals')}
                    className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              View All
            </button>
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description || 'Transaction'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {showBalances ? formatCurrency(transaction.amount) : '••••'}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <DollarSign size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Start tracking your income and expenses
                  </p>
                  <button
                    onClick={() => navigate('/add-transaction')}
                    className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
