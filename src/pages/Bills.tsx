import React, { useState } from 'react';
import { Calendar, Bell, Plus, Edit3, Trash2, AlertTriangle, CheckCircle, Clock, CreditCard, Zap, Play, Pause, Target, DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { format, differenceInDays, addDays, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { TopNavigation } from '../components/layout/TopNavigation';
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
        let annualAmount = bill.amount;
        if (bill.frequency === 'weekly') annualAmount = bill.amount * 52;
        else if (bill.frequency === 'bi_weekly') annualAmount = bill.amount * 26;
        else if (bill.frequency === 'monthly') annualAmount = bill.amount * 12;
        else if (bill.frequency === 'quarterly') annualAmount = bill.amount * 4;
        else if (bill.frequency === 'semi_annual') annualAmount = bill.amount * 2;
        return sum + annualAmount;
      }, 0)
  };

  // Get recent bill-related transactions
  const recentBillTransactions = transactions
    .filter(t => t.category === 'Bills' || t.description?.includes('Bill payment'))
    .slice(0, 5);

  const handleAddBill = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await addBill({
        title: data.title,
        description: data.description,
        category: data.category,
        billType: data.billType,
        amount: data.amount,
        estimatedAmount: data.estimatedAmount,
        frequency: data.frequency,
        customFrequencyDays: data.customFrequencyDays,
        dueDate: data.dueDate,
        nextDueDate: data.dueDate, // For new bills, next due date is the same as due date
        defaultAccountId: data.defaultAccountId,
        autoPay: data.autoPay,
        linkedLiabilityId: data.linkedLiabilityId,
        isEmi: data.isEmi,
        isEssential: data.isEssential,
        reminderDaysBefore: data.reminderDaysBefore,
        sendDueDateReminder: data.sendDueDateReminder,
        sendOverdueReminder: data.sendOverdueReminder,
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
        await updateBill(editingBill.id, {
          title: data.title,
          description: data.description,
          category: data.category,
          billType: data.billType,
          amount: data.amount,
          estimatedAmount: data.estimatedAmount,
          frequency: data.frequency,
          customFrequencyDays: data.customFrequencyDays,
          dueDate: data.dueDate,
          defaultAccountId: data.defaultAccountId,
          autoPay: data.autoPay,
          linkedLiabilityId: data.linkedLiabilityId,
          isEmi: data.isEmi,
          isEssential: data.isEssential,
        });
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

  const handlePayBill = async (paymentData: { amount: number; description: string; accountId: string }) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await payBillFromAccount(paymentData.accountId, selectedBill.id, paymentData.amount, paymentData.description);

      // If bill is linked to a liability, update the liability
      if (selectedBill.linkedLiabilityId) {
        const liability = liabilities.find(l => l.id === selectedBill.linkedLiabilityId);
        if (liability) {
          const newRemainingAmount = Math.max(0, liability.remainingAmount - paymentData.amount);
          await updateLiability(selectedBill.linkedLiabilityId, {
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount === 0 ? 'paid_off' : liability.status
          });
        }
      }

      setShowPaymentModal(false);
      setSelectedBill(null);
    } catch (error: any) {
      console.error('Error paying bill:', error);
      setError(error.message || 'Failed to process payment');
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
        await deleteBill(billToDelete);
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

  const getBillStatus = (bill: any) => {
    const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
    
    if (!bill.isActive) return 'inactive';
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'urgent';
    if (daysUntilDue <= 7) return 'upcoming';
    return 'active';
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'text-red-500';
      case 'urgent': return 'text-orange-500';
      case 'upcoming': return 'text-yellow-500';
      case 'active': return 'text-green-500';
      case 'inactive': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };

  const getBillStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertTriangle size={16} className="text-red-500" />;
      case 'urgent': return <AlertCircle size={16} className="text-orange-500" />;
      case 'upcoming': return <Clock size={16} className="text-yellow-500" />;
      case 'active': return <CheckCircle size={16} className="text-green-500" />;
      case 'inactive': return <Pause size={16} className="text-gray-500" />;
      default: return <Bell size={16} className="text-blue-500" />;
    }
  };

  const getLinkedLiabilityName = (liabilityId: string) => {
    const liability = liabilities.find(l => l.id === liabilityId);
    return liability ? liability.name : 'Unknown Liability';
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title="Bills & Payments" />
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        {/* Bill Statistics */}
        <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-forest-300 text-sm font-body">Total Bills</p>
              <p className="text-2xl font-numbers font-bold text-white">{billStats.totalBills}</p>
            </div>
            <div className="text-center">
              <p className="text-forest-300 text-sm font-body">Active</p>
              <p className="text-2xl font-numbers font-bold text-green-400">{billStats.activeBills}</p>
            </div>
            <div className="text-center">
              <p className="text-forest-300 text-sm font-body">Overdue</p>
              <p className="text-2xl font-numbers font-bold text-red-400">{billStats.overdueBills}</p>
            </div>
            <div className="text-center">
              <p className="text-forest-300 text-sm font-body">Monthly</p>
              <p className="text-2xl font-numbers font-bold text-white">{formatCurrency(billStats.totalMonthlyAmount)}</p>
            </div>
          </div>
          
          {/* Annual Overview */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-forest-300 mb-2">
              <span>Annual Bill Total</span>
              <span>{formatCurrency(billStats.totalAnnualAmount)}</span>
            </div>
            <div className="w-full bg-forest-800/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((billStats.totalAnnualAmount / 50000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-forest-800/30 rounded-lg p-1">
          {Object.entries({
            upcoming: { label: 'Upcoming', count: categorizedBills.upcoming.length },
            overdue: { label: 'Overdue', count: categorizedBills.overdue.length },
            paid: { label: 'Paid', count: categorizedBills.paid.length },
            all: { label: 'All', count: categorizedBills.all.length }
          }).map(([key, { label, count }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-forest-600 text-white'
                  : 'text-forest-300 hover:text-white'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          {categorizedBills[activeTab].map((bill) => {
            const status = getBillStatus(bill);
            const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
            
            return (
              <div key={bill.id} className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={20} className="text-forest-400" />
                      <h3 className="text-lg font-heading font-semibold text-white">{bill.title}</h3>
                      {getBillStatusIcon(status)}
                      {bill.isEssential && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Essential</span>
                      )}
                    </div>
                    <p className="text-forest-300 text-sm font-body mb-2">{bill.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-forest-400 font-body">Category: {bill.category}</span>
                      <span className="text-forest-400 font-body">
                        Due: {format(new Date(bill.nextDueDate), 'MMM dd, yyyy')}
                      </span>
                      {bill.linkedLiabilityId && (
                        <span className="text-forest-400 font-body">
                          EMI: {getLinkedLiabilityName(bill.linkedLiabilityId)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {bill.isActive && (
                      <button
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowPaymentModal(true);
                        }}
                        className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
                        title="Pay Bill"
                      >
                        <DollarSign size={16} className="text-forest-400" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingBill(bill);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
                      title="Edit Bill"
                    >
                      <Edit3 size={16} className="text-forest-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-2 hover:bg-forest-600/20 rounded-lg transition-colors"
                      title="Delete Bill"
                    >
                      <Trash2 size={16} className="text-forest-400" />
                    </button>
                  </div>
                </div>

                {/* Bill Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-forest-800/20 rounded-lg p-3">
                    <p className="text-forest-300 text-xs mb-1">Amount</p>
                    <p className="text-lg font-numbers font-bold text-white">{formatCurrency(bill.amount)}</p>
                  </div>
                  <div className="bg-forest-800/20 rounded-lg p-3">
                    <p className="text-forest-300 text-xs mb-1">Frequency</p>
                    <p className="text-sm font-medium text-white capitalize">{bill.frequency.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-forest-800/20 rounded-lg p-3">
                    <p className="text-forest-300 text-xs mb-1">Status</p>
                    <p className={`text-sm font-medium ${getBillStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </p>
                  </div>
                  <div className="bg-forest-800/20 rounded-lg p-3">
                    <p className="text-forest-300 text-xs mb-1">Days Left</p>
                    <p className={`text-sm font-medium ${
                      daysUntilDue < 0 ? 'text-red-400' : 
                      daysUntilDue <= 3 ? 'text-orange-400' : 
                      daysUntilDue <= 7 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} overdue` : `${daysUntilDue} days`}
                    </p>
                  </div>
                </div>

                {/* Auto-pay and Reminder Settings */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {bill.autoPay && (
                      <span className="flex items-center gap-1 text-green-400">
                        <Zap size={14} />
                        Auto-pay enabled
                      </span>
                    )}
                    {bill.sendDueDateReminder && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Bell size={14} />
                        Reminders: {bill.reminderDaysBefore} days before
                      </span>
                    )}
                  </div>
                  {bill.lastPaidDate && (
                    <span className="text-forest-400">
                      Last paid: {format(new Date(bill.lastPaidDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Bill Transactions */}
        {recentBillTransactions.length > 0 && (
          <div className="bg-forest-900/30 backdrop-blur-md rounded-2xl p-6 border border-forest-600/20">
            <h3 className="text-lg font-heading font-semibold text-white mb-4">Recent Bill Payments</h3>
            <div className="space-y-3">
              {recentBillTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-forest-800/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingDown size={16} className="text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{transaction.description}</p>
                      <p className="text-xs text-forest-400">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-numbers font-bold text-red-400">
                      -{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Bill Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg"
          >
            <Plus size={24} />
          </Button>
        </div>
      </div>

      {/* Add Bill Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBill ? "Edit Bill" : "Add New Bill"}
      >
        <EnhancedBillForm
          onSubmit={editingBill ? handleEditBill : handleAddBill}
          onCancel={() => {
            setShowModal(false);
            setEditingBill(null);
          }}
          initialData={editingBill}
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
            accounts={accounts}
            onSubmit={handlePayBill}
            onCancel={() => setShowPaymentModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Bill"
      >
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Are you sure?</h3>
          <p className="text-forest-300 mb-6">
            This action cannot be undone. All payment history for this bill will be lost.
          </p>
          <div className="flex space-x-4">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteBill}
              variant="destructive"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Bill'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 left-6 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};