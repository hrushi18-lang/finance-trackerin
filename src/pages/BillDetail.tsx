import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MoreVertical, 
  FileText, 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { format, isAfter, isBefore, differenceInDays, addDays } from 'date-fns';
import LuxuryCategoryIcon from '../components/common/LuxuryCategoryIcon';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FlexibleBillPaymentForm } from '../components/forms/FlexibleBillPaymentForm';

const BillDetail: React.FC = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const { 
    bills, 
    transactions, 
    accounts,
    updateBill,
    addTransaction,
    getBillTransactions,
    payBillFlexible,
    getBillPaymentHistory,
    isLoading 
  } = useFinance();
  const { formatCurrency } = useInternationalization();
  
  const [showPayBill, setShowPayBill] = useState(false);
  const [showEditBill, setShowEditBill] = useState(false);

  // Find the current bill
  const bill = useMemo(() => {
    return bills.find(b => b.id === billId);
  }, [bills, billId]);

  // Get transactions related to this bill
  const billTransactions = useMemo(() => {
    if (!bill) return [];
    return getBillTransactions(bill.id);
  }, [bill, getBillTransactions]);

  // Calculate bill analytics
  const billAnalytics = useMemo(() => {
    if (!bill) return null;

    const totalPaid = billTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const isOverdue = isBefore(new Date(bill.nextDueDate), new Date()) && bill.isActive;
    const isDueSoon = differenceInDays(new Date(bill.nextDueDate), new Date()) <= 3 && differenceInDays(new Date(bill.nextDueDate), new Date()) >= 0;
    const isPaid = bill.lastPaidDate && isAfter(new Date(bill.lastPaidDate), new Date(bill.dueDate));
    
    const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
    const averagePayment = billTransactions.length > 0 ? totalPaid / billTransactions.length : 0;
    const paymentFrequency = billTransactions.length / Math.max(differenceInDays(new Date(), new Date(bill.createdAt)) / 30, 1);

    return {
      totalPaid,
      isOverdue,
      isDueSoon,
      isPaid,
      daysUntilDue,
      averagePayment,
      paymentFrequency
    };
  }, [bill, billTransactions]);

  // Get account info for account-specific bills
  const account = useMemo(() => {
    if (!bill || bill.billCategory !== 'account_specific' || !bill.defaultAccountId) return null;
    return accounts.find(a => a.id === bill.defaultAccountId);
  }, [bill, accounts]);

  const handlePayBill = async (paymentData: {
    amount: number;
    accountId: string;
    description: string;
    paymentType: 'full' | 'partial' | 'extra' | 'skip';
    skipReason?: string;
  }) => {
    if (!bill) return;

    try {
      await payBillFlexible(bill.id, paymentData);
      setShowPayBill(false);
    } catch (error) {
      console.error('Error paying bill:', error);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'completed' | 'cancelled') => {
    if (!bill) return;
    try {
      await updateBill(bill.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating bill status:', error);
    }
  };

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <h2 className="text-xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            Bill not found
          </h2>
          <Button onClick={() => navigate('/bills')}>
            Back to Bills
          </Button>
        </div>
      </div>
    );
  }

  if (!billAnalytics) return null;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="relative">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/bills')}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                  {bill.title}
                </h1>
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  {(bill.billCategory || 'general_expense').replace('_', ' ').toUpperCase()} • {bill.category}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEditBill(true)}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <Edit size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <button
                className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <MoreVertical size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          {/* Bill Status Hero Card */}
          <div 
            className="relative overflow-hidden rounded-3xl p-8 mb-6"
            style={{
              background: billAnalytics.isOverdue
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : billAnalytics.isDueSoon
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : billAnalytics.isPaid
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, var(--primary) 0%, #2d5016 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div className="text-center text-white">
              <div className="flex items-center justify-center mb-4">
                <LuxuryCategoryIcon category={bill.category} size={32} variant="luxury" />
              </div>
              <h2 className="text-lg font-body mb-2 opacity-90">Bill Amount</h2>
              <p className="text-4xl font-serif font-bold mb-2">
                {formatCurrency(bill.amount)}
              </p>
              <div className="flex items-center justify-center space-x-2 mb-2">
                {billAnalytics.isOverdue ? (
                  <AlertCircle size={16} />
                ) : billAnalytics.isDueSoon ? (
                  <Clock size={16} />
                ) : billAnalytics.isPaid ? (
                  <CheckCircle size={16} />
                ) : null}
                <p className="text-sm font-medium opacity-90">
                  {billAnalytics.isOverdue ? 'Overdue' :
                   billAnalytics.isDueSoon ? 'Due Soon' :
                   billAnalytics.isPaid ? 'Paid' : 'Upcoming'}
                </p>
              </div>
              <p className="text-sm font-medium opacity-90">
                Due: {format(new Date(bill.nextDueDate), 'MMM dd, yyyy')}
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full opacity-10" style={{ backgroundColor: 'white' }}></div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Bill Status and Actions */}
        <div 
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: 'var(--background-secondary)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                bill.status === 'active' ? 'bg-green-500' :
                bill.status === 'paused' ? 'bg-yellow-500' :
                bill.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>
                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
              </span>
            </div>
            <div className="flex space-x-2">
              {bill.status === 'active' && (
                <button
                  onClick={() => handleStatusChange('paused')}
                  className="p-2 rounded-lg transition-colors hover:bg-yellow-50"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Clock size={16} />
                </button>
              )}
              {bill.status === 'paused' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className="p-2 rounded-lg transition-colors hover:bg-green-50"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <CheckCircle size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Days Until Due</p>
              <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                {billAnalytics.daysUntilDue}
              </p>
            </div>
            <div>
              <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Frequency</p>
              <p className="text-lg font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                {bill.frequency.replace('_', ' ').charAt(0).toUpperCase() + bill.frequency.replace('_', ' ').slice(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Bill Analytics */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Analytics
          </h3>
          
          <div 
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
            }}
          >
            {/* Payment History Chart */}
            <div className="h-24 flex items-end justify-between space-x-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((week) => {
                const weekPayments = billTransactions
                  .filter(t => {
                    const transactionDate = new Date(t.date);
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - (7 - week) * 7);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return transactionDate >= weekStart && transactionDate < weekEnd;
                  })
                  .reduce((sum, t) => sum + (t.amount || 0), 0);
                
                const maxPayment = Math.max(...billTransactions.map(t => t.amount || 0), bill.amount);
                const height = (weekPayments / maxPayment) * 60;
                
                return (
                  <div key={week} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full rounded-t"
                      style={{ 
                        height: `${height}px`,
                        backgroundColor: 'var(--primary)',
                        opacity: 0.7
                      }}
                    ></div>
                    <span className="text-xs font-body mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      W{week}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Total Paid</p>
                <p className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(billAnalytics.totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Avg Payment</p>
                <p className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(billAnalytics.averagePayment)}
                </p>
              </div>
              <div>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>Payments/Month</p>
                <p className="text-sm font-numbers font-bold" style={{ color: 'var(--text-primary)' }}>
                  {billAnalytics.paymentFrequency.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowPayBill(true)}
              className="flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <CreditCard size={20} className="text-white" />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>Pay Bill</span>
            </button>

            <button
              onClick={() => setShowEditBill(true)}
              className="flex flex-col items-center space-y-2 p-4 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Edit size={20} className="text-white" />
              </div>
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>Edit Bill</span>
            </button>
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent Payments
          </h3>
          <div className="space-y-3">
            {billTransactions.length === 0 ? (
              <div 
                className="p-8 text-center rounded-2xl"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--background)' }}>
                  <FileText size={24} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                  No payments yet
                </h3>
                <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Pay this bill to see payment history
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowPayBill(true)}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <CreditCard size={16} />
                  <span>Pay Bill</span>
                </Button>
              </div>
            ) : (
              billTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-2xl"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <LuxuryCategoryIcon category={transaction.category} size={16} variant="minimal" />
                      <div>
                        <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                          {transaction.description}
                        </h4>
                        <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-numbers text-sm font-bold text-red-600">
                        -{formatCurrency(transaction.amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pay Bill Modal */}
      <Modal
        isOpen={showPayBill}
        onClose={() => setShowPayBill(false)}
        title="Pay Bill"
        size="lg"
      >
        <FlexibleBillPaymentForm
          bill={bill}
          accounts={accounts}
          onSubmit={handlePayBill}
          onCancel={() => setShowPayBill(false)}
        />
      </Modal>
    </div>
  );
};

export default BillDetail;