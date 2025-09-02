import React, { useState } from 'react';
import { TrendingUp, Wallet, CreditCard, Target, Calendar, BarChart3, Eye, EyeOff, ArrowLeftRight, Plus, ChevronLeft, ChevronRight, PieChart, Building, Smartphone, DollarSign, Home, Car, GraduationCap } from 'lucide-react';
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

  // Calculate net worth using stats
  const netWorth = React.useMemo(() => {
    const totalAssets = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.remainingAmount || 0), 0);
    return totalAssets - totalLiabilities;
  }, [accounts, liabilities]);

  // Calculate monthly income and expenses from stats
  const monthlyStats = React.useMemo(() => {
    return {
      income: stats.monthlyIncome || 0,
      expenses: stats.monthlyExpenses || 0,
      net: (stats.monthlyIncome || 0) - (stats.monthlyExpenses || 0)
    };
  }, [stats]);

  // Get recent transactions
  const recentTransactions = React.useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Get upcoming bills
  const upcomingBills = React.useMemo(() => {
    return recurringTransactions
      .filter(rt => rt.isActive && rt.type === 'expense')
      .slice(0, 3);
  }, [recurringTransactions]);

  // Get account icon
  const getAccountIcon = (account: any) => {
    switch (account.type) {
      case 'checking':
      case 'primary_banking':
      case 'bank_current':
        return <Building size={16} className="text-green-700" />;
      case 'savings':
      case 'bank_savings':
        return <Target size={16} className="text-green-600" />;
      case 'credit':
      case 'credit_card':
        return <CreditCard size={16} className="text-green-800" />;
      case 'digital_wallet':
        return <Smartphone size={16} className="text-green-600" />;
      case 'goals_vault':
        return <Target size={16} className="text-green-700" />;
      default:
        return <Wallet size={16} className="text-green-600" />;
    }
  };

  // Get transaction icon
  const getTransactionIcon = (transaction: any) => {
    if (transaction.type === 'income') {
      return <TrendingUp size={20} className="text-green-600" />;
    } else {
      return <TrendingUp size={20} className="text-red-500" />;
    }
  };

  // Get bill icon
  const getBillIcon = (bill: any) => {
    const category = bill.category?.toLowerCase() || '';
    if (category.includes('rent') || category.includes('housing')) return <Home size={20} className="text-green-700" />;
    if (category.includes('car') || category.includes('auto')) return <Car size={20} className="text-green-700" />;
    if (category.includes('credit')) return <CreditCard size={20} className="text-green-700" />;
    if (category.includes('student') || category.includes('education')) return <GraduationCap size={20} className="text-green-700" />;
    return <Calendar size={20} className="text-green-700" />;
  };

  // Get goal progress
  const getGoalProgress = (goal: any) => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  // Get budget progress
  const getBudgetProgress = (budget: any) => {
    const spent = budget.spent || 0;
    const limit = budget.amount || budget.limit || 1;
    return (spent / limit) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-20">
      {/* Immersive Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 pt-12 pb-8 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading text-gray-900">Overview</h1>
          <div className="flex items-center space-x-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
            <Calendar size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">This Month</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 space-y-8">

        {/* Summary Section */}
        <div>
          <h2 className="text-lg font-heading text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Net Worth Card */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Net Worth</h3>
              <p className="text-2xl font-numbers">
                {showBalances ? formatCurrency(netWorth) : '••••••'}
              </p>
            </div>
            
            {/* Goals Progress Card */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Goals</h3>
              <p className="text-2xl font-numbers">
                {goals.length > 0 ? 
                  `${Math.round(goals.reduce((sum, goal) => sum + getGoalProgress(goal), 0) / goals.length)}%` : 
                  '0%'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Goals Progress Section */}
        {goals.length > 0 && (
          <div>
            <h2 className="text-lg font-heading text-gray-900 mb-4">Goals Progress</h2>
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const progress = getGoalProgress(goal);
                return (
                  <div key={goal.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Target size={20} className="text-green-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                          <p className="text-sm text-gray-500">{goal.category}</p>
                        </div>
                      </div>
                      <span className="text-lg font-numbers text-gray-900">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
          </div>
        )}

        {/* Bills & Upcoming Payments Section */}
        {upcomingBills.length > 0 && (
          <div>
            <h2 className="text-lg font-heading text-gray-900 mb-4">Bills & Upcoming Payments</h2>
            <div className="space-y-4">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getBillIcon(bill)}
                      <div>
                        <h4 className="font-semibold text-gray-900">{bill.description}</h4>
                        <p className="text-sm text-gray-500">Due in 3 days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-numbers text-gray-900">
                        {showBalances ? formatCurrency(bill.amount) : '••••'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budgets Snapshot Section */}
        {budgets.length > 0 && (
          <div>
            <h2 className="text-lg font-heading text-gray-900 mb-4">Budgets Snapshot</h2>
            <div className="space-y-4">
              {budgets.slice(0, 3).map((budget) => {
                const progress = getBudgetProgress(budget);
                return (
                  <div key={budget.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{budget.category}</h4>
                      <span className="text-sm text-gray-500">
                        {showBalances ? formatCurrency(budget.spent || 0) : '••••'} / {showBalances ? formatCurrency(budget.amount || budget.limit || 0) : '••••'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty States */}
        {goals.length === 0 && upcomingBills.length === 0 && budgets.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <BarChart3 size={24} className="text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to FinTrack</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start by adding your first account, goal, or transaction
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/accounts')}
                    className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Add Account
                  </button>
                  <button
                    onClick={() => navigate('/goals')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Set Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};