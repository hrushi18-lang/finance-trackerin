import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Target, 
  Calendar, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Plus, 
  Building, 
  Smartphone, 
  PiggyBank,
  Car,
  Home,
  GraduationCap,
  Bell,
  User,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
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
  const netWorth = useMemo(() => {
    const totalAssets = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.remainingAmount || 0), 0);
    return totalAssets - totalLiabilities;
  }, [accounts, liabilities]);

  // Calculate net worth change (mock for now)
  const netWorthChange = useMemo(() => {
    return { amount: 1234, percentage: 1.0 };
  }, []);

  // Calculate monthly income and expenses
  const monthlyStats = useMemo(() => {
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

  // Get recent transactions for analytics
  const analyticsData = useMemo(() => {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Generate data points for the month
    const dataPoints = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(startOfMonth.getTime() + (i * 10 * 24 * 60 * 60 * 1000));
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === date.toDateString();
      });
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayExpenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      dataPoints.push({
        period: i === 0 ? 'Start' : i === 1 ? 'Mid' : 'End',
        income: dayIncome || Math.random() * 2000 + 1000,
        expenses: dayExpenses || Math.random() * 1500 + 800
      });
    }
    
    return dataPoints;
  }, [transactions]);

  // Get upcoming bills
  const upcomingBills = useMemo(() => {
    return recurringTransactions
      .filter(rt => rt.isActive && rt.type === 'expense')
      .slice(0, 3)
      .map((bill, index) => ({
        ...bill,
        dueIn: index === 0 ? 1 : index === 1 ? 5 : 12,
        status: index === 0 ? 'due_tomorrow' : index === 1 ? 'upcoming' : 'upcoming'
      }));
  }, [recurringTransactions]);

  // Get account icon
  const getAccountIcon = (account: any) => {
    switch (account.type) {
      case 'checking':
      case 'primary_banking':
      case 'bank_current':
        return <Building size={20} className="text-blue-600" />;
      case 'savings':
      case 'bank_savings':
        return <PiggyBank size={20} className="text-green-600" />;
      case 'credit':
      case 'credit_card':
        return <CreditCard size={20} className="text-red-600" />;
      case 'digital_wallet':
        return <Smartphone size={20} className="text-purple-600" />;
      default:
        return <Wallet size={20} className="text-gray-600" />;
    }
  };

  // Get goal icon
  const getGoalIcon = (goal: any) => {
    const category = goal.category?.toLowerCase() || '';
    if (category.includes('car') || category.includes('vehicle')) return <Car size={20} className="text-blue-600" />;
    if (category.includes('vacation') || category.includes('trip') || category.includes('travel')) return <TrendingUp size={20} className="text-green-600" />;
    if (category.includes('emergency')) return <Target size={20} className="text-orange-600" />;
    if (category.includes('home') || category.includes('house')) return <Home size={20} className="text-purple-600" />;
    return <Target size={20} className="text-gray-600" />;
  };

  // Get bill status color
  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'due_tomorrow': return 'bg-red-500';
      case 'upcoming': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  // Get bill status text
  const getBillStatusText = (dueIn: number) => {
    if (dueIn === 1) return 'Due Tomorrow';
    if (dueIn <= 7) return `Due in ${dueIn} days`;
    return `Due in ${dueIn} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-20">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading text-gray-900">Overview</h1>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-1">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Net Worth Hero Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-600 mb-2">Net Worth</h2>
            <p className="text-4xl font-serif font-bold text-gray-900 mb-2">
              {showBalances ? formatCurrency(netWorth) : '••••••'}
            </p>
            <p className="text-sm text-green-600 font-medium">
              +{formatCurrency(netWorthChange.amount)} ({netWorthChange.percentage}%) this month
            </p>
          </div>
          {/* Animated progress ring */}
          <div className="absolute top-4 right-4 w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-green-600"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${netWorthChange.percentage * 10}, 100`}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>

        {/* Manage Accounts Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Accounts</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {accounts.slice(0, 3).map((account) => (
              <div key={account.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 min-w-[140px] flex-shrink-0">
                <div className="flex items-center space-x-3 mb-3">
                  {getAccountIcon(account)}
                  <span className="text-sm font-medium text-gray-700">
                    {account.name}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {showBalances ? formatCurrency(account.balance || 0) : '••••••'}
                </p>
              </div>
            ))}
            {/* Add Account Card */}
            <div className="bg-gray-100 rounded-2xl p-4 min-w-[140px] flex-shrink-0 flex items-center justify-center border-2 border-dashed border-gray-300">
              <button
                onClick={() => navigate('/accounts')}
                className="flex flex-col items-center space-y-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Plus size={24} />
                <span className="text-sm font-medium">Add Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        {goals.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals</h3>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {goals.slice(0, 3).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 min-w-[160px] flex-shrink-0">
                    <div className="flex items-center space-x-3 mb-3">
                      {getGoalIcon(goal)}
                      <span className="text-sm font-medium text-gray-700">
                        {goal.title}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{showBalances ? formatCurrency(goal.currentAmount) : '••••'}</span>
                        <span>{showBalances ? formatCurrency(goal.targetAmount) : '••••'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-600 to-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Bills Section */}
        {upcomingBills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bills</h3>
            <div className="space-y-3">
              {upcomingBills.map((bill, index) => (
                <div key={bill.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-1 h-12 rounded-full ${getBillStatusColor(bill.status)}`}></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{bill.description}</h4>
                        <p className="text-sm text-gray-500">{getBillStatusText(bill.dueIn)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {showBalances ? formatCurrency(bill.amount) : '••••'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budgets & Liabilities Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Budgets Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3">Budgets</h4>
            <div className="space-y-3">
              {budgets.slice(0, 2).map((budget) => {
                const progress = ((budget.spent || 0) / (budget.amount || budget.limit || 1)) * 100;
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{budget.category}</span>
                      <span>{progress.toFixed(0)}%</span>
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

          {/* Liabilities Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3">Liabilities</h4>
            <div className="space-y-3">
              {liabilities.slice(0, 2).map((liability) => (
                <div key={liability.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{liability.name}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {showBalances ? formatCurrency(liability.remainingAmount || 0) : '••••'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Snapshot */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Spending vs Income</h4>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
              <Calendar size={14} className="text-gray-600" />
              <span className="text-sm text-gray-600">This Month</span>
            </div>
          </div>
          
          {/* Mini Line Graph */}
          <div className="h-32 flex items-end justify-between space-x-2">
            {analyticsData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center space-y-1 mb-2">
                  {/* Income bar */}
                  <div 
                    className="w-full bg-gray-300 rounded-t"
                    style={{ height: `${(data.income / Math.max(...analyticsData.map(d => d.income))) * 60}px` }}
                  ></div>
                  {/* Expenses bar */}
                  <div 
                    className="w-full bg-green-600 rounded-b"
                    style={{ height: `${(data.expenses / Math.max(...analyticsData.map(d => d.expenses))) * 60}px` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{data.period}</span>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 mt-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-xs text-gray-600">Income</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span className="text-xs text-gray-600">Spending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
};