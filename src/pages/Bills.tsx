import React, { useState } from 'react';
import { Calendar, Bell, Plus, Edit3, Trash2, AlertTriangle, CheckCircle, Clock, CreditCard, Zap } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { BillForm } from '../components/forms/BillForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

export const Bills: React.FC = () => {
  const { recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter bills (expense recurring transactions)
  const bills = recurringTransactions.filter(rt => rt.type === 'expense');
  const upcomingBills = bills.filter(bill => {
    const daysUntilDue = differenceInDays(new Date(bill.nextOccurrenceDate), new Date());
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });

  const handleAddBill = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addRecurringTransaction({
        ...data,
        type: 'expense',
        isActive: true,
        currentOccurrences: 0
      });
      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding bill:', error);
      setError(error.message || 'Failed to add bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBill = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      if (editingBill) {
        await updateRecurringTransaction(editingBill.id, data);
        setEditingBill(null);
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('Error updating bill:', error);
      setError(error.message || 'Failed to update bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBill = (billId: string) => {
    setBillToDelete(billId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBill = async () => {
    try {
      setIsSubmitting(true);
      if (billToDelete) {
        await deleteRecurringTransaction(billToDelete);
        setBillToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      setError(error.message || 'Failed to delete bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysUntilDue = (bill: any) => {
    return differenceInDays(new Date(bill.nextOccurrenceDate), new Date());
  };

  const getBillStatus = (bill: any) => {
    const daysUntilDue = getDaysUntilDue(bill);
    
    if (daysUntilDue < 0) return { status: 'overdue', color: 'error', label: '⚠️ Overdue' };
    if (daysUntilDue === 0) return { status: 'due_today', color: 'error', label: '🚨 Due Today' };
    if (daysUntilDue <= 3) return { status: 'due_soon', color: 'warning', label: `⏰ Due in ${daysUntilDue} days` };
    return { status: 'upcoming', color: 'primary', label: '📅 Upcoming' };
  };

  const totalMonthlyBills = bills.reduce((sum, bill) => {
    let monthlyAmount = bill.amount;
    switch (bill.frequency) {
      case 'weekly': monthlyAmount = bill.amount * 4.33; break;
      case 'yearly': monthlyAmount = bill.amount / 12; break;
      default: monthlyAmount = bill.amount;
    }
    return sum + monthlyAmount;
  }, 0);

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="Bills & Payments" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          Never miss a payment again! Track all your bills and due dates
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

        {/* Bills Summary */}
        {bills.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
              <Calendar size={20} className="mx-auto text-primary-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Monthly Bills</p>
              <p className="text-lg font-bold text-white">
                <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                {totalMonthlyBills.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
              <Bell size={20} className="mx-auto text-warning-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Due This Week</p>
              <p className="text-lg font-bold text-white">{upcomingBills.length}</p>
            </div>
          </div>
        )}

        {bills.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-primary-400 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No bills tracked yet</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              Add your first bill to never miss a payment again
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={18} className="mr-2 sm:w-5 sm:h-5" />
              Add First Bill
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => {
              const billStatus = getBillStatus(bill);
              const daysUntilDue = getDaysUntilDue(bill);
              
              return (
                <div key={bill.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                        billStatus.color === 'error' ? 'bg-error-500/20' :
                        billStatus.color === 'warning' ? 'bg-warning-500/20' :
                        'bg-primary-500/20'
                      }`}>
                        <CreditCard size={20} className={`${
                          billStatus.color === 'error' ? 'text-error-400' :
                          billStatus.color === 'warning' ? 'text-warning-400' :
                          'text-primary-400'
                        } sm:w-6 sm:h-6`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">{bill.description}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{bill.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingBill(bill);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-error-400" />
                      </button>
                    </div>
                  </div>

                  {/* Amount and Due Date */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Amount</p>
                      <p className="text-lg font-bold text-white">
                        <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                        {bill.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{bill.frequency}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Next Due</p>
                      <p className="text-sm font-medium text-white">
                        {format(new Date(bill.nextOccurrenceDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {daysUntilDue === 0 ? 'Today' : 
                         daysUntilDue === 1 ? 'Tomorrow' :
                         daysUntilDue > 0 ? `In ${daysUntilDue} days` : 
                         `${Math.abs(daysUntilDue)} days overdue`}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`text-center py-2 sm:py-3 rounded-xl border ${
                    billStatus.color === 'error' ? 'bg-error-500/20 border-error-500/30' :
                    billStatus.color === 'warning' ? 'bg-warning-500/20 border-warning-500/30' :
                    'bg-primary-500/20 border-primary-500/30'
                  }`}>
                    <span className={`font-medium text-sm ${
                      billStatus.color === 'error' ? 'text-error-400' :
                      billStatus.color === 'warning' ? 'text-warning-400' :
                      'text-primary-400'
                    }`}>
                      {billStatus.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Student Tips */}
        <div className="mt-6 bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-start space-x-3">
            <Zap size={18} className="text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-400 mb-1">💡 Student Bill Tips</h4>
              <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                <li>Set up reminders 3-5 days before due dates</li>
                <li>Pay bills as soon as you get your allowance or salary</li>
                <li>Group bills by payment method to track spending</li>
                <li>Consider annual payments for discounts (like subscriptions)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Bill Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBill(null);
          setError(null);
        }}
        title={editingBill ? 'Edit Bill' : 'Add New Bill'}
      >
        <BillForm
          initialData={editingBill}
          onSubmit={editingBill ? handleEditBill : handleAddBill}
          onCancel={() => {
            setShowModal(false);
            setEditingBill(null);
            setError(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setBillToDelete(null);
        }}
        title="Delete Bill"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this bill? You'll lose all reminders and tracking.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setBillToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteBill}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};