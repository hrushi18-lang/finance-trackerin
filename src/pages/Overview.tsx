import React, { useState } from 'react';
import { TrendingUp, Wallet, CreditCard, Target, Calendar, BarChart3, Eye, EyeOff, ArrowLeftRight, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [currentLiabilityIndex, setCurrentLiabilityIndex] = useState(0);

  // Calculate total balance across all visible accounts
  const totalBalance = (accounts || [])
    .filter(account => account.isVisible)
    .reduce((sum, account) => sum + (Number(account.balance) || 0), 0);

  // Get upcoming bills (next 7 days)
  const upcomingBills = (recurringTransactions || [])
    .filter(rt => rt.isActive && rt.type === 'expense')
    .slice(0, 5);

  // Calculate financial health score
  const netWorth = stats.totalIncome - stats.totalExpenses - stats.totalLiabilities;
  const financialHealthScore = Math.min(Math.max(((netWorth / 10000) * 100) + 500, 0), 1000);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return CreditCard;
      case 'digital_wallet':
        return Wallet;
      default:
        return Wallet;
    }
  };

  const getAccountColor = (type: string) => {
    const colors = {
      bank_savings: 'bg-blue-500',
      bank_current: 'bg-green-500',
      bank_student: 'bg-purple-500',
      digital_wallet: 'bg-orange-500',
      cash: 'bg-gray-500',
      credit_card: 'bg-red-500',
      investment: 'bg-yellow-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const nextGoal = () => {
    setCurrentGoalIndex((prev) => (prev + 1) % goals.length);
  };

  const prevGoal = () => {
    setCurrentGoalIndex((prev) => (prev - 1 + goals.length) % goals.length);
  };

  const nextLiability = () => {
    setCurrentLiabilityIndex((prev) => (prev + 1) % liabilities.length);
  };

  const prevLiability = () => {
    setCurrentLiabilityIndex((prev) => (prev - 1 + liabilities.length) % liabilities.length);
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title="Financial Overview" />
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        {/* Dashboard Snapshot */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-heading font-semibold text-white">Financial Snapshot</h3>
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
              title={showBalances ? "Hide balances" : "Show balances"}
            >
              {showBalances ? (
                <EyeOff size={20} className="text-forest-400" />
              ) : (
                <Eye size={20} className="text-forest-400" />
              )}
            </button>
          </div>

          {showBalances && (
            <div className="text-center mb-6">
              <p className="text-forest-300 text-sm mb-2 font-body">Total Net Worth</p>
              <p className="text-4xl font-numbers font-bold text-white mb-2">
                <CurrencyIcon currencyCode={currency.code} size={24} className="inline mr-2" />
                {netWorth.toLocaleString()}
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className="text-forest-200 font-body">Health Score: {Math.round(financialHealthScore)}/1000</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-forest-800/30 rounded-lg p-4 text-center">
              <p className="text-forest-300 text-sm mb-1 font-body">Total Balance</p>
              <p className="text-xl font-numbers font-bold text-white">
                {showBalances ? formatCurrency(totalBalance) : '••••••'}
              </p>
              <p className="text-xs text-forest-400 font-body">{(accounts || []).filter(a => a.isVisible).length} accounts</p>
            </div>
            <div className="bg-forest-800/30 rounded-lg p-4 text-center">
              <p className="text-forest-300 text-sm mb-1 font-body">Monthly Net</p>
              <p className="text-xl font-numbers font-bold text-white">
                {showBalances ? formatCurrency(stats.monthlyIncome - stats.monthlyExpenses) : '••••••'}
              </p>
              <p className="text-xs text-forest-400 font-body">This month</p>
            </div>
          </div>
        </div>

        {/* Accounts Overview */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-white">Accounts Overview</h3>
            <button
              onClick={() => navigate('/profile')}
              className="text-forest-400 text-sm font-body hover:text-forest-300"
            >
              Manage All
            </button>
          </div>

          {(accounts || []).length === 0 ? (
            <div className="text-center py-8">
              <Wallet size={48} className="mx-auto text-forest-600 mb-4" />
              <p className="text-forest-300 mb-4 font-body">No accounts added yet</p>
              <button
                onClick={() => navigate('/profile')}
                className="bg-forest-600 text-white py-2 px-4 rounded-lg font-body hover:bg-forest-700 transition-colors"
              >
                Add First Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(accounts || []).slice(0, 4).map((account) => {
                const AccountIcon = getAccountIcon(account.type);
                return (
                  <div key={account.id} className="bg-forest-800/20 rounded-xl p-4 border border-forest-600/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg ${getAccountColor(account.type)} flex items-center justify-center`}>
                          <AccountIcon size={20} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-heading font-medium text-white">{account.name}</h4>
                          <p className="text-xs text-forest-400 font-body capitalize">{account.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                    {account.isVisible && showBalances && (
                      <p className="text-lg font-numbers font-bold text-white">
                        <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                        {account.balance.toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals - Swipeable Cards */}
        {goals.length > 0 && (
          <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-white">Financial Goals</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-forest-400 font-body">{currentGoalIndex + 1} of {goals.length}</span>
                <button onClick={prevGoal} className="p-1 hover:bg-forest-600/20 rounded">
                  <ChevronLeft size={16} className="text-forest-400" />
                </button>
                <button onClick={nextGoal} className="p-1 hover:bg-forest-600/20 rounded">
                  <ChevronRight size={16} className="text-forest-400" />
                </button>
              </div>
            </div>

            {goals[currentGoalIndex] && (
              <div className="bg-forest-800/20 rounded-xl p-4 border border-forest-600/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-forest-600 rounded-lg flex items-center justify-center">
                    <Target size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-heading font-medium text-white">{goals[currentGoalIndex].title}</h4>
                    <p className="text-sm text-forest-400 font-body">{goals[currentGoalIndex].category}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-forest-300 font-body">Progress</span>
                    <span className="text-white font-numbers">
                      {formatCurrency(goals[currentGoalIndex].currentAmount)} / {formatCurrency(goals[currentGoalIndex].targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-forest-700/30 rounded-full h-2">
                    <div
                      className="bg-forest-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((goals[currentGoalIndex].currentAmount / goals[currentGoalIndex].targetAmount) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-forest-400 mt-1 font-body">
                    {((goals[currentGoalIndex].currentAmount / goals[currentGoalIndex].targetAmount) * 100).toFixed(1)}% complete
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liabilities - Swipeable Cards */}
        {liabilities.length > 0 && (
          <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-white">Liabilities</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-forest-400 font-body">{currentLiabilityIndex + 1} of {liabilities.length}</span>
                <button onClick={prevLiability} className="p-1 hover:bg-forest-600/20 rounded">
                  <ChevronLeft size={16} className="text-forest-400" />
                </button>
                <button onClick={nextLiability} className="p-1 hover:bg-forest-600/20 rounded">
                  <ChevronRight size={16} className="text-forest-400" />
                </button>
              </div>
            </div>

            {liabilities[currentLiabilityIndex] && (
              <div className="bg-forest-800/20 rounded-xl p-4 border border-forest-600/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-heading font-medium text-white">{liabilities[currentLiabilityIndex].name}</h4>
                    <p className="text-sm text-forest-400 font-body capitalize">{liabilities[currentLiabilityIndex].type.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-forest-300 text-sm mb-1 font-body">Remaining</p>
                    <p className="text-lg font-numbers font-bold text-white">
                      {formatCurrency(liabilities[currentLiabilityIndex].remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-forest-300 text-sm mb-1 font-body">Monthly Payment</p>
                    <p className="text-lg font-numbers font-bold text-white">
                      {formatCurrency(liabilities[currentLiabilityIndex].monthlyPayment)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-white">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/transaction-history')}
              className="text-forest-400 text-sm font-body hover:text-forest-300"
            >
              View All
            </button>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-forest-800/20 rounded-xl border border-forest-600/20"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income' 
                        ? 'bg-success-500/20' 
                        : 'bg-error-500/20'
                    }`}>
                      <TrendingUp size={16} className={
                        transaction.type === 'income' ? 'text-success-400' : 'text-error-400'
                      } />
                    </div>
                    <div>
                      <p className="font-body font-medium text-white text-sm">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-forest-400 font-body">
                        {transaction.category} • {format(transaction.date, 'MMM dd')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-numbers font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-success-400' 
                        : 'text-error-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 size={48} className="mx-auto text-forest-600 mb-4" />
              <p className="text-forest-300 font-body">No transactions yet</p>
              <p className="text-sm text-forest-400 font-body">Start by adding your first transaction</p>
            </div>
          )}
        </div>

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-white">Upcoming Bills</h3>
              <button 
                onClick={() => navigate('/recurring-transactions')}
                className="text-forest-400 text-sm font-body hover:text-forest-300"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-forest-800/20 rounded-lg border border-forest-600/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-warning-500/20 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-warning-400" />
                    </div>
                    <div>
                      <p className="font-body font-medium text-white text-sm">{bill.description}</p>
                      <p className="text-xs text-forest-400 font-body">{bill.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers font-semibold text-warning-400">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className="text-xs text-forest-400 font-body">Due soon</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Health Overview */}
        {(budgets || []).length > 0 && (
          <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-white">Budget Health</h3>
              <button 
                onClick={() => navigate('/budgets')}
                className="text-forest-400 text-sm font-body hover:text-forest-300"
              >
                Manage
              </button>
            </div>
            
            <div className="space-y-3">
              {(budgets || []).slice(0, 3).map((budget) => {
                const utilization = (budget.spent / budget.amount) * 100;
                return (
                  <div key={budget.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-body text-white">{budget.category}</span>
                        <span className="text-xs font-numbers text-forest-400">
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-forest-700/30 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            utilization >= 100 ? 'bg-error-500' :
                            utilization >= 80 ? 'bg-warning-500' : 'bg-success-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/add-transaction')}
            className="bg-forest-600 hover:bg-forest-700 text-white p-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span className="font-body font-medium">Add Transaction</span>
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="bg-forest-700 hover:bg-forest-600 text-white p-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <BarChart3 size={20} />
            <span className="font-body font-medium">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};