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
  CheckCircle,
  Plane
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format } from 'date-fns';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';

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

  // Calculate net worth change (mock for now - you can implement real calculation)
  const netWorthChange = useMemo(() => {
    return { amount: 1234, percentage: 1.01 };
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

  // Get analytics data for the graph
  const analyticsData = useMemo(() => {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Generate data points for the month (Start, Mid, End)
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
        income: dayIncome || 0,
        expenses: dayExpenses || 0
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
    if (category.includes('car') || category.includes('vehicle')) return <Car size={20} className="text-purple-600" />;
    if (category.includes('vacation') || category.includes('trip') || category.includes('travel')) return <Plane size={20} className="text-blue-600" />;
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
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="relative">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                Overview
              </h1>
              <p className="text-sm font-body mt-1" style={{ color: 'var(--text-secondary)' }}>
                Your financial dashboard
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <button className="p-1">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: 'var(--background-secondary)' }}
                >
                  <User size={16} style={{ color: 'var(--text-secondary)' }} />
                </div>
              </button>
            </div>
          </div>

          {/* Net Worth Hero Card */}
          <div 
            className="relative overflow-hidden rounded-3xl p-8 mb-6"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #2d5016 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div className="text-center text-white">
              <h2 className="text-lg font-body mb-2 opacity-90">Net Worth</h2>
              <p className="text-4xl font-serif font-bold mb-2">
                {showBalances ? formatCurrency(netWorth) : '••••••'}
              </p>
              <p className="text-sm font-medium opacity-90">
                +{formatCurrency(netWorthChange.amount)} ({netWorthChange.percentage}%) this month
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--success)', opacity: 0.1 }}>
                <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>Monthly Income</span>
            </div>
            <p className="text-xl font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
              {showBalances ? formatCurrency(monthlyStats.income) : '••••••'}
            </p>
          </div>

          <div 
            className="rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--error)', opacity: 0.1 }}>
                <TrendingUp size={16} style={{ color: 'var(--error)' }} />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>Monthly Expenses</span>
            </div>
            <p className="text-xl font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
              {showBalances ? formatCurrency(monthlyStats.expenses) : '••••••'}
            </p>
          </div>
        </div>

        {/* Accounts Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
              Accounts
            </h3>
            <button
              onClick={() => navigate('/accounts')}
              className="text-sm font-body px-3 py-1 rounded-lg transition-colors"
              style={{ 
                color: 'var(--primary)',
                backgroundColor: 'var(--background-secondary)'
              }}
            >
              View All
            </button>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {accounts.length > 0 ? (
              accounts.slice(0, 3).map((account) => (
                <div 
                  key={account.id} 
                  className="min-w-[160px] flex-shrink-0 p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <LuxuryCategoryIcon 
                      category={account.type === 'bank_current' ? 'Primary Banking' : 
                               account.type === 'bank_savings' ? 'Savings' :
                               account.type === 'credit_card' ? 'Credit' :
                               account.type === 'digital_wallet' ? 'Digital Wallet' : 'Other Account'}
                      size={20}
                      variant="luxury"
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {account.name}
                    </span>
                  </div>
                  <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                    {showBalances ? formatCurrency(account.balance || 0) : '••••••'}
                  </p>
                </div>
              ))
            ) : (
              <div 
                className="min-w-[160px] flex-shrink-0 p-4 flex items-center justify-center rounded-2xl border-2 border-dashed"
                style={{ 
                  backgroundColor: 'var(--background-secondary)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="text-center">
                  <Wallet size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No accounts</p>
                </div>
              </div>
            )}
            
            {/* Add Account Card */}
            <div 
              className="min-w-[160px] flex-shrink-0 p-4 flex items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                borderColor: 'var(--border)'
              }}
              onClick={() => navigate('/accounts')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Plus size={24} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Add Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
              Goals
            </h3>
            <button
              onClick={() => navigate('/goals')}
              className="text-sm font-body px-3 py-1 rounded-lg transition-colors"
              style={{ 
                color: 'var(--primary)',
                backgroundColor: 'var(--background-secondary)'
              }}
            >
              View All
            </button>
          </div>
          
          {goals.length > 0 ? (
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {goals.slice(0, 3).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div 
                    key={goal.id} 
                    className="min-w-[180px] flex-shrink-0 p-4 rounded-2xl"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <LuxuryCategoryIcon 
                        category={goal.category || 'Other Goal'}
                        size={20}
                        variant="luxury"
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {goal.title}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{showBalances ? formatCurrency(goal.currentAmount) : '••••'}</span>
                        <span>{showBalances ? formatCurrency(goal.targetAmount) : '••••'}</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-light)' }}>
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: 'var(--primary)'
                          }}
                        ></div>
                      </div>
                      <p className="text-xs font-body mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {progress.toFixed(0)}% complete
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              className="p-8 text-center rounded-2xl"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
                  <Target size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>No Goals Yet</h3>
                  <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Set your first financial goal to start saving
                  </p>
                  <button
                    onClick={() => navigate('/goals')}
                    className="btn-primary"
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bills & Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Bills */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
                Upcoming Bills
              </h3>
              <button
                onClick={() => navigate('/bills')}
                className="text-sm font-body px-3 py-1 rounded-lg transition-colors"
                style={{ 
                  color: 'var(--primary)',
                  backgroundColor: 'var(--background-secondary)'
                }}
              >
                View All
              </button>
            </div>
            
            {upcomingBills.length > 0 ? (
              <div className="space-y-3">
                {upcomingBills.map((bill, index) => (
                  <div 
                    key={bill.id} 
                    className="p-4 rounded-2xl"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-1 h-12 rounded-full ${getBillStatusColor(bill.status)}`}></div>
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bill.description}</h4>
                          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>{getBillStatusText(bill.dueIn)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                          {showBalances ? formatCurrency(bill.amount) : '••••'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="p-6 text-center rounded-2xl"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
                    <Calendar size={20} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-heading mb-1" style={{ color: 'var(--text-primary)' }}>No Bills Yet</h3>
                    <p className="text-sm font-body mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Add your first bill to start tracking
                    </p>
                    <button
                      onClick={() => navigate('/bills')}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Add Bill
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Snapshot */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
                Analytics
              </h3>
              <button
                onClick={() => navigate('/analytics')}
                className="text-sm font-body px-3 py-1 rounded-lg transition-colors"
                style={{ 
                  color: 'var(--primary)',
                  backgroundColor: 'var(--background-secondary)'
                }}
              >
                View Details
              </button>
            </div>
            
            <div 
              className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
              onClick={() => navigate('/analytics')}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-heading" style={{ color: 'var(--text-primary)' }}>Spending vs Income</h4>
                <div className="flex items-center space-x-2 rounded-lg px-3 py-1" style={{ backgroundColor: 'var(--background)' }}>
                  <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>This Month</span>
                </div>
              </div>
              
              {/* Mini Bar Chart */}
              <div className="h-24 flex items-end justify-between space-x-2 mb-3">
                {analyticsData.map((data, index) => {
                  const maxValue = Math.max(...analyticsData.map(d => Math.max(d.income, d.expenses)));
                  const incomeHeight = maxValue > 0 ? (data.income / maxValue) * 60 : 0;
                  const expensesHeight = maxValue > 0 ? (data.expenses / maxValue) * 60 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center space-y-1 mb-2">
                        {/* Income bar */}
                        <div 
                          className="w-full rounded-t"
                          style={{ 
                            height: `${incomeHeight}px`,
                            backgroundColor: 'var(--success)'
                          }}
                        ></div>
                        {/* Expenses bar */}
                        <div 
                          className="w-full rounded-b"
                          style={{ 
                            height: `${expensesHeight}px`,
                            backgroundColor: 'var(--error)'
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>{data.period}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--success)' }}></div>
                  <span className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>Income</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--error)' }}></div>
                  <span className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>Spending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budgets & Liabilities Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budgets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
                Budgets
              </h3>
              <button
                onClick={() => navigate('/budgets')}
                className="text-sm font-body px-3 py-1 rounded-lg transition-colors"
                style={{ 
                  color: 'var(--primary)',
                  backgroundColor: 'var(--background-secondary)'
                }}
              >
                View All
              </button>
            </div>
            
            <div 
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              {budgets.length > 0 ? (
                <div className="space-y-4">
                  {budgets.slice(0, 3).map((budget) => {
                    const progress = ((budget.spent || 0) / (budget.amount || budget.limit || 1)) * 100;
                    return (
                      <div key={budget.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>{budget.category}</span>
                          <span className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-light)' }}>
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: progress > 100 ? 'var(--error)' : 'var(--success)'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>No budgets set</p>
                </div>
              )}
            </div>
          </div>

          {/* Liabilities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
                Liabilities
              </h3>
              <button
                onClick={() => navigate('/liabilities')}
                className="text-sm font-body px-3 py-1 rounded-lg transition-colors"
                style={{ 
                  color: 'var(--primary)',
                  backgroundColor: 'var(--background-secondary)'
                }}
              >
                View All
              </button>
            </div>
            
            <div 
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              {liabilities.length > 0 ? (
                <div className="space-y-4">
                  {liabilities.slice(0, 3).map((liability) => (
                    <div key={liability.id} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <LuxuryCategoryIcon 
                          category={liability.category || 'Other Debt'}
                          size={16}
                          variant="minimal"
                        />
                        <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>{liability.name}</span>
                      </div>
                      <span className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                        {showBalances ? formatCurrency(liability.remainingAmount || 0) : '••••'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>No liabilities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;