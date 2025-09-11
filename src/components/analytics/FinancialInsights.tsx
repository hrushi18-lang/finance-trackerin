import React, { useState, useMemo } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface FinancialInsightsProps {
  data: any;
  onInsightClick: (insight: any) => void;
}

interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'spending' | 'savings' | 'income' | 'goals' | 'debt' | 'budget';
  actionable: boolean;
  actionText?: string;
  value?: number;
  trend?: number;
  priority: number;
}

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({
  data,
  onInsightClick
}) => {
  const { formatCurrency } = useInternationalization();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');

  const insights = useMemo((): Insight[] => {
    if (!data) return [];

    const generatedInsights: Insight[] = [];

    // Income Insights
    if (data.incomeTrend > 10) {
      generatedInsights.push({
        id: 'income-growth',
        type: 'positive',
        title: 'Strong Income Growth',
        description: `Your income has grown by ${data.incomeTrend}% this period. This is excellent progress!`,
        impact: 'high',
        category: 'income',
        actionable: true,
        actionText: 'Consider increasing savings rate',
        value: data.totalIncome,
        trend: data.incomeTrend,
        priority: 1
      });
    }

    // Spending Insights
    if (data.expenseTrend > 15) {
      generatedInsights.push({
        id: 'spending-increase',
        type: 'warning',
        title: 'Spending Increase Alert',
        description: `Your expenses have increased by ${data.expenseTrend}% this period. Review your spending patterns.`,
        impact: 'high',
        category: 'spending',
        actionable: true,
        actionText: 'Review budget categories',
        value: data.totalExpenses,
        trend: data.expenseTrend,
        priority: 2
      });
    }

    // Savings Rate Insights
    if (data.savingsRate < 10) {
      generatedInsights.push({
        id: 'low-savings',
        type: 'negative',
        title: 'Low Savings Rate',
        description: `Your savings rate is ${data.savingsRate}%. Financial experts recommend saving at least 20% of income.`,
        impact: 'high',
        category: 'savings',
        actionable: true,
        actionText: 'Create savings goal',
        value: data.savingsRate,
        priority: 3
      });
    } else if (data.savingsRate > 30) {
      generatedInsights.push({
        id: 'excellent-savings',
        type: 'positive',
        title: 'Excellent Savings Rate',
        description: `Your savings rate of ${data.savingsRate}% is outstanding! You're building wealth effectively.`,
        impact: 'medium',
        category: 'savings',
        actionable: false,
        value: data.savingsRate,
        priority: 4
      });
    }

    // Goal Progress Insights
    if (data.goalProgress < 50 && data.goalDeadline < 30) {
      generatedInsights.push({
        id: 'goal-behind',
        type: 'warning',
        title: 'Goal Behind Schedule',
        description: `You're ${100 - data.goalProgress}% behind on your goal with only ${data.goalDeadline} days left.`,
        impact: 'high',
        category: 'goals',
        actionable: true,
        actionText: 'Adjust goal timeline',
        value: data.goalProgress,
        priority: 2
      });
    }

    // Budget Insights
    if (data.budgetOverspend > 0) {
      generatedInsights.push({
        id: 'budget-overspend',
        type: 'negative',
        title: 'Budget Overspend',
        description: `You've overspent your budget by ${formatCurrency(data.budgetOverspend)} this period.`,
        impact: 'medium',
        category: 'budget',
        actionable: true,
        actionText: 'Review spending categories',
        value: data.budgetOverspend,
        priority: 3
      });
    }

    // Debt Insights
    if (data.debtToIncomeRatio > 0.4) {
      generatedInsights.push({
        id: 'high-debt-ratio',
        type: 'warning',
        title: 'High Debt-to-Income Ratio',
        description: `Your debt-to-income ratio is ${(data.debtToIncomeRatio * 100).toFixed(1)}%. Consider debt reduction strategies.`,
        impact: 'high',
        category: 'debt',
        actionable: true,
        actionText: 'Create debt payoff plan',
        value: data.debtToIncomeRatio,
        priority: 1
      });
    }

    // Opportunities
    if (data.unusedBudget > 0) {
      generatedInsights.push({
        id: 'unused-budget',
        type: 'opportunity',
        title: 'Unused Budget Available',
        description: `You have ${formatCurrency(data.unusedBudget)} unused in your budget. Consider investing or saving more.`,
        impact: 'medium',
        category: 'savings',
        actionable: true,
        actionText: 'Increase savings goal',
        value: data.unusedBudget,
        priority: 4
      });
    }

    return generatedInsights.sort((a, b) => a.priority - b.priority);
  }, [data, formatCurrency]);

  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory;
      const impactMatch = selectedImpact === 'all' || insight.impact === selectedImpact;
      return categoryMatch && impactMatch;
    });
  }, [insights, selectedCategory, selectedImpact]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return CheckCircle;
      case 'negative': return TrendingDown;
      case 'warning': return AlertTriangle;
      case 'opportunity': return Lightbulb;
      default: return BarChart3;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'negative': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'opportunity': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'spending', label: 'Spending' },
    { value: 'savings', label: 'Savings' },
    { value: 'income', label: 'Income' },
    { value: 'goals', label: 'Goals' },
    { value: 'debt', label: 'Debt' },
    { value: 'budget', label: 'Budget' }
  ];

  const impacts = [
    { value: 'all', label: 'All Impact Levels' },
    { value: 'high', label: 'High Impact' },
    { value: 'medium', label: 'Medium Impact' },
    { value: 'low', label: 'Low Impact' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Lightbulb size={24} className="text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Financial Insights</h2>
          <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
            {filteredInsights.length} insights
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <BarChart3 size={18} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Zap size={18} className="text-gray-400" />
          <select
            value={selectedImpact}
            onChange={(e) => setSelectedImpact(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
          >
            {impacts.map(impact => (
              <option key={impact.value} value={impact.value}>{impact.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb size={48} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No insights found</h3>
            <p className="text-gray-500">Try adjusting your filters or add more financial data.</p>
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const Icon = getInsightIcon(insight.type);
            const colorClass = getInsightColor(insight.type);
            const impactClass = getImpactColor(insight.impact);

            return (
              <div
                key={insight.id}
                className={`p-6 rounded-xl border ${colorClass} cursor-pointer hover:scale-[1.02] transition-transform`}
                onClick={() => onInsightClick(insight)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-gray-800/50">
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${impactClass} bg-gray-800`}>
                          {insight.impact.toUpperCase()} IMPACT
                        </span>
                        {insight.actionable && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">
                            ACTIONABLE
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 mb-3">{insight.description}</p>
                      {insight.value !== undefined && (
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-400">
                            Value: <span className="text-white font-semibold">
                              {typeof insight.value === 'number' && insight.value < 1 
                                ? `${(insight.value * 100).toFixed(1)}%`
                                : formatCurrency(insight.value)
                              }
                            </span>
                          </span>
                          {insight.trend !== undefined && (
                            <span className={`flex items-center space-x-1 ${
                              insight.trend >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {insight.trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              <span>{Math.abs(insight.trend)}%</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {insight.actionable && (
                      <div className="flex items-center space-x-1 text-blue-400">
                        <span className="text-sm">{insight.actionText}</span>
                        <ArrowRight size={16} />
                      </div>
                    )}
                    <Star size={20} className="text-yellow-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
