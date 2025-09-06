import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  metrics?: Record<string, any>;
  recommendations?: string[];
  createdAt: string;
  category: string;
}

interface FinancialInsightsCardProps {
  insight: FinancialInsight;
  className?: string;
}

export const FinancialInsightsCard: React.FC<FinancialInsightsCardProps> = ({
  insight,
  className = ''
}) => {
  const { currency } = useInternationalization();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp size={20} className="text-green-500" />;
      case 'negative':
        return <TrendingDown size={20} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-500" />;
      default:
        return <Target size={20} className="text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'negative':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30';
      case 'warning':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      default:
        return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getTypeColor(insight.type)} backdrop-blur-md rounded-xl p-4 border ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getTypeIcon(insight.type)}
          <div>
            <h3 className="text-white font-semibold text-lg leading-tight">{insight.title}</h3>
            <p className="text-gray-300 text-sm capitalize">{insight.category}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getImpactColor(insight.impact)}`}>
            {insight.impact.toUpperCase()}
          </span>
          <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-200 text-sm leading-relaxed">
          {insight.description}
        </p>
      </div>

      {/* Metrics */}
      {insight.metrics && Object.keys(insight.metrics).length > 0 && (
        <div className="mb-4 p-3 bg-black/20 rounded-lg">
          <h4 className="text-white font-medium text-sm mb-2">Key Metrics</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(insight.metrics).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-300 text-xs capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-white text-xs font-medium">
                  {typeof value === 'number' && key.includes('amount') 
                    ? `${currency.symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : typeof value === 'number' && key.includes('percentage')
                    ? `${value.toFixed(1)}%`
                    : typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value || '')
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insight.recommendations && insight.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-white font-medium text-sm mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {insight.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                <p className="text-gray-200 text-sm">{recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60"></div>
          <span>{Math.round(insight.confidence * 100)}% confidence</span>
        </div>
        <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
