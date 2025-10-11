import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, TrendingUp, AlertTriangle, CheckCircle, 
  X, RefreshCw, Sparkles, ArrowRight
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';

interface InsightCard {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  action?: {
    label: string;
    path?: string;
    onClick?: () => void;
  };
}

export function InsightsDashboard() {
  const { generateInsights } = useChat();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadInsights();
    
    // Load dismissed insights from localStorage
    const dismissed = localStorage.getItem('dismissedInsights');
    if (dismissed) {
      setDismissedInsights(new Set(JSON.parse(dismissed)));
    }
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const aiInsights = await generateInsights();
      
      // Convert AI insights to InsightCard format
      const cards: InsightCard[] = aiInsights.map((insight, index) => {
        // Parse insight to determine type and extract info
        const lowerInsight = insight.toLowerCase();
        let type: 'success' | 'warning' | 'info' | 'tip' = 'info';
        
        if (lowerInsight.includes('great') || lowerInsight.includes('excellent') || lowerInsight.includes('👍')) {
          type = 'success';
        } else if (lowerInsight.includes('warning') || lowerInsight.includes('over') || lowerInsight.includes('⚠️')) {
          type = 'warning';
        } else if (lowerInsight.includes('tip') || lowerInsight.includes('consider') || lowerInsight.includes('💡')) {
          type = 'tip';
        }

        return {
          id: `insight_${Date.now()}_${index}`,
          type,
          title: extractTitle(insight),
          description: insight,
          action: suggestAction(insight)
        };
      });
      
      setInsights(cards);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractTitle = (insight: string): string => {
    // Extract emoji if present
    const emojiMatch = insight.match(/^([^\w\s]+)\s*/);
    if (emojiMatch) {
      return insight.substring(emojiMatch[0].length).split('.')[0].substring(0, 50);
    }
    return insight.split('.')[0].substring(0, 50);
  };

  const suggestAction = (insight: string): InsightCard['action'] | undefined => {
    const lowerInsight = insight.toLowerCase();
    
    if (lowerInsight.includes('goal')) {
      return { label: 'View Goals', path: '/goals' };
    } else if (lowerInsight.includes('budget')) {
      return { label: 'Check Budget', path: '/budgets' };
    } else if (lowerInsight.includes('bill')) {
      return { label: 'View Bills', path: '/bills' };
    } else if (lowerInsight.includes('debt') || lowerInsight.includes('liabilit')) {
      return { label: 'Manage Debt', path: '/liabilities' };
    } else if (lowerInsight.includes('spending')) {
      return { label: 'View Analytics', path: '/analytics' };
    }
    
    return undefined;
  };

  const dismissInsight = (id: string) => {
    const newDismissed = new Set(dismissedInsights);
    newDismissed.add(id);
    setDismissedInsights(newDismissed);
    localStorage.setItem('dismissedInsights', JSON.stringify(Array.from(newDismissed)));
  };

  const getIcon = (type: InsightCard['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getColors = (type: InsightCard['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          button: 'bg-green-600 hover:bg-green-700'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-400',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'tip':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-200 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
          button: 'bg-purple-600 hover:bg-purple-700'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const visibleInsights = insights.filter(i => !dismissedInsights.has(i.id));

  if (visibleInsights.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI-Powered Insights
          </h2>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && insights.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleInsights.map(insight => {
          const colors = getColors(insight.type);
          
          return (
            <div
              key={insight.id}
              className={`${colors.bg} ${colors.border} border rounded-xl p-4 relative transition-all hover:shadow-md`}
            >
              {/* Dismiss Button */}
              <button
                onClick={() => dismissInsight(insight.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Dismiss insight"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Icon */}
              <div className={`${colors.icon} mb-3`}>
                {getIcon(insight.type)}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 pr-6">
                {insight.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {insight.description}
              </p>

              {/* Action Button */}
              {insight.action && (
                <button
                  onClick={() => {
                    if (insight.action?.path) {
                      navigate(insight.action.path);
                    } else if (insight.action?.onClick) {
                      insight.action.onClick();
                    }
                  }}
                  className={`${colors.button} text-white text-sm px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
                >
                  <span>{insight.action.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA to AI Assistant */}
      {visibleInsights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Want more personalized advice?
              </h3>
              <p className="text-blue-100 text-sm">
                Chat with your AI Financial Assistant for detailed guidance
              </p>
            </div>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <span>Chat Now</span>
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

