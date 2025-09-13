import React, { useState, useMemo } from 'react';
import { Calendar, Bell, Plus, Edit3, Trash2, AlertTriangle, CheckCircle, Clock, CreditCard, Zap, Play, Pause, Target, DollarSign, AlertCircle, TrendingUp, TrendingDown, Eye, ArrowLeft, BarChart3, PieChart, Calendar as CalendarIcon, TrendingUp as TrendUp } from 'lucide-react';
import { format, differenceInDays, addDays, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/common/Modal';
import { EnhancedBillForm } from '../components/forms/EnhancedBillForm';
import { BillPaymentForm } from '../components/forms/BillPaymentForm';
import { Button } from '../components/common/Button';
import { RingChart } from '../components/analytics/RingChart';
import { BarChart } from '../components/analytics/BarChart';
import { AnalyticsEngine } from '../utils/analytics-engine';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

const Bills: React.FC = () => {
  const navigate = useNavigate();
  const { 
    bills, addBill, updateBill, deleteBill, addTransaction, accounts, liabilities, transactions, 
    payBillFromAccount, updateLiability, updateBillStage, handleBillCompletion, createVariableAmountBill, 
    createIncomeBill, payBillFromMultipleAccounts, goals, budgets, userCategories
  } = useFinance();
  const { formatCurrency, formatCurrencyWithSecondary, currency, supportedCurrencies } = useInternationalization();
  
  // Format bill amount with currency conversion info
  const formatBillAmount = (bill: any) => {
    const billCurrency = bill.currencyCode || currency.code;
    const needsConversion = billCurrency !== currency.code;
    
    if (needsConversion) {
      // Simple conversion rate (in real app, this would come from an API)
      const conversionRates: { [key: string]: { [key: string]: number } } = {
        'USD': { 'INR': 83.0, 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25, 'AUD': 1.35 },
        'EUR': { 'USD': 1.18, 'INR': 97.5, 'GBP': 0.86, 'JPY': 129.0, 'CAD': 1.47, 'AUD': 1.59 },
        'GBP': { 'USD': 1.37, 'INR': 113.5, 'EUR': 1.16, 'JPY': 150.0, 'CAD': 1.71, 'AUD': 1.85 },
        'INR': { 'USD': 0.012, 'EUR': 0.010, 'GBP': 0.009, 'JPY': 1.32, 'CAD': 0.015, 'AUD': 0.016 },
        'JPY': { 'USD': 0.009, 'INR': 0.76, 'EUR': 0.008, 'GBP': 0.007, 'CAD': 0.011, 'AUD': 0.012 },
        'CAD': { 'USD': 0.80, 'INR': 66.4, 'EUR': 0.68, 'GBP': 0.58, 'JPY': 87.5, 'AUD': 1.08 },
        'AUD': { 'USD': 0.74, 'INR': 61.5, 'EUR': 0.63, 'GBP': 0.54, 'JPY': 81.0, 'CAD': 0.93 }
      };
      
      const rate = conversionRates[billCurrency]?.[currency.code] || 1;
      const convertedAmount = bill.amount * rate;
      
      const billCurrencyInfo = supportedCurrencies.find(c => c.code === billCurrency);
      const billSymbol = billCurrencyInfo?.symbol || billCurrency;
      
      return (
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            {billSymbol}{bill.amount.toFixed(2)} {billCurrency}
          </div>
          <div className="text-sm text-gray-500">
            ≈ {formatCurrency(convertedAmount, currency.code)}
          </div>
        </div>
      );
    }
    
    return <span className="font-numbers">{formatCurrency(bill.amount)}</span>;
  };
  
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming' | 'overdue' | 'paid' | 'all'>('current');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  // Initialize analytics engine
  const analyticsEngine = useMemo(() => {
    return new AnalyticsEngine(
      transactions || [],
      accounts || [],
      goals || [],
      bills || [],
      liabilities || [],
      budgets || [],
      userCategories || []
    );
  }, [transactions, accounts, goals, bills, liabilities, budgets, userCategories]);

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'lastMonth':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1))
        };
      case 'last3Months':
        return {
          start: startOfMonth(subMonths(now, 3)),
          end: endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Get bill analytics
  const billAnalytics = useMemo(() => {
    return analyticsEngine.getBillAnalytics();
  }, [analyticsEngine]);

  // Enhanced bill filtering and categorization
  const categorizedBills = {
    upcoming: bills?.filter(bill => {
      const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
      return daysUntilDue >= 0 && daysUntilDue <= 15 && bill.status === 'active';
    }) || [],
    current: bills?.filter(bill => {
      const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
      return daysUntilDue >= 0 && daysUntilDue <= 3 && bill.status === 'active';
    }) || [],
    overdue: bills?.filter(bill => {
      const daysUntilDue = differenceInDays(new Date(bill.nextDueDate), new Date());
      return daysUntilDue < 0 && bill.status === 'active';
    }) || [],
    paid: bills?.filter(bill => bill.status === 'completed' || bill.billStage === 'paid') || [],
    all: bills || []
  };

  // Calculate bill statistics
  const billStats = {
    totalBills: bills?.length || 0,
    activeBills: bills?.filter(b => b.status === 'active').length || 0,
    overdueBills: categorizedBills.overdue.length,
    upcomingBills: categorizedBills.upcoming.length,
    totalMonthlyAmount: bills
      ?.filter(b => b.status === 'active' && b.frequency === 'monthly')
      .reduce((sum, bill) => sum + bill.amount, 0) || 0,
    totalAnnualAmount: bills
      ?.filter(b => b.status === 'active')
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

  const handleBillStageChange = async (billId: string, stage: 'paid' | 'moved' | 'failed' | 'stopped') => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      let reason = '';
      let movedToDate: Date | undefined;
      
      if (stage === 'moved') {
        reason = prompt('Reason for moving this bill:') || 'Moved by user';
        const newDate = prompt('New due date (YYYY-MM-DD):');
        if (newDate) {
          movedToDate = new Date(newDate);
        }
      } else if (stage === 'failed') {
        reason = prompt('Reason for failure:') || 'Payment failed';
      } else if (stage === 'stopped') {
        reason = prompt('Reason for stopping:') || 'Stopped by user';
      }
      
      await updateBillStage(billId, stage, reason, movedToDate);
    } catch (error: any) {
      console.error('Error updating bill stage:', error);
      setError(error.message || 'Failed to update bill stage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBillCompletionAction = async (billId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const action = prompt('What would you like to do?\n1. Continue\n2. Extend\n3. Archive\n4. Delete\n\nEnter 1-4:');
      
      switch (action) {
        case '1':
          await handleBillCompletion(billId, 'continue');
          break;
        case '2':
          const newAmount = prompt('New amount (optional):');
          const newDueDate = prompt('New due date (YYYY-MM-DD, optional):');
          await handleBillCompletion(billId, 'extend', 
            newAmount ? parseFloat(newAmount) : undefined,
            newDueDate ? new Date(newDueDate) : undefined,
            'Extended by user'
          );
          break;
        case '3':
          const archiveReason = prompt('Reason for archiving:') || 'Archived by user';
          await handleBillCompletion(billId, 'archive', undefined, undefined, archiveReason);
          break;
        case '4':
          const deleteReason = prompt('Reason for deletion:') || 'Deleted by user';
          await handleBillCompletion(billId, 'delete', undefined, undefined, deleteReason);
          break;
        default:
          console.log('Invalid action selected');
      }
    } catch (error: any) {
      console.error('Error handling bill completion:', error);
      setError(error.message || 'Failed to handle bill completion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = async (billId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;
      
      const newAmount = prompt(`Enter new amount for "${bill.title}" (current: ${formatCurrency(bill.amount, bill.currencyCode)}):`);
      if (newAmount && !isNaN(parseFloat(newAmount))) {
        const amount = parseFloat(newAmount);
        if (amount > 0) {
          await updateBill(billId, { amount: amount });
        } else {
          alert('Amount must be greater than 0');
        }
      }
    } catch (error: any) {
      console.error('Error updating bill amount:', error);
      setError(error.message || 'Failed to update bill amount. Please try again.');
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/cards')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-heading">Bills & Payments</h1>
          </div>
          <button
            onClick={() => navigate('/bills/create')}
            className="btn-primary flex items-center space-x-2 px-4 py-2"
          >
            <Plus size={16} />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Bill Analytics Section */}
      <div className="px-4 mb-6">
        <div className="card-neumorphic p-4 slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              Bill Analytics
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 rounded-lg text-sm border border-gray-300 bg-white text-gray-900"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
              </select>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              >
                <BarChart3 size={16} className={showAnalytics ? 'text-blue-600' : 'text-gray-600'} />
              </button>
            </div>
          </div>

          {showAnalytics && (
            <div className="space-y-6">
              {/* Bill Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-blue-800">Total Bills</h3>
                    <Bell size={16} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-numbers text-blue-900">{billAnalytics.totalBills}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-green-800">Paid This Month</h3>
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-numbers text-green-900">{billAnalytics.paidThisMonth}</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-yellow-800">Upcoming</h3>
                    <Clock size={16} className="text-yellow-600" />
                  </div>
                  <p className="text-2xl font-numbers text-yellow-900">{billAnalytics.upcomingBills}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-red-800">Overdue</h3>
                    <AlertTriangle size={16} className="text-red-600" />
                  </div>
                  <p className="text-2xl font-numbers text-red-900">{billAnalytics.overdueBills}</p>
                </div>
              </div>

              {/* Bill Distribution by Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Bills by Category
                  </h3>
                  {billAnalytics.categoryBreakdown.length > 0 ? (
                    <RingChart
                      data={billAnalytics.categoryBreakdown.map((cat, index) => ({
                        label: cat.category,
                        value: cat.amount,
                        color: `hsl(${120 + index * 30}, 60%, 50%)`
                      }))}
                      size={180}
                      strokeWidth={15}
                      interactive={true}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No bill data for this period</p>
                    </div>
                  )}
                </div>

                {/* Monthly Payment Trends */}
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Monthly Payment Trends
                  </h3>
                  {billAnalytics.monthlyTrends.length > 0 ? (
                    <BarChart
                      data={billAnalytics.monthlyTrends.map(trend => ({
                        month: trend.month,
                        paid: trend.paidAmount,
                        due: trend.dueAmount
                      }))}
                      interactive={true}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No trend data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Bills Calendar */}
              <div>
                <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Upcoming Bills Calendar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {billAnalytics.upcomingBillsList.slice(0, 6).map((bill) => (
                    <div key={bill.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {bill.name}
                        </h4>
                        <span className="text-xs text-gray-500">{bill.frequency}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                          {formatBillAmount(bill)}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Due Date</span>
                          <span className="text-xs">{format(bill.nextDueDate, 'MMM dd')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Days Left</span>
                          <span className={`text-xs ${bill.daysUntilDue <= 3 ? 'text-red-600' : bill.daysUntilDue <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {bill.daysUntilDue} days
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment History */}
              {billAnalytics.paymentHistory.length > 0 && (
                <div>
                  <h3 className="text-md font-heading mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Recent Payments
                  </h3>
                  <div className="space-y-2">
                    {billAnalytics.paymentHistory.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {payment.billName}
                          </p>
                          <p className="text-xs text-gray-500">{payment.accountName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-numbers">{formatCurrencyWithSecondary(payment.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {format(payment.paymentDate, 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Bill Summary */}
        <div className="card p-4 slide-in-up">
          <div className="mb-4">
            <h2 className="text-lg font-heading">Bill Overview</h2>
          </div>
          
          {bills && bills.length > 0 ? (
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
        {bills && bills.length > 0 && (
          <div className="flex space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
            {[
              { key: 'current', label: 'Current (3 days)', count: categorizedBills.current.length },
              { key: 'upcoming', label: 'Upcoming (15 days)', count: categorizedBills.upcoming.length },
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
        {bills && bills.length > 0 && (
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
                          onClick={() => navigate(`/bills/${bill.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        
                        {/* Bill staging buttons */}
                        {bill.billStage === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowPaymentModal(true);
                              }}
                              className="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-green-500 hover:bg-green-600 text-white"
                              title="Mark as Paid"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => handleBillStageChange(bill.id, 'moved')}
                              className="px-2 py-1 rounded-full text-xs font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white"
                              title="Move to Later Date"
                            >
                              Move
                            </button>
                            <button
                              onClick={() => handleBillStageChange(bill.id, 'failed')}
                              className="px-2 py-1 rounded-full text-xs font-medium transition-colors bg-red-500 hover:bg-red-600 text-white"
                              title="Mark as Failed"
                            >
                              Failed
                            </button>
                            <button
                              onClick={() => handleBillStageChange(bill.id, 'stopped')}
                              className="px-2 py-1 rounded-full text-xs font-medium transition-colors bg-gray-500 hover:bg-gray-600 text-white"
                              title="Stop Bill"
                            >
                              Stop
                            </button>
                          </>
                        )}
                        
                        {/* Variable amount adjustment button */}
                        {bill.isVariableAmount && (
                          <button
                            onClick={() => handleAmountChange(bill.id)}
                            className="px-2 py-1 rounded-full text-xs font-medium transition-colors bg-purple-500 hover:bg-purple-600 text-white"
                            title="Adjust Amount"
                          >
                            Adjust
                          </button>
                        )}
                        
                        {bill.billStage === 'paid' && (
                          <button
                            onClick={() => handleBillCompletionAction(bill.id)}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-purple-500 hover:bg-purple-600 text-white"
                            title="Handle Completion"
                          >
                            Complete
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setEditingBill(bill);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                          title="Edit Bill"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
                          title="Delete Bill"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                          {bill.isIncome ? 'Income Amount' : 'Amount'}
                          {bill.isVariableAmount && ' (Variable)'}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-numbers">
                            {bill.isIncome ? '+' : '-'}{formatCurrency(bill.amount, bill.currencyCode)}
                          </p>
                          {bill.isVariableAmount && bill.minAmount && bill.maxAmount && (
                            <span className="text-xs text-gray-500">
                              ({formatCurrency(bill.minAmount, bill.currencyCode)} - {formatCurrency(bill.maxAmount, bill.currencyCode)})
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Due Date</p>
                        <p className="text-lg font-numbers">
                          {format(new Date(bill.nextDueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* New enhanced features display */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Currency */}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {bill.currencyCode}
                      </span>
                      
                      {/* Income/Expense indicator */}
                      {bill.isIncome ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Income
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Expense
                        </span>
                      )}
                      
                      {/* Bill stage */}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bill.billStage === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.billStage === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        bill.billStage === 'moved' ? 'bg-blue-100 text-blue-800' :
                        bill.billStage === 'failed' ? 'bg-red-100 text-red-800' :
                        bill.billStage === 'stopped' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bill.billStage.charAt(0).toUpperCase() + bill.billStage.slice(1)}
                      </span>
                      
                      {/* Priority */}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bill.priority === 'high' ? 'bg-red-100 text-red-800' :
                        bill.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {bill.priority.charAt(0).toUpperCase() + bill.priority.slice(1)} Priority
                      </span>
                      
                      {/* Variable amount indicator */}
                      {bill.isVariableAmount && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Variable
                        </span>
                      )}
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
            accounts={accounts}
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
