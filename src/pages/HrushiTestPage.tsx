import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { GlassCard } from '../components/common/GlassCard';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { currencyConversionService } from '../services/currencyConversionService';
import { Decimal } from 'decimal.js';
import { 
  DollarSign, 
  Target, 
  Calculator, 
  FileText, 
  CreditCard, 
  Banknote,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface TestScenario {
  id: string;
  title: string;
  description: string;
  type: 'goal' | 'budget' | 'bill' | 'liability' | 'account' | 'transaction';
  amount: number;
  currency: string;
  accountCurrency: string;
  expectedConversion: {
    accountAmount: number;
    primaryAmount: number;
  };
}

const HrushiTestPage: React.FC = () => {
  const { 
    accounts, 
    goals, 
    budgets, 
    bills, 
    liabilities,
    executeCurrencyTransaction,
    executeGoalCreation,
    executeBudgetCreation,
    executeBillCreation,
    executeLiabilityCreation,
    executeAccountCreation
  } = useFinance();
  
  const { primaryCurrency } = useInternationalization();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // Hrushi's test scenarios based on his persona
  const testScenarios: TestScenario[] = [
    {
      id: 'goal-travel-fund',
      title: 'Travel Fund Goal',
      description: 'Save $25,000 for travel and emergency fund',
      type: 'goal',
      amount: 25000,
      currency: 'USD',
      accountCurrency: 'USD',
      expectedConversion: { accountAmount: 25000, primaryAmount: 25000 }
    },
    {
      id: 'goal-india-remittance',
      title: 'India Remittance Goal',
      description: 'Save ₹2,00,000 to send to parents',
      type: 'goal',
      amount: 200000,
      currency: 'INR',
      accountCurrency: 'INR',
      expectedConversion: { accountAmount: 200000, primaryAmount: 2400 } // Assuming 1 USD = 83 INR
    },
    {
      id: 'budget-monthly-expenses',
      title: 'Monthly Living Expenses Budget',
      description: 'Budget for meals, groceries, transport',
      type: 'budget',
      amount: 1500,
      currency: 'USD',
      accountCurrency: 'USD',
      expectedConversion: { accountAmount: 1500, primaryAmount: 1500 }
    },
    {
      id: 'budget-india-subscriptions',
      title: 'India Subscriptions Budget',
      description: 'Budget for Indian subscriptions and utilities',
      type: 'budget',
      amount: 5000,
      currency: 'INR',
      accountCurrency: 'INR',
      expectedConversion: { accountAmount: 5000, primaryAmount: 60 }
    },
    {
      id: 'bill-netflix',
      title: 'Netflix Subscription',
      description: 'Monthly Netflix subscription',
      type: 'bill',
      amount: 15.99,
      currency: 'USD',
      accountCurrency: 'USD',
      expectedConversion: { accountAmount: 15.99, primaryAmount: 15.99 }
    },
    {
      id: 'bill-india-emi',
      title: 'Student Loan EMI (India)',
      description: 'Monthly EMI for student loan in India',
      type: 'bill',
      amount: 20000,
      currency: 'INR',
      accountCurrency: 'INR',
      expectedConversion: { accountAmount: 20000, primaryAmount: 240 }
    },
    {
      id: 'liability-credit-card',
      title: 'Credit Card Debt',
      description: 'Outstanding credit card balance',
      type: 'liability',
      amount: 2500,
      currency: 'USD',
      accountCurrency: 'USD',
      expectedConversion: { accountAmount: 2500, primaryAmount: 2500 }
    },
    {
      id: 'liability-india-loan',
      title: 'India Student Loan',
      description: 'Outstanding student loan in India',
      type: 'liability',
      amount: 500000,
      currency: 'INR',
      accountCurrency: 'INR',
      expectedConversion: { accountAmount: 500000, primaryAmount: 6000 }
    },
    {
      id: 'account-cash-wallet',
      title: 'Cash Wallet (USD)',
      description: 'Daily expenses cash wallet',
      type: 'account',
      amount: 200,
      currency: 'USD',
      accountCurrency: 'USD',
      expectedConversion: { accountAmount: 200, primaryAmount: 200 }
    },
    {
      id: 'account-india-bank',
      title: 'India Bank Account',
      description: 'Bank account for Indian transactions',
      type: 'account',
      amount: 100000,
      currency: 'INR',
      accountCurrency: 'INR',
      expectedConversion: { accountAmount: 100000, primaryAmount: 1200 }
    }
  ];

  const runTest = async (scenario: TestScenario) => {
    setIsLoading(true);
    setCurrentTest(scenario.id);
    
    try {
      let result;
      const executionRequest = {
        amount: scenario.amount,
        currency: scenario.currency,
        accountId: accounts[0]?.id || 'default',
        operation: 'create' as const,
        description: scenario.description,
        category: 'test'
      };

      switch (scenario.type) {
        case 'goal':
          result = await executeGoalCreation({
            ...executionRequest,
            goalName: scenario.title,
            targetAmount: scenario.amount,
            targetCurrency: scenario.currency
          });
          break;
        case 'budget':
          result = await executeBudgetCreation({
            ...executionRequest,
            budgetName: scenario.title,
            budgetAmount: scenario.amount,
            budgetCurrency: scenario.currency,
            budgetPeriod: 'monthly'
          });
          break;
        case 'bill':
          result = await executeBillCreation({
            ...executionRequest,
            billName: scenario.title,
            billAmount: scenario.amount,
            billCurrency: scenario.currency,
            dueDate: new Date().toISOString().split('T')[0]
          });
          break;
        case 'liability':
          result = await executeLiabilityCreation({
            ...executionRequest,
            liabilityName: scenario.title,
            liabilityAmount: scenario.amount,
            liabilityCurrency: scenario.currency,
            liabilityType: 'student_loan'
          });
          break;
        case 'account':
          result = await executeAccountCreation({
            ...executionRequest,
            accountName: scenario.title,
            accountType: 'bank_savings'
          });
          break;
        default:
          result = await executeCurrencyTransaction(executionRequest);
      }

      setTestResults(prev => ({
        ...prev,
        [scenario.id]: {
          success: result.success,
          result,
          expected: scenario.expectedConversion,
          actual: {
            accountAmount: result.accountAmount,
            primaryAmount: result.primaryAmount
          },
          timestamp: new Date()
        }
      }));

    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [scenario.id]: {
          success: false,
          error: error.message,
          timestamp: new Date()
        }
      }));
    } finally {
      setIsLoading(false);
      setCurrentTest(null);
    }
  };

  const runAllTests = async () => {
    for (const scenario of testScenarios) {
      await runTest(scenario);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getTestStatus = (scenarioId: string) => {
    const result = testResults[scenarioId];
    if (!result) return 'pending';
    if (result.success) return 'success';
    return 'error';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Hrushi's Currency Conversion Test Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing multi-currency functionality for Stanford student persona
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Test Persona: Hrushi Thogiti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <strong>Primary Currency:</strong> USD<br/>
                <strong>Secondary Currency:</strong> INR<br/>
                <strong>Location:</strong> Stanford University, California
              </div>
              <div>
                <strong>Accounts:</strong> USD Cash, USD Bank, USD Credit Card, INR Bank<br/>
                <strong>Goals:</strong> Travel fund, India remittance<br/>
                <strong>Liabilities:</strong> Student loan (India), Credit card (USD)
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-8">
          <div className="flex gap-4">
            <Button
              onClick={runAllTests}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
            <Button
              onClick={() => setTestResults({})}
              variant="outline"
              disabled={isLoading}
            >
              Clear Results
            </Button>
          </div>
        </div>

        {/* Test Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testScenarios.map((scenario) => {
            const status = getTestStatus(scenario.id);
            const isRunning = currentTest === scenario.id;
            const result = testResults[scenario.id];

            return (
              <GlassCard key={scenario.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(isRunning ? 'loading' : status)}
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {scenario.title}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'success' ? 'bg-green-100 text-green-800' :
                    status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {scenario.type}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {scenario.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">
                      {currencyConversionService.formatAmount(
                        new Decimal(scenario.amount), 
                        scenario.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Account Currency:</span>
                    <span className="font-medium">{scenario.accountCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Primary Currency:</span>
                    <span className="font-medium">{primaryCurrency.code}</span>
                  </div>
                </div>

                {result && result.success && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Conversion Results:
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Account Amount:</span>
                        <span className="font-medium">
                          {currencyConversionService.formatAmount(
                            new Decimal(result.actual.accountAmount), 
                            result.result.accountCurrency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Primary Amount:</span>
                        <span className="font-medium">
                          {currencyConversionService.formatAmount(
                            new Decimal(result.actual.primaryAmount), 
                            result.result.primaryCurrency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exchange Rate:</span>
                        <span className="font-medium">
                          {result.result.exchangeRate?.toFixed(4) || '1.0000'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {result && !result.success && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      Error:
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {result.error}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => runTest(scenario)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full mt-4"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Run Test'
                  )}
                </Button>
                </GlassCard>
            );
          })}
        </div>

        {/* Summary */}
        {Object.keys(testResults).length > 0 && (
          <div className="mt-8">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(testResults).filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(testResults).filter(r => !r.success).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {testScenarios.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default HrushiTestPage;