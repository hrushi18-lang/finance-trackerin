import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';
import { EnhancedTransactionForm } from '../components/forms/EnhancedTransactionForm';
import { useFinance } from '../contexts/FinanceContext';
import { 
  convertTransactionCurrency, 
  generateTransactionDisplayText,
  formatCurrencyAmount,
  type CurrencyConversionResult 
} from '../utils/multi-currency-converter';

const MultiCurrencyDemo: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, getUserCurrency } = useFinance();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [demoResults, setDemoResults] = useState<CurrencyConversionResult[]>([]);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  const primaryCurrency = getUserCurrency();

  // Demo scenarios for all 5 currency cases
  const demoScenarios = [
    {
      name: "Case 1: T = A = P (All Same)",
      description: "Add ₹1,000 into an INR account with INR primary currency",
      transactionAmount: 1000,
      transactionCurrency: 'INR',
      accountCurrency: 'INR',
      primaryCurrency: 'INR',
      expected: "No conversion needed - all currencies match"
    },
    {
      name: "Case 2: T = A ≠ P",
      description: "Add $100 into a USD account with INR primary currency",
      transactionAmount: 100,
      transactionCurrency: 'USD',
      accountCurrency: 'USD',
      primaryCurrency: 'INR',
      expected: "Converted to primary currency: $1 = ₹83"
    },
    {
      name: "Case 3: T ≠ A, A = P",
      description: "Add £100 into an INR account with INR primary currency",
      transactionAmount: 100,
      transactionCurrency: 'GBP',
      accountCurrency: 'INR',
      primaryCurrency: 'INR',
      expected: "Converted to account currency: £1 = ₹105"
    },
    {
      name: "Case 4: T ≠ A, T = P",
      description: "Add ₹8,300 into a USD account with INR primary currency",
      transactionAmount: 8300,
      transactionCurrency: 'INR',
      accountCurrency: 'USD',
      primaryCurrency: 'INR',
      expected: "Converted to account currency: ₹1 = $0.012"
    },
    {
      name: "Case 5: T ≠ A ≠ P (All Different)",
      description: "Add ¥10,000 into a GBP account with INR primary currency",
      transactionAmount: 10000,
      transactionCurrency: 'JPY',
      accountCurrency: 'GBP',
      primaryCurrency: 'INR',
      expected: "Multi-currency conversion: ¥1 = £0.0053 = ₹0.56"
    }
  ];

  const runDemo = async () => {
    setIsRunningDemo(true);
    setDemoResults([]);
    
    const results: CurrencyConversionResult[] = [];
    
    for (const scenario of demoScenarios) {
      try {
        const result = await convertTransactionCurrency(
          scenario.transactionAmount,
          scenario.transactionCurrency,
          scenario.accountCurrency,
          scenario.primaryCurrency
        );
        results.push(result);
      } catch (error) {
        console.error(`Error in scenario ${scenario.name}:`, error);
      }
    }
    
    setDemoResults(results);
    setIsRunningDemo(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Multi-Currency Transaction Demo</h1>
              <p className="text-gray-600">Comprehensive currency conversion system for all 5 cases</p>
            </div>
          </div>
          <Button
            onClick={() => setShowTransactionForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Current Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900">Primary Currency</h3>
              <p className="text-2xl font-bold text-blue-600">{primaryCurrency}</p>
              <p className="text-sm text-blue-700">Used for totals and calculations</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900">Available Accounts</h3>
              <p className="text-2xl font-bold text-green-600">{accounts.length}</p>
              <p className="text-sm text-green-700">Different currency accounts</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900">Currency Cases</h3>
              <p className="text-2xl font-bold text-purple-600">5</p>
              <p className="text-sm text-purple-700">Supported combinations</p>
            </div>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Currency Conversion Scenarios</h2>
            <Button
              onClick={runDemo}
              loading={isRunningDemo}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw size={20} className="mr-2" />
              Run Demo
            </Button>
          </div>

          <div className="space-y-4">
            {demoScenarios.map((scenario, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                  <span className="text-sm text-gray-500">Scenario {index + 1}</span>
                </div>
                <p className="text-gray-600 mb-3">{scenario.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Transaction:</span>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrencyAmount(scenario.transactionAmount, scenario.transactionCurrency, getCurrencyInfo(scenario.transactionCurrency)?.symbol || '$')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Account:</span>
                    <p className="text-lg font-bold text-green-600">
                      {scenario.accountCurrency}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Primary:</span>
                    <p className="text-lg font-bold text-purple-600">
                      {scenario.primaryCurrency}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expected:</span>
                    <p className="text-sm text-gray-600">{scenario.expected}</p>
                  </div>
                </div>

                {/* Show result if available */}
                {demoResults[index] && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Conversion Result:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3">
                        <h5 className="font-medium text-gray-700 mb-1">Transaction Amount</h5>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrencyAmount(
                            demoResults[index].transactionAmount,
                            demoResults[index].transactionCurrency,
                            demoResults[index].transactionSymbol
                          )}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <h5 className="font-medium text-gray-700 mb-1">Account Balance</h5>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrencyAmount(
                            demoResults[index].accountAmount,
                            demoResults[index].accountCurrency,
                            demoResults[index].accountSymbol
                          )}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <h5 className="font-medium text-gray-700 mb-1">Total Impact</h5>
                        <p className="text-xl font-bold text-purple-600">
                          {formatCurrencyAmount(
                            demoResults[index].primaryAmount,
                            demoResults[index].primaryCurrency,
                            demoResults[index].primarySymbol
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Case {demoResults[index].case}:</strong> {generateTransactionDisplayText(demoResults[index]).conversionNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Storage Strategy</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Transaction Currency:</strong> What user entered (native_amount, native_currency, native_symbol)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Account Currency:</strong> What the account uses (converted_amount, converted_currency, converted_symbol)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Primary Currency:</strong> For totals and calculations (currency_code)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Display Strategy</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Transaction:</strong> Show original amount with conversion preview</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Account:</strong> Show converted amount in account's currency</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Totals:</strong> Show primary currency amounts for calculations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Transaction Form Modal */}
      {showTransactionForm && (
        <EnhancedTransactionForm
          isOpen={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
        />
      )}
    </div>
  );
};

export default MultiCurrencyDemo;
