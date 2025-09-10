import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MoreVertical, 
  Target, 
  Plus,
  Edit,
  Pause,
  Play,
  CheckCircle
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format, isBefore, differenceInDays } from 'date-fns';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

const GoalDetail: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { 
    goals, 
    transactions, 
    accounts,
    updateGoal,
    addTransaction,
    getGoalTransactions
  } = useFinance();
  const { formatCurrency } = useInternationalization();
  
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  // Find the current goal
  const goal = useMemo(() => {
    return goals.find(g => g.id === goalId);
  }, [goals, goalId]);

  // Get transactions related to this goal
  const goalTransactions = useMemo(() => {
    if (!goal) return [];
    return getGoalTransactions(goal.id);
  }, [goal, getGoalTransactions]);

  // Calculate goal analytics
  const goalAnalytics = useMemo(() => {
    if (!goal) return null;

    const totalContributions = goalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
    const daysRemaining = Math.max(differenceInDays(new Date(goal.targetDate), new Date()), 0);
    
    const dailyTarget = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;
    const weeklyTarget = dailyTarget * 7;
    const monthlyTarget = dailyTarget * 30;

    const isOverdue = isBefore(new Date(goal.targetDate), new Date()) && progressPercentage < 100;
    const isCompleted = progressPercentage >= 100;
    const isOnTrack = daysRemaining > 0 && dailyTarget <= (goal.currentAmount / Math.max(differenceInDays(new Date(), new Date(goal.createdAt)), 1));

    return {
      totalContributions,
      progressPercentage,
      remainingAmount,
      daysRemaining,
      dailyTarget,
      weeklyTarget,
      monthlyTarget,
      isOverdue,
      isCompleted,
      isOnTrack
    };
  }, [goal, goalTransactions]);

  // Get account info for account-specific goals
  // const account = useMemo(() => {
  //   if (!goal || goal.goalType !== 'account_specific' || !goal.accountId) return null;
  //   return accounts.find(a => a.id === goal.accountId);
  // }, [goal, accounts]);

  const handleAddContribution = async () => {
    if (!goal || !contributionAmount) return;

    try {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) return;

      // Add transaction
      await addTransaction({
        type: 'income',
        amount: amount,
        description: `Contribution to ${goal.title}`,
        category: 'Goal Contribution',
        date: new Date(),
        accountId: goal.accountId || accounts[0]?.id,
        affectsBalance: true,
        status: 'completed',
        // linkedGoalId: goal.id
      });

      // Update goal
      await updateGoal(goal.id, {
        currentAmount: goal.currentAmount + amount
      });

      setContributionAmount('');
      setShowAddContribution(false);
    } catch (error) {
      console.error('Error adding contribution:', error);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'completed' | 'cancelled') => {
    if (!goal) return;
    try {
      await updateGoal(goal.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <h2 className="text-xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            Goal not found
          </h2>
          <Button onClick={() => navigate('/goals')}>
            Back to Goals
          </Button>
        </div>
      </div>
    );
  }

  if (!goalAnalytics) return null;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="relative">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/goals')}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                  {goal.title}
                </h1>
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  {(goal.goalType || 'general_savings').replace('_', ' ').toUpperCase()} • {goal.category}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEditGoal(true)}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <Edit size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <button
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <MoreVertical size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          {/* Goal Progress Hero Card */}
          <div 
            className="relative overflow-hidden rounded-3xl p-8 mb-6"
            style={{
              background: goalAnalytics.isCompleted 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : goalAnalytics.isOverdue
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, var(--primary) 0%, #2d5016 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div className="text-center text-white">
              <div className="flex items-center justify-center mb-4">
                <LuxuryCategoryIcon category={goal.category} size={32} variant="luxury" />
              </div>
              <h2 className="text-lg font-body mb-2 opacity-90">Goal Progress</h2>
              <p className="text-4xl font-serif font-bold mb-2">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </p>
              <div className="w-full bg-white/20 rounded-full h-3 mb-4">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-500"
                  style={{ width: `${goalAnalytics.progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm font-medium opacity-90">
                {goalAnalytics.progressPercentage.toFixed(1)}% Complete
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Goal Status and Actions */}
        <div 
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                goal.status === 'active' ? 'bg-green-500' :
                goal.status === 'paused' ? 'bg-yellow-500' :
                goal.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </span>
            </div>
            <div className="flex space-x-2">
              {goal.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStatusChange('paused')}
                    className="p-2 rounded-lg transition-colors hover:bg-yellow-50"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Pause size={16} />
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="p-2 rounded-lg transition-colors hover:bg-green-50"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <CheckCircle size={16} />
                  </button>
                </>
              )}
              {goal.status === 'paused' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className="p-2 rounded-lg transition-colors hover:bg-green-50"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Play size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Remaining</p>
              <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(goalAnalytics.remainingAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Days Left</p>
              <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                {goalAnalytics.daysRemaining}
              </p>
            </div>
          </div>
        </div>

        {/* Goal Analytics */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Analytics
          </h3>
          
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            {/* Progress Chart */}
            <div className="h-24 flex items-end justify-between space-x-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((week) => {
                const weekContributions = goalTransactions
                  .filter(t => {
                    const transactionDate = new Date(t.date);
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - (7 - week) * 7);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return transactionDate >= weekStart && transactionDate < weekEnd;
                  })
                  .reduce((sum, t) => sum + (t.amount || 0), 0);
                
                const maxContribution = Math.max(...goalTransactions.map(t => t.amount || 0), 1);
                const height = (weekContributions / maxContribution) * 60;
                
                return (
                  <div key={week} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full rounded-t"
                      style={{ 
                        height: `${height}px`,
                        backgroundColor: 'var(--primary)',
                        opacity: 0.7
                      }}
                    ></div>
                    <span className="text-xs font-body mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      W{week}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Daily Target</p>
                <p className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(goalAnalytics.dailyTarget)}
                </p>
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Weekly Target</p>
                <p className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(goalAnalytics.weeklyTarget)}
                </p>
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Monthly Target</p>
                <p className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(goalAnalytics.monthlyTarget)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowAddContribution(true)}
              className="flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Plus size={20} className="text-white" />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>Add Contribution</span>
            </button>

            <button
              onClick={() => setShowEditGoal(true)}
              className="flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Edit size={20} className="text-white" />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>Edit Goal</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent Contributions
          </h3>
          <div className="space-y-3">
            {goalTransactions.length === 0 ? (
              <div 
                className="p-8 text-center rounded-2xl"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--background)' }}>
                  <Target size={24} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                  No contributions yet
                </h3>
                <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Start contributing to your goal to see progress
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowAddContribution(true)}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Add Contribution</span>
                </Button>
              </div>
            ) : (
              goalTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <LuxuryCategoryIcon category={transaction.category} size={16} variant="minimal" />
                      <div>
                        <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                          {transaction.description}
                        </h4>
                        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-numbers text-sm font-bold text-green-600">
                        +{formatCurrency(transaction.amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Contribution Modal */}
      <Modal
        isOpen={showAddContribution}
        onClose={() => setShowAddContribution(false)}
        title="Add Contribution"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => setShowAddContribution(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContribution}
              className="flex-1"
              disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
            >
              Add Contribution
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalDetail;
