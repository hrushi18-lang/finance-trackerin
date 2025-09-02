import React, { useState } from 'react';
import { PieChart, Calculator, TrendingUp, AlertTriangle, Plus, Edit3, Trash2, AlertCircle, Target } from 'lucide-react';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { BudgetForm } from '../components/forms/BudgetForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Budget } from '../types';

export const Budgets: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, transactions } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddBudget = async (budget: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addBudget(budget);
      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding budget:', error);
      setError(error.message || 'Failed to add budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBudget = async (budget: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingBudget) {
        await updateBudget(editingBudget, budget);
        setEditingBudget(null);
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('Error updating budget:', error);
      setError(error.message || 'Failed to update budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await deleteBudget(budgetToDelete);
      setShowDeleteConfirm(false);
      setBudgetToDelete(null);
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      setError(error.message || 'Failed to delete budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate budget progress
  const getBudgetProgress = (budget: Budget) => {
    const spent = budget.spent || 0;
    const limit = budget.limit;
    const percentage = (spent / limit) * 100;
    return { spent, limit, percentage: Math.min(percentage, 100) };
  };

  // Get budget status color
  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Get budget status text
  const getBudgetStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Over Budget';
    if (percentage >= 80) return 'Near Limit';
    return 'On Track';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-20">
      <TopNavigation title="Budgets" showBack />
      
      <div className="px-6 py-6 space-y-8">
        {/* Budget Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Budget Overview</h2>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Budget</span>
            </button>
          </div>
          
          {budgets.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
                <p className="text-sm text-gray-600">Active Budgets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {budgets.filter(b => {
                    const progress = getBudgetProgress(b);
                    return progress.percentage >= 80;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Near Limit</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Budgets Yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create your first budget to start tracking your spending
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Create Budget
              </button>
            </div>
          )}
        </div>

        {/* Budgets List */}
        {budgets.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Budgets</h3>
            <div className="space-y-4">
              {budgets.map((budget) => {
                const progress = getBudgetProgress(budget);
                const statusColor = getBudgetStatusColor(progress.percentage);
                const statusText = getBudgetStatusText(progress.percentage);
                
                return (
                  <div key={budget.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Target size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{budget.name}</h4>
                          <p className="text-sm text-gray-500">{budget.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingBudget(budget.id);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Spent: {formatCurrency(progress.spent)}</span>
                        <span>Limit: {formatCurrency(progress.limit)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.percentage >= 100 ? 'bg-red-500' :
                            progress.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusText}
                      </span>
                      <span className="text-sm text-gray-500">
                        {progress.percentage.toFixed(0)}% used
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} className="text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? "Edit Budget" : "Add Budget"}
      >
        <BudgetForm
          budget={editingBudget ? budgets.find(b => b.id === editingBudget) : undefined}
          onSubmit={editingBudget ? handleEditBudget : handleAddBudget}
          onCancel={() => {
            setShowModal(false);
            setEditingBudget(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Budget"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Budget</h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone. Are you sure you want to delete this budget?
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteBudget}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
