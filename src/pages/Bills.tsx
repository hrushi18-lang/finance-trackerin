import React, { useState } from 'react';
import { Calendar, Bell, Plus, Edit3, Trash2, AlertTriangle, CheckCircle, Clock, CreditCard, Zap, Play, Pause, Target, DollarSign } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { EnhancedBillForm } from '../components/forms/EnhancedBillForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

export const Bills: React.FC = () => {
  const { recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, addTransaction, accounts } = useFinance();
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
  const bills = recurringTransactions.filter(rt => rt.type === 'expense');
  
  const categorizedBills = {
    upcoming: bills.filter(bill => {
      const daysUntilDue = differenceInDays(new Date(bill.nextOccurrenceDate), new Date());
      return daysUntilDue >= 0 && daysUntilDue <= 30;
    }),
    overdue: bills.filter(bill => {
      const daysUntilDue = differenceInDays(new Date(bill.nextOccurrenceDate), new Date());
      return daysUntilDue < 0;
    }),
    paid: bills.filter(bill => !bill.isActive),
    all: bills
  };

  const handleAddBill = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert to recurring transaction format
      const recurringData = {
        type: 'expense' as const,
        amount: data.amount,
        category: data.category,
        description: data.title,
        frequency: data.frequency === 'bi_weekly' ? 'weekly' : 
                   data.frequency === 'quarterly' ? 'monthly' :
                   data.frequency === 'semi_annual' ? 'monthly' :
                   data.frequency === 'annual' ? 'yearly' :
                   data.frequency === 'one_time' ? 'monthly' : data.frequency,
        startDate: data.dueDate,
        nextOccurrenceDate: data.dueDate,
        isActive: true,
        currentOccurrences: 0,
        // Enhanced bill properties
        billType: data.billType,
        isEmi: data.isEmi,
        isEssential: data.isEssential,
        autoPay: data.autoPay,
        reminderDaysBefore: data.reminderDaysBefore,
        accountId: data.defaultAccountId
      };
      
      await addRecurringTransaction(recurringData);
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
        await updateRecurringTransaction(editingBill.id, {
          amount: data.amount,
          category: data.category,
          description: data.title,
          frequency: data.frequency,
          isActive: true
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

  const handlePayBill = async (bill: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create payment transaction
      await addTransaction({
        type: 'expense',
        amount: bill.amount,
        category: bill.category,
        description: `Bill payment: ${bill.description}`,
        date: new Date(),
        accountId: bill.accountId || accounts?.[0]?.id
      });

      // Update next occurrence date
      const nextDate = addDays(new Date(bill.nextOccurrenceDate), 
        bill.frequency === 'weekly' ? 7 :
        bill.frequency === 'monthly' ? 30 :
        bill.frequency === 'yearly' ? 365 : 30
      );

      await updateRecurringTransaction(bill.id, {
        nextOccurrenceDate: nextDate,
        lastProcessedDate: new Date(),
        currentOccurrences: (bill.currentOccurrences || 0) + 1
      });

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

  const getBillStatus = (bill: any) => {
    const daysUntilDue = differenceInDays(new Date(bill.nextOccurrenceDate), new Date());
    
    if (daysUntilDue < 0) return { status: 'overdue', color: 'error', label: '⚠️ Overdue', priority: 'high' };
    if (daysUntilDue === 0) return { status: 'due_today', color: 'error', label: '🚨 Due Today', priority: 'high' };
    if (daysUntilDue <= 3) return { status: 'due_soon', color: 'warning', label: `⏰ Due in ${daysUntilDue} days`, priority: 'medium' };
    if (daysUntilDue <= 7) return { status: 'upcoming', color: 'primary', label: `📅 Due in ${daysUntilDue} days`, priority: 'low' };
    return { status: 'scheduled', color: 'gray', label: '📋 Scheduled', priority: 'low' };
  };

  const getBillTypeIcon = (category: string) => {
    const icons = {
      'Housing': '🏠',
      'Utilities': '⚡',
      'Internet': '🌐',
      'Phone': '📱',
      'Subscriptions': '📺',
      'Insurance': '🛡️',
      'Loan EMI': '🏦',
      'Credit Card': '💳',
      'Transportation': '🚗',
      'Other': '📄'
    };
    return icons[category as keyof typeof icons] || '📄';
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

  const currentTabBills = categorizedBills[activeTab];

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="📅 Bills & Payments" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          💡 Never miss a payment again! Track all your bills and due dates
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

        {/* Bills Summary Dashboard */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 mb-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Bills Dashboard</h3>
              <p className="text-blue-200 text-sm">Your payment obligations overview</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <Calendar size={20} className="mx-auto text-primary-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Monthly Bills</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(totalMonthlyBills)}
              </p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <Bell size={20} className="mx-auto text-warning-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Due This Week</p>
              <p className="text-lg font-bold text-white">{categorizedBills.upcoming.length}</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <AlertTriangle size={20} className="mx-auto text-error-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Overdue</p>
              <p className="text-lg font-bold text-white">{categorizedBills.overdue.length}</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <CheckCircle size={20} className="mx-auto text-success-400 mb-2" />
              <p className="text-xs text-gray-400 mb-1">Total Bills</p>
              <p className="text-lg font-bold text-white">{bills.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/20 rounded-xl p-1 border border-white/10 mb-6">
          {[
            { id: 'upcoming', label: 'Upcoming', count: categorizedBills.upcoming.length },
            { id: 'overdue', label: 'Overdue', count: categorizedBills.overdue.length },
            { id: 'paid', label: 'Paid', count: categorizedBills.paid.length },
            { id: 'all', label: 'All', count: categorizedBills.all.length }
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
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bills List */}
        {currentTabBills.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-primary-400 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              {activeTab === 'upcoming' ? 'No upcoming bills' :
               activeTab === 'overdue' ? 'No overdue bills' :
               activeTab === 'paid' ? 'No paid bills' :
               'No bills tracked yet'}
            </h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              {bills.length === 0 
                ? 'Add your first bill to never miss a payment again'
                : `Switch to another tab to see your ${bills.length} bills`}
            </p>
            {bills.length === 0 && (
              <Button onClick={() => setShowModal(true)}>
                <Plus size={18} className="mr-2 sm:w-5 sm:h-5" />
                Add First Bill
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentTabBills.map((bill) => {
              const billStatus = getBillStatus(bill);
              const daysUntilDue = differenceInDays(new Date(bill.nextOccurrenceDate), new Date());
              
              return (
                <div key={bill.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getBillTypeIcon(bill.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">{bill.description}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{bill.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            billStatus.color === 'error' ? 'bg-error-500/20 text-error-400' :
                            billStatus.color === 'warning' ? 'bg-warning-500/20 text-warning-400' :
                            billStatus.color === 'primary' ? 'bg-primary-500/20 text-primary-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {billStatus.priority} priority
                          </span>
                          {bill.isEssential && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              Essential
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateRecurringTransaction(bill.id, { isActive: !bill.isActive })}
                        className={`p-2 rounded-lg transition-colors ${
                          bill.isActive 
                            ? 'hover:bg-warning-500/20 text-warning-400' 
                            : 'hover:bg-success-500/20 text-success-400'
                        }`}
                        title={bill.isActive ? 'Pause' : 'Resume'}
                      >
                        {bill.isActive ? <Pause size={16} /> : <Play size={16} />}
                      </button>
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
                  <div className={`text-center py-2 sm:py-3 rounded-xl border mb-4 ${
                    billStatus.color === 'error' ? 'bg-error-500/20 border-error-500/30' :
                    billStatus.color === 'warning' ? 'bg-warning-500/20 border-warning-500/30' :
                    billStatus.color === 'primary' ? 'bg-primary-500/20 border-primary-500/30' :
                    'bg-gray-500/20 border-gray-500/30'
                  }`}>
                    <span className={`font-medium text-sm ${
                      billStatus.color === 'error' ? 'text-error-400' :
                      billStatus.color === 'warning' ? 'text-warning-400' :
                      billStatus.color === 'primary' ? 'text-primary-400' :
                      'text-gray-400'
                    }`}>
                      {billStatus.label}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {bill.isActive && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowPaymentModal(true);
                        }}
                        className="flex-1"
                        size="sm"
                      >
                        💰 Pay Now
                      </Button>
                      <Button
                        onClick={() => {
                          // Mark as paid without transaction
                          const nextDate = addDays(new Date(bill.nextOccurrenceDate), 30);
                          updateRecurringTransaction(bill.id, {
                            nextOccurrenceDate: nextDate,
                            lastProcessedDate: new Date()
                          });
                        }}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        ✅ Mark Paid
                      </Button>
                    </div>
                  )}
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
              <h4 className="font-medium text-blue-400 mb-1">💡 Student Bill Management Tips</h4>
              <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                <li>Set up reminders 3-5 days before due dates to plan your spending</li>
                <li>Pay bills as soon as you get your allowance or salary</li>
                <li>Group bills by payment method to track which account to use</li>
                <li>Mark essential bills (rent, utilities) vs optional (subscriptions)</li>
                <li>Consider annual payments for discounts on subscriptions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bill Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBill(null);
          setError(null);
        }}
        title={editingBill ? 'Edit Bill' : 'Create New Bill'}
      >
        <EnhancedBillForm
          initialData={editingBill}
          onSubmit={editingBill ? handleEditBill : handleAddBill}
          onCancel={() => {
            setShowModal(false);
            setEditingBill(null);
            setError(null);
          }}
        />
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBill(null);
        }}
        title="Pay Bill"
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
              <h4 className="font-medium text-blue-400 mb-2">{selectedBill.description}</h4>
              <p className="text-blue-300 text-sm">
                Amount: {formatCurrency(selectedBill.amount)} • Due: {format(new Date(selectedBill.nextOccurrenceDate), 'MMM dd, yyyy')}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => handlePayBill(selectedBill)}
                className="flex-1"
                loading={isSubmitting}
              >
                💳 Pay from Account
              </Button>
              <Button
                onClick={() => {
                  // Mark as paid without creating transaction
                  const nextDate = addDays(new Date(selectedBill.nextOccurrenceDate), 30);
                  updateRecurringTransaction(selectedBill.id, {
                    nextOccurrenceDate: nextDate,
                    lastProcessedDate: new Date()
                  });
                  setShowPaymentModal(false);
                  setSelectedBill(null);
                }}
                variant="outline"
                className="flex-1"
              >
                ✅ Mark Paid
              </Button>
            </div>
          </div>
        )}
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