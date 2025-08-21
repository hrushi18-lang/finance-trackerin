import React, { useState, useMemo } from 'react';
import { Calendar, Repeat, CreditCard, AlertTriangle, TrendingUp, TrendingDown, Zap, Bell, Plus, Edit3, Trash2, Play, Pause, DollarSign, Clock } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { SmartRecurringTransactionForm } from '../forms/SmartRecurringTransactionForm';
import { CashFlowForecast } from './CashFlowForecast';
import { BillOptimizationAlerts } from './BillOptimizationAlerts';

interface SmartRecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  nextOccurrenceDate: Date;
  isActive: boolean;
  isBill: boolean;
  paymentMethod?: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  reminderDays: number;
  autoProcess: boolean;
}

export const SmartRecurringManager: React.FC = () => {
  const { 
    recurringTransactions, 
    addRecurringTransaction, 
    updateRecurringTransaction, 
    deleteRecurringTransaction,
    transactions,
    goals 
  } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'bills' | 'forecast' | 'optimization'>('active');

  // Enhanced recurring transactions with bill classification
  const enhancedRecurring = useMemo(() => {
    return (recurringTransactions || []).map(rt => ({
      ...rt,
      isBill: rt.category?.toLowerCase().includes('bill') || 
              rt.category?.toLowerCase().includes('subscription') ||
              rt.category?.toLowerCase().includes('rent') ||
              rt.category?.toLowerCase().includes('insurance'),
      priority: getDuePriority(rt),
      tags: generateTags(rt)
    }));
  }, [recurringTransactions]);

  // Categorize transactions
  const activeRecurring = enhancedRecurring.filter(rt => rt.isActive);
  const bills = enhancedRecurring.filter(rt => rt.isBill && rt.isActive);
  const upcoming = enhancedRecurring.filter(rt => {
    const nextDate = new Date(rt.nextOccurrenceDate);
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isAfter(nextDate, new Date()) && isBefore(nextDate, sevenDaysFromNow);
  });

  // Calculate predictive analytics
  const monthlyRecurringTotal = useMemo(() => {
    return activeRecurring.reduce((sum, rt) => {
      let monthlyAmount = rt.amount;
      switch (rt.frequency) {
        case 'daily': monthlyAmount = rt.amount * 30; break;
        case 'weekly': monthlyAmount = rt.amount * 4.33; break;
        case 'bi-weekly': monthlyAmount = rt.amount * 2.17; break;
        case 'quarterly': monthlyAmount = rt.amount / 3; break;
        case 'yearly': monthlyAmount = rt.amount / 12; break;
        default: monthlyAmount = rt.amount;
      }
      return rt.type === 'income' ? sum + monthlyAmount : sum - monthlyAmount;
    }, 0);
  }, [activeRecurring]);

  function getDuePriority(rt: any): 'high' | 'medium' | 'low' {
    const nextDate = new Date(rt.nextOccurrenceDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 1) return 'high';
    if (daysUntilDue <= 7) return 'medium';
    return 'low';
  }

  function generateTags(rt: any): string[] {
    const tags = [];
    if (rt.isBill) tags.push('Bill');
    if (rt.type === 'expense' && rt.amount > 1000) tags.push('Large');
    if (rt.frequency === 'monthly') tags.push('Monthly');
    return tags;
  }

  const handleAddTransaction = async (data: any) => {
    try {
      await addRecurringTransaction(data);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
    }
  };

  const handleEditTransaction = async (data: any) => {
    try {
      if (editingTransaction) {
        await updateRecurringTransaction(editingTransaction.id, data);
        setEditingTransaction(null);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-error-500/20 border-error-500/30 text-error-400';
      case 'medium': return 'bg-warning-500/20 border-warning-500/30 text-warning-400';
      case 'low': return 'bg-success-500/20 border-success-500/30 text-success-400';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getNextOccurrenceText = (rt: any) => {
    const nextDate = new Date(rt.nextOccurrenceDate);
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return format(nextDate, 'MMM dd');
  };

  return (
    <div className="space-y-6">
      {/* Header with Smart Analytics */}
      <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-xl p-4 border border-primary-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Repeat size={20} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Smart Recurring Transactions</h3>
              <p className="text-sm text-primary-200">Automated financial tracking</p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="bg-primary-500 hover:bg-primary-600"
          >
            <Plus size={16} className="mr-2" />
            Add Recurring
          </Button>
        </div>

        {/* Predictive Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-400">Monthly Impact</span>
            </div>
            <p className={`text-lg font-bold ${monthlyRecurringTotal >= 0 ? 'text-success-400' : 'text-error-400'}`}>
              {monthlyRecurringTotal >= 0 ? '+' : ''}{formatCurrency(monthlyRecurringTotal)}
            </p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Bell size={16} className="text-orange-400" />
              <span className="text-xs text-gray-400">Upcoming Bills</span>
            </div>
            <p className="text-lg font-bold text-white">{upcoming.length}</p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Calendar size={16} className="text-blue-400" />
              <span className="text-xs text-gray-400">Active Items</span>
            </div>
            <p className="text-lg font-bold text-white">{activeRecurring.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/20 rounded-xl p-1 border border-white/10">
        {[
          { id: 'active', label: 'Active', icon: Repeat },
          { id: 'bills', label: 'Bills', icon: CreditCard },
          { id: 'forecast', label: 'Cash Flow', icon: TrendingUp },
          { id: 'optimization', label: 'Optimize', icon: Zap }
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
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeRecurring.length === 0 ? (
            <div className="text-center py-12 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
              <Repeat size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No recurring transactions</h3>
              <p className="text-gray-400 mb-6">Set up automatic transactions for regular income and expenses</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus size={18} className="mr-2" />
                Create First Recurring Transaction
              </Button>
            </div>
          ) : (
            activeRecurring.map((rt) => (
              <div key={rt.id} className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rt.type === 'income' ? 'bg-success-500/20' : 'bg-error-500/20'
                    }`}>
                      {rt.type === 'income' ? (
                        <TrendingUp size={20} className="text-success-400" />
                      ) : (
                        <TrendingDown size={20} className="text-error-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{rt.description}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">{rt.category}</span>
                        {rt.isBill && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Bill
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(rt.priority)}`}>
                          {rt.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingTransaction(rt);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 size={16} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteRecurringTransaction(rt.id)}
                      className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-error-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Amount & Frequency</p>
                    <p className={`text-lg font-bold ${rt.type === 'income' ? 'text-success-400' : 'text-error-400'}`}>
                      {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{rt.frequency}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Next Occurrence</p>
                    <p className="text-sm font-medium text-white">
                      {getNextOccurrenceText(rt)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(rt.nextOccurrenceDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {rt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rt.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-black/30 text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <h4 className="font-medium text-blue-400 mb-2">Bill Management</h4>
            <p className="text-sm text-blue-300">
              Track your recurring bills and get reminders before due dates.
            </p>
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-8 bg-black/20 rounded-xl border border-white/10">
              <CreditCard size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No bills configured</p>
              <p className="text-sm text-gray-500 mt-2">Add recurring transactions and mark them as bills</p>
            </div>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard size={20} className="text-blue-400" />
                    <div>
                      <h4 className="font-medium text-white">{bill.description}</h4>
                      <p className="text-sm text-gray-400">
                        Due {getNextOccurrenceText(bill)} • {formatCurrency(bill.amount)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(bill.priority)}`}>
                    {bill.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'forecast' && (
        <CashFlowForecast recurringTransactions={activeRecurring} />
      )}

      {activeTab === 'optimization' && (
        <BillOptimizationAlerts recurringTransactions={activeRecurring} />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Edit Recurring Transaction' : 'Create Smart Recurring Transaction'}
      >
        <SmartRecurringTransactionForm
          initialData={editingTransaction}
          onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
          onCancel={() => {
            setShowModal(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
};