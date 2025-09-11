import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  Target,
  FileText,
  PieChart,
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { usePayment } from '../contexts/PaymentContext';
import { format } from 'date-fns';

const Activities: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useInternationalization();
  const { accounts, transactions, goals, budgets, liabilities, bills } = useFinance();
  const { openPaymentModal } = usePayment();
  
  const [showBalances, setShowBalances] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Calculate activity statistics
  const activityStats = useMemo(() => {
    const totalGoals = goals.length;
    const totalBudgets = budgets.length;
    const totalLiabilities = liabilities.length;
    const totalBills = bills.length;
    
    const activeGoals = goals.filter(goal => goal.status === 'active').length;
    const completedGoals = goals.filter(goal => goal.status === 'completed').length;
    
    const totalGoalValue = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    const totalGoalTarget = goals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
    
    const totalBudgetAmount = budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
    const totalBudgetSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    
    const totalLiabilityAmount = liabilities.reduce((sum, liability) => sum + (liability.remainingAmount || 0), 0);
    const totalBillAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    
    return {
      totalGoals,
      totalBudgets,
      totalLiabilities,
      totalBills,
      activeGoals,
      completedGoals,
      totalGoalValue,
      totalGoalTarget,
      totalBudgetAmount,
      totalBudgetSpent,
      totalLiabilityAmount,
      totalBillAmount
    };
  }, [goals, budgets, liabilities, bills]);

  // Activity cards data
  const activityCards = [
    {
      id: 'goals',
      title: 'Goals',
      icon: Target,
      color: 'from-blue-500 to-purple-600',
      stats: {
        total: activityStats.totalGoals,
        active: activityStats.activeGoals,
        completed: activityStats.completedGoals,
        value: activityStats.totalGoalValue,
        target: activityStats.totalGoalTarget
      },
      description: 'Track your financial goals and savings targets',
      action: () => navigate('/goals'),
      actionText: 'View Goals'
    },
    {
      id: 'budgets',
      title: 'Budgets',
      icon: PieChart,
      color: 'from-green-500 to-teal-600',
      stats: {
        total: activityStats.totalBudgets,
        spent: activityStats.totalBudgetSpent,
        remaining: activityStats.totalBudgetAmount - activityStats.totalBudgetSpent,
        amount: activityStats.totalBudgetAmount
      },
      description: 'Manage your spending limits and budget categories',
      action: () => navigate('/budgets'),
      actionText: 'View Budgets'
    },
    {
      id: 'liabilities',
      title: 'Liabilities',
      icon: CreditCard,
      color: 'from-red-500 to-pink-600',
      stats: {
        total: activityStats.totalLiabilities,
        amount: activityStats.totalLiabilityAmount
      },
      description: 'Track your debts, loans, and financial obligations',
      action: () => navigate('/liabilities'),
      actionText: 'View Liabilities'
    },
    {
      id: 'bills',
      title: 'Bills',
      icon: FileText,
      color: 'from-orange-500 to-yellow-600',
      stats: {
        total: activityStats.totalBills,
        amount: activityStats.totalBillAmount
      },
      description: 'Manage your recurring bills and payments',
      action: () => navigate('/bills'),
      actionText: 'View Bills'
    }
  ];

  const handleSwipeLeft = () => {
    setCurrentCardIndex(prev => 
      prev < activityCards.length - 1 ? prev + 1 : 0
    );
  };

  const handleSwipeRight = () => {
    setCurrentCardIndex(prev => 
      prev > 0 ? prev - 1 : activityCards.length - 1
    );
  };

  const currentCard = activityCards[currentCardIndex];

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/overview')}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
            </button>
            <div>
              <h1 className="text-2xl font-heading text-white">Activities</h1>
              <p className="text-sm text-gray-400">Manage your financial activities</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              {showBalances ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Cards Container */}
      <div className="px-4 mb-8">
        <div className="relative">
          {/* Swipeable Card */}
          <div className="bg-gradient-to-br rounded-2xl p-6 border border-white/10 overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${currentCard.color} opacity-10`} />
            
            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${currentCard.color}`}>
                    <currentCard.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading text-white">{currentCard.title}</h2>
                    <p className="text-sm text-gray-300">{currentCard.description}</p>
                  </div>
                </div>
                <button
                  onClick={currentCard.action}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ 
                    backgroundColor: 'var(--primary)',
                    color: 'white'
                  }}
                >
                  {currentCard.actionText}
                </button>
              </div>

              {/* Card Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {currentCard.id === 'goals' && (
                  <>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-bold text-white">{currentCard.stats.total}</div>
                      <div className="text-xs text-gray-400">Total Goals</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-bold text-white">{currentCard.stats.active}</div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-bold text-white">{currentCard.stats.completed}</div>
                      <div className="text-xs text-gray-400">Completed</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-lg font-bold text-white">
                        {showBalances ? formatCurrency(currentCard.stats.value) : '••••••'}
                      </div>
                      <div className="text-xs text-gray-400">Saved</div>
                    </div>
                  </>
                )}
                
                {currentCard.id === 'budgets' && (
                  <>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-bold text-white">{currentCard.stats.total}</div>
                      <div className="text-xs text-gray-400">Total Budgets</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-lg font-bold text-white">
                        {showBalances ? formatCurrency(currentCard.stats.spent) : '••••••'}
                      </div>
                      <div className="text-xs text-gray-400">Spent</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-lg font-bold text-white">
                        {showBalances ? formatCurrency(currentCard.stats.remaining) : '••••••'}
                      </div>
                      <div className="text-xs text-gray-400">Remaining</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-lg font-bold text-white">
                        {showBalances ? formatCurrency(currentCard.stats.amount) : '••••••'}
                      </div>
                      <div className="text-xs text-gray-400">Total Budget</div>
                    </div>
                  </>
                )}
                
                {currentCard.id === 'liabilities' && (
                  <>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-bold text-white">{currentCard.stats.total}</div>
                      <div className="text-xs text-gray-400">Total Liabilities</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-lg font-bold text-white">
                        {showBalances ? formatCurrency(currentCard.stats.amount) : '••••••'}
                      </div>
                      <div className="text-xs text-gray-400">Total Debt</div>
                    </div>
                  </>
                )}
                
                {currentCard.id === 'bills' && (
                  <>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-bold text-white">{currentCard.stats.total}</div>
                      <div className="text-xs text-gray-400">Total Bills</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <div className="text-lg font-bold text-white">
                        {showBalances ? formatCurrency(currentCard.stats.amount) : '••••••'}
                      </div>
                      <div className="text-xs text-gray-4">Monthly Bills</div>
                    </div>
                  </>
                )}
              </div>

              {/* Progress Bar for Goals */}
              {currentCard.id === 'goals' && currentCard.stats.target > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{((currentCard.stats.value / currentCard.stats.target) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${Math.min((currentCard.stats.value / currentCard.stats.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handleSwipeRight}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
            </button>
            
            {/* Card Indicators */}
            <div className="flex space-x-2">
              {activityCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCardIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentCardIndex ? 'bg-white' : 'bg-gray-500'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleSwipeLeft}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
              }}
            >
              <ChevronRight size={20} style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <h3 className="text-lg font-heading text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/goals')}
            className="p-4 rounded-xl border border-white/20 hover:border-white/40 transition-colors text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Target size={20} className="text-blue-400" />
              <span className="font-medium text-white">Add Goal</span>
            </div>
            <p className="text-sm text-gray-400">Create a new financial goal</p>
          </button>
          
          <button
            onClick={() => navigate('/budgets')}
            className="p-4 rounded-xl border border-white/20 hover:border-white/40 transition-colors text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <PieChart size={20} className="text-green-400" />
              <span className="font-medium text-white">Add Budget</span>
            </div>
            <p className="text-sm text-gray-400">Set spending limits</p>
          </button>
          
          <button
            onClick={() => navigate('/liabilities')}
            className="p-4 rounded-xl border border-white/20 hover:border-white/40 transition-colors text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard size={20} className="text-red-400" />
              <span className="font-medium text-white">Add Liability</span>
            </div>
            <p className="text-sm text-gray-400">Track your debts</p>
          </button>
          
          <button
            onClick={() => navigate('/bills')}
            className="p-4 rounded-xl border border-white/20 hover:border-white/40 transition-colors text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <FileText size={20} className="text-orange-400" />
              <span className="font-medium text-white">Add Bill</span>
            </div>
            <p className="text-sm text-gray-400">Manage recurring bills</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Activities;
