import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, Calendar, DollarSign, PieChart, BarChart3, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useTheme } from '../contexts/ThemeContext';

import { ProgressBar } from '../components/analytics/ProgressBar';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { TrendChart } from '../components/analytics/TrendChart';
import Modal from '../components/common/Modal';
import { GoalForm } from '../components/forms/GoalForm';
import { MockTransactionForm } from '../components/forms/MockTransactionForm';

interface GoalDetailProps {}

const GoalDetail: React.FC<GoalDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { currency, formatCurrency, formatDate } = useInternationalization();
  const { 
    goals, 
    accounts, 
    transactions, 
    updateGoal, 
    deleteGoal, 
    addTransaction,
    getGoalTransactions,
    getAccountContributions
  } = useFinance();

  const [goal, setGoal] = useState<any>(null);
  const [goalTransactions, setGoalTransactions] = useState<any[]>([]);
  const [accountContributions, setAccountContributions] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    if (id && goals) {
      const foundGoal = goals.find(g => g.id === id);
      if (foundGoal) {
        setGoal(foundGoal);
        setSelectedAccount(foundGoal.account_id || '');
        
        // Get goal-specific transactions
        const goalTrans = getGoalTransactions(id);
        setGoalTransactions(goalTrans);
        
        // Get account contributions
        const contributions = getAccountContributions(id, 'goal');
        setAccountContributions(contributions);
      }
    }
  }, [id, goals, getGoalTransactions, getAccountContributions]);

  const handleEditGoal = (updatedGoal: any) => {
    updateGoal(updatedGoal);
    setGoal(updatedGoal);
    setIsEditModalOpen(false);
  };

  const handleDeleteGoal = () => {
    if (goal && window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(goal.id);
      navigate('/goals');
    }
  };

  const handleAddTransaction = (transaction: any) => {
    const newTransaction = {
      ...transaction,
      goal_id: goal?.id,
      account_id: selectedAccount,
      type: 'contribution'
    };
    addTransaction(newTransaction);
    setIsTransactionModalOpen(false);
    
    // Refresh data
    const goalTrans = getGoalTransactions(goal?.id);
    setGoalTransactions(goalTrans);
  };

  if (!goal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 dark:from-forest-900 dark:to-forest-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-forest-300">Loading goal details...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (goal.current_amount / goal.target_amount) * 100;
  const remainingAmount = goal.target_amount - goal.current_amount;
  const daysRemaining = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Calculate analytics data
  const monthlyContributions = goalTransactions.reduce((acc, trans) => {
    const month = new Date(trans.date).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  const accountBreakdown = accountContributions.reduce((acc, contrib) => {
    acc[contrib.account_name] = (acc[contrib.account_name] || 0) + contrib.amount;
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
                onClick={() => navigate('/goals')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-forest-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-forest-300" />
              </button>
              <div>
                <h1 className="text-xl font-heading text-gray-900 dark:text-forest-100">
                  {goal.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-forest-400">
                  Goal Details & Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-olive-600 hover:bg-olive-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Contribution</span>
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-forest-700 transition-colors"
              >
                <Edit className="h-5 w-5 text-gray-600 dark:text-forest-300" />
              </button>
              <button
                onClick={handleDeleteGoal}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Goal Card */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Goal Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-olive-100 dark:bg-forest-700 rounded-xl">
                  <Target className="h-8 w-8 text-olive-600 dark:text-forest-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading text-gray-900 dark:text-forest-100">
                    {goal.name}
                  </h2>
                  <p className="text-gray-600 dark:text-forest-400">
                    {goal.description}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                    Progress
                  </span>
                  <span className="text-sm font-numbers text-gray-900 dark:text-forest-100">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <ProgressBar 
                  value={progressPercentage} 
                  max={100}
                  className="h-3"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-forest-400">
                  <span>{formatCurrency(goal.current_amount, currency)}</span>
                  <span>{formatCurrency(goal.target_amount, currency)}</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-forest-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-olive-600 dark:text-forest-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                      Remaining
                    </span>
                  </div>
                  <p className="text-xl font-numbers text-gray-900 dark:text-forest-100">
                    {formatCurrency(remainingAmount, currency)}
                  </p>
                </div>
                {daysRemaining && (
                  <div className="bg-gray-50 dark:bg-forest-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-olive-600 dark:text-forest-300" />
                      <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                        Days Left
                      </span>
                    </div>
                    <p className="text-xl font-numbers text-gray-900 dark:text-forest-100">
                      {daysRemaining}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Goal Stats */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-olive-50 to-olive-100 dark:from-forest-700 dark:to-forest-600 rounded-xl p-6">
                <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100 mb-4">
                  Goal Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Date Added</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatDate(goal.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Target Date</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {goal.target_date ? formatDate(goal.target_date) : 'No deadline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Contributions</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {goalTransactions.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Total Contributed</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(goal.current_amount, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Contributions Ring Chart */}
              {Object.keys(accountBreakdown).length > 0 && (
                <div className="bg-white dark:bg-forest-800 rounded-xl p-6 border border-gray-200 dark:border-forest-700">
                  <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100 mb-4">
                    Account Contributions
                  </h3>
                  <RingChart
                    data={Object.entries(accountBreakdown).map(([name, amount]) => ({
                      name,
                      value: amount,
                      color: `hsl(${Math.random() * 360}, 70%, 50%)`
                    }))}
                    size={120}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Contributions */}
          <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-6 w-6 text-olive-600 dark:text-forest-300" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Monthly Contributions
              </h3>
            </div>
            <BarChart
              data={Object.entries(monthlyContributions).map(([month, amount]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                value: amount
              }))}
              height={200}
            />
          </div>

          {/* Progress Trend */}
          <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-6 w-6 text-olive-600 dark:text-forest-300" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Progress Trend
              </h3>
            </div>
            <TrendChart
              data={goalTransactions.map((trans, index) => ({
                date: trans.date,
                value: goalTransactions.slice(0, index + 1).reduce((sum, t) => sum + t.amount, 0)
              }))}
              height={200}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-olive-600 dark:text-forest-300" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Recent Contributions
              </h3>
            </div>
            <span className="text-sm text-gray-500 dark:text-forest-400">
              {goalTransactions.length} transactions
            </span>
          </div>

          {goalTransactions.length > 0 ? (
            <div className="space-y-3">
              {goalTransactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-forest-700/50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-forest-100">
                        Contribution
                      </p>
                      <p className="text-sm text-gray-500 dark:text-forest-400">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers text-green-600 dark:text-green-400">
                      +{formatCurrency(transaction.amount, currency)}
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
                <Target className="h-8 w-8 text-gray-400 dark:text-forest-500" />
              </div>
              <p className="text-gray-500 dark:text-forest-400 mb-4">
                No contributions yet
              </p>
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="px-4 py-2 bg-olive-600 hover:bg-olive-700 text-white rounded-lg transition-colors"
              >
                Add First Contribution
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Goal Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Goal"
        size="lg"
      >
        <GoalForm
          initialData={goal}
          onSubmit={handleEditGoal}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Add Contribution"
        size="md"
      >
        <MockTransactionForm
          onSubmit={handleAddTransaction}
          onCancel={() => setIsTransactionModalOpen(false)}
          defaultAccount={selectedAccount}
          transactionType="contribution"
        />
      </Modal>
    </div>
  );
};

export default GoalDetail;