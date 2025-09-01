import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Already exists
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingUserDetails } from './OnboardingUserDetails';
import { OnboardingAccountsSetup } from './OnboardingAccountsSetup';
import { OnboardingCategories } from './OnboardingCategories';
import { OnboardingGoals } from './OnboardingGoals';
import { OnboardingActivities } from './OnboardingActivities';
import { OnboardingBills } from './OnboardingBills';
import { OnboardingLiabilities } from './OnboardingLiabilities';
import { OnboardingBudgets } from './OnboardingBudgets';
import { OnboardingPreferences } from './OnboardingPreferences';
import { OnboardingPlanningSetup } from './OnboardingPlanningSetup';
import { OnboardingComplete } from './OnboardingComplete';
import { useAuth } from '../../contexts/AuthContext'; // Already exists
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { Capacitor } from '@capacitor/core';

interface OnboardingData {
  // Profile data
  name?: string;
  age?: number;
  profession?: string;
  country?: string;
  currency?: string;
  monthlyIncome?: number;
  
  // Account data
  accounts?: Array<{
    name: string;
    type: string;
    balance: number;
  }>;
  
  // Categories
  selectedCategories?: string[];
  customCategories?: string[];
  
  // Goals data
  primaryGoals?: string[];
  emergencyFund?: number;
  timeHorizon?: '1year' | '2-5years' | '5-10years' | '10+years';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  
  // Activities
  goals?: Array<{ name: string; amount: number }>;
  bills?: Array<{ name: string; amount: number; frequency: string }>;
  liabilities?: Array<{ name: string; amount: number; type: string }>;
  budgets?: Array<{ category: string; amount: number; period: string }>;
  
  // Preferences data
  budgetPeriod?: 'weekly' | 'monthly' | 'yearly';
  notifications?: {
    budgetAlerts: boolean;
    goalReminders: boolean;
    billReminders: boolean;
    weeklyReports: boolean;
  };
  startOfWeek?: 'sunday' | 'monday';
  theme?: 'light' | 'dark' | 'auto';
  biometricEnabled?: boolean;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrency, setRegion, supportedCurrencies, supportedRegions } = useInternationalization();
  const isNative = Capacitor.isNativePlatform();

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setOnboardingData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const steps = [
    { title: "Welcome", component: OnboardingWelcome }, // Already exists
    { title: "User Details", component: OnboardingUserDetails }, // Already exists
    { title: "Accounts", component: OnboardingAccountsSetup }, // Already exists
    { title: "Categories", component: OnboardingCategories }, // Already exists
    { title: "Goals", component: OnboardingGoals }, // Already exists
    { title: "Activities", component: OnboardingActivities }, // Already exists
    { title: "Bills", component: OnboardingBills }, // Already exists
    { title: "Liabilities", component: OnboardingLiabilities }, // Already exists
    { title: "Budgets", component: OnboardingBudgets }, // Already exists
    { title: "Preferences", component: OnboardingPreferences }, // Already exists
    { title: "Planning", component: OnboardingPlanningSetup }, // Already exists
    { title: "Complete", component: OnboardingComplete }, // Already exists
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepData = (data: any) => {
    console.log(`🔄 Onboarding step ${currentStep + 1} data:`, data); // Already exists
    setOnboardingData(prev => ({ ...prev, ...data }));
    
    // Apply immediate personalization based on step data
    if (data.currency && supportedCurrencies.find(c => c.code === data.currency)) {
      const selectedCurrency = supportedCurrencies.find(c => c.code === data.currency);
      if (selectedCurrency) {
        setCurrency(selectedCurrency);
      } // Already exists
    }
    
    if (data.country && supportedRegions.find(r => r.countryCode === data.country)) {
      const selectedRegion = supportedRegions.find(r => r.countryCode === data.country);
      if (selectedRegion) {
        setRegion(selectedRegion);
      }
    } // Already exists
    
    nextStep();
  };

  const completeOnboarding = async () => {
    console.log('🔄 Completing onboarding with data:', onboardingData);
    
    // Process and analyze onboarding data for personalization
    const personalizedData = processOnboardingData(onboardingData);
    console.log('🔄 Processed personalization data:', personalizedData);
    
    onComplete(onboardingData);
  };

  // Intelligent onboarding data processing
  const processOnboardingData = (data: OnboardingData) => { // Already exists
    const personalization = {
      dashboardLayout: [] as string[],
      priorityFeatures: [] as string[],
      hiddenFeatures: [] as string[],
      budgetingFrequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
      alertSettings: {} as Record<string, boolean>,
      assistantPersonality: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
    };

    // Process user types // Already exists
    if (data.userTypes?.includes('student')) {
      personalization.dashboardLayout.push('budgeting', 'savings_goals', 'expense_tracking');
      personalization.budgetingFrequency = 'weekly';
      personalization.assistantPersonality = 'conservative';
    }
    
    if (data.userTypes?.includes('freelancer')) {
      personalization.dashboardLayout.push('income_tracking', 'cash_flow', 'tax_planning');
      personalization.alertSettings.irregularIncomeWarning = true;
    }
    
    if (data.userTypes?.includes('business_owner')) { // Already exists
      personalization.dashboardLayout.push('business_tracking', 'investment_planning', 'tax_optimization');
      personalization.assistantPersonality = 'aggressive';
    }

    // Process primary focus
    if (data.primaryFocus?.includes('save_more')) {
      personalization.priorityFeatures.push('savings_dashboard', 'automated_tips', 'goal_tracking');
    }
    
    if (data.primaryFocus?.includes('pay_off_debt')) {
      personalization.priorityFeatures.push('debt_strategies', 'emi_tracking', 'payoff_calculator');
    }
    
    if (data.primaryFocus?.includes('invest_better')) { // Already exists
      personalization.priorityFeatures.push('investment_tracking', 'portfolio_analysis');
    }

    // Process financial activities
    if (!data.hasInvestments) {
      personalization.hiddenFeatures.push('investment_tracking', 'portfolio_analysis');
    }
    
    if (!data.hasDebts) {
      personalization.hiddenFeatures.push('debt_tracking', 'emi_reminders');
    }
    
    if (data.hasMultipleAccounts) { // Already exists
      personalization.priorityFeatures.push('account_aggregation', 'transfer_tracking');
    }

    // Process income stability
    if (data.incomeStability === 'irregular') {
      personalization.alertSettings.cashFlowWarning = true;
      personalization.priorityFeatures.push('emergency_fund', 'cash_flow_management');
    }

    // Process experience level // Already exists
    if (data.experience === 'beginner') {
      personalization.priorityFeatures.push('guided_tutorials', 'simple_interface', 'basic_tips');
      personalization.hiddenFeatures.push('advanced_analytics', 'complex_investments');
    } else if (data.experience === 'advanced') {
      personalization.priorityFeatures.push('advanced_analytics', 'complex_tracking', 'tax_optimization');
    }

    return personalization;
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg"> // Already exists
        {/* Progress Bar */}
        {currentStep > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">
                Step {currentStep} of {steps.length - 1}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round((currentStep / (steps.length - 1)) * 100)}%
              </span>
            </div> // Already exists
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            {/* Step Indicators */}
            <div className="flex justify-between mt-2"> // Already exists
              {steps.slice(1, -1).map((step, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index < currentStep - 1
                      ? 'bg-primary-500'
                      : index === currentStep - 1
                      ? 'bg-primary-400 ring-4 ring-primary-500/30'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl"> // Already exists
          <CurrentStepComponent
            onNext={handleStepData}
            onPrev={prevStep}
            onComplete={completeOnboarding}
            userData={onboardingData}
            initialData={onboardingData}
            canGoBack={currentStep > 0}
          />
        </div>
      </div>
    </div>
  );
};