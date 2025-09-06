import React, { useState } from 'react';
import { PieChart, Calculator, TrendingUp, AlertTriangle, Plus, Edit3, Trash2, AlertCircle, Target } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { BudgetForm } from '../components/forms/BudgetForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Budget } from '../types';

const Budgets: React.FC = () => {
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
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading">Budgets</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2 px-4 py-2"
          >
            <Plus size={16} />
            <span>Add Budget</span>
          </button>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Budget Summary */}
        <div className="card p-4 slide-in-up">
          <div className="mb-4">
            <h2 className="text-lg font-heading">Budget Overview</h2>
          </div>
          
          {budgets.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-numbers">{budgets.length}</p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Active Budgets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-numbers">
                  {budgets.filter(b => {
                    const progress = getBudgetProgress(b);
                    return progress.percentage >= 80;
                  }).length}
                </p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Near Limit</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <PieChart size={20} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-heading mb-2">No Budgets Yet</h3>
              <p className="text-sm font-body mb-4">
                Create your first budget to start tracking your spending
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Create Budget
              </button>
            </div>
          )}
        </div>

        {/* Budgets List */}
        {budgets.length > 0 && (
          <div className="slide-in-up">
            <h3 className="text-lg font-heading mb-4">Your Budgets</h3>
            <div className="space-y-3">
              {budgets.map((budget) => {
                const progress = getBudgetProgress(budget);
                const statusColor = getBudgetStatusColor(progress.percentage);
                const statusText = getBudgetStatusText(progress.percentage);
                
                return (
                  <div key={budget.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                          <Target size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{budget.name}</h4>
                          <p className="text-sm font-body">{budget.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingBudget(budget.id);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        <span>Spent: {formatCurrency(progress.spent)}</span>
                        <span>Limit: {formatCurrency(progress.limit)}</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-light)' }}>
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress.percentage}%`,
                            backgroundColor: progress.percentage >= 100 ? 'var(--error)' :
                                           progress.percentage >= 80 ? 'var(--warning)' : 'var(--success)'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusText}
                      </span>
                      <span className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
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
          <div className="card p-4" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} />
              <p className="text-sm font-body">{error}</p>
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
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--error)' }}>
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-heading">Delete Budget</h3>
              <p className="text-sm font-body">
                This action cannot be undone. Are you sure you want to delete this budget?
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteBudget}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--error)', color: 'white' }}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Budgets;
