import React from 'react';
import { Target, Home, Plane, GraduationCap, Heart, Car, Briefcase, PiggyBank } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useForm } from 'react-hook-form';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface GoalData {
  primaryGoals: string[];
  emergencyFund: number;
  timeHorizon: '1year' | '2-5years' | '5-10years' | '10+years';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

interface OnboardingGoalsProps {
  onNext: (data: GoalData) => void;
  onPrev: () => void;
  initialData?: Partial<GoalData>;
  canGoBack?: boolean;
}

export const OnboardingGoals: React.FC<OnboardingGoalsProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { currency } = useInternationalization();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GoalData>({
    defaultValues: {
      primaryGoals: [],
      ...initialData
    }
  });

  const selectedGoals = watch('primaryGoals') || [];
  const timeHorizon = watch('timeHorizon');
  const riskTolerance = watch('riskTolerance');

  const goalOptions = [
    { id: 'emergency', label: 'Emergency Fund (3 months expenses)', icon: PiggyBank, color: 'red' },
    { id: 'laptop', label: 'New Laptop/Phone', icon: Briefcase, color: 'blue' },
    { id: 'education', label: 'Course/Certification/Skills', icon: GraduationCap, color: 'purple' },
    { id: 'travel', label: 'Study Abroad/Travel', icon: Plane, color: 'blue' },
    { id: 'car', label: 'First Car/Bike', icon: Car, color: 'gray' },
    { id: 'internship', label: 'Internship Fund', icon: Briefcase, color: 'green' },
    { id: 'business', label: 'Start a Side Business', icon: Building, color: 'orange' },
    { id: 'other', label: 'Other Personal Goal', icon: Target, color: 'indigo' }
  ];

  const timeOptions = [
    { value: '1year', label: 'Less than 1 year', description: 'Short-term goals' },
    { value: '2-5years', label: '2-5 years', description: 'Medium-term planning' },
    { value: '5-10years', label: '5-10 years', description: 'Long-term objectives' },
    { value: '10+years', label: '10+ years', description: 'Life-changing goals' },
  ];

  const riskOptions = [
    { 
      value: 'conservative', 
      label: 'Conservative', 
      description: 'Prefer stability over growth',
      icon: '🛡️'
    },
    { 
      value: 'moderate', 
      label: 'Moderate', 
      description: 'Balanced approach to risk',
      icon: '⚖️'
    },
    { 
      value: 'aggressive', 
      label: 'Aggressive', 
      description: 'Higher risk for higher returns',
      icon: '🚀'
    },
  ];

  const toggleGoal = (goalId: string) => {
    const currentGoals = selectedGoals;
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(id => id !== goalId)
      : [...currentGoals, goalId];
    setValue('primaryGoals', newGoals);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      red: isSelected ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/20 hover:border-red-400/50',
      green: isSelected ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 hover:border-green-400/50',
      blue: isSelected ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/20 hover:border-blue-400/50',
      purple: isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-white/20 hover:border-purple-400/50',
      pink: isSelected ? 'border-pink-500 bg-pink-500/20 text-pink-400' : 'border-white/20 hover:border-pink-400/50',
      gray: isSelected ? 'border-gray-500 bg-gray-500/20 text-gray-400' : 'border-white/20 hover:border-gray-400/50',
      orange: isSelected ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/20 hover:border-orange-400/50',
      indigo: isSelected ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-white/20 hover:border-indigo-400/50',
    };
    return colors[color as keyof typeof colors];
  };

  const onSubmit = (data: GoalData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">What do you want to save for?</h2>
        <p className="text-gray-400">Your coach will help you reach these goals step by step</p>
      </div>

      {/* Student-Focused Introduction */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-green-500/30">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">🎓</span>
          <div>
            <h3 className="font-semibold text-white mb-2">Why Set Goals Early?</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• <strong className="text-green-400">Builds discipline:</strong> Having clear targets makes it easier to say no to impulse purchases</p>
              <p>• <strong className="text-blue-400">Creates motivation:</strong> Seeing progress towards your laptop or trip keeps you focused</p>
              <p>• <strong className="text-purple-400">Develops planning:</strong> You learn to break big dreams into achievable monthly savings</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Goal Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            What do you want to achieve? (Select all that excite you!)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {goalOptions.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              const IconComponent = goal.icon;
              
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${getColorClasses(goal.color, isSelected)}`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent size={24} className="opacity-80" />
                    <span className="font-medium">
                      {goal.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedGoals.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">Select at least one goal to continue</p>
          )}
        </div>

        {/* Emergency Fund */}
        <Input
          label="Emergency Fund Goal (Recommended: 3 months of expenses)"
          type="number"
          step="0.01"
          placeholder="e.g., 30000"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-gray-400" />}
          {...register('emergencyFund', {
            required: 'Emergency fund amount is required',
            min: { value: 0, message: 'Amount cannot be negative' }
          })}
          error={errors.emergencyFund?.message}
          className="bg-black/20 border-white/20 text-white"
        />
        
        {/* Emergency Fund Explanation */}
        <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-start space-x-2">
            <span className="text-red-400 mt-0.5">🚨</span>
            <div>
              <p className="text-red-400 font-medium text-sm">Why Emergency Fund Matters</p>
              <p className="text-red-300 text-sm mt-1">
                Life happens - phone breaks, medical bills, family emergencies. An emergency fund means you won't need to 
                borrow money or stress about unexpected costs. Start with ₹10,000 and build from there!
              </p>
            </div>
          </div>
        </div>

        {/* Time Horizon */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Primary Time Horizon
          </label>
          <div className="space-y-2">
            {timeOptions.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('timeHorizon', { required: 'Please select a time horizon' })}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 transition-colors ${
                  timeHorizon === option.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm opacity-80">{option.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.timeHorizon && (
            <p className="text-sm text-error-400 mt-1">{errors.timeHorizon.message}</p>
          )}
        </div>

        {/* Risk Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Risk Tolerance
          </label>
          <div className="grid grid-cols-1 gap-3">
            {riskOptions.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('riskTolerance', { required: 'Please select your risk tolerance' })}
                  className="sr-only"
                />
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  riskTolerance === option.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm opacity-80">{option.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.riskTolerance && (
            <p className="text-sm text-error-400 mt-1">{errors.riskTolerance.message}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex space-x-3 pt-4">
          {canGoBack && (
            <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
              Back
            </Button>
          )}
          <Button 
            type="submit" 
            className="flex-1"
            disabled={selectedGoals.length === 0}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};