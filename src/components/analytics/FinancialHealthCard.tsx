import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface FinancialHealthMetrics {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  creditUtilization: number;
  emergencyFundMonths: number;
  investmentRatio: number;
  overallHealthScore: number;
  healthGrade: string;
  riskLevel: string;
  recommendations: string[];
}

interface FinancialHealthCardProps {
  metrics: FinancialHealthMetrics;
  formatCurrency: (amount: number) => string;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  metrics,
  formatCurrency
}) => {
  // Guard clause to handle undefined or incomplete metrics
  if (!metrics || typeof metrics !== 'object') {
    return (
      <div className="p-6 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
        <div className="text-center text-gray-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Financial health data is loading...</p>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6 text-green-400" />;
    if (score >= 60) return <Target className="w-6 h-6 text-yellow-400" />;
    if (score >= 40) return <AlertTriangle className="w-6 h-6 text-orange-400" />;
    return <AlertTriangle className="w-6 h-6 text-red-400" />;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'very_high': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <div>
            <h3 className="text-xl font-heading text-white">Financial Health</h3>
            <p className="text-sm text-gray-400">Your overall financial wellness</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getHealthColor(metrics.overallHealthScore || 0)}`}>
            {metrics.overallHealthScore || 0}
          </div>
          <div className="text-sm text-gray-400">Health Score</div>
        </div>
      </div>

      {/* Health Grade and Risk Level */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-white/5">
          <div className="flex items-center justify-center mb-2">
            {getHealthIcon(metrics.overallHealthScore || 0)}
          </div>
          <div className="text-2xl font-bold text-white">{metrics.healthGrade || 'N/A'}</div>
          <div className="text-sm text-gray-400">Health Grade</div>
        </div>
        <div className="text-center p-4 rounded-lg bg-white/5">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(metrics.riskLevel || 'unknown')}`}>
            {(metrics.riskLevel || 'unknown').replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-sm text-gray-400 mt-2">Risk Level</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Net Worth</span>
            <span className="text-sm font-medium text-white">
              {formatCurrency(metrics.netWorth || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Savings Rate</span>
            <span className="text-sm font-medium text-white">
              {(metrics.savingsRate || 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Emergency Fund</span>
            <span className="text-sm font-medium text-white">
              {(metrics.emergencyFundMonths || 0).toFixed(1)} months
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Debt-to-Income</span>
            <span className="text-sm font-medium text-white">
              {((metrics.debtToIncomeRatio || 0) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Credit Utilization</span>
            <span className="text-sm font-medium text-white">
              {(metrics.creditUtilization || 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Investment Ratio</span>
            <span className="text-sm font-medium text-white">
              {(metrics.investmentRatio || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {metrics.recommendations && metrics.recommendations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-white mb-3">Recommendations</h4>
          <div className="space-y-2">
            {metrics.recommendations.slice(0, 3).map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <span>{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
