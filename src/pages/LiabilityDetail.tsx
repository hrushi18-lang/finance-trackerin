import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, TrendingDown, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, Plus, Edit, Trash2, Percent } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useTheme } from '../contexts/ThemeContext';

import { ProgressBar } from '../components/analytics/ProgressBar';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { TrendChart } from '../components/analytics/TrendChart';
import Modal from '../components/common/Modal';
import { LiabilityForm } from '../components/forms/LiabilityForm';
import { MockTransactionForm } from '../components/forms/MockTransactionForm';

interface LiabilityDetailProps {}

const LiabilityDetail: React.FC<LiabilityDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { currency, formatCurrency, formatDate } = useInternationalization();
  const { 
    liabilities, 
    accounts, 
    transactions, 
    updateLiability, 
    deleteLiability, 
    addTransaction,
    getLiabilityTransactions,
    repayLiabilityFromAccount
  } = useFinance();

  const [liability, setLiability] = useState<any>(null);
  const [liabilityTransactions, setLiabilityTransactions] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    if (id && liabilities) {
      const foundLiability = liabilities.find(l => l.id === id);
      if (foundLiability) {
        setLiability(foundLiability);
        setSelectedAccount(foundLiability.defaultPaymentAccountId || '');
        
        // Get liability-specific transactions
        const liabilityTrans = getLiabilityTransactions(id);
        setLiabilityTransactions(liabilityTrans);
        
        // Get payment history (same as transactions for now)
        setPaymentHistory(liabilityTrans);
      }
    }
  }, [id, liabilities, getLiabilityTransactions]);

  const handleEditLiability = (updatedLiability: any) => {
    updateLiability(updatedLiability);
    setLiability(updatedLiability);
    setIsEditModalOpen(false);
  };

  const handleDeleteLiability = () => {
    if (liability && window.confirm('Are you sure you want to delete this liability?')) {
      deleteLiability(liability.id);
      navigate('/liabilities');
    }
  };

  const handleAddPayment = async (transaction: any) => {
    try {
      if (!liability || !selectedAccount) {
        throw new Error('Liability or account not selected');
      }

      // Use repayLiabilityFromAccount to properly update both transaction and liability
      await repayLiabilityFromAccount(
        selectedAccount,
        liability.id,
        transaction.amount,
        transaction.description || `Payment for ${liability.name}`
      );
      
      setIsPaymentModalOpen(false);
      
      // Refresh data
      const liabilityTrans = getLiabilityTransactions(liability.id);
      setLiabilityTransactions(liabilityTrans);
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  if (!liability) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 dark:from-forest-900 dark:to-forest-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-forest-300">Loading liability details...</p>
        </div>
      </div>
    );
  }

  const totalPaid = liabilityTransactions.reduce((sum, trans) => sum + trans.amount, 0);
  const remainingBalance = liability.original_amount - totalPaid;
  const paymentPercentage = (totalPaid / liability.original_amount) * 100;
  const isFullyPaid = totalPaid >= liability.original_amount;

  // Calculate interest and payment analytics
  const monthlyPayments = liabilityTransactions.reduce((acc, trans) => {
    const month = new Date(trans.date).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentTypes = liabilityTransactions.reduce((acc, trans) => {
    const type = trans.payment_type || 'Regular Payment';
    acc[type] = (acc[type] || 0) + trans.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate interest paid (simplified)
  const interestPaid = liabilityTransactions.reduce((sum, trans) => {
    return sum + (trans.interest_amount || 0);
  }, 0);

  const principalPaid = totalPaid - interestPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 dark:from-forest-900 dark:to-forest-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-forest-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/liabilities')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-forest-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-forest-300" />
              </button>
              <div>
                <h1 className="text-xl font-heading text-gray-900 dark:text-forest-100">
                  {liability.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-forest-400">
                  Liability Details & Payment Tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isFullyPaid && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
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
                onClick={handleDeleteLiability}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Liability Card */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liability Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-3 rounded-xl ${
                  isFullyPaid 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : 'bg-purple-100 dark:bg-purple-900/20'
                }`}>
                  <CreditCard className={`h-8 w-8 ${
                    isFullyPaid 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
                <div>
                  <h2 className="text-2xl font-heading text-gray-900 dark:text-forest-100">
                    {liability.name}
                  </h2>
                  <p className="text-gray-600 dark:text-forest-400">
                    {liability.description}
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
                    isFullyPaid ? 'bg-green-500' : 'bg-purple-500'
                  }`}
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-forest-400">
                  <span>{formatCurrency(totalPaid, currency)}</span>
                  <span>{formatCurrency(liability.original_amount, currency)}</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-xl p-4 ${
                  isFullyPaid 
                    ? 'bg-green-50 dark:bg-green-900/10' 
                    : 'bg-purple-50 dark:bg-purple-900/10'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className={`h-5 w-5 ${
                      isFullyPaid 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-purple-600 dark:text-purple-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                      {isFullyPaid ? 'Fully Paid' : 'Remaining Balance'}
                    </span>
                  </div>
                  <p className={`text-xl font-numbers ${
                    isFullyPaid 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {isFullyPaid ? 'Paid Off' : formatCurrency(remainingBalance, currency)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-forest-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Percent className="h-5 w-5 text-gray-600 dark:text-forest-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-forest-300">
                      Interest Rate
                    </span>
                  </div>
                  <p className="text-xl font-numbers text-gray-900 dark:text-forest-100">
                    {liability.interest_rate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Liability Stats */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-forest-700 dark:to-forest-600 rounded-xl p-6">
                <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100 mb-4">
                  Liability Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Date Created</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatDate(liability.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Original Amount</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(liability.original_amount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Payments Made</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {liabilityTransactions.length}
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

              {/* Payment Breakdown */}
              <div className="bg-white dark:bg-forest-800 rounded-xl p-6 border border-gray-200 dark:border-forest-700">
                <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100 mb-4">
                  Payment Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Principal Paid</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(principalPaid, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-forest-300">Interest Paid</span>
                    <span className="font-numbers text-gray-900 dark:text-forest-100">
                      {formatCurrency(interestPaid, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 dark:border-forest-700 pt-3">
                    <span className="font-medium text-gray-700 dark:text-forest-300">Total Paid</span>
                    <span className="font-numbers font-medium text-gray-900 dark:text-forest-100">
                      {formatCurrency(totalPaid, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`rounded-xl p-6 ${
                isFullyPaid 
                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' 
                  : 'bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {isFullyPaid ? (
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  )}
                  <div>
                    <h4 className={`font-heading ${
                      isFullyPaid 
                        ? 'text-green-800 dark:text-green-300' 
                        : 'text-purple-800 dark:text-purple-300'
                    }`}>
                      {isFullyPaid ? 'Fully Paid' : 'Active Liability'}
                    </h4>
                    <p className={`text-sm ${
                      isFullyPaid 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-purple-600 dark:text-purple-400'
                    }`}>
                      {isFullyPaid 
                        ? 'Liability paid off'
                        : `${formatCurrency(remainingBalance, currency)} remaining`
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
              <BarChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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

          {/* Payment Types */}
          <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Payment Types
              </h3>
            </div>
            {Object.keys(paymentTypes).length > 0 ? (
              <RingChart
                data={Object.entries(paymentTypes).map(([type, amount]) => ({
                  name: type,
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

        {/* Balance Trend */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingDown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
              Balance Trend
            </h3>
          </div>
          <TrendChart
            data={liabilityTransactions.map((trans, index) => ({
              date: trans.date,
              value: liability.original_amount - liabilityTransactions.slice(0, index + 1).reduce((sum, t) => sum + t.amount, 0)
            }))}
            height={200}
          />
        </div>

        {/* Payment History */}
        <div className="bg-white/80 dark:bg-forest-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-forest-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-heading text-gray-900 dark:text-forest-100">
                Payment History
              </h3>
            </div>
            <span className="text-sm text-gray-500 dark:text-forest-400">
              {liabilityTransactions.length} payments
            </span>
          </div>

          {liabilityTransactions.length > 0 ? (
            <div className="space-y-3">
              {liabilityTransactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-forest-700/50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-forest-100">
                        {transaction.payment_type || 'Payment'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-forest-400">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers text-purple-600 dark:text-purple-400">
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
                <CreditCard className="h-8 w-8 text-gray-400 dark:text-forest-500" />
              </div>
              <p className="text-gray-500 dark:text-forest-400 mb-4">
                No payments made yet
              </p>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Make First Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Liability Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Liability"
        size="lg"
      >
        <LiabilityForm
          initialData={liability}
          onSubmit={handleEditLiability}
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
          maxAmount={remainingBalance}
        />
      </Modal>
    </div>
  );
};

export default LiabilityDetail;