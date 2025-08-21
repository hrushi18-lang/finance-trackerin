import React, { useMemo } from 'react';
import { Zap, AlertTriangle, CheckCircle, DollarSign, Calendar, Trash2, Edit3 } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface BillOptimizationAlertsProps {
  recurringTransactions: any[];
}

interface OptimizationAlert {
  type: 'duplicate' | 'subscription_overload' | 'timing_optimization' | 'payment_method' | 'category_consolidation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  savings?: number;
  transactions: any[];
  actions: string[];
}

export const BillOptimizationAlerts: React.FC<BillOptimizationAlertsProps> = ({
  recurringTransactions
}) => {
  const { formatCurrency } = useInternationalization();

  const optimizationAlerts = useMemo(() => {
    const alerts: OptimizationAlert[] = [];
    const bills = recurringTransactions.filter(rt => rt.isBill);

    // Check for subscription overload
    const subscriptions = bills.filter(bill => 
      bill.category?.toLowerCase().includes('subscription') ||
      bill.description?.toLowerCase().includes('subscription') ||
      bill.category?.toLowerCase().includes('entertainment')
    );

    if (subscriptions.length >= 3) {
      const totalSubscriptionCost = subscriptions.reduce((sum, sub) => {
        let monthlyCost = sub.amount;
        if (sub.frequency === 'yearly') monthlyCost = sub.amount / 12;
        if (sub.frequency === 'weekly') monthlyCost = sub.amount * 4.33;
        return sum + monthlyCost;
      }, 0);

      alerts.push({
        type: 'subscription_overload',
        title: 'Multiple Subscriptions Detected',
        description: `You have ${subscriptions.length} active subscriptions costing ${formatCurrency(totalSubscriptionCost)} monthly. Consider consolidating or canceling unused ones.`,
        impact: 'medium',
        savings: totalSubscriptionCost * 0.3, // Estimate 30% savings
        transactions: subscriptions,
        actions: ['Review usage', 'Cancel unused', 'Look for bundle deals']
      });
    }

    // Check for duplicate categories
    const categoryGroups = bills.reduce((groups, bill) => {
      const category = bill.category.toLowerCase();
      if (!groups[category]) groups[category] = [];
      groups[category].push(bill);
      return groups;
    }, {} as Record<string, any[]>);

    Object.entries(categoryGroups).forEach(([category, transactions]) => {
      if (transactions.length > 2 && category !== 'other') {
        const totalCost = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        alerts.push({
          type: 'category_consolidation',
          title: `Multiple ${category} Bills`,
          description: `You have ${transactions.length} bills in the ${category} category totaling ${formatCurrency(totalCost)}. Consider consolidating providers.`,
          impact: 'low',
          savings: totalCost * 0.15,
          transactions,
          actions: ['Compare providers', 'Negotiate better rates', 'Bundle services']
        });
      }
    });

    // Check for timing optimization
    const sameDayBills = bills.reduce((groups, bill) => {
      const day = new Date(bill.nextOccurrenceDate).getDate();
      if (!groups[day]) groups[day] = [];
      groups[day].push(bill);
      return groups;
    }, {} as Record<number, any[]>);

    Object.entries(sameDayBills).forEach(([day, dayBills]) => {
      if (dayBills.length > 3) {
        const totalAmount = dayBills.reduce((sum, bill) => sum + bill.amount, 0);
        
        alerts.push({
          type: 'timing_optimization',
          title: 'Bills Clustered on Same Day',
          description: `${dayBills.length} bills (${formatCurrency(totalAmount)}) are due on day ${day}. Consider spreading them out for better cash flow.`,
          impact: 'medium',
          transactions: dayBills,
          actions: ['Stagger due dates', 'Contact providers', 'Improve cash flow']
        });
      }
    });

    // Check for high-cost recurring expenses
    const highCostBills = bills.filter(bill => {
      let monthlyCost = bill.amount;
      if (bill.frequency === 'yearly') monthlyCost = bill.amount / 12;
      if (bill.frequency === 'weekly') monthlyCost = bill.amount * 4.33;
      return monthlyCost > 500;
    });

    if (highCostBills.length > 0) {
      alerts.push({
        type: 'payment_method',
        title: 'High-Cost Bills Optimization',
        description: `You have ${highCostBills.length} high-cost recurring expenses. Consider negotiating better rates or finding alternatives.`,
        impact: 'high',
        transactions: highCostBills,
        actions: ['Negotiate rates', 'Shop competitors', 'Consider annual payments for discounts']
      });
    }

    return alerts.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }, [recurringTransactions, formatCurrency]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'subscription_overload': return <Zap size={18} className="text-warning-400" />;
      case 'category_consolidation': return <DollarSign size={18} className="text-blue-400" />;
      case 'timing_optimization': return <Calendar size={18} className="text-purple-400" />;
      case 'payment_method': return <AlertTriangle size={18} className="text-error-400" />;
      default: return <CheckCircle size={18} className="text-success-400" />;
    }
  };

  const getAlertColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-error-500/20 border-error-500/30';
      case 'medium': return 'bg-warning-500/20 border-warning-500/30';
      case 'low': return 'bg-blue-500/20 border-blue-500/30';
      default: return 'bg-primary-500/20 border-primary-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimization Score */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-green-500/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Bill Optimization Score</h3>
          <span className="text-2xl font-bold text-white">
            {Math.max(100 - (optimizationAlerts.length * 15), 0)}/100
          </span>
        </div>
        <p className="text-green-300 text-sm">
          {optimizationAlerts.length === 0 
            ? 'Your recurring transactions are well optimized!'
            : `${optimizationAlerts.length} optimization opportunities found`}
        </p>
      </div>

      {/* Optimization Alerts */}
      <div className="space-y-4">
        <h4 className="font-medium text-white">Optimization Opportunities</h4>
        
        {optimizationAlerts.length === 0 ? (
          <div className="bg-success-500/20 rounded-lg p-6 border border-success-500/30 text-center">
            <CheckCircle size={48} className="mx-auto text-success-400 mb-4" />
            <h4 className="font-medium text-success-400 mb-2">All Optimized!</h4>
            <p className="text-success-300 text-sm">
              Your recurring transactions are well-structured. Keep monitoring for new optimization opportunities.
            </p>
          </div>
        ) : (
          optimizationAlerts.map((alert, index) => (
            <div key={index} className={`rounded-lg p-4 border ${getAlertColor(alert.impact)}`}>
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">{alert.title}</h5>
                    {alert.savings && (
                      <span className="px-2 py-1 bg-success-500/20 text-success-400 text-xs rounded">
                        Save up to {formatCurrency(alert.savings)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{alert.description}</p>
                  
                  {/* Affected Transactions */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-2">Affected transactions:</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.transactions.slice(0, 3).map((transaction, i) => (
                        <span key={i} className="px-2 py-1 bg-black/30 text-gray-300 text-xs rounded">
                          {transaction.description}
                        </span>
                      ))}
                      {alert.transactions.length > 3 && (
                        <span className="px-2 py-1 bg-black/30 text-gray-400 text-xs rounded">
                          +{alert.transactions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Items */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Recommended actions:</p>
                    <div className="space-y-1">
                      {alert.actions.map((action, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                          <span className="text-xs text-primary-300">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <h4 className="font-medium text-white mb-4">Monthly Recurring Breakdown</h4>
        
        <div className="space-y-3">
          {['monthly', 'weekly', 'yearly'].map(freq => {
            const items = recurringTransactions.filter(rt => rt.frequency === freq && rt.isActive);
            const total = items.reduce((sum, item) => {
              let monthlyAmount = item.amount;
              if (freq === 'weekly') monthlyAmount = item.amount * 4.33;
              if (freq === 'yearly') monthlyAmount = item.amount / 12;
              return sum + monthlyAmount;
            }, 0);

            if (items.length === 0) return null;

            return (
              <div key={freq} className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                <div>
                  <p className="font-medium text-white capitalize">{freq} Items</p>
                  <p className="text-xs text-gray-400">{items.length} transactions</p>
                </div>
                <span className="font-semibold text-white">{formatCurrency(total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};