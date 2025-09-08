import React, { useState } from 'react';
import { X, Download, ArrowUpRight, Edit3, Archive, Trash2, Clock } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { Button } from '../common/Button';

interface GoalCompletionModalProps {
  goal: {
    id: string;
    title: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    completionAction: string;
  };
  onClose: () => void;
}

export const GoalCompletionModal: React.FC<GoalCompletionModalProps> = ({ goal, onClose }) => {
  const { 
    handleGoalCompletion, 
    handleGoalWithdrawal, 
    extendGoal, 
    customizeGoal, 
    archiveGoal, 
    deleteGoalSoft,
    accounts 
  } = useFinance();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [showCustomizeForm, setShowCustomizeForm] = useState(false);
  
  // Withdrawal form state
  const [withdrawalAmount, setWithdrawalAmount] = useState(goal.currentAmount);
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  
  // Extend form state
  const [newTargetAmount, setNewTargetAmount] = useState(goal.targetAmount * 1.5);
  const [extensionReason, setExtensionReason] = useState('');
  
  // Customize form state
  const [customTitle, setCustomTitle] = useState(goal.title);
  const [customDescription, setCustomDescription] = useState(goal.description);
  const [customTargetAmount, setCustomTargetAmount] = useState(goal.targetAmount);
  const [customizationReason, setCustomizationReason] = useState('');

  const handleWithdraw = async () => {
    if (!destinationAccountId) {
      setError('Please select a destination account');
      return;
    }
    
    if (withdrawalAmount <= 0 || withdrawalAmount > goal.currentAmount) {
      setError('Invalid withdrawal amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await handleGoalWithdrawal(
        goal.id,
        withdrawalAmount,
        destinationAccountId,
        withdrawalReason || undefined,
        withdrawalNotes || undefined
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw from goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtend = async () => {
    if (newTargetAmount <= goal.targetAmount) {
      setError('New target amount must be greater than current target');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await extendGoal(goal.id, newTargetAmount, extensionReason || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomize = async () => {
    if (customTargetAmount <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await customizeGoal(
        goal.id,
        customTargetAmount,
        customTitle !== goal.title ? customTitle : undefined,
        customDescription !== goal.description ? customDescription : undefined,
        customizationReason || undefined
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to customize goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await archiveGoal(goal.id, 'Goal completed and archived');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal? The goal will be removed from your active goals, but all transaction history and progress data will be preserved for analytics.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteGoalSoft(goal.id, 'Goal completed and deleted');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setIsLoading(false);
    }
  };

  const availableAccounts = accounts.filter(acc => acc.type !== 'goals_vault' && acc.isVisible);

  if (goal.completionAction !== 'waiting') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Goal Completed
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This goal has already been processed. Status: {goal.completionAction}
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Goal Completed! 🎉
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {goal.title}
          </h4>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You've reached your target of ${goal.targetAmount.toLocaleString()}!
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              Current amount: <span className="font-semibold">${goal.currentAmount.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!showWithdrawalForm && !showExtendForm && !showCustomizeForm && (
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              What would you like to do?
            </h5>
            
            <Button
              onClick={() => setShowWithdrawalForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Withdraw Amount
            </Button>
            
            <Button
              onClick={() => setShowExtendForm(true)}
              variant="secondary"
              className="w-full flex items-center justify-center"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Extend Goal
            </Button>
            
            <Button
              onClick={() => setShowCustomizeForm(true)}
              variant="secondary"
              className="w-full flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Customize Goal
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleArchive}
                variant="secondary"
                className="flex-1 flex items-center justify-center"
                disabled={isLoading}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
              
              <Button
                onClick={handleDelete}
                variant="secondary"
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 flex items-center justify-center"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        {showWithdrawalForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-900 dark:text-white">Withdraw Amount</h5>
              <button
                onClick={() => setShowWithdrawalForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount to Withdraw
              </label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                max={goal.currentAmount}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Destination Account
              </label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select account</option>
                {availableAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} (${account.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="e.g., Emergency fund, Investment"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={withdrawalNotes}
                onChange={(e) => setWithdrawalNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowWithdrawalForm(false)}
                variant="secondary"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Withdrawing...' : 'Withdraw'}
              </Button>
            </div>
          </div>
        )}

        {/* Extend Form */}
        {showExtendForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-900 dark:text-white">Extend Goal</h5>
              <button
                onClick={() => setShowExtendForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Target Amount
              </label>
              <input
                type="number"
                value={newTargetAmount}
                onChange={(e) => setNewTargetAmount(Number(e.target.value))}
                min={goal.targetAmount + 1}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="e.g., Want to save more, Inflation adjustment"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowExtendForm(false)}
                variant="secondary"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtend}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Extending...' : 'Extend Goal'}
              </Button>
            </div>
          </div>
        )}

        {/* Customize Form */}
        {showCustomizeForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-900 dark:text-white">Customize Goal</h5>
              <button
                onClick={() => setShowCustomizeForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Amount
              </label>
              <input
                type="number"
                value={customTargetAmount}
                onChange={(e) => setCustomTargetAmount(Number(e.target.value))}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={customizationReason}
                onChange={(e) => setCustomizationReason(e.target.value)}
                placeholder="e.g., Changed priorities, New circumstances"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowCustomizeForm(false)}
                variant="secondary"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomize}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Customizing...' : 'Customize Goal'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
