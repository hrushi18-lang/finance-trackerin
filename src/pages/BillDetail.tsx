import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useTheme } from '../contexts/ThemeContext';

import { ProgressBar } from '../components/analytics/ProgressBar';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { TrendChart } from '../components/analytics/TrendChart';
import Modal from '../components/common/Modal';
import { BillForm } from '../components/forms/BillForm';
import { MockTransactionForm } from '../components/forms/MockTransactionForm';

interface BillDetailProps {}

const BillDetail: React.FC<BillDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { currency, formatCurrency, formatDate } = useInternationalization();
  const { 
    bills, 
    accounts, 
    transactions, 
    updateBill, 
    deleteBill, 
    addTransaction,
    getBillTransactions,
    getBillPaymentHistory
  } = useFinance();

  const [bill, setBill] = useState<any>(null);
  const [billTransactions, setBillTransactions] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    if (id && bills) {
      const foundBill = bills.find(b => b.id === id);
      if (foundBill) {
        setBill(foundBill);
        setSelectedAccount(foundBill.account_id || '');
        
        // Get bill-specific transactions
        const billTrans = getBillTransactions(id);
        setBillTransactions(billTrans);
        
        // Get payment history
        const history = getBillPaymentHistory(id);
        setPaymentHistory(history);
      }
    }
  }, [id, bills, getBillTransactions, getBillPaymentHistory]);

  const handleEditBill = (updatedBill: any) => {
    updateBill(updatedBill);
    setBill(updatedBill);
    setIsEditModalOpen(false);
  };

  const handleDeleteBill = () => {
    if (bill && window.confirm('Are you sure you want to delete this bill?')) {
      deleteBill(bill.id);
      navigate('/bills');
    }
  };

  const handleAddPayment = (transaction: any) => {
    const newTransaction = {
      ...transaction,
      bill_id: bill?.id,
      account_id: selectedAccount,
      type: 'payment'
    };
    addTransaction(newTransaction);
    setIsPaymentModalOpen(false);
    
    // Refresh data
    const billTrans = getBillTransactions(bill?.id);
    setBillTransactions(billTrans);
  };

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 dark:from-forest-900 dark:to-forest-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-forest-300">Loading bill details...</p>
        </div>
      </div>
    );
  }

  const totalPaid = billTransactions.reduce((sum, trans) => sum + trans.amount, 0);
  const remainingAmount = bill.amount - totalPaid;
  const paymentPercentage = (totalPaid / bill.amount) * 100;
  const isFullyPaid = totalPaid >= bill.amount;
  const isOverdue = new Date(bill.due_date) < new Date() && !isFullyPaid;

  // Calculate analytics data
  const monthlyPayments = billTransactions.reduce((acc, trans) => {
    const month = new Date(trans.date).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethods = billTransactions.reduce((acc, trans) => {
    const method = trans.payment_method || 'Unknown';
    acc[method] = (acc[method] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  const daysUntilDue = Math.ceil((new Date(bill.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 dark:from-forest-900 dark:to-forest-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-forest-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/bills')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-forest-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-forest-300" />
              </button>
              <div>
                <h1 className="text-xl font-heading text-gray-900 dark:text-forest-100">
                  {bill.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-forest-400">
                  Bill Details & Payment History
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isFullyPaid && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Make Payment</span>
                </button>
              )}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-forest-700 transition-colors"
              >
                <Edit className="h-5 w-5 text-gray-600 dark:text-forest-300" />
              </button>
              <button
                onClick={handleDeleteBill}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Bill Card */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bill Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-3 rounded-xl ${
                  isFullyPaid 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : isOverdue 
                    ? 'bg-red-100 dark:bg-red-900/20' 
                    : 'bg-orange-100 dark:bg-orange-900/20'
                }`}>
                  <Receipt className={`h-8 w-8 ${
                    isFullyPaid 
                      ? 'text-green-600 dark:text-green-400' 
                      : isOverdue 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`} />
                </div>
                <div>
                  <h2 className="text-2xl font-heading text-gray-900 dark:text-forest-100">
                    {bill.name}
                  </h2>
                  <p className="text-gray-600 dark:text-forest-400">
                    {bill.description}
                  </p>
                </div>
              </div>

              {/* Payment Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                    Payment Progress
                  </span>
                  <span className={`text-sm font-numbers ${
                    isFullyPaid 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-900 dark:text-forest-100'
                  }`}>
                    {paymentPercentage.toFixed(1)}%
                  </span>
                </div>
                <ProgressBar 
                  value={Math.min(paymentPercentage, 100)} 
                  max={100}
                  className={`h-3 ${
                    isFullyPaid ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-forest-400">
                  <span>{formatCurrency(totalPaid, currency)}</span>
                  <span>{formatCurrency(bill.amount, currency)}</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-xl p-4 ${
                  isFullyPaid 
                    ? 'bg-green-50 dark:bg-green-900/10' 
                    : 'bg-orange-50 dark:bg-orange-900/10'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className={`h-5 w-5 ${
                      isFullyPaid 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                      {isFullyPaid ? 'Fully Paid' : 'Remaining'}
                    </span>
                  </div>
                  <p className={`text-xl font-numbers ${
                    isFullyPaid 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {isFullyPaid ? 'Paid' : formatCurrency(remainingAmount, currency)}
                  </p>
                </div>
                <div className={`rounded-xl p-4 ${
                  isOverdue 
                    ? 'bg-red-50 dark:bg-red-900/10' 
                    : 'bg-gray-50 dark:bg-forest-700/50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className={`h-5 w-5 ${
                      isOverdue 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-600 dark:text-forest-300'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                      {isOverdue ? 'Overdue' : 'Due Date'}
                    </span>
                  </div>
                  <p className={`text-xl font-numbers ${
                    isOverdue 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-900 dark:text-forest-100'
                  }`}>
                    {formatDate(bill.due_date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bill Stats */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-forest-700 dark:to-forest-600 rounded-xl p-6">
                <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100 mb-4">
                  Bill Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Date Created</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatDate(bill.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Bill Amount</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(bill.amount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Payments</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {billTransactions.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Total Paid</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(totalPaid, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`rounded-xl p-6 ${
                isFullyPaid 
                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
                  : isOverdue 
                  ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                  : 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {isFullyPaid ? (
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : isOverdue ? (
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  ) : (
                    <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  )}
                  <div>
                    <h4 className={`font-heading ${
                      isFullyPaid 
                        ? 'text-green-800 dark:text-green-300' 
                        : isOverdue 
                        ? 'text-red-800 dark:text-red-300'
                        : 'text-orange-800 dark:text-orange-300'
                    }`}>
                      {isFullyPaid ? 'Fully Paid' : isOverdue ? 'Overdue' : 'Pending'}
                    </h4>
                    <p className={`text-sm ${
                      isFullyPaid 
                        ? 'text-green-600 dark:text-green-400' 
                        : isOverdue 
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {isFullyPaid 
                        ? 'Payment completed'
                        : isOverdue 
                        ? `${Math.abs(daysUntilDue)} days overdue`
                        : `${daysUntilDue} days remaining`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Payments */}
          <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Monthly Payments
              </h3>
            </div>
            <BarChart
              data={Object.entries(monthlyPayments).map(([month, amount]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                value: amount
              }))}
              height={200}
            />
          </div>

          {/* Payment Methods */}
          <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Payment Methods
              </h3>
            </div>
            {Object.keys(paymentMethods).length > 0 ? (
              <RingChart
                data={Object.entries(paymentMethods).map(([method, amount]) => ({
                  name: method,
                  value: amount,
                  color: `hsl(${Math.random() * 360}, 70%, 50%)`
                }))}
                size={120}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-forest-400">No payment data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Payment History
              </h3>
            </div>
            <span className="text-sm text-gray-500 dark:text-forest-400">
              {billTransactions.length} payments
            </span>
          </div>

          {billTransactions.length > 0 ? (
            <div className="space-y-3">
              {billTransactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-forest-700/50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-forest-100">
                        Payment
                      </p>
                      <p className="text-sm text-gray-500 dark:text-forest-400">
                        {transaction.payment_method || 'Unknown method'} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers text-green-600 dark:text-green-400">
                      -{formatCurrency(transaction.amount, currency)}
                    </p>
                    {transaction.account_name && (
                      <p className="text-sm text-gray-500 dark:text-forest-400">
                        {transaction.account_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-100 dark:bg-forest-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Receipt className="h-8 w-8 text-gray-400 dark:text-forest-500" />
              </div>
              <p className="text-gray-500 dark:text-forest-400 mb-4">
                No payments made yet
              </p>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Make First Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Bill Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Bill"
        size="lg"
      >
        <BillForm
          initialData={bill}
          onSubmit={handleEditBill}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Make Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Make Payment"
        size="md"
      >
        <MockTransactionForm
          onSubmit={handleAddPayment}
          onCancel={() => setIsPaymentModalOpen(false)}
          defaultAccount={selectedAccount}
          transactionType="payment"
          maxAmount={remainingAmount}
        />
      </Modal>
    </div>
  );
};

export default BillDetail;