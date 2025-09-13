import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, User, Globe, Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CurrencySelector } from '../currency/CurrencySelector';
import { CategorySelector } from '../common/CategorySelector';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface SimpleOnboardingFlowProps {
  onComplete: () => void;
}

export const SimpleOnboardingFlow: React.FC<SimpleOnboardingFlowProps> = ({ onComplete }) => {
  const { addUserCategory } = useFinance();
  const { setCurrency, setSecondaryCurrency, supportedCurrencies } = useInternationalization();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    age: '',
    profession: '',
    country: '',
    currency: 'USD',
    secondaryCurrency: '',
    customCategories: [] as Array<{
      name: string;
      type: 'income' | 'expense';
      icon: string;
      color: string;
    }>
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: '📝',
    color: '#FF6B6B'
  });

  const categoryIcons = [
    '🍔', '🚗', '🏠', '⚡', '📱', '👕', '🎬', '🏥', '🎓', '💼',
    '✈️', '🍕', '☕', '🛒', '🎮', '📚', '💊', '🏋️', '🎵', '🎨'
  ];

  const categoryColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#FFB347'
  ];

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 1) { // Profile step
      if (!formData.name.trim() || !formData.age || !formData.profession.trim()) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 2) { // Currency step
      if (!formData.currency) {
        setError('Please select a primary currency');
        return;
      }
    }
    
    setError(null);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addCustomCategory = () => {
    if (newCategory.name.trim()) {
      setFormData(prev => ({
        ...prev,
        customCategories: [...prev.customCategories, { ...newCategory, name: newCategory.name.trim() }]
      }));
      setNewCategory({
        name: '',
        type: 'expense',
        icon: '📝',
        color: '#FF6B6B'
      });
    }
  };

  const removeCustomCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter((_, i) => i !== index)
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Update user profile with collected data
      await updateProfile({
        name: formData.name,
        age: parseInt(formData.age),
        profession: formData.profession,
        country: formData.country,
        primaryCurrency: formData.currency,
        displayCurrency: formData.secondaryCurrency || formData.currency
      });

      // Set currency
      const selectedCurrency = supportedCurrencies.find(c => c.code === formData.currency);
      if (selectedCurrency) {
        setCurrency(selectedCurrency);
      }

      // Set secondary currency if provided
      if (formData.secondaryCurrency) {
        const selectedSecondaryCurrency = supportedCurrencies.find(c => c.code === formData.secondaryCurrency);
        if (selectedSecondaryCurrency) {
          setSecondaryCurrency(selectedSecondaryCurrency);
        }
      }

      // Add custom categories
      for (const category of formData.customCategories) {
        await addUserCategory({
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color
        });
      }

      onComplete();
    } catch (error) {
      setError('Failed to complete setup');
      console.error('Setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to FinTrack',
      description: 'Let\'s set up your personal finance tracker',
      icon: <Check size={24} />,
      component: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-blue-600">
            <Check size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Welcome to FinTrack
            </h2>
            <p className="text-gray-600">
              Your personal finance management made simple
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Basic Information',
      description: 'Tell us a bit about yourself',
      icon: <User size={24} />,
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Full Name *
            </label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`py-3 ${formData.name.trim() === '' ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'}`}
            />
            {formData.name.trim() === '' && (
              <p className="text-xs text-red-500 mt-1">Name is required</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Age *
            </label>
            <Input
              type="number"
              placeholder="Enter your age"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              min="13"
              max="120"
              className={`py-3 ${formData.age === '' ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'}`}
            />
            {formData.age === '' && (
              <p className="text-xs text-red-500 mt-1">Age is required</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Profession *
            </label>
            <Input
              type="text"
              placeholder="e.g., Software Engineer, Teacher, Doctor"
              value={formData.profession}
              onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
              className={`py-3 ${formData.profession.trim() === '' ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'}`}
            />
            {formData.profession.trim() === '' && (
              <p className="text-xs text-red-500 mt-1">Profession is required</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Country
            </label>
            <Input
              type="text"
              placeholder="e.g., India, United States, Canada"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="py-3"
            />
          </div>
        </div>
      )
    },
    {
      id: 'currency',
      title: 'Select Currency',
      description: 'Choose your primary and secondary currencies',
      icon: <Globe size={24} />,
      component: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Primary Currency *
            </label>
            <CurrencySelector
              value={formData.currency}
              onChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
              showFlag={true}
              showFullName={true}
              popularOnly={false}
            />
            {formData.currency === '' && (
              <p className="text-xs text-red-500 mt-1">Primary currency is required</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              This will be your primary currency for all calculations and totals. All other currencies will be converted to this currency.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Secondary Currency (Optional)
            </label>
            <CurrencySelector
              value={formData.secondaryCurrency}
              onChange={(currency) => setFormData(prev => ({ ...prev, secondaryCurrency: currency }))}
              showFlag={true}
              showFullName={true}
              popularOnly={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be shown alongside your primary currency for reference
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'categories',
      title: 'Custom Categories',
      description: 'Add your own income and expense categories',
      icon: <Plus size={24} />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Add custom categories to better organize your finances
            </p>
          </div>
          
          {/* Add New Category */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3">Add New Category</h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                />
                
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                >
                  <option value="expense">💸 Expense</option>
                  <option value="income">💰 Income</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Select Icon
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {categoryIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        newCategory.icon === icon 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Select Color
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {categoryColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        newCategory.color === color 
                          ? 'border-gray-800' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <Button
                variant="primary"
                onClick={addCustomCategory}
                disabled={!newCategory.name.trim()}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Category
              </Button>
            </div>
          </div>
          
          {/* Display Added Categories */}
          {formData.customCategories.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">
                Your Categories ({formData.customCategories.length})
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.customCategories.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{category.icon}</span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-700">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {category.type === 'income' ? '💰 Income' : '💸 Expense'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCustomCategory(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <EyeOff size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-green-600">
            <Check size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Welcome to FinTrack!
            </h2>
            <p className="text-gray-600">
              Your personal finance tracker is ready to go.
            </p>
          </div>
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">
                Profile setup complete
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">
                Currency set to {formData.currency}
              </span>
            </div>
            {formData.customCategories.length > 0 && (
              <div className="flex items-center space-x-2">
                <Check size={16} className="text-green-600" />
                <span className="text-sm text-gray-600">
                  {formData.customCategories.length} custom categories added
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  
  // Check if current step can proceed
  const canProceed = (() => {
    switch (currentStepData.id) {
      case 'welcome':
        return true;
      case 'profile':
        return formData.name.trim() !== '';
      case 'currency':
        return formData.currency !== '';
      case 'categories':
        return true; // Categories are optional
      case 'complete':
        return true;
      default:
        return true;
    }
  })();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300 bg-blue-600"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8 rounded-2xl mb-6 bg-white shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-600 text-white">
              {currentStepData.icon}
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-800">
              {currentStepData.title}
            </h1>
            <p className="text-sm text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {currentStepData.component}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>
          
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            loading={isLoading}
            className="flex items-center space-x-2"
          >
            <span>{isLastStep ? 'Get Started' : 'Continue'}</span>
            {!isLastStep && <ArrowRight size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboardingFlow;
