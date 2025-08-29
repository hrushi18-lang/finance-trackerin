import React, { useState } from 'react';
import { Lightbulb, RefreshCw, TrendingUp, TrendingDown, Info, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { Button } from '../common/Button';

interface FinancialInsightsProps {
  maxInsights?: number;
}

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ maxInsights = 3 }) => {
  const { insights, refreshInsights } = useFinance();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshInsights();
    } catch (error) {
      console.error('Error refreshing insights:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAiGenerate = async () => {
    setIsAiGenerating(true);
    try {
      // Simulate AI generation with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refreshInsights();
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle size={18} className="text-success-400" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-warning-400" />;
      case 'info':
      default:
        return <Info size={18} className="text-primary-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-success-500/20 border-success-500/30';
      case 'warning':
        return 'bg-warning-500/20 border-warning-500/30';
      case 'info':
      default:
        return 'bg-primary-500/20 border-primary-500/30';
    }
  };

  const displayedInsights = showAll ? insights : insights.slice(0, maxInsights);

  if (insights.length === 0) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <span className="text-xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Your Financial Coach</h3>
          </div>
          <Button
            onClick={handleAiGenerate}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            loading={isAiGenerating}
          >
            <span className="mr-2">✨</span>
            Get Coaching Tips
          </Button>
        </div>
        
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">🎓</span>
          <p className="text-gray-400">Your financial coach is ready!</p>
          <p className="text-sm text-gray-500 mt-2">Start tracking transactions to get personalized money tips</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <span className="text-xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Your Financial Coach</h3>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleAiGenerate}
            variant="outline"
            size="sm"
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            loading={isAiGenerating}
          >
            <span className="mr-2">🧠</span>
            Get Tips
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            loading={isRefreshing}
          >
            <span className="mr-2">🔄</span>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {displayedInsights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start space-x-3">
              {getInsightIcon(insight.type)}
              <div>
                <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                <p className="text-gray-300 text-sm mt-1">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {insights.length > maxInsights && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            {showAll ? 'Show Less' : `Show ${insights.length - maxInsights} More Insights`}
          </button>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center text-blue-400 text-xs">
          <span className="mr-2">🤖</span>
          <span>Your personal financial coach - Tips based on your spending habits and goals</span>
        </div>
      </div>
    </div>
  );
};