import React, { useState } from 'react';
import { CreditCard, Calendar, Percent, TrendingDown, Plus, Edit3, Trash2, BarChart3, Calculator, Info, AlertTriangle, ShoppingCart, CheckCircle, Building, Car, Home, GraduationCap, Wallet, Target, Clock, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { TopNavigation } from '../components/layout/TopNavigation';
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-20">
      <TopNavigation title="Liabilities" showBack />
      
      <div className="px-6 py-6 space-y-8">
        {/* Liability Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Debt Overview</h2>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Liability</span>
            </button>
          </div>
          
          {liabilities.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{liabilityStats.activeLiabilities}</p>
                <p className="text-sm text-gray-600">Active Debts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(liabilityStats.totalDebt)}
                </p>
                <p className="text-sm text-gray-600">Total Debt</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Liabilities Yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add your first liability to start tracking your debt
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Add Liability
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {liabilities.length > 0 && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'analytics', label: 'Analytics', icon: Calculator },
              { key: 'payments', label: 'Payments', icon: DollarSign }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Liabilities List */}
        {liabilities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Liabilities</h3>
            <div className="space-y-4">
              {liabilities.map((liability) => {
                const status = getLiabilityStatus(liability);
                const progress = ((liability.totalAmount - liability.remainingAmount) / liability.totalAmount) * 100;
                
                return (
                  <div key={liability.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getLiabilityIcon(liability.liabilityType)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{liability.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">
                            {liability.liabilityType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedLiability(liability.id);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => {
                            setEditingLiability(liability);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLiability(liability.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Remaining</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(liability.remainingAmount || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Interest Rate</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {(liability.interestRate || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Paid: {formatCurrency(liability.totalAmount - (liability.remainingAmount || 0))}</span>
                        <span>Total: {formatCurrency(liability.totalAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {progress.toFixed(0)}% paid
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
              <AlertTriangle size={20} className="text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
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
