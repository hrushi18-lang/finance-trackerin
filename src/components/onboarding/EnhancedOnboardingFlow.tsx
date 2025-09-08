import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Check, User, Globe, Plus, Eye, EyeOff, Target, CreditCard, FileText, PieChart } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CurrencySelector } from '../currency/CurrencySelector';
import { CurrencyInput } from '../currency/CurrencyInput';
import { LiveRateDisplay } from '../currency/LiveRateDisplay';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { PerformanceOptimizer } from '../common/PerformanceOptimizer';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { useFinance } from '../../contexts/FinanceContextOffline';
import { useProfile } from '../../contexts/ProfileContext';
import { useOfflineStorage } from '../../hooks/useOfflineStorage';
import { profileManager, UserProfile, CustomCategory, BasicActivity, AccountSetup } from '../../lib/profile-manager';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

// Types are now imported from profile-manager

interface EnhancedOnboardingFlowProps {
  onComplete: () => void;
}

export const EnhancedOnboardingFlow: React.FC<EnhancedOnboardingFlowProps> = ({ onComplete }) => {
  const { displayCurrency } = useEnhancedCurrency();
  const { addAccount, addGoal, addBill, addLiability, addUserCategory } = useFinance();
  const { refreshProfile } = useProfile();
  const { isOnline, offlineData, saveOfflineData, syncData } = useOfflineStorage();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>({
    name: '',
    age: 0,
    country: '',
    profession: '',
    monthlyIncome: 0,
    primaryCurrency: displayCurrency,
    displayCurrency: displayCurrency,
    autoConvert: true,
    showOriginalAmounts: true,
    email: user?.email || ''
  });
  
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [basicActivities, setBasicActivities] = useState<BasicActivity[]>([]);
  const [accounts, setAccounts] = useState<AccountSetup[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newActivity, setNewActivity] = useState<Partial<BasicActivity>>({});
  const [newAccount, setNewAccount] = useState<Partial<AccountSetup>>({});

  // Load offline data on mount
  useEffect(() => {
    if (offlineData.userProfile) {
      setUserProfile(offlineData.userProfile);
    }
    if (offlineData.customCategories) {
      setCustomCategories(offlineData.customCategories);
    }
    if (offlineData.basicActivities) {
      setBasicActivities(offlineData.basicActivities);
    }
    if (offlineData.accounts) {
      setAccounts(offlineData.accounts);
    }
    if (offlineData.currentStep !== undefined) {
      setCurrentStep(offlineData.currentStep);
    }
    if (offlineData.completedSteps) {
      setCompletedSteps(new Set(offlineData.completedSteps));
    }
  }, [offlineData]);

  // Auto-save data changes
  const saveData = useCallback(() => {
    saveOfflineData({
      userProfile,
      customCategories,
      basicActivities,
      accounts,
      currentStep,
      completedSteps: Array.from(completedSteps)
    });
  }, [userProfile, customCategories, basicActivities, accounts, currentStep, completedSteps, saveOfflineData]);

  // Auto-save on data changes
  useEffect(() => {
    const timeoutId = setTimeout(saveData, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [saveData]);

  // Sync data when coming back online
  useEffect(() => {
    if (isOnline && Object.keys(offlineData).length > 0) {
      syncData();
    }
  }, [isOnline, offlineData, syncData]);

  const defaultCategories = [
    { name: 'Food & Dining', icon: '🍛', color: '#FF6B6B' },
    { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
    { name: 'Bills & Utilities', icon: '📄', color: '#45B7D1' },
    { name: 'Entertainment', icon: '🎉', color: '#96CEB4' },
    { name: 'Health & Fitness', icon: '🏥', color: '#FFEAA7' },
    { name: 'Education', icon: '🎓', color: '#DDA0DD' },
    { name: 'Savings', icon: '🐷', color: '#98D8C8' },
    { name: 'Investments', icon: '📈', color: '#F7DC6F' },
    { name: 'Shopping', icon: '🛍️', color: '#BB8FCE' }
  ];

  const handleNext = () => {
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

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };


  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝');

  const categoryIcons = [
    '🍔', '🚗', '🏠', '⚡', '📱', '👕', '🎬', '🏥', '🎓', '💼',
    '✈️', '🍕', '☕', '🛒', '🎮', '📚', '💊', '🏋️', '🎵', '🎨'
  ];

  const addCustomCategory = () => {
    if (newCategory.trim()) {
      const category: Omit<CustomCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: newCategory.trim(),
        type: newCategoryType,
        icon: newCategoryIcon,
        color: newCategoryType === 'income' ? '#10B981' : '#EF4444',
        isActive: true
      };
      setCustomCategories(prev => [...prev, { ...category, id: Date.now().toString(), userId: user?.id || '' }]);
      setNewCategory('');
      setNewCategoryType('expense');
      setNewCategoryIcon('📝');
    }
  };

  const addBasicActivity = () => {
    if (newActivity.name && newActivity.amount && newActivity.type) {
      const activity: BasicActivity = {
        id: Date.now().toString(),
        name: newActivity.name,
        amount: newActivity.amount,
        currency: newActivity.currency || displayCurrency,
        type: newActivity.type,
        description: newActivity.description || ''
      };
      setBasicActivities(prev => [...prev, activity]);
      setNewActivity({});
    }
  };

  const addAccountSetup = () => {
    if (newAccount.name && newAccount.type && newAccount.balance !== undefined) {
      const account: AccountSetup = {
        id: Date.now().toString(),
        name: newAccount.name,
        type: newAccount.type,
        balance: newAccount.balance,
        currency: newAccount.currency || displayCurrency,
        isVisible: true,
        institution: newAccount.institution
      };
      setAccounts(prev => [...prev, account]);
      setNewAccount({});
    }
  };

  const toggleAccountVisibility = (accountId: string) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === accountId ? { ...acc, isVisible: !acc.isVisible } : acc
    ));
  };

  const handleComplete = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Create user profile
      const profileData = {
        ...userProfile,
        email: user.email || userProfile.email
      };
      
      await profileManager.createUserProfile(profileData, user.id);
      console.log('✅ User profile created');

      // Save custom categories to database
      for (const category of customCategories) {
        await addUserCategory({
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isActive: true
        });
      }
      console.log('✅ Custom categories saved');

      // Save basic activities
      for (const activity of basicActivities) {
        switch (activity.type) {
          case 'goal':
            await addGoal({
              title: activity.name,
              targetAmount: activity.amount,
              currentAmount: 0,
              targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              category: 'Personal',
              description: activity.description,
              goalType: 'general_savings',
              periodType: 'yearly',
              isRecurring: false,
              priority: 'medium',
              status: 'active',
              activityScope: 'general',
              withdrawalAmount: 0,
              isWithdrawn: false,
              completionAction: 'waiting'
            });
            break;
          case 'bill':
            await addBill({
              title: activity.name,
              amount: activity.amount,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              category: 'Utilities',
              description: activity.description,
              billType: 'fixed',
              frequency: 'monthly',
              nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              autoPay: false,
              isEmi: false,
              isActive: true,
              isEssential: false,
              reminderDaysBefore: 3,
              sendDueDateReminder: true,
              sendOverdueReminder: true,
              billCategory: 'general_expense',
              isRecurring: true,
              priority: 'medium',
              status: 'active',
              activityScope: 'general',
              accountIds: [],
              currencyCode: activity.currency,
              isIncome: false,
              billStage: 'pending',
              isVariableAmount: false,
              completionAction: 'continue',
              linkedAccountsCount: 0,
              isArchived: false
            });
            break;
          case 'liability':
            await addLiability({
              name: activity.name,
              totalAmount: activity.amount,
              remainingAmount: activity.amount,
              monthlyPayment: activity.amount / 12,
              minimumPayment: activity.amount / 24,
              dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              liabilityType: 'personal_loan',
              description: activity.description,
              currencyCode: activity.currency,
              priority: 'medium',
              status: 'active',
              activityScope: 'general',
              isActive: true,
              autoGenerateBills: true,
              reminderDays: 7,
              notes: '',
              interestRate: 0,
              startDate: new Date(),
              modificationCount: 0,
              liabilityStatus: 'new',
              paymentDay: 1,
              affectsCreditScore: true,
              isSecured: false,
              providesFunds: false,
              billGenerationDay: 1,
              sendReminders: true,
              paymentStrategy: 'equal',
              paymentAccounts: [],
              paymentPercentages: [],
              typeSpecificData: {},
              accountIds: []
            });
            break;
        }
      }
      console.log('✅ Basic activities saved');
      
      // Save accounts
      for (const account of accounts) {
        await addAccount({
          name: account.name,
          type: account.type as any,
          balance: account.balance,
          institution: account.institution,
          currency: account.currency,
          currencyCode: account.currency,
          isVisible: account.isVisible
        });
      }
      console.log('✅ Accounts saved');
      
      // Refresh profile context to reflect new data
      await refreshProfile();
      
      console.log('🎉 Onboarding completed successfully!');
      onComplete();
    } catch (error) {
      setError('Failed to complete setup');
      console.error('Setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize steps to prevent unnecessary re-renders
  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: 'Welcome to FinTrack',
      description: 'Professional Financial Management Platform',
      icon: <Check size={24} />,
      component: (
        <div className="text-center space-y-8">
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-blue-600">
            <PieChart size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              Welcome to FinTrack
            </h2>
            <p className="text-lg text-gray-600">
              Professional financial management and accounting platform
            </p>
          </div>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <Check size={20} className="text-green-600" />
              <span className="text-gray-600">
                Multi-currency accounting with real-time exchange rates
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Check size={20} className="text-green-600" />
              <span className="text-gray-600">
                Comprehensive budgeting and financial planning tools
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Check size={20} className="text-green-600" />
              <span className="text-gray-600">
                Enterprise-grade security and data protection
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Check size={20} className="text-green-600" />
              <span className="text-gray-600">
                Offline capability with automatic synchronization
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'User Profile Setup',
      description: 'Configure your financial management preferences',
      icon: <User size={24} />,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Full Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={userProfile.name}
                onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                className={`py-3 ${userProfile.name.trim() === '' ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'}`}
              />
              {userProfile.name.trim() === '' && (
                <p className="text-xs text-red-500 mt-1">Name is required to continue</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Age
                </label>
                <Input
                  type="number"
                  placeholder="25"
                  value={userProfile.age || ''}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className="py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Country
                </label>
                <Input
                  type="text"
                  placeholder="India"
                  value={userProfile.country}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, country: e.target.value }))}
                  className="py-3"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Profession
              </label>
              <Input
                type="text"
                placeholder="Software Engineer"
                value={userProfile.profession}
                onChange={(e) => setUserProfile(prev => ({ ...prev, profession: e.target.value }))}
                className="py-3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Monthly Income
              </label>
              <CurrencyInput
                value={userProfile.monthlyIncome}
                currency={userProfile.primaryCurrency}
                onValueChange={(value) => setUserProfile(prev => ({ ...prev, monthlyIncome: typeof value === 'number' ? value : 0 }))}
                onCurrencyChange={(currency) => setUserProfile(prev => ({ ...prev, primaryCurrency: currency, displayCurrency: currency }))}
                placeholder="50000"
                showConversion={userProfile.primaryCurrency !== displayCurrency}
                targetCurrency={displayCurrency}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'currency',
      title: 'Currency Configuration',
      description: 'Set up multi-currency accounting preferences',
      icon: <Globe size={24} />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              Configure your primary currency and multi-currency settings for professional accounting.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <CurrencySelector
                label="Primary Currency *"
                value={userProfile.primaryCurrency}
                onChange={(currency) => setUserProfile(prev => ({ 
                  ...prev, 
                  primaryCurrency: currency,
                  displayCurrency: currency 
                }))}
                showFlag={true}
                showFullName={true}
                popularOnly={false}
              />
              {userProfile.primaryCurrency === '' && (
                <p className="text-xs text-red-500 mt-1">Currency selection is required to continue</p>
              )}
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={userProfile.autoConvert}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, autoConvert: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Automatically convert amounts to my primary currency
                </span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={userProfile.showOriginalAmounts}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, showOriginalAmounts: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Show original amounts alongside converted amounts
                </span>
              </label>
            </div>
            
            {userProfile.primaryCurrency !== 'USD' && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <LiveRateDisplay
                  fromCurrency={userProfile.primaryCurrency}
                  toCurrency="USD"
                  amount={100}
                  showTrend={true}
                  showLastUpdated={true}
                />
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'categories',
      title: 'Category Management',
      description: 'Configure transaction categories for professional accounting',
      icon: <PieChart size={24} />,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              Default Categories
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {defaultCategories.map((category, index) => (
                <button
                  key={index}
                  className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-solid hover:border-blue-500 transition-all duration-200 text-center bg-gray-50 hover:bg-blue-50"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium text-gray-700">
                    {category.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              Custom Categories
            </h3>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">Add Custom Category</h4>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value as 'income' | 'expense')}
                    className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-700"
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
                        onClick={() => setNewCategoryIcon(icon)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          newCategoryIcon === icon 
                            ? 'border-purple-500 bg-purple-100' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    onClick={addCustomCategory}
                    className="flex-1"
                    disabled={!newCategory.trim()}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Category
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setNewCategory('');
                      setNewCategoryType('expense');
                      setNewCategoryIcon('📝');
                    }}
                    className="px-4"
                    disabled={!newCategory && newCategoryType === 'expense' && newCategoryIcon === '📝'}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            
            {customCategories.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">
                    Your Categories ({customCategories.length})
                  </h4>
                  <Button
                    variant="secondary"
                    onClick={() => setCustomCategories([])}
                    className="text-xs px-3 py-1"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-lg">{category.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">
                            {category.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {category.type === 'income' ? '💰 Income' : '💸 Expense'} • {category.color}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setCustomCategories(prev => prev.filter(c => c.id !== category.id))}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Remove category"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'activities',
      title: 'Create Activities',
      description: 'Set up goals, bills, liabilities, and budgets to stay on track.',
      icon: <Target size={24} />,
      component: (
        <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  Add Basic Activities
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setNewActivity({ type: 'goal', name: 'Emergency Fund', amount: 10000, currency: displayCurrency, description: 'Build emergency savings' })}
                    className="text-xs px-3 py-1"
                  >
                    Quick Goal
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setNewActivity({ type: 'bill', name: 'Electricity Bill', amount: 2000, currency: displayCurrency, description: 'Monthly electricity bill' })}
                    className="text-xs px-3 py-1"
                  >
                    Quick Bill
                  </Button>
                </div>
              </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Add New Activity</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newActivity.type || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value as any }))}
                      className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                    >
                      <option value="">Select type</option>
                      <option value="goal">🎯 Goal</option>
                      <option value="bill">📄 Bill</option>
                      <option value="liability">💳 Liability</option>
                      <option value="budget">📊 Budget</option>
                    </select>
                    
                    <Input
                      type="text"
                      placeholder="Activity name"
                      value={newActivity.name || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      value={newActivity.amount || 0}
                      currency={newActivity.currency || displayCurrency}
                      onValueChange={(value) => setNewActivity(prev => ({ ...prev, amount: typeof value === 'number' ? value : 0 }))}
                      onCurrencyChange={(currency) => setNewActivity(prev => ({ ...prev, currency }))}
                      placeholder="0"
                    />
                    
                    <Input
                      type="text"
                      placeholder="Description (optional)"
                      value={newActivity.description || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      onClick={addBasicActivity}
                      className="flex-1"
                      disabled={!newActivity.type || !newActivity.name || !newActivity.amount}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Activity
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={() => setNewActivity({})}
                      className="px-4"
                      disabled={!newActivity.type && !newActivity.name && !newActivity.amount}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {basicActivities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">
                    Your Activities ({basicActivities.length})
                  </h4>
                  <Button
                    variant="secondary"
                    onClick={() => setBasicActivities([])}
                    className="text-xs px-3 py-1"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {basicActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-lg">
                          {activity.type === 'goal' ? '🎯' : 
                           activity.type === 'bill' ? '📄' :
                           activity.type === 'liability' ? '💳' : '📊'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">
                            {activity.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} • {activity.currency} {activity.amount.toLocaleString()}
                            {activity.description && ` • ${activity.description}`}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setBasicActivities(prev => prev.filter(a => a.id !== activity.id))}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Remove activity"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'accounts',
      title: 'Set Up Your Accounts',
      description: 'Start by adding your accounts. You can add more later.',
      icon: <CreditCard size={24} />,
      component: (
        <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  Add Account
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setNewAccount({ name: 'Main Savings', type: 'bank_savings', balance: 50000, currency: displayCurrency, institution: 'Your Bank' })}
                    className="text-xs px-3 py-1"
                  >
                    Quick Savings
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setNewAccount({ name: 'Cash Wallet', type: 'cash', balance: 5000, currency: displayCurrency })}
                    className="text-xs px-3 py-1"
                  >
                    Quick Cash
                  </Button>
                </div>
              </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-medium text-green-800 mb-3">Add New Account</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="text"
                      placeholder="Account name"
                      value={newAccount.name || ''}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                    />
                    
                    <select
                      value={newAccount.type || ''}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value }))}
                      className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                    >
                      <option value="">Select type</option>
                      <option value="bank_savings">🏦 Savings</option>
                      <option value="bank_current">🏦 Current</option>
                      <option value="digital_wallet">📱 Digital Wallet</option>
                      <option value="cash">💵 Cash</option>
                      <option value="credit_card">💳 Credit Card</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      value={newAccount.balance || 0}
                      currency={newAccount.currency || displayCurrency}
                      onValueChange={(value) => setNewAccount(prev => ({ ...prev, balance: typeof value === 'number' ? value : 0 }))}
                      onCurrencyChange={(currency) => setNewAccount(prev => ({ ...prev, currency }))}
                      placeholder="0"
                    />
                    
                    <Input
                      type="text"
                      placeholder="Institution (optional)"
                      value={newAccount.institution || ''}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, institution: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      onClick={addAccountSetup}
                      className="flex-1"
                      disabled={!newAccount.name || !newAccount.type || newAccount.balance === undefined}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Account
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={() => setNewAccount({})}
                      className="px-4"
                      disabled={!newAccount.name && !newAccount.type && newAccount.balance === undefined}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {accounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">
                    Your Accounts ({accounts.length})
                  </h4>
                  <Button
                    variant="secondary"
                    onClick={() => setAccounts([])}
                    className="text-xs px-3 py-1"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-lg">
                          {account.type === 'bank_savings' ? '🏦' :
                           account.type === 'bank_current' ? '🏦' :
                           account.type === 'digital_wallet' ? '📱' :
                           account.type === 'cash' ? '💵' : '💳'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">
                            {account.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {account.currency} {account.balance.toLocaleString()} • {account.type.replace('_', ' ')}
                            {account.institution && ` • ${account.institution}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleAccountVisibility(account.id)}
                          className={`p-1 rounded hover:bg-gray-200 transition-colors ${account.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                          title={account.isVisible ? 'Hide account' : 'Show account'}
                        >
                          {account.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => setAccounts(prev => prev.filter(a => a.id !== account.id))}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove account"
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-green-600">
            <Check size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800">
              Welcome to FinTrack!
            </h2>
            <p className="text-lg text-gray-600">
              Your personal finance management system is ready to go.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">
                Profile setup complete
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">
                Currency preferences set ({userProfile.primaryCurrency})
              </span>
            </div>
            {customCategories.length > 0 && (
              <div className="flex items-center space-x-3">
                <Check size={16} className="text-green-600" />
                <span className="text-sm text-gray-600">
                  {customCategories.length} custom categories added
                </span>
              </div>
            )}
            {basicActivities.length > 0 && (
              <div className="flex items-center space-x-3">
                <Check size={16} className="text-green-600" />
                <span className="text-sm text-gray-600">
                  {basicActivities.length} activities created
                </span>
              </div>
            )}
            {accounts.length > 0 && (
              <div className="flex items-center space-x-3">
                <Check size={16} className="text-green-600" />
                <span className="text-sm text-gray-600">
                  {accounts.length} accounts added
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
  ], [userProfile, customCategories, basicActivities, accounts, displayCurrency, isLoading, addCustomCategory, addBasicActivity, addAccountSetup, toggleAccountVisibility]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  
  // Check if current step can proceed based on validation
  const canProceed = (() => {
    switch (currentStepData.id) {
      case 'welcome':
        return true; // Always can proceed from welcome
      case 'profile':
        return userProfile.name.trim() !== ''; // Name is required
      case 'currency':
        return userProfile.primaryCurrency !== ''; // Currency is required
      case 'categories':
        return true; // Categories are optional
      case 'activities':
        return true; // Activities are optional
      case 'accounts':
        return true; // Accounts are optional
      case 'complete':
        return true; // Always can proceed to complete
      default:
        return true;
    }
  })();

  return (
    <PerformanceOptimizer>
      <div className="min-h-screen flex items-center justify-center px-4 bg-amber-50">
        <OfflineIndicator isOnline={isOnline} />
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
        <div className="p-8 rounded-2xl mb-6 bg-white shadow-2xl">
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
    </PerformanceOptimizer>
  );
};

export default EnhancedOnboardingFlow;
