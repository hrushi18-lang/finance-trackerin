import React, { useState, useMemo } from 'react';
import { CreditCard, Calendar, Percent, TrendingDown, Calculator, Target, AlertTriangle, CheckCircle, Plus, BarChart3, Clock } from 'lucide-react';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { EnhancedLiabilityForm } from '../forms/EnhancedLiabilityForm';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface DebtAnalytics {
  totalDebt: number;
  monthlyPayments: number;
  averageInterestRate: number;
  debtToIncomeRatio: number;
  payoffTimeline: Array<{
    month: string;
    remainingDebt: number;
    interestPaid: number;
    principalPaid: number;
  }>;
  debtBreakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
}

export const EnhancedDebtManagement: React.FC = () => {
  const { liabilities, stats, addLiability, updateLiability, deleteLiability } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'strategy'>('overview');

  // Calculate debt analytics
  const debtAnalytics: DebtAnalytics = useMemo(() => {
    const activeDebts = (liabilities || []).filter(debt => debt.remainingAmount > 0);
    
    const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const monthlyPayments = activeDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
    const averageInterestRate = activeDebts.length > 0 
      ? activeDebts.reduce((sum, debt) => sum + debt.interestRate, 0) / activeDebts.length 
      : 0;
    
    const debtToIncomeRatio = stats.monthlyIncome > 0 ? (monthlyPayments / stats.monthlyIncome) * 100 : 0;

    // Generate payoff timeline (next 24 months)
    const payoffTimeline = [];
    let currentDebts = activeDebts.map(debt => ({ ...debt }));
    
    for (let month = 0; month < 24; month++) {
      const monthDate = addMonths(new Date(), month);
      let totalRemaining = 0;
      let totalInterest = 0;
      let totalPrincipal = 0;

      currentDebts.forEach(debt => {
        if (debt.remainingAmount > 0) {
          const monthlyInterest = (debt.remainingAmount * debt.interestRate / 100) / 12;
          const monthlyPrincipal = Math.min(debt.monthlyPayment - monthlyInterest, debt.remainingAmount);
          
          totalInterest += monthlyInterest;
          totalPrincipal += monthlyPrincipal;
          
          debt.remainingAmount = Math.max(0, debt.remainingAmount - monthlyPrincipal);
          totalRemaining += debt.remainingAmount;
        }
      });

      payoffTimeline.push({
        month: format(monthDate, 'MMM yyyy'),
        remainingDebt: totalRemaining,
        interestPaid: totalInterest,
        principalPaid: totalPrincipal
      });

      if (totalRemaining === 0) break;
    }

    // Debt breakdown by liability
    const debtBreakdown = activeDebts.map((debt, index) => ({
      name: debt.name,
      amount: debt.remainingAmount,
      percentage: totalDebt > 0 ? (debt.remainingAmount / totalDebt) * 100 : 0,
      color: `hsl(${index * 45}, 70%, 60%)`
    }));

    return {
      totalDebt,
      monthlyPayments,
      averageInterestRate,
      debtToIncomeRatio,
      payoffTimeline,
      debtBreakdown
    };
  }, [liabilities, stats]);

  const handleAddLiability = async (data: any) => {
    try {
      await addLiability(data);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding liability:', error);
    }
  };

  const getDebtHealthColor = () => {
    if (debtAnalytics.debtToIncomeRatio <= 20) return 'text-success-400';
    if (debtAnalytics.debtToIncomeRatio <= 36) return 'text-warning-400';
    return 'text-error-400';
  };

  const getDebtHealthStatus = () => {
    if (debtAnalytics.debtToIncomeRatio <= 20) return 'Excellent';
    if (debtAnalytics.debtToIncomeRatio <= 36) return 'Good';
    if (debtAnalytics.debtToIncomeRatio <= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <CreditCard size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Enhanced Debt Management</h3>
              <p className="text-sm text-red-200">Comprehensive debt tracking and analytics</p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="bg-red-500 hover:bg-red-600"
          >
            <Plus size={16} className="mr-2" />
            Add Debt
          </Button>
        </div>

        {/* Debt Health Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Total Debt</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(debtAnalytics.totalDebt)}
            </p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Monthly Payments</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(debtAnalytics.monthlyPayments)}
            </p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Avg Interest Rate</p>
            <p className="text-lg font-bold text-warning-400">
              {debtAnalytics.averageInterestRate.toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Debt-to-Income</p>
            <p className={`text-lg font-bold ${getDebtHealthColor()}`}>
              {debtAnalytics.debtToIncomeRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400">{getDebtHealthStatus()}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/20 rounded-xl p-1 border border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: CreditCard },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'strategy', label: 'Strategy', icon: Target }
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
          {(liabilities || []).filter(debt => debt.remainingAmount > 0).length === 0 ? (
            <div className="text-center py-12 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
              <CreditCard size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No active debts</h3>
              <p className="text-gray-400 mb-6">Add your debts to track repayment progress</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus size={18} className="mr-2" />
                Add First Debt
              </Button>
            </div>
          ) : (
            (liabilities || []).filter(debt => debt.remainingAmount > 0).map((debt) => (
              <div key={debt.id} className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{debt.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">{debt.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                    {debt.interestRate}% APR
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Remaining</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(debt.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Monthly Payment</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(debt.monthlyPayment)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100}%` 
                    }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-400">
                  <span>
                    {(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100).toFixed(1)}% paid off
                  </span>
                  <span>
                    Due: {format(debt.due_date, 'MMM dd')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Payoff Timeline Chart */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h4 className="font-medium text-white mb-4">Debt Payoff Timeline</h4>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={debtAnalytics.payoffTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `${currency.symbol}${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Remaining Debt']}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="remainingDebt"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Debt Breakdown */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h4 className="font-medium text-white mb-4">Debt Breakdown</h4>
            
            <div className="space-y-3">
              {debtAnalytics.debtBreakdown.map((debt, index) => (
                <div key={debt.name} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: debt.color }}
                    />
                    <span className="font-medium text-white">{debt.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-white">{formatCurrency(debt.amount)}</span>
                    <p className="text-xs text-gray-400">{debt.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Debt Health Insights */}
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-start space-x-3">
              <BarChart3 size={18} className="text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Debt Health Analysis</h4>
                <div className="text-sm text-blue-300 space-y-1">
                  <p>• Debt-to-income ratio: {debtAnalytics.debtToIncomeRatio.toFixed(1)}% ({getDebtHealthStatus()})</p>
                  <p>• Average interest rate: {debtAnalytics.averageInterestRate.toFixed(1)}%</p>
                  <p>• Estimated debt-free date: {debtAnalytics.payoffTimeline.length > 0 ? 
                    debtAnalytics.payoffTimeline[debtAnalytics.payoffTimeline.length - 1]?.month || 'Unknown' : 'No active debt'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-6">
          {/* Debt Strategy Recommendations */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h4 className="font-medium text-white mb-4">Recommended Strategies</h4>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="flex items-start space-x-3">
                  <Calculator size={18} className="text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-400">Debt Avalanche Method</h5>
                    <p className="text-sm text-blue-300 mt-1">
                      Pay minimum on all debts, then put extra money toward the highest interest rate debt. 
                      This saves the most money over time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <div className="flex items-start space-x-3">
                  <Target size={18} className="text-purple-400 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-purple-400">Debt Snowball Method</h5>
                    <p className="text-sm text-purple-300 mt-1">
                      Pay minimum on all debts, then put extra money toward the smallest balance. 
                      This provides psychological wins and momentum.
                    </p>
                  </div>
                </div>
              </div>

              {debtAnalytics.debtToIncomeRatio > 36 && (
                <div className="p-4 bg-warning-500/20 rounded-lg border border-warning-500/30">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle size={18} className="text-warning-400 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-warning-400">High Debt-to-Income Ratio</h5>
                      <p className="text-sm text-warning-300 mt-1">
                        Your debt payments are {debtAnalytics.debtToIncomeRatio.toFixed(1)}% of your income. 
                        Consider debt consolidation or increasing income to improve financial health.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Liability Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Enhanced Liability"
      >
        <EnhancedLiabilityForm
          onSubmit={handleAddLiability}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};