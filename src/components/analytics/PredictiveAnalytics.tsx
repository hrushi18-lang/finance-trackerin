import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, Target, Calendar, DollarSign } from 'lucide-react';

interface PredictionData {
  period: string;
  predicted: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
}

interface PredictiveAnalyticsProps {
  title: string;
  predictions: PredictionData[];
  formatCurrency: (amount: number) => string;
  showPercentage?: boolean;
  icon?: React.ReactNode;
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  title,
  predictions,
  formatCurrency,
  showPercentage = false,
  icon
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500/20';
    if (confidence >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />;
      default:
        return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-400';
      case 'decreasing':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        {icon || <Sparkles className="w-6 h-6 text-purple-400" />}
        <div>
          <h3 className="text-xl font-heading text-white">{title}</h3>
          <p className="text-sm text-gray-400">AI-powered predictions</p>
        </div>
      </div>

      <div className="space-y-4">
        {predictions.map((prediction, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">{prediction.period}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(prediction.trend)}
                <span className={`text-sm font-medium ${getTrendColor(prediction.trend)}`}>
                  {prediction.trend}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-white">
                  {showPercentage ? `${prediction.predicted.toFixed(1)}%` : formatCurrency(prediction.predicted)}
                </div>
                <div className="text-xs text-gray-400">Predicted Value</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                  {prediction.confidence.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">Confidence</div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getConfidenceBg(prediction.confidence)}`}
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>

            {/* Key Factors */}
            {prediction.factors.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2">Key Factors:</div>
                <div className="flex flex-wrap gap-1">
                  {prediction.factors.slice(0, 3).map((factor, factorIndex) => (
                    <span
                      key={factorIndex}
                      className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-300">
            <strong>Disclaimer:</strong> Predictions are based on historical data and trends. 
            Actual results may vary due to unforeseen circumstances.
          </div>
        </div>
      </div>
    </div>
  );
};
