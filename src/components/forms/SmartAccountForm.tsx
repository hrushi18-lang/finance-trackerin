import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Smartphone, Wallet, CreditCard, TrendingUp, Target, Eye, EyeOff, AlertCircle, Info, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { FinancialAccount } from '../../types';

interface AccountFormData {
  name: string;
  type: 'bank_savings' | 'bank_current' | 'bank_student' | 'digital_wallet' | 'cash' | 'credit_card' | 'investment' | 'goals_vault' | 'custom';
  balance: number;
  institution?: string;
  platform?: string;
  isVisible: boolean;
  accountNumber?: string;
  description?: string;
}

interface SmartAccountFormProps {
  initialData?: FinancialAccount;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  userType?: string;
  primaryFocus?: string[];
}

export const SmartAccountForm: React.FC<SmartAccountFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  userType,
  primaryFocus
}) => {
  const { currency } = useInternationalization();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AccountFormData>({
    defaultValues: initialData || {
      type: 'bank_savings',
      balance: 0,
      isVisible: true
    }
  });

  const selectedType = watch('type');
  const watchedBalance = watch('balance');

  // Progressive form steps
  const steps = [
    { title: 'Account Type', description: 'Choose the type of account you want to add' },
    { title: 'Basic Details', description: 'Enter account name and current balance' },
    { title: 'Additional Info', description: 'Add institution details (optional)' },
    { title: 'Review & Create', description: 'Review your account details' }
  ];

  // Smart account type recommendations based on user profile
  const getRecommendedAccountTypes = () => {
    const allTypes = [
      { 
        value: 'bank_savings', 
        label: 'Bank Savings Account', 
        icon: Building, 
        color: 'blue',
        description: 'SBI, HDFC, ICICI Savings',
        recommended: true
      },
      { 
        value: 'bank_current', 
        label: 'Current Account', 
        icon: Building, 
        color: 'green',
        description: 'HDFC Current, SBI Current',
        recommended: userType === 'business_owner' || userType === 'freelancer'
      },
      { 
        value: 'bank_student', 
        label: 'Student Account', 
        icon: Building, 
        color: 'purple',
        description: 'SBI Student, HDFC Student Plus',
        recommended: userType === 'student'
      },
      { 
        value: 'digital_wallet', 
        label: 'Digital Wallet', 
        icon: Smartphone, 
        color: 'orange',
        description: 'PayTM, PhonePe, Google Pay',
        recommended: true
      },
      { 
        value: 'cash', 
        label: 'Cash', 
        icon: Wallet, 
        color: 'gray',
        description: 'Cash in hand, petty cash',
        recommended: true
      },
      { 
        value: 'credit_card', 
        label: 'Credit Card', 
        icon: CreditCard, 
        color: 'red',
        description: 'HDFC Regalia, SBI SimplyCLICK',
        recommended: userType !== 'student'
      },
      { 
        value: 'investment', 
        label: 'Investment Account', 
        icon: TrendingUp, 
        color: 'yellow',
        description: 'Zerodha, Groww, SIP Portfolio',
        recommended: primaryFocus?.includes('invest_better') || userType === 'business_owner'
      },
      { 
        value: 'goals_vault', 
        label: 'Goals Vault', 
        icon: Target, 
        color: 'purple',
        description: 'Dedicated account for financial goals',
        recommended: primaryFocus?.includes('save_more') || primaryFocus?.includes('plan_future')
      }
    ];

    return allTypes;
  };

  const accountTypes = getRecommendedAccountTypes();

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = 'border-2 transition-all duration-200 p-4 rounded-xl cursor-pointer';
    const selectedClasses = 'border-primary-500 bg-primary-500/10 shadow-lg transform scale-105';
    const unselectedClasses = 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500/50 hover:bg-gray-700/30';
    
    return `${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`;
  };

  const getColorIcon = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500'
    };
    return colorMap[color] || 'bg-indigo-500';
  };

  const handleFormSubmit = async (data: AccountFormData) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (error: any) {
      setError(error.message || 'Failed to save account');
    }
  };

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

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedType;
      case 1:
        return watch('name') && watch('name').length >= 2;
      case 2:
        return true; // Optional step
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Choose Account Type</h3>
              <p className="text-gray-300 text-sm">
                Select the type of account you want to add. We've highlighted recommendations based on your profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accountTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = selectedType === type.value;
                const isRecommended = type.recommended;
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('type', type.value as any)}
                    className={getColorClasses(type.color, isSelected)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl ${getColorIcon(type.color)} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent size={24} className="text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-semibold">{type.label}</h4>
                          {isRecommended && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Basic Account Details</h3>
              <p className="text-gray-300 text-sm">
                Enter the account name and your current balance.
              </p>
            </div>

            <Input
              label="Account Name"
              type="text"
              placeholder="e.g., Main Savings, PayTM Wallet"
              icon={<Wallet size={18} className="text-blue-400" />}
              {...register('name', { 
                required: 'Account name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              error={errors.name?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Balance
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyIcon currencyCode={currency.code} size={18} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('balance', {
                    required: 'Balance is required',
                    min: { value: 0, message: 'Balance cannot be negative' }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/20 text-white rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
              </div>
              {errors.balance && (
                <p className="text-red-400 text-sm mt-1">{errors.balance.message}</p>
              )}
            </div>

            {/* Balance Impact Preview */}
            {watchedBalance && !isNaN(Number(watchedBalance)) && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center text-blue-400 mb-2">
                  <Info size={16} className="mr-2" />
                  <span className="font-medium">Balance Preview</span>
                </div>
                <p className="text-sm text-blue-300">
                  This account will start with a balance of{' '}
                  <span className="font-semibold text-white">
                    <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                    {Number(watchedBalance).toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Additional Information</h3>
              <p className="text-gray-300 text-sm">
                Add institution or platform details to help you identify this account.
              </p>
            </div>

            <Input
              label="Institution/Platform (Optional)"
              type="text"
              placeholder="e.g., HDFC Bank, PayTM, Zerodha"
              icon={<Building size={18} className="text-green-400" />}
              {...register('institution')}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Account Number (Optional)"
              type="text"
              placeholder="Last 4 digits or full number"
              icon={<CreditCard size={18} className="text-purple-400" />}
              {...register('accountNumber')}
              className="bg-black/20 border-white/20 text-white"
            />

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isVisible"
                {...register('isVisible')}
                className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="isVisible" className="text-sm text-gray-300">
                Show this account on home screen
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Review Account Details</h3>
              <p className="text-gray-300 text-sm">
                Please review your account information before creating.
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-600/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl ${getColorIcon(accountTypes.find(t => t.value === selectedType)?.color || 'blue')} flex items-center justify-center`}>
                  {React.createElement(accountTypes.find(t => t.value === selectedType)?.icon || Building, { size: 24, className: "text-white" })}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{watch('name') || 'Account Name'}</h4>
                  <p className="text-sm text-gray-400">{accountTypes.find(t => t.value === selectedType)?.label}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Balance:</span>
                  <span className="font-medium ml-2 text-white">
                    <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                    {Number(watch('balance') || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Visible:</span>
                  <span className="font-medium ml-2 text-white">
                    {watch('isVisible') ? 'Yes' : 'No'}
                  </span>
                </div>
                {watch('institution') && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Institution:</span>
                    <span className="font-medium ml-2 text-white">{watch('institution')}</span>
                  </div>
                )}
                {watch('accountNumber') && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Account Number:</span>
                    <span className="font-medium ml-2 text-white">{watch('accountNumber')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-400">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index < currentStep
                  ? 'bg-primary-500'
                  : index === currentStep
                  ? 'bg-primary-400 ring-4 ring-primary-500/30'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex space-x-3 pt-6">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting || !canProceed()}
              className="flex-1 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
              <CheckCircle size={16} className="ml-2" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
