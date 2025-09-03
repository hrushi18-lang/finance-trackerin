import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Building2, Target, CreditCard, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { AccountForm } from '../accounts/AccountForm';
import { financeManager, CreateAccountData } from '../../lib/finance-manager';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [userData, setUserData] = useState({
    name: '',
    financialGoal: '',
    monthlyIncome: 0,
    hasAccounts: false,
    hasGoals: false,
    hasBudgets: false
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleCreateAccount = async (data: CreateAccountData) => {
    try {
      await financeManager.createAccount(data);
      setUserData(prev => ({ ...prev, hasAccounts: true }));
      markStepComplete('accounts');
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to FinTrack!',
      description: 'Let\'s set up your personal finance management system',
      icon: <Check size={24} />,
      component: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h2 className="text-2xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
              Welcome to FinTrack!
            </h2>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Your personal finance manager that works offline and syncs across devices
            </p>
          </div>
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <Check size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                Track expenses and income
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Check size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                Set and achieve financial goals
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Check size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                Manage budgets and bills
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Check size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                Works offline, syncs online
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Tell us about yourself',
      description: 'Help us personalize your experience',
      icon: <FileText size={24} />,
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              What's your main financial goal?
            </label>
            <select
              value={userData.financialGoal}
              onChange={(e) => setUserData(prev => ({ ...prev, financialGoal: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border)'
              }}
            >
              <option value="">Select your goal</option>
              <option value="emergency-fund">Build an emergency fund</option>
              <option value="debt-free">Pay off debt</option>
              <option value="home">Save for a home</option>
              <option value="retirement">Plan for retirement</option>
              <option value="travel">Save for travel</option>
              <option value="education">Education expenses</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Monthly Income (Optional)
            </label>
            <Input
              type="number"
              placeholder="0"
              value={userData.monthlyIncome}
              onChange={(e) => setUserData(prev => ({ ...prev, monthlyIncome: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>
      )
    },
    {
      id: 'accounts',
      title: 'Add your first account',
      description: 'Connect your bank account or add a manual account',
      icon: <Building2 size={24} />,
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Add at least one account to get started. You can add more later.
            </p>
          </div>
          <AccountForm
            isOpen={true}
            onClose={() => {}}
            onSubmit={handleCreateAccount}
            account={null}
            loading={false}
          />
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Set your first goal',
      description: 'Create a financial goal to work towards',
      icon: <Target size={24} />,
      component: (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-body mb-4" style={{ color: 'var(--text-secondary)' }}>
              Goals help you stay focused on what matters most to you financially.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                // Create a sample emergency fund goal
                financeManager.createGoal({
                  name: 'Emergency Fund',
                  target_amount: 10000,
                  target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  category: 'Emergency Fund',
                  description: 'Build a 6-month emergency fund'
                }).then(() => {
                  setUserData(prev => ({ ...prev, hasGoals: true }));
                  markStepComplete('goals');
                });
              }}
              className="w-full p-4 rounded-xl border-2 border-dashed hover:border-solid transition-all"
              style={{ 
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background-secondary)'
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-heading text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  Emergency Fund
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  $10,000 target • 1 year
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                // Create a sample vacation goal
                financeManager.createGoal({
                  name: 'Vacation Fund',
                  target_amount: 5000,
                  target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                  category: 'Travel',
                  description: 'Save for a dream vacation'
                }).then(() => {
                  setUserData(prev => ({ ...prev, hasGoals: true }));
                  markStepComplete('goals');
                });
              }}
              className="w-full p-4 rounded-xl border-2 border-dashed hover:border-solid transition-all"
              style={{ 
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background-secondary)'
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">✈️</div>
                <h3 className="font-heading text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  Vacation Fund
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  $5,000 target • 6 months
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                // Create a sample debt payoff goal
                financeManager.createGoal({
                  name: 'Debt Payoff',
                  target_amount: 15000,
                  target_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
                  category: 'Debt',
                  description: 'Pay off credit card debt'
                }).then(() => {
                  setUserData(prev => ({ ...prev, hasGoals: true }));
                  markStepComplete('goals');
                });
              }}
              className="w-full p-4 rounded-xl border-2 border-dashed hover:border-solid transition-all"
              style={{ 
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background-secondary)'
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">💳</div>
                <h3 className="font-heading text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  Debt Payoff
                </h3>
                <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                  $15,000 target • 2 years
                </p>
              </div>
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={() => markStepComplete('goals')}
              className="text-sm font-body hover:underline"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      description: 'Your FinTrack account is ready to use',
      icon: <Check size={24} />,
      component: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success)' }}>
            <Check size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
              Welcome to FinTrack!
            </h2>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              You're ready to start managing your finances. Your data is secure and will sync across all your devices.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <Check size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                Account created successfully
              </span>
            </div>
            {userData.hasAccounts && (
              <div className="flex items-center space-x-3">
                <Check size={16} style={{ color: 'var(--success)' }} />
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Financial accounts added
                </span>
              </div>
            )}
            {userData.hasGoals && (
              <div className="flex items-center space-x-3">
                <Check size={16} style={{ color: 'var(--success)' }} />
                <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  Financial goals set
                </span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Check size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                Offline mode enabled
              </span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStep === 0 || currentStep === 1 || completedSteps.has(currentStepData.id) || isLastStep;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: 'var(--primary)',
                width: `${((currentStep + 1) / steps.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div
          className="p-8 rounded-2xl mb-6"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
          }}
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
              {currentStepData.icon}
            </div>
            <h1 className="text-xl font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
              {currentStepData.title}
            </h1>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {currentStepData.description}
            </p>
          </div>

          {currentStepData.component}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center space-x-2"
          >
            <span>{isLastStep ? 'Get Started' : 'Next'}</span>
            {!isLastStep && <ArrowRight size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
};