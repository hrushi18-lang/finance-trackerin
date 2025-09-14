import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, GraduationCap, Users, ShoppingCart, Wallet, Car, Home, Scale, Zap, FileText, Globe, Building, DollarSign, Calendar, Percent, Target, Settings } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';
import { CurrencyInput } from '../currency/CurrencyInput';
import { LiabilityType, getLiabilityBehavior } from '../../lib/liability-behaviors';
import { getCurrencyInfo } from '../../utils/currency-converter';

interface LuxuryLiabilityFormProps {
  onComplete: (liability: any) => void;
  onCancel: () => void;
}

const liabilityTypes = [
  { id: 'education_loan', name: 'Education Loan', icon: <GraduationCap size={24} />, description: 'Student loans, tuition, books' },
  { id: 'student_credit_card', name: 'Student Credit Card', icon: <CreditCard size={24} />, description: 'Low-limit cards for building credit' },
  { id: 'family_debt', name: 'Family Debt', icon: <Users size={24} />, description: 'Borrowed from parents/relatives' },
  { id: 'bnpl', name: 'Buy Now Pay Later', icon: <ShoppingCart size={24} />, description: 'Laptops, phones, course materials' },
  { id: 'personal_loan', name: 'Personal Loan', icon: <Wallet size={24} />, description: 'Home renovation, wedding, emergencies' },
  { id: 'credit_card', name: 'Credit Card', icon: <CreditCard size={24} />, description: 'Monthly expenses, rewards optimization' },
  { id: 'auto_loan', name: 'Auto Loan', icon: <Car size={24} />, description: 'Vehicle financing' },
  { id: 'home_loan', name: 'Home Loan', icon: <Home size={24} />, description: 'Property purchase' },
  { id: 'gold_loan', name: 'Gold Loan', icon: <Scale size={24} />, description: 'Emergency liquidity against gold' },
  { id: 'utility_debt', name: 'Utility Debt', icon: <Zap size={24} />, description: 'Electricity, internet, subscriptions' },
  { id: 'tax_debt', name: 'Tax Debt', icon: <FileText size={24} />, description: 'Government compliance obligations' },
  { id: 'international_debt', name: 'International Debt', icon: <Globe size={24} />, description: 'Multi-currency obligations' }
];

export const LuxuryLiabilityForm: React.FC<LuxuryLiabilityFormProps> = ({ onComplete, onCancel }) => {
  const { addLiability, accounts } = useFinance();
  const { formatCurrency: formatCurrencyOld } = useInternationalization();
  const { displayCurrency, formatCurrency, convertAmount } = useEnhancedCurrency();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Type Selection
    liabilityType: '' as LiabilityType | '',
    
    // Step 2: Basic Info
    name: '',
    description: '',
    liabilityStatus: 'new' as 'new' | 'existing',
    
    // Step 3: Financial Details
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    monthlyPayment: '',
    minimumPayment: '',
    currencyCode: displayCurrency,
    
    // Step 4: Payment Setup
    paymentDay: '1',
    autoGenerateBills: true,
    sendReminders: true,
    reminderDays: '7',
    paymentStrategy: 'equal' as 'equal' | 'minimum' | 'aggressive',
    selectedAccounts: [] as string[],
    
    // Step 5: Additional Settings
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    affectsCreditScore: true,
    isSecured: false,
    providesFunds: false
  });

  const totalSteps = 5;

  // Handle Escape key to close modal and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onCancel]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const liabilityData = {
        name: formData.name,
        liabilityType: formData.liabilityType,
        description: formData.description,
        liabilityStatus: formData.liabilityStatus,
        totalAmount: parseFloat(formData.totalAmount),
        remainingAmount: formData.liabilityStatus === 'new' 
          ? parseFloat(formData.totalAmount) 
          : parseFloat(formData.remainingAmount),
        interestRate: parseFloat(formData.interestRate),
        monthlyPayment: parseFloat(formData.monthlyPayment),
        minimumPayment: parseFloat(formData.minimumPayment),
        paymentDay: parseInt(formData.paymentDay),
        loanTermMonths: 0, // Will be calculated
        remainingTermMonths: 0, // Will be calculated
        startDate: new Date(),
        dueDate: undefined,
        nextPaymentDate: undefined,
        linkedAssetId: undefined,
        status: 'active',
        isActive: true,
        affectsCreditScore: formData.affectsCreditScore,
        isSecured: formData.isSecured,
        providesFunds: formData.providesFunds,
        autoGenerateBills: formData.autoGenerateBills,
        billGenerationDay: parseInt(formData.paymentDay),
        sendReminders: formData.sendReminders,
        reminderDays: parseInt(formData.reminderDays),
        paymentStrategy: formData.paymentStrategy,
        paymentAccounts: formData.selectedAccounts,
        paymentPercentages: [],
        modificationCount: 0,
        typeSpecificData: {},
        currencyCode: formData.currencyCode,
        activityScope: 'general' as const,
        accountIds: formData.selectedAccounts,
        targetCategory: undefined,
        priority: formData.priority
      };

      await addLiability(liabilityData);
      onComplete(liabilityData);
    } catch (error: any) {
      console.error('Error creating liability:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            i + 1 <= currentStep 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {i + 1 < currentStep ? <Check size={16} /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${
              i + 1 < currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Liability Type</h2>
        <p className="text-gray-600">Select the type of liability you want to add</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {liabilityTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => updateFormData('liabilityType', type.id)}
            className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
              formData.liabilityType === type.id
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className={`mx-auto mb-3 ${
                formData.liabilityType === type.id ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {type.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
              <p className="text-xs text-gray-500">{type.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">Tell us about your liability</p>
      </div>
      
      <div className="space-y-4">
        <Input
          label="Liability Name"
          placeholder="e.g., Student Loan, Credit Card"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="text-lg"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
          <textarea
            placeholder="Add any additional details..."
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Is this a new or existing liability?</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateFormData('liabilityStatus', 'new')}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.liabilityStatus === 'new'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🆕</div>
                <div className="font-semibold">New</div>
                <div className="text-sm text-gray-500">Just starting</div>
              </div>
            </button>
            <button
              onClick={() => updateFormData('liabilityStatus', 'existing')}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.liabilityStatus === 'existing'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">Existing</div>
                <div className="text-sm text-gray-500">Already in progress</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Details</h2>
        <p className="text-gray-600">Enter the financial information</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-4">
          <CurrencyInput
            label="Total Amount"
            value={formData.totalAmount ? parseFloat(formData.totalAmount) : ''}
            currency={formData.currencyCode}
            onValueChange={(value) => updateFormData('totalAmount', value.toString())}
            onCurrencyChange={(currency) => updateFormData('currencyCode', currency)}
            placeholder="0.00"
            showConversion={formData.currencyCode !== displayCurrency}
            targetCurrency={displayCurrency}
          />
          <Input
            label="Interest Rate (%)"
            type="number"
            placeholder="0.00"
            value={formData.interestRate}
            onChange={(e) => updateFormData('interestRate', e.target.value)}
            icon={<Percent size={18} className="text-gray-400" />}
          />
        </div>
        
        {formData.liabilityStatus === 'existing' && (
          <CurrencyInput
            label="Remaining Amount"
            value={formData.remainingAmount ? parseFloat(formData.remainingAmount) : ''}
            currency={formData.currencyCode}
            onValueChange={(value) => updateFormData('remainingAmount', value.toString())}
            onCurrencyChange={(currency) => updateFormData('currencyCode', currency)}
            placeholder="0.00"
            showConversion={formData.currencyCode !== displayCurrency}
            targetCurrency={displayCurrency}
          />
        )}
        
        <div className="space-y-4">
          <CurrencyInput
            label="Monthly Payment"
            value={formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : ''}
            currency={formData.currencyCode}
            onValueChange={(value) => updateFormData('monthlyPayment', value.toString())}
            onCurrencyChange={(currency) => updateFormData('currencyCode', currency)}
            placeholder="0.00"
            showConversion={formData.currencyCode !== displayCurrency}
            targetCurrency={displayCurrency}
          />
          <CurrencyInput
            label="Minimum Payment"
            value={formData.minimumPayment ? parseFloat(formData.minimumPayment) : ''}
            currency={formData.currencyCode}
            onValueChange={(value) => updateFormData('minimumPayment', value.toString())}
            onCurrencyChange={(currency) => updateFormData('currencyCode', currency)}
            placeholder="0.00"
            showConversion={formData.currencyCode !== displayCurrency}
            targetCurrency={displayCurrency}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={formData.currencyCode}
            onChange={(e) => updateFormData('currencyCode', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={displayCurrency}>{displayCurrency} - {getCurrencyInfo(displayCurrency)?.name || 'US Dollar'}</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
          </select>
        </div>

        {/* Live Rate Display */}
        {formData.currencyCode !== displayCurrency && formData.totalAmount && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-600 mb-1">Live Conversion</h4>
                <p className="text-xs text-gray-600">
                  {formatCurrency(parseFloat(formData.totalAmount), formData.currencyCode)} = {' '}
                  {convertAmount(parseFloat(formData.totalAmount), formData.currencyCode, displayCurrency) 
                    ? formatCurrency(convertAmount(parseFloat(formData.totalAmount), formData.currencyCode, displayCurrency)!, displayCurrency)
                    : 'N/A'
                  }
                </p>
              </div>
              {/* LiveRateDisplay removed for simplified currency system */}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup</h2>
        <p className="text-gray-600">Configure how you'll manage payments</p>
      </div>
      
      <div className="space-y-4">
        <Input
          label="Payment Day of Month"
          type="number"
          placeholder="1"
          value={formData.paymentDay}
          onChange={(e) => updateFormData('paymentDay', e.target.value)}
          icon={<Calendar size={18} className="text-gray-400" />}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Payment Strategy</label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'equal', name: 'Equal Payments', desc: 'Pay the same amount each month' },
              { id: 'minimum', name: 'Minimum Only', desc: 'Pay only the minimum required' },
              { id: 'aggressive', name: 'Aggressive', desc: 'Pay as much as possible' }
            ].map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => updateFormData('paymentStrategy', strategy.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.paymentStrategy === strategy.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{strategy.name}</div>
                <div className="text-sm text-gray-500">{strategy.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Payment Accounts</label>
          <div className="space-y-2">
            {accounts.map((account) => (
              <label key={account.id} className="flex items-center p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.selectedAccounts.includes(account.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateFormData('selectedAccounts', [...formData.selectedAccounts, account.id]);
                    } else {
                      updateFormData('selectedAccounts', formData.selectedAccounts.filter(id => id !== account.id));
                    }
                  }}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{account.name}</div>
                  <div className="text-sm text-gray-500">{account.accountType} • {formatCurrency(account.balance)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoGenerateBills}
              onChange={(e) => updateFormData('autoGenerateBills', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Auto-generate Bills</div>
              <div className="text-sm text-gray-500">Create bills automatically</div>
            </div>
          </label>
          
          <label className="flex items-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.sendReminders}
              onChange={(e) => updateFormData('sendReminders', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div>
              <div className="font-medium text-gray-900">Send Reminders</div>
              <div className="text-sm text-gray-500">Get payment notifications</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const behavior = formData.liabilityType ? getLiabilityBehavior(formData.liabilityType) : null;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
          <p className="text-gray-600">Review your liability details before creating</p>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{behavior?.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{formData.name}</h3>
              <p className="text-gray-600">{behavior?.displayName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="font-semibold text-gray-900">{formatCurrency(parseFloat(formData.totalAmount || '0'), formData.currencyCode)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Interest Rate</div>
              <div className="font-semibold text-gray-900">{formData.interestRate}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Monthly Payment</div>
              <div className="font-semibold text-gray-900">{formatCurrency(parseFloat(formData.monthlyPayment || '0'), formData.currencyCode)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Payment Day</div>
              <div className="font-semibold text-gray-900">{formData.paymentDay}</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500 mb-2">Payment Accounts</div>
            <div className="flex flex-wrap gap-2">
              {formData.selectedAccounts.map(accountId => {
                const account = accounts.find(a => a.id === accountId);
                return account ? (
                  <span key={accountId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {account.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.liabilityType !== '';
      case 2: return formData.name.trim() !== '';
      case 3: return formData.totalAmount !== '' && formData.interestRate !== '';
      case 4: return formData.selectedAccounts.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-slideUp mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Add Liability</h1>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-600 text-xl">×</span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4">
          {renderStepIndicator()}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={20} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Liability'}
                <Check size={20} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
