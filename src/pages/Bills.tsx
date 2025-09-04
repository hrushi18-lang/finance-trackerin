import React, { useState } from 'react';
import { Calendar, Bell, Plus, Edit3, Trash2, AlertTriangle, CheckCircle, Clock, CreditCard, Zap, Play, Pause, Target, DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { format, differenceInDays, addDays, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Modal } from '../components/common/Modal';
import { EnhancedBillForm } from '../components/forms/EnhancedBillForm';
import { BillPaymentForm } from '../components/forms/BillPaymentForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

export const Bills: React.FC = () => {
  const { bills, addBill, updateBill, deleteBill, addTransaction, accounts, liabilities, transactions, payBillFromAccount, updateLiability } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue' | 'paid' | 'all'>('upcoming');

  // Enhanced bill filtering and categorization
  const categorizedBills = {
    upcoming: bills.filter(bill => {
      const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
      return daysUntilDue >= 0 && daysUntilDue <= 30 && bill.isActive;
    }),
    overdue: bills.filter(bill => {
      const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
      return daysUntilDue < 0 && bill.isActive;
    }),
    paid: bills.filter(bill => !bill.isActive || bill.lastPaidDate),
    all: bills
  };

  // Calculate bill statistics
  const billStats = {
    totalBills: bills.length,
    activeBills: bills.filter(b => b.isActive).length,
    overdueBills: categorizedBills.overdue.length,
    upcomingBills: categorizedBills.upcoming.length,
    totalMonthlyAmount: bills
      .filter(b => b.isActive && b.frequency === 'monthly')
      .reduce((sum, bill) => sum + bill.amount, 0),
    totalAnnualAmount: bills
      .filter(b => b.isActive)
      .reduce((sum, bill) => {
        const multiplier = bill.frequency === 'weekly' ? 52 : 
                          bill.frequency === 'bi_weekly' ? 26 :
                          bill.frequency === 'monthly' ? 12 :
                          bill.frequency === 'quarterly' ? 4 :
                          bill.frequency === 'semi_annual' ? 2 : 1;
        return sum + (bill.amount * multiplier);
      }, 0)
  };

  const handleAddBill = async (bill: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addBill(bill);
      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding bill:', error);
      setError(error.message || 'Failed to add bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBill = async (bill: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      if (editingBill) {
        await updateBill(editingBill.id, bill);
        setEditingBill(null);
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('Error updating bill:', error);
      setError(error.message || 'Failed to update bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBill = (billId: string) => {
    setBillToDelete(billId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBill = async () => {
    if (!billToDelete) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await deleteBill(billToDelete);
      setShowDeleteConfirm(false);
      setBillToDelete(null);
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      setError(error.message || 'Failed to delete bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayBill = async (paymentData: any) => {
    if (!selectedBill) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await payBillFromAccount(paymentData.accountId, selectedBill.id, paymentData.amount, paymentData.description);
      setShowPaymentModal(false);
      setSelectedBill(null);
    } catch (error: any) {
      console.error('Error paying bill:', error);
      setError(error.message || 'Failed to pay bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBillStatus = (bill: any) => {
    const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
    if (daysUntilDue < 0) return { status: 'overdue', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    if (daysUntilDue <= 3) return { status: 'due_soon', color: 'text-yellow-600 bg-yellow-100', icon: Clock };
    if (daysUntilDue <= 7) return { status: 'due_this_week', color: 'text-blue-600 bg-blue-100', icon: Calendar };
    return { status: 'upcoming', color: 'text-green-600 bg-green-100', icon: CheckCircle };
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return <Calendar size={16} className="text-blue-600" />;
      case 'monthly': return <Calendar size={16} className="text-green-600" />;
      case 'quarterly': return <Calendar size={16} className="text-purple-600" />;
      case 'annual': return <Calendar size={16} className="text-orange-600" />;
      default: return <Calendar size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading">Bills & Payments</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2 px-4 py-2"
          >
            <Plus size={16} />
            <span>Add Bill</span>
          </button>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Bill Summary */}
        <div className="card p-4 slide-in-up">
          <div className="mb-4">
            <h2 className="text-lg font-heading">Bill Overview</h2>
          </div>
          
          {bills.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-numbers">{billStats.activeBills}</p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Active Bills</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-numbers" style={{ color: 'var(--error)' }}>{billStats.overdueBills}</p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Overdue</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <Bell size={20} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-heading mb-2">No Bills Yet</h3>
              <p className="text-sm font-body mb-4">
                Add your first bill to start tracking payments
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Add Bill
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {bills.length > 0 && (
          <div className="flex space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
            {[
              { key: 'upcoming', label: 'Upcoming', count: categorizedBills.upcoming.length },
              { key: 'overdue', label: 'Overdue', count: categorizedBills.overdue.length },
              { key: 'paid', label: 'Paid', count: categorizedBills.paid.length },
              { key: 'all', label: 'All', count: categorizedBills.all.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'text-white transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'transparent'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}

        {/* Bills List */}
        {bills.length > 0 && (
          <div className="slide-in-up">
            <h3 className="text-lg font-heading mb-4">Your Bills</h3>
            <div className="space-y-3">
              {categorizedBills[activeTab].map((bill) => {
                const status = getBillStatus(bill);
                const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
                
                return (
                  <div key={bill.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                          {getFrequencyIcon(bill.frequency)}
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bill.title}</h4>
                          <p className="text-sm font-body">{bill.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                          style={{ backgroundColor: 'var(--success)', color: 'white' }}
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => {
                            setEditingBill(bill);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Amount</p>
                        <p className="text-lg font-numbers">
                          {formatCurrency(bill.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Due Date</p>
                        <p className="text-lg font-numbers">
                          {format(new Date(bill.nextDueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                         daysUntilDue === 0 ? 'Due today' :
                         daysUntilDue === 1 ? 'Due tomorrow' :
                         `Due in ${daysUntilDue} days`}
                      </span>
                      <span className="text-sm font-body capitalize" style={{ color: 'var(--text-tertiary)' }}>
                        {bill.frequency}
                      </span>
                    </div>

                    {/* Bill Completion Actions */}
                    {bill.lastPaidDate && (
                      <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Bill Paid! ✅</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Archive bill
                              updateBill(bill.id, { ...bill, isArchived: true });
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => {
                              // Delete bill
                              handleDeleteBill(bill.id);
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              // Restart bill (reset payment status)
                              updateBill(bill.id, { ...bill, lastPaidDate: null, nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
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
              <AlertCircle size={16} />
              <p className="text-sm font-body">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Bill Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBill(null);
        }}
        title={editingBill ? "Edit Bill" : "Add Bill"}
      >
        <EnhancedBillForm
          bill={editingBill}
          onSubmit={editingBill ? handleEditBill : handleAddBill}
          onCancel={() => {
            setShowModal(false);
            setEditingBill(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pay Bill"
      >
        {selectedBill && (
          <BillPaymentForm
            bill={selectedBill}
            onSubmit={handlePayBill}
            onCancel={() => setShowPaymentModal(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Bill"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Bill</h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone. Are you sure you want to delete this bill?
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
              onClick={confirmDeleteBill}
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

export default Bills;