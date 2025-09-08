import React, { useState } from 'react';
import { Target, Calendar, CreditCard, PieChart, Plus } from 'lucide-react';
import { Button } from '../common/Button';

interface ActivityData {
  goals: Array<{ name: string; amount: number }>;
  bills: Array<{ name: string; amount: number }>;
  liabilities: Array<{ name: string; amount: number }>;
  budgets: Array<{ category: string; amount: number }>;
}

interface OnboardingActivitiesProps {
  onNext: (data: ActivityData) => void;
  onPrev: () => void;
  initialData?: Partial<ActivityData>;
  canGoBack?: boolean;
}

export const OnboardingActivities: React.FC<OnboardingActivitiesProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const [activities, setActivities] = useState<ActivityData>({
    goals: [],
    bills: [],
    liabilities: [],
    budgets: [],
    ...initialData
  });

  const activityTypes = [
    {
      key: 'goals' as keyof ActivityData,
      title: 'Goals',
      description: 'e.g. Save ₹50k, buy laptop',
      icon: Target,
      color: 'yellow',
      examples: ['Save for laptop', 'Emergency fund', 'Study abroad']
    },
    {
      key: 'bills' as keyof ActivityData,
      title: 'Bills',
      description: 'e.g. Rent, subscriptions',
      icon: Calendar,
      color: 'blue',
      examples: ['Rent', 'Phone bill', 'Netflix']
    },
    {
      key: 'liabilities' as keyof ActivityData,
      title: 'Liabilities',
      description: 'e.g. Loans, debts',
      icon: CreditCard,
      color: 'red',
      examples: ['Student loan', 'Credit card debt', 'Personal loan']
    },
    {
      key: 'budgets' as keyof ActivityData,
      title: 'Budgets',
      description: 'e.g. Monthly caps per category',
      icon: PieChart,
      color: 'green',
      examples: ['Food budget', 'Entertainment limit', 'Transport budget']
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      red: 'bg-red-500/20 border-red-500/30 text-red-400',
      green: 'bg-green-500/20 border-green-500/30 text-green-400'
    };
    return colors[color as keyof typeof colors] || 'bg-forest-500/20 border-forest-500/30 text-forest-400';
  };

  const handleContinue = () => {
    onNext(activities);
  };

  return (
    <div className="min-h-screen bg-forest-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-forest-700/80 backdrop-blur-md rounded-3xl p-8 border border-forest-600/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Create Activities
            </h2>
            <p className="text-forest-200 font-body">
              Set up goals, bills, liabilities, and budgets to stay on track.
            </p>
          </div>

          {/* Activity Cards */}
          <div className="space-y-4 mb-8">
            {activityTypes.map((activity) => {
              const IconComponent = activity.icon;
              const count = activities[activity.key]?.length || 0;
              
              return (
                <div
                  key={activity.key}
                  className={`p-4 rounded-2xl border-2 ${getColorClasses(activity.color)} hover:scale-105 transition-all cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-white">{activity.title}</h3>
                        <p className="text-sm opacity-80 font-body">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {count > 0 && (
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-body">
                          {count}
                        </span>
                      )}
                      <Plus size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full py-4 text-lg font-heading font-semibold bg-white text-forest-800 hover:bg-forest-50 rounded-2xl shadow-lg transition-all"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
