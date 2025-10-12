import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Calculator, TrendingUp, AlertTriangle, Plus, Edit3, Trash2, AlertCircle, Target, ArrowLeft, Pause, Play, Square, Archive, CheckCircle } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { BudgetForm } from '../components/forms/BudgetForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Budget } from '../types';

const Budgets: React.FC = () => {
  const navigate = useNavigate();
  const { budgets, addBudget, updateBudget, deleteBudget, pauseBudget, resumeBudget, stopBudget, archiveBudget, completeBudget, transactions, refreshBudgets } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'active' | 'all' | 'archived'>('active');
  const [activeTab, setActiveTab] = useState<'overview' | 'list'>('overview');
  const [selectedBudget, setSelectedBudget] = useState<string>('');

  const handleAddBudget = async (budget: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addBudget(budget);
      await refreshBudgets(); // Auto-refresh to show new budget immediately
      setShowModal(false);
      setEditingBudget(null);
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
        await refreshBudgets(); // Auto-refresh to show updated budget immediately
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
      await refreshBudgets(); // Auto-refresh after delete
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
    const limit = budget.amount || 0;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
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

  // Filter budgets based on view
  const filteredBudgets = budgets.filter(budget => {
    if (viewFilter === 'active') {
      return budget.is_active !== false && budget.status !== 'archived' && budget.status !== 'stopped';
    } else if (viewFilter === 'archived') {
      return budget.status === 'archived' || budget.status === 'stopped' || budget.status === 'completed';
    }
    // 'all' - return everything for analytics
    return true;
  });

  // Calculate totals for ALL budgets (for analytics)
  const totalBudgeted = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const activeBudgetsCount = budgets.filter(b => b.is_active !== false && b.status !== 'archived').length;
  const archivedBudgetsCount = budgets.filter(b => b.status === 'archived' || b.status === 'stopped').length;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/cards')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-heading">Budgets</h1>
          </div>
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
        {/* Segmented Bar at Top */}
        {budgets.length > 0 && (
          <div className="flex space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
            {[
              { key: 'overview', label: 'Overview', icon: PieChart },
              { key: 'list', label: 'All Budgets', icon: Calculator }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
                  activeTab === tab.key
                    ? 'text-white transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'transparent'
                }}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Budget Summary */}
            <div className="card p-4 slide-in-up">
              <div className="mb-4">
                <h2 className="text-lg font-heading">Budget Overview</h2>
              </div>
          
          {budgets.length > 0 ? (
            <>
              {/* Budget Selection Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Select Budget to View Details
                </label>
                <select
                  value={selectedBudget || ''}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-900"
                >
                  <option value="">Choose a budget...</option>
                  {budgets.map((budget) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name || budget.category} - {formatCurrency(budget.amount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-numbers">{activeBudgetsCount}</p>
                  <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-numbers">{archivedBudgetsCount}</p>
                  <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Archived</p>
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
            </>
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
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Filter Tabs */}
        {budgets.length > 0 && (
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setViewFilter('active')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewFilter === 'active'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Active ({activeBudgetsCount})
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              All ({budgets.length})
            </button>
            <button
              onClick={() => setViewFilter('archived')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewFilter === 'archived'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Archived ({archivedBudgetsCount})
            </button>
          </div>
        )}
            {/* Budgets List */}
            {budgets.length > 0 && (
              <div className="slide-in-up">
                <h3 className="text-lg font-heading mb-4">
                  {viewFilter === 'active' ? 'Active Budgets' : viewFilter === 'archived' ? 'Archived Budgets' : 'All Budgets'}
                </h3>
            <div className="space-y-3">
              {filteredBudgets.map((budget) => {
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
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{budget.category}</h4>
                          <p className="text-sm font-body">{budget.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Status Controls */}
                        {budget.status === 'active' && (
                          <button
                            onClick={() => pauseBudget(budget.id)}
                            className="p-2 text-yellow-600 hover:text-yellow-700 transition-colors rounded-full hover:bg-yellow-50"
                            title="Pause Budget"
                          >
                            <Pause size={14} />
                          </button>
                        )}
                        {budget.status === 'paused' && (
                          <button
                            onClick={() => resumeBudget(budget.id)}
                            className="p-2 text-green-600 hover:text-green-700 transition-colors rounded-full hover:bg-green-50"
                            title="Resume Budget"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        {(budget.status === 'active' || budget.status === 'paused') && (
                          <>
                            <button
                              onClick={() => stopBudget(budget.id, 'User stopped')}
                              className="p-2 text-gray-600 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-50"
                              title="Stop Budget"
                            >
                              <Square size={14} />
                            </button>
                            <button
                              onClick={() => archiveBudget(budget.id, 'User archived')}
                              className="p-2 text-blue-600 hover:text-blue-700 transition-colors rounded-full hover:bg-blue-50"
                              title="Archive Budget"
                            >
                              <Archive size={14} />
                            </button>
                          </>
                        )}
                        
                        {/* Edit & Delete */}
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
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                        {/* Budget Lifecycle Status Badge */}
                        {budget.status && budget.status !== 'active' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            budget.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            budget.status === 'stopped' ? 'bg-gray-100 text-gray-800' :
                            budget.status === 'archived' ? 'bg-blue-100 text-blue-800' :
                            budget.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                          </span>
                        )}
                      </div>
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
          initialData={editingBudget ? budgets.find(b => b.id === editingBudget) : undefined}
          onSubmit={editingBudget ? handleEditBudget : handleAddBudget}
          onCancel={() => {
            setShowModal(false);
            setEditingBudget(null);
          }}
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
