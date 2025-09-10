import React, { useState } from 'react';
import { CreditCard, Calendar, Percent, TrendingDown, Plus, Edit3, Trash2, BarChart3, Calculator, Info, AlertTriangle, ShoppingCart, CheckCircle, Building, Car, Home, GraduationCap, Wallet, Target, Clock, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Modal } from '../components/common/Modal';
import { EnhancedLiabilityForm } from '../components/forms/EnhancedLiabilityForm';
import { PaymentForm } from '../components/forms/PaymentForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { DebtStrategyTool } from '../components/liabilities/DebtStrategyTool';

export const Liabilities: React.FC = () => {
  const { liabilities, addLiability, updateLiability, deleteLiability, addTransaction, accounts, repayLiabilityFromAccount } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLiability, setEditingLiability] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [liabilityToDelete, setLiabilityToDelete] = useState<string | null>(null);
  const [showStrategyTool, setShowStrategyTool] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'payments'>('overview');

  const handleAddLiability = async (liability: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create the liability
      await addLiability({
        name: liability.name,
        liabilityType: liability.liabilityType,
        description: liability.description,
        totalAmount: liability.totalAmount,
        remainingAmount: liability.remainingAmount,
        interestRate: liability.interestRate,
        monthlyPayment: liability.monthlyPayment || liability.minimumPayment || 0,
        minimumPayment: liability.minimumPayment || 0,
        paymentDay: liability.paymentDay || 1,
        loanTermMonths: liability.loanTermMonths,
        remainingTermMonths: liability.loanTermMonths,
        startDate: new Date(liability.startDate),
        dueDate: liability.dueDate ? new Date(liability.dueDate) : undefined,
        nextPaymentDate: liability.dueDate ? new Date(liability.dueDate) : undefined,
        linkedAssetId: liability.linkedAssetId,
        status: 'active',
        isActive: true
      });
      
      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding liability:', error);
      setError(error.message || 'Failed to add liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLiability = async (liability: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (editingLiability) {
        await updateLiability(editingLiability.id, liability);
        setEditingLiability(null);
        setShowEditModal(false);
      }
    } catch (error: any) {
      console.error('Error updating liability:', error);
      setError(error.message || 'Failed to update liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakePayment = async (paymentData: { amount: number; description: string; createTransaction: boolean; accountId: string }) => {
    const liability = liabilities.find(l => l.id === selectedLiability);
    if (!liability) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const paymentAmount = Number(paymentData.amount) || 0;
      const currentRemaining = Number(liability.remainingAmount) || 0;
      
      // Handle overpayment
      const actualPayment = Math.min(paymentAmount, currentRemaining);
      
      // Create payment transaction if requested
      if (paymentData.createTransaction && paymentData.accountId) {
        await repayLiabilityFromAccount(paymentData.accountId, liability.id, actualPayment, paymentData.description);
      }
      
      // Update liability remaining amount
      await updateLiability(liability.id, {
        remainingAmount: Math.max(0, currentRemaining - actualPayment),
        status: Math.max(0, currentRemaining - actualPayment) === 0 ? 'paid_off' : liability.status
      });
      
      setShowPaymentModal(false);
      setSelectedLiability(null);
    } catch (error: any) {
      console.error('Error making payment:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLiability = (liabilityId: string) => {
    setLiabilityToDelete(liabilityId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLiability = async () => {
    if (!liabilityToDelete) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await deleteLiability(liabilityToDelete);
      setShowDeleteConfirm(false);
      setLiabilityToDelete(null);
    } catch (error: any) {
      console.error('Error deleting liability:', error);
      setError(error.message || 'Failed to delete liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate liability statistics
  const liabilityStats = {
    totalLiabilities: liabilities.length,
    activeLiabilities: liabilities.filter(l => l.status === 'active').length,
    totalDebt: liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0),
    totalMonthlyPayments: liabilities.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0),
    averageInterestRate: liabilities.length > 0 
      ? liabilities.reduce((sum, l) => sum + (l.interestRate || 0), 0) / liabilities.length 
      : 0
  };

  // Get liability icon
  const getLiabilityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit_card': return <CreditCard size={20} className="text-red-600" />;
      case 'personal_loan': return <Wallet size={20} className="text-blue-600" />;
      case 'mortgage': return <Home size={20} className="text-green-600" />;
      case 'auto_loan': return <Car size={20} className="text-purple-600" />;
      case 'student_loan': return <GraduationCap size={20} className="text-orange-600" />;
      case 'business_loan': return <Building size={20} className="text-indigo-600" />;
      default: return <CreditCard size={20} className="text-gray-600" />;
    }
  };

  // Get liability status
  const getLiabilityStatus = (liability: any) => {
    if (liability.status === 'paid_off') return { status: 'Paid Off', color: 'text-green-600 bg-green-100' };
    if (liability.remainingAmount <= 0) return { status: 'Paid Off', color: 'text-green-600 bg-green-100' };
    return { status: 'Active', color: 'text-blue-600 bg-blue-100' };
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading">Liabilities</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2 px-4 py-2"
          >
            <Plus size={16} />
            <span>Add Liability</span>
          </button>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Liability Summary */}
        <div className="card p-4 slide-in-up">
          <div className="mb-4">
            <h2 className="text-lg font-heading">Debt Overview</h2>
          </div>
          
          {liabilities.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-numbers">{liabilityStats.activeLiabilities}</p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Active Debts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-numbers" style={{ color: 'var(--error)' }}>
                  {formatCurrency(liabilityStats.totalDebt)}
                </p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Total Debt</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <CreditCard size={20} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-heading mb-2">No Liabilities Yet</h3>
              <p className="text-sm font-body mb-4">
                Add your first liability to start tracking your debt
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Add Liability
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {liabilities.length > 0 && (
          <div className="flex space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'analytics', label: 'Analytics', icon: Calculator },
              { key: 'payments', label: 'Payments', icon: DollarSign }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
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

        {/* Liabilities List */}
        {liabilities.length > 0 && (
          <div className="slide-in-up">
            <h3 className="text-lg font-heading mb-4">Your Liabilities</h3>
            <div className="space-y-3">
              {liabilities.map((liability) => {
                const status = getLiabilityStatus(liability);
                const progress = ((liability.totalAmount - liability.remainingAmount) / liability.totalAmount) * 100;
                
                return (
                  <div key={liability.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                          {getLiabilityIcon(liability.liabilityType)}
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{liability.name}</h4>
                          <p className="text-sm font-body capitalize">
                            {liability.liabilityType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedLiability(liability.id);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                          style={{ backgroundColor: 'var(--success)', color: 'white' }}
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => {
                            setEditingLiability(liability);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteLiability(liability.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Remaining</p>
                        <p className="text-lg font-numbers">
                          {formatCurrency(liability.remainingAmount || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Interest Rate</p>
                        <p className="text-lg font-numbers">
                          {(liability.interestRate || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        <span>Paid: {formatCurrency(liability.totalAmount - (liability.remainingAmount || 0))}</span>
                        <span>Total: {formatCurrency(liability.totalAmount)}</span>
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
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.status}
                      </span>
                      <span className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                        {progress.toFixed(0)}% paid
                      </span>
                    </div>

                    {/* Liability Completion Actions */}
                    {progress >= 100 && (
                      <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Liability Paid Off! 🎉</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Archive liability
                              updateLiability(liability.id, { ...liability, status: 'archived' });
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => {
                              // Delete liability
                              handleDeleteLiability(liability.id);
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              // Restart liability (reset to original amount)
                              updateLiability(liability.id, { 
                                ...liability, 
                                remainingAmount: liability.totalAmount,
                                status: 'active'
                              });
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Restart
                          </button>
                        </div>
                      </div>
                    )}
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
              <AlertTriangle size={16} />
              <p className="text-sm font-body">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Liability Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Liability"
      >
        <EnhancedLiabilityForm
          onSubmit={handleAddLiability}
          onCancel={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Liability Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Liability"
      >
        <EnhancedLiabilityForm
          liability={editingLiability}
          onSubmit={handleEditLiability}
          onCancel={() => setShowEditModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Make Payment"
      >
        {selectedLiability && (
          <PaymentForm
            liability={liabilities.find(l => l.id === selectedLiability)}
            accounts={accounts}
            onSubmit={handleMakePayment}
            onCancel={() => setShowPaymentModal(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Liability"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Liability</h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone. Are you sure you want to delete this liability?
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
              onClick={confirmDeleteLiability}
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
