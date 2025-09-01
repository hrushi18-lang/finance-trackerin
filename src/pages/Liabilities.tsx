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
  const { liabilities, addLiability, updateLiability, deleteLiability, addTransaction, accounts } = useFinance();
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
        ...liability,
        type: liability.liabilityType, // Map to old format for compatibility
        totalAmount: liability.totalAmount,
        remainingAmount: liability.remainingAmount,
        interestRate: liability.interestRate,
        monthlyPayment: liability.monthlyPayment || liability.minimumPayment || 0,
        due_date: liability.dueDate || liability.nextPaymentDate || new Date(),
        start_date: liability.startDate
      });

      // Handle fund disbursement
      if (liability.providesFunds && liability.disbursementAccountId) {
        await addTransaction({
          type: 'income',
          amount: liability.totalAmount,
          category: 'Loan Disbursement',
          description: `Funds received: ${liability.name}`,
          date: liability.startDate,
          accountId: liability.disbursementAccountId,
          affectsBalance: true
        });
      }

      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding liability:', error);
      setError(error.message || 'Failed to add liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakePayment = async (paymentData: { amount: number; description: string; createTransaction: boolean }) => {
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
      if (paymentData.createTransaction) {
        await addTransaction({
          type: 'expense',
          amount: actualPayment,
          category: 'Debt Payment',
          description: paymentData.description || `Payment for ${liability.name}`,
          date: new Date(),
          accountId: liability.defaultPaymentAccountId // Use default payment account
        });
      }
      
      // Update liability remaining amount
      await updateLiability(liability.id, {
        // Update specific fields
        totalAmount: liability.totaltotalAmount,
        remainingAmount: Math.max(0, currentRemaining - actualPayment),
        interestRate: liability.interestRate,
        monthlyPayment: liability.monthlyPayment,
        paymentDay: liability.paymentDay,
        startDate: liability.startDate,
        dueDate: liability.dueDate,
        nextPaymentDate: liability.nextPaymentDate,
        status: Math.max(0, currentRemaining - actualPayment) === 0 ? 'paid_off' : liability.status,
        remainingAmount: Math.max(0, currentRemaining - actualPayment)
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
    try {
      setIsSubmitting(true);
      if (liabilityToDelete) {
        await deleteLiability(liabilityToDelete);
        setLiabilityToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Error deleting liability:', error);
      setError(error.message || 'Failed to delete liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      personal_loan: Wallet,
      student_loan: GraduationCap,
      auto_loan: Car,
      mortgage: Home,
      credit_card: CreditCard,
      bnpl: ShoppingCart,
      installment: Calendar,
      loan: Wallet, // Legacy support
      other: CreditCard
    };
    return icons[type as keyof typeof icons] || CreditCard;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      personal_loan: 'bg-blue-500',
      student_loan: 'bg-purple-500',
      auto_loan: 'bg-green-500',
      mortgage: 'bg-orange-500',
      credit_card: 'bg-red-500',
      bnpl: 'bg-pink-500',
      installment: 'bg-indigo-500',
      loan: 'bg-blue-500', // Legacy support
      other: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      personal_loan: 'Personal Loan',
      student_loan: 'Student Loan',
      auto_loan: 'Auto Loan',
      mortgage: 'Mortgage',
      credit_card: 'Credit Card',
      bnpl: 'Buy Now Pay Later',
      installment: 'Installment Plan',
      loan: 'Loan', // Legacy support
      purchase: 'Purchase',
      other: 'Other'
    };
    return labels[type as keyof typeof labels] || 'Other';
  };

  const getLiabilityStatus = (liability: any) => {
    const remainingAmount = Number(liability.remainingAmount) || 0;
    
    if (remainingAmount <= 0) {
      return { status: 'paid_off', color: 'success', label: '✅ Paid Off' };
    }
    
    const daysUntilDue = differenceInDays(new Date(liability.nextPaymentDate), new Date());
    
    if (daysUntilDue < 0) {
      return { status: 'overdue', color: 'error', label: '⚠️ Overdue' };
    }
    
    if (daysUntilDue === 0) {
      return { status: 'due_today', color: 'error', label: '🚨 Due Today' };
    }
    
    if (daysUntilDue <= 7) {
      return { status: 'due_soon', color: 'warning', label: `⏰ Due in ${daysUntilDue} days` };
    }
    
    return { status: 'current', color: 'primary', label: '📅 Current' };
  };

  const totalDebt = liabilities.reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);
  const totalMonthlyPayments = liabilities.reduce((sum, l) => sum + (Number(l.monthlyPayment || l.minimumPayment) || 0), 0);
  const activeLiabilities = liabilities.filter(l => (Number(l.remainingAmount) || 0) > 0);

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="💳 Debt & Liabilities" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          🎯 Track and manage all your debts in one place
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={18} className="text-error-400" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Dashboard */}
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl p-6 mb-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Debt Overview</h3>
              <p className="text-red-200 text-sm">Your complete debt picture</p>
            </div>
            {activeLiabilities.length > 1 && (
              <Button
                onClick={() => setShowStrategyTool(true)}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Calculator size={16} className="mr-2" />
                Strategy Tool
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <CreditCard size={20} className="mx-auto text-red-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Total Debt</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(totalDebt)}
              </p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <DollarSign size={20} className="mx-auto text-orange-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Monthly Payments</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(totalMonthlyPayments)}
              </p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <Target size={20} className="mx-auto text-blue-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Active Debts</p>
              <p className="text-lg font-bold text-white">{activeLiabilities.length}</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <CheckCircle size={20} className="mx-auto text-success-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Paid Off</p>
              <p className="text-lg font-bold text-white">
                {liabilities.length - activeLiabilities.length}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/20 rounded-xl p-1 border border-white/10 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: CreditCard },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'payments', label: 'Payments', icon: DollarSign }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {liabilities.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={24} className="text-error-400 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No debts tracked</h3>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                  Add your debts to track repayment progress and get insights
                </p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus size={18} className="mr-2 sm:w-5 sm:h-5" />
                  Add First Debt
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {liabilities.map((liability) => {
                  const totalAmount = Number(liability.totalAmount) || 0;
                  const remainingAmount = Number(liability.remainingAmount) || 0;
                  const monthlyPayment = Number(liability.monthlyPayment || liability.minimumPayment) || 0;
                  const interestRate = Number(liability.interestRate) || 0;
                  
                  const payoffProgress = totalAmount > 0 ? ((totalAmount - remainingAmount) / totalAmount) * 100 : 0;
                  const TypeIcon = getTypeIcon(liability.type);
                  const liabilityStatus = getLiabilityStatus(liability);
                  
                  return (
                    <div key={liability.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 sm:mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${getTypeColor(liability.type)} flex items-center justify-center`}>
                            <TypeIcon size={20} className="text-white sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm sm:text-base">{liability.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-400">{getTypeLabel(liability.type)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {interestRate > 0 && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                              {interestRate}% APR
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingLiability(liability);
                              setShowEditModal(true);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Edit3 size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteLiability(liability.id)}
                            className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-error-400" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="mb-4 sm:mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs sm:text-sm text-gray-400">Paid Off</span>
                          <span className="text-sm sm:text-lg font-semibold text-white">
                            {formatCurrency(totalAmount - remainingAmount)} / {formatCurrency(totalAmount)}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${payoffProgress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="font-medium text-orange-400">
                            {payoffProgress.toFixed(1)}% paid off
                          </span>
                          <span className="text-gray-400">
                            {formatCurrency(remainingAmount)} remaining
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400">Monthly Payment</p>
                          <p className="text-sm font-medium text-white">
                            {formatCurrency(monthlyPayment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Due Date</p>
                          <p className="text-sm font-medium text-white">
                            {format(liability.nextPaymentDate || liability.dueDate, 'MMM dd')}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`text-center py-2 sm:py-3 rounded-xl border mb-4 ${
                        liabilityStatus.status === 'paid_off' ? 'bg-success-500/20 border-success-500/30' :
                        liabilityStatus.status === 'overdue' ? 'bg-error-500/20 border-error-500/30' :
                        liabilityStatus.status === 'due_soon' ? 'bg-warning-500/20 border-warning-500/30' :
                        'bg-primary-500/20 border-primary-500/30'
                      }`}>
                        <span className={`font-medium text-sm ${
                          liabilityStatus.status === 'paid_off' ? 'text-success-400' :
                          liabilityStatus.status === 'overdue' ? 'text-error-400' :
                          liabilityStatus.status === 'due_soon' ? 'text-warning-400' :
                          'text-primary-400'
                        }`}>
                          {liabilityStatus.label}
                        </span>
                      </div>

                      {/* Action Button */}
                      {remainingAmount > 0 && (
                        <Button
                          onClick={() => {
                            setSelectedLiability(liability.id);
                            setShowPaymentModal(true);
                          }}
                          className="w-full"
                          size="sm"
                        >
                          💰 Make Payment
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Debt Breakdown by Type */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h4 className="font-medium text-white mb-4">Debt Breakdown by Type</h4>
              
              <div className="space-y-3">
                {Object.entries(
                  liabilities.reduce((acc, liability) => {
                    const type = liability.type;
                    const amount = Number(liability.remainingAmount) || 0;
                    acc[type] = (acc[type] || 0) + amount;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, amount]) => {
                  const percentage = totalDebt > 0 ? (amount / totalDebt) * 100 : 0;
                  const TypeIcon = getTypeIcon(type);
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg ${getTypeColor(type)} flex items-center justify-center`}>
                          <TypeIcon size={16} className="text-white" />
                        </div>
                        <span className="font-medium text-white">{getTypeLabel(type)}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatCurrency(amount)}</p>
                        <p className="text-xs text-gray-400">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h4 className="font-medium text-white mb-4">Upcoming Payments</h4>
              
              <div className="space-y-3">
                {activeLiabilities
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .slice(0, 5)
                  .map((liability) => {
                    const daysUntilDue = differenceInDays(new Date(liability.due_date), new Date());
                    
                    return (
                      <div key={liability.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Clock size={16} className="text-blue-400" />
                          <div>
                            <p className="font-medium text-white text-sm">{liability.name}</p>
                            <p className="text-xs text-gray-400">
                              {daysUntilDue === 0 ? 'Due today' :
                               daysUntilDue === 1 ? 'Due tomorrow' :
                               daysUntilDue > 0 ? `Due in ${daysUntilDue} days` :
                               `${Math.abs(daysUntilDue)} days overdue`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            {formatCurrency(Number(liability.monthlyPayment || liability.minimumPayment) || 0)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(liability.due_date, 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment History would go here */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h4 className="font-medium text-white mb-4">Payment History</h4>
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Payment history tracking coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Tips */}
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 mt-0.5">🎓</span>
            <div>
              <h4 className="font-medium text-blue-400 mb-1">💡 Student Debt Management Tips</h4>
              <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                <li>Track all your debts in one place - EMIs, credit cards, student loans</li>
                <li>Pay more than the minimum when you can to save on interest</li>
                <li>Focus on high-interest debt first (debt avalanche method)</li>
                <li>Set up automatic bill reminders to never miss payments</li>
                <li>Celebrate every payment - you're building financial freedom!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Liability Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Debt"
      >
        <EnhancedLiabilityForm
          onSubmit={handleAddLiability}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Edit Liability Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLiability(null);
        }}
        title="Edit Debt"
      >
        {editingLiability && (
          <EnhancedLiabilityForm
            initialData={{
              ...editingLiability,
              // Ensure date fields are strings for form
              startDate: editingLiability.startDate.toISOString().split('T')[0],
              dueDate: editingLiability.dueDate?.toISOString().split('T')[0],
              nextPaymentDate: editingLiability.nextPaymentDate?.toISOString().split('T')[0],
              // Map liabilityType back to type for form compatibility if needed
              type: editingLiability.liabilityType,
              // Ensure numeric fields are numbers
              totalAmount: Number(editingLiability.totalAmount),
              remainingAmount: Number(editingLiability.remainingAmount),
            }}
            onSubmit={async (data) => {
              await updateLiability(editingLiability.id, data);
              setShowEditModal(false);
              setEditingLiability(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setEditingLiability(null);
            }}
          />
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedLiability(null);
        }}
        title="Make Payment"
      >
        <PaymentForm
          liability={liabilities.find(l => l.id === selectedLiability)}
          onSubmit={handleMakePayment}
          onCancel={() => {
            setShowPaymentModal(false);
            setSelectedLiability(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setLiabilityToDelete(null);
        }}
        title="Delete Debt"
      >
        <div className="space-y-4">
          <div className="bg-error-500/20 rounded-lg p-4 border border-error-500/30">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={18} className="text-error-400 mt-0.5" />
              <div>
                <p className="text-error-400 font-medium">⚠️ This can't be undone!</p>
                <p className="text-error-300 text-sm mt-1">
                  Deleting this debt will remove all payment history and linked bills.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-300">
            Are you sure you want to delete this debt? All related data will be lost forever.
          </p>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setLiabilityToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteLiability}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isSubmitting}
            >
              Delete Debt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Debt Strategy Tool Modal */}
      <Modal
        isOpen={showStrategyTool}
        onClose={() => setShowStrategyTool(false)}
        title="Debt Repayment Strategy"
      >
        <DebtStrategyTool onClose={() => setShowStrategyTool(false)} />
      </Modal>
    </div>
  );
};