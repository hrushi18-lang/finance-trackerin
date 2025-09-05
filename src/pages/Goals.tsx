import React, { useState } from 'react';
import { Target, Calendar, Plus, ArrowUpDown, TrendingUp, Edit3, Trash2, AlertCircle, CheckCircle, PiggyBank, TrendingDown, Eye } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { calculatePercentage, sanitizeFinancialData } from '../utils/validation';
import { Modal } from '../components/common/Modal';
import { GoalForm } from '../components/forms/GoalForm';
import { GoalTransactionForm } from '../components/forms/GoalTransactionForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { Goal } from '../types';
import { ProgressBar } from '../components/analytics/ProgressBar';

export const Goals: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { goals, addGoal, updateGoal, deleteGoal, addTransaction, accounts, transactions, fundGoalFromAccount, contributeToGoal, withdrawGoalToAccount } = useFinance();
  const { formatCurrency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'upcoming'>('active');

  // Find emergency fund goal
  const emergencyFund = goals.find(g => g.category.toLowerCase() === 'emergency');

  // Enhanced goal categorization
  const categorizedGoals = {
    active: goals.filter(goal => {
      const progress = calculatePercentage(goal.currentAmount, goal.targetAmount);
      const daysUntilTarget = differenceInDays(new Date(goal.targetDate), new Date());
      return progress < 100 && daysUntilTarget > 0;
    }),
    completed: goals.filter(goal => {
      const progress = calculatePercentage(goal.currentAmount, goal.targetAmount);
      return progress >= 100;
    }),
    upcoming: goals.filter(goal => {
      const daysUntilTarget = differenceInDays(new Date(goal.targetDate), new Date());
      return daysUntilTarget <= 0 && goal.currentAmount < goal.targetAmount;
    })
  };

  // Calculate goal statistics
  const goalStats = {
    totalGoals: goals.length,
    activeGoals: categorizedGoals.active.length,
    completedGoals: categorizedGoals.completed.length,
    totalTargetAmount: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
    totalCurrentAmount: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    overallProgress: goals.length > 0 ? 
      (goals.reduce((sum, goal) => sum + goal.currentAmount, 0) / 
       goals.reduce((sum, goal) => sum + goal.targetAmount, 0)) * 100 : 0
  };

  // Get recent goal-related transactions
  const recentGoalTransactions = transactions
    .filter(t => t.category === 'Savings' || t.category === 'Goal Withdrawal' || t.category === 'Internal Transfer')
    .slice(0, 5);

  const handleAddGoal = async (goal: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields to prevent NaN
      const sanitizedGoal = sanitizeFinancialData(goal, ['targetAmount', 'currentAmount']);
      
      await addGoal(sanitizedGoal);
      setShowModal(false);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    } catch (error: any) {
      console.error('Error adding goal:', error);
      setError(error.message || 'Failed to add goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields to prevent NaN
      const sanitizedGoal = sanitizeFinancialData(goal, ['targetAmount', 'currentAmount']);
      
      if (editingGoal) {
        await updateGoal(editingGoal.id, sanitizedGoal);
        setEditingGoal(null);
        setShowEditModal(false);
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['goals'] });
      }
    } catch (error: any) {
      console.error('Error updating goal:', error);
      setError(error.message || 'Failed to update goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGoal = async () => {
    try {
      setIsSubmitting(true);
      
      if (goalToDelete) {
        await deleteGoal(goalToDelete);
        setGoalToDelete(null);
        setShowDeleteConfirm(false);
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['goals'] });
      }
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      setError(error.message || 'Failed to delete goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const goal = goals.find(g => g.id === selectedGoalId);
      if (!goal) return;

      const { amount, type, source, description, deductFromBalance, targetAccountId } = data;
      const numericAmount = Number(amount) || 0;

      if (type === 'add') {
        // Add money to goal
        const currentAmount = Number(goal.currentAmount) || 0;
        const targetAmount = Number(goal.targetAmount) || 0;
        const newAmount = Math.min(currentAmount + numericAmount, targetAmount);

        await updateGoal(selectedGoalId!, {
          currentAmount: newAmount
        });

        if (source === 'emergency_fund' && emergencyFund) {
          // Deduct from emergency fund
          const emergencyCurrentAmount = Number(emergencyFund.currentAmount) || 0;
          await updateGoal(emergencyFund.id, {
            currentAmount: Math.max(0, emergencyCurrentAmount - numericAmount)
          });
          
          // No vault flow here; keep internal transfer semantics
          if (targetAccountId) {
            await addTransaction({
              type: 'expense',
              amount: numericAmount,
              category: 'Internal Transfer',
              description: `${description} (from Emergency Fund to ${goal.title})`,
              date: new Date(),
              accountId: targetAccountId,
              affectsBalance: true,
              status: 'completed'
            });
          }
        } else if (deductFromBalance) {
          // Move money from selected account into Goals Vault and update allocation
          if (targetAccountId) {
            await fundGoalFromAccount(targetAccountId, goal.id, numericAmount, description);
          }
        }
        // If deductFromBalance is false, we don't record any transaction
        // This is useful for tracking gifts, bonuses, or manual transfers
      } else {
        // Withdraw money from goal
        const currentAmount = Number(goal.currentAmount) || 0;
        const newAmount = Math.max(0, currentAmount - numericAmount);

        await updateGoal(selectedGoalId!, {
          currentAmount: newAmount
        });

        if (source === 'emergency_fund' && emergencyFund) {
          // Add to emergency fund
          const emergencyCurrentAmount = Number(emergencyFund.currentAmount) || 0;
          await updateGoal(emergencyFund.id, {
            currentAmount: emergencyCurrentAmount + numericAmount
          });
          
          if (targetAccountId) {
            await addTransaction({
              type: 'income',
              amount: numericAmount,
              category: 'Internal Transfer',
              description: `${description} (from ${goal.title} to Emergency Fund)`,
              date: new Date(),
              accountId: targetAccountId,
              affectsBalance: true,
              status: 'completed'
            });
          }
        } else {
          // Move from Goals Vault back to selected account
          if (targetAccountId) {
            await withdrawGoalToAccount(targetAccountId, goal.id, numericAmount, description);
          }
        }
      }

      setShowTransactionModal(false);
      setSelectedGoalId(null);
    } catch (error: any) {
      console.error('Error processing goal transaction:', error);
      setError(error.message || 'Failed to process transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGoalStatus = (goal: Goal) => {
    const progress = calculatePercentage(goal.currentAmount, goal.targetAmount);
    const daysUntilTarget = differenceInDays(new Date(goal.targetDate), new Date());
    
    if (progress >= 100) return 'completed';
    if (daysUntilTarget < 0) return 'overdue';
    if (daysUntilTarget <= 7) return 'urgent';
    if (daysUntilTarget <= 30) return 'upcoming';
    return 'active';
  };

  // color helper removed (unused)

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'overdue': return <AlertCircle size={16} className="text-red-500" />;
      case 'urgent': return <AlertCircle size={16} className="text-orange-500" />;
      case 'upcoming': return <Calendar size={16} className="text-yellow-500" />;
      default: return <Target size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading">Financial Goals</h1>
          <button
            onClick={() => navigate('/goals/create')}
            className="btn-primary flex items-center space-x-2 px-4 py-2"
          >
            <Plus size={16} />
            <span>Add Goal</span>
          </button>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Goal Statistics */}
        <div className="card-neumorphic p-4 slide-in-up">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Total Goals</p>
              <p className="text-2xl font-numbers">{goalStats.totalGoals}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Active</p>
              <p className="text-2xl font-numbers">{goalStats.activeGoals}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Completed</p>
              <p className="text-2xl font-numbers">{goalStats.completedGoals}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Progress</p>
              <p className="text-2xl font-numbers">{Math.round(goalStats.overallProgress)}%</p>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
              <span>Overall Progress</span>
              <span>{formatCurrency(goalStats.totalCurrentAmount)} / {formatCurrency(goalStats.totalTargetAmount)}</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-light)' }}>
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(goalStats.overallProgress, 100)}%`,
                  backgroundColor: 'var(--primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
          {Object.entries({
            active: { label: 'Active', count: categorizedGoals.active.length },
            upcoming: { label: 'Upcoming', count: categorizedGoals.upcoming.length },
            completed: { label: 'Completed', count: categorizedGoals.completed.length }
          }).map(([key, { label, count }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? 'text-white transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:scale-105'
              }`}
              style={{
                backgroundColor: activeTab === key ? 'var(--primary)' : 'transparent'
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {categorizedGoals[activeTab].map((goal) => {
            const progress = calculatePercentage(goal.currentAmount, goal.targetAmount);
            const status = getGoalStatus(goal);
            const daysUntilTarget = differenceInDays(new Date(goal.targetDate), new Date());
            
            return (
              <div key={goal.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={16} className="text-blue-500" />
                      <h3 className="text-lg font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>{goal.title}</h3>
                      {getGoalStatusIcon(status)}
                    </div>
                    <p className="text-sm font-body mb-2">{goal.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-body" style={{ color: 'var(--text-tertiary)' }}>Category: {goal.category}</span>
                      <span className="font-body" style={{ color: 'var(--text-tertiary)' }}>
                        Due: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                      </span>
                      {daysUntilTarget > 0 && (
                        <span className="font-body" style={{ color: 'var(--text-tertiary)' }}>
                          {daysUntilTarget} days left
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/goals/${goal.id}`)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setShowTransactionModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Add/Withdraw Money"
                    >
                      <ArrowUpDown size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setShowEditModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Goal"
                    >
                      <Edit3 size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mb-3">
                  <ProgressBar
                    current={goal.currentAmount}
                    target={goal.targetAmount}
                    size="md"
                    showPercentage={true}
                    showValues={true}
                  />
                </div>

                {/* Goal Completion Actions */}
                {progress >= 100 && (
                  <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Goal Completed! 🎉</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Withdraw all money to default account
                          const defaultAccount = accounts.find(acc => acc.type === 'savings') || accounts[0];
                          if (defaultAccount) {
                            withdrawGoalToAccount(goal.id, goal.currentAmount, defaultAccount.id, 'Goal completed - withdrawing all funds');
                          }
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        Withdraw All
                      </button>
                      <button
                        onClick={() => {
                          // Archive goal
                          updateGoal(goal.id, { ...goal, isArchived: true });
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => {
                          // Restart goal
                          updateGoal(goal.id, { ...goal, currentAmount: 0, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) });
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        Restart
                      </button>
                    </div>
                  </div>
                )}

                {/* Monthly Savings Target */}
                {daysUntilTarget > 0 && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <PiggyBank size={16} className="text-blue-500" />
                      <span className="text-sm font-medium">Monthly Savings Target</span>
                    </div>
                    <p className="text-lg font-numbers font-bold">
                      {formatCurrency((goal.targetAmount - goal.currentAmount) / Math.max(1, Math.ceil(daysUntilTarget / 30)))}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>per month to reach your goal</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent Goal Transactions */}
        {recentGoalTransactions.length > 0 && (
          <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
            <h3 className="text-lg font-heading font-semibold text-white mb-4">Recent Goal Activity</h3>
            <div className="space-y-3">
              {recentGoalTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-forest-800/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'income' ? (
                      <TrendingUp size={16} className="text-green-400" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{transaction.description}</p>
                      <p className="text-xs text-forest-400">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-numbers font-bold ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Goal Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg"
          >
            <Plus size={24} />
          </Button>
        </div>
      </div>

      {/* Add Goal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Goal"
      >
        <GoalForm
          onSubmit={handleAddGoal}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Goal"
      >
        {editingGoal && (
          <GoalForm
            onSubmit={async (data) => handleEditGoal(data as any)}
            onCancel={() => setShowEditModal(false)}
            initialData={{
              title: editingGoal.title,
              description: editingGoal.description,
              targetAmount: editingGoal.targetAmount,
              currentAmount: editingGoal.currentAmount,
              targetDate: editingGoal.targetDate.toISOString().split('T')[0],
              category: editingGoal.category,
              accountId: editingGoal.accountId
            }}
          />
        )}
      </Modal>

      {/* Goal Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title="Goal Transaction"
      >
        {selectedGoalId && (
          <GoalTransactionForm
            onSubmit={handleGoalTransaction}
            onCancel={() => setShowTransactionModal(false)}
            goal={goals.find(g => g.id === selectedGoalId)!}
            emergencyFundBalance={0}
            accounts={accounts}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Goal"
      >
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Are you sure?</h3>
          <p className="text-forest-300 mb-6">
            This action cannot be undone. All progress and transaction history for this goal will be lost.
          </p>
          <div className="flex space-x-4">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteGoal}
              className="flex-1 bg-error-500 hover:bg-error-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Goal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 left-6 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};