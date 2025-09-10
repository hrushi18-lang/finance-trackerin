import React from 'react';
import { CheckCircle, ArrowLeft, Wallet, Target, Calendar, CreditCard, PieChart } from 'lucide-react';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface PlanningSetupData {
  accounts: Array<{ name: string; balance: number }>;
  goals: Array<{ name: string; amount: number }>;
  bills: Array<{ name: string; amount: number }>;
  liabilities: Array<{ name: string; amount: number }>;
  budgets: Array<{ category: string; amount: number }>;
}

interface OnboardingPlanningSetupProps {
  onNext: () => void;
  onPrev: () => void;
  userData: PlanningSetupData;
  canGoBack?: boolean;
}

export const OnboardingPlanningSetup: React.FC<OnboardingPlanningSetupProps> = ({ 
  onNext, 
  onPrev, 
  userData,
  canGoBack = true
}) => {
  const { formatCurrency } = useInternationalization();

  const getAccountIcon = (name: string) => {
    if (name.toLowerCase().includes('wallet')) return '💳';
    if (name.toLowerCase().includes('cash')) return '💵';
    if (name.toLowerCase().includes('bank')) return '🏦';
    return '💰';
  };

  const totalBalance = userData.accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Header with Back Button */}
          <div className="flex items-center mb-6">
            {canGoBack && (
              <button
                onClick={onPrev}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-forest-600 h-2 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              Review Your Plan
            </h2>
            <p className="text-gray-600 font-body">
              Here's a summary of your financial setup.
            </p>
          </div>

          {/* Accounts Section */}
          <div className="mb-8">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">Accounts</h3>
            <div className="space-y-3">
              {userData.accounts?.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getAccountIcon(account.name)}</span>
                    <span className="font-body font-medium text-gray-900">{account.name}</span>
                  </div>
                  <span className="font-numbers font-bold text-gray-900">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activities Section */}
          <div className="mb-8">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">Activities</h3>
            <div className="space-y-3">
              {userData.goals?.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Target size={16} className="text-yellow-600" />
                    <span className="font-body text-gray-900">Goal: {goal.name}</span>
                  </div>
                  <span className="font-numbers text-gray-900">{formatCurrency(goal.amount)}</span>
                </div>
              ))}
              
              {userData.bills?.map((bill, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="font-body text-gray-900">Bill: {bill.name}</span>
                  </div>
                  <span className="font-numbers text-gray-900">{formatCurrency(bill.amount)}</span>
                </div>
              ))}
              
              {userData.liabilities?.map((liability, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CreditCard size={16} className="text-red-600" />
                    <span className="font-body text-gray-900">Debt: {liability.name}</span>
                  </div>
                  <span className="font-numbers text-gray-900">{formatCurrency(liability.amount)}</span>
                </div>
              ))}
              
              {userData.budgets?.map((budget, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <PieChart size={16} className="text-green-600" />
                    <span className="font-body text-gray-900">Budget: {budget.category}</span>
                  </div>
                  <span className="font-numbers text-gray-900">{formatCurrency(budget.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Summary */}
          <div className="bg-orange-50 rounded-xl p-4 mb-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-orange-600" />
                <span className="font-body font-medium text-orange-900">FinTrack Free</span>
              </div>
              <button className="text-orange-600 font-body text-sm hover:text-orange-700">
                Change
              </button>
            </div>
            <p className="text-orange-700 text-sm font-body mt-1">Your current plan.</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => {/* Handle plan confirmation */}}
              variant="outline"
              className="w-full py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Confirm Plan
            </Button>
            
            <Button
              onClick={onNext}
              className="w-full py-4 text-lg font-heading font-semibold bg-gray-900 text-white hover:bg-gray-800 rounded-2xl shadow-lg transition-all"
            >
              Continue to App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};