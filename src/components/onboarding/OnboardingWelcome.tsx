import React, { useState } from 'react';
import { User, GraduationCap, Briefcase, Building2, Heart, DollarSign, Target, TrendingUp, Shield, Users } from 'lucide-react';
import { Button } from '../common/Button';

interface OnboardingWelcomeProps {
  onNext: (data: { userType: string; primaryFocus: string[]; experience: string }) => void;
  onPrev?: () => void;
  initialData?: any;
  canGoBack?: boolean;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = false 
}) => {
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');

  const userTypes = [
    {
      id: 'student',
      title: 'Student',
      description: 'Managing pocket money, part-time income, and student loans',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      features: ['Budget tracking', 'Expense management', 'Goal setting', 'Student loan tracking']
    },
    {
      id: 'young_professional',
      title: 'Young Professional',
      description: 'Starting career, building emergency fund, and planning for future',
      icon: User,
      color: 'from-green-500 to-green-600',
      features: ['Salary tracking', 'Emergency fund', 'Investment planning', 'Tax optimization']
    },
    {
      id: 'freelancer',
      title: 'Freelancer/Entrepreneur',
      description: 'Irregular income, business expenses, and tax planning',
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      features: ['Cash flow management', 'Business expenses', 'Tax planning', 'Client invoicing']
    },
    {
      id: 'business_owner',
      title: 'Business Owner',
      description: 'Managing business finances, investments, and growth planning',
      icon: Building2,
      color: 'from-orange-500 to-orange-600',
      features: ['Business analytics', 'Investment tracking', 'Tax optimization', 'Growth planning']
    },
    {
      id: 'family',
      title: 'Family Manager',
      description: 'Managing household finances, family goals, and children\'s education',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      features: ['Family budgeting', 'Education planning', 'Insurance tracking', 'Retirement planning']
    },
    {
      id: 'retiree',
      title: 'Retiree/Senior',
      description: 'Managing retirement funds, healthcare costs, and estate planning',
      icon: Heart,
      color: 'from-indigo-500 to-indigo-600',
      features: ['Retirement tracking', 'Healthcare costs', 'Estate planning', 'Legacy management']
    }
  ];

  const focusAreas = [
    { id: 'save_more', title: 'Save More Money', icon: DollarSign, description: 'Build emergency fund and savings' },
    { id: 'pay_off_debt', title: 'Pay Off Debt', icon: Target, description: 'Eliminate loans and credit card debt' },
    { id: 'invest_better', title: 'Invest Wisely', icon: TrendingUp, description: 'Grow wealth through investments' },
    { id: 'budget_better', title: 'Budget Better', icon: Shield, description: 'Control spending and expenses' },
    { id: 'plan_future', title: 'Plan for Future', icon: Target, description: 'Retirement and long-term goals' }
  ];

  const experienceLevels = [
    {
      id: 'beginner',
      title: 'Beginner',
      description: 'New to personal finance management',
      icon: '🌱',
      features: ['Simple interface', 'Guided tutorials', 'Basic tips', 'Step-by-step guidance']
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      description: 'Some experience with budgeting and tracking',
      icon: '📈',
      features: ['Standard features', 'Moderate complexity', 'Some automation', 'Basic analytics']
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'Experienced with investments and complex planning',
      icon: '🎯',
      features: ['Advanced analytics', 'Complex tracking', 'Full automation', 'Professional tools']
    }
  ];

  const handleUserTypeSelect = (typeId: string) => {
    setSelectedUserType(typeId);
  };

  const handleFocusToggle = (focusId: string) => {
    setSelectedFocus(prev => 
      prev.includes(focusId) 
        ? prev.filter(id => id !== focusId)
        : [...prev, focusId]
    );
  };

  const handleExperienceSelect = (experienceId: string) => {
    setSelectedExperience(experienceId);
  };

  const handleContinue = () => {
    if (selectedUserType && selectedFocus.length > 0 && selectedExperience) {
      onNext({
        userType: selectedUserType,
        primaryFocus: selectedFocus,
        experience: selectedExperience
      });
    }
  };

  const canContinue = selectedUserType && selectedFocus.length > 0 && selectedExperience;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <DollarSign size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-white mb-4">
          Welcome to FinTrack
        </h1>
        <p className="text-lg text-gray-300 font-body max-w-md mx-auto">
          Let's personalize your financial journey. Tell us about yourself so we can create the perfect experience for you.
        </p>
      </div>

      {/* User Type Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-white mb-4">
          I am a...
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedUserType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => handleUserTypeSelect(type.id)}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-primary-500 bg-primary-500/10 shadow-lg transform scale-105'
                    : 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500/50 hover:bg-gray-700/30'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-heading font-semibold text-white mb-2">
                      {type.title}
                    </h3>
                    <p className="text-sm text-gray-300 font-body mb-3">
                      {type.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {type.features.map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Focus Areas */}
      {selectedUserType && (
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-semibold text-white mb-4">
            What's your primary focus? (Select all that apply)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {focusAreas.map((focus) => {
              const IconComponent = focus.icon;
              const isSelected = selectedFocus.includes(focus.id);
              
              return (
                <button
                  key={focus.id}
                  onClick={() => handleFocusToggle(focus.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary-500' : 'bg-gray-600'
                    }`}>
                      <IconComponent size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-semibold text-white">
                        {focus.title}
                      </h3>
                      <p className="text-xs text-gray-400 font-body">
                        {focus.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Experience Level */}
      {selectedUserType && selectedFocus.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-semibold text-white mb-4">
            How would you describe your financial management experience?
          </h2>
          <div className="space-y-3">
            {experienceLevels.map((level) => {
              const isSelected = selectedExperience === level.id;
              
              return (
                <button
                  key={level.id}
                  onClick={() => handleExperienceSelect(level.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{level.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-heading font-semibold text-white mb-1">
                        {level.title}
                      </h3>
                      <p className="text-sm text-gray-300 font-body mb-2">
                        {level.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {level.features.map((feature, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {canContinue && (
        <div className="pt-6">
          <Button
            onClick={handleContinue}
            className="w-full py-4 text-lg font-heading font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl shadow-lg transition-all"
          >
            Let's Get Started
          </Button>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm text-gray-400 font-body">
          Step 1 of 12 • We'll personalize everything based on your needs
        </p>
      </div>
    </div>
  );
};