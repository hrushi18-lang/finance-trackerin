import React, { useState } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, Globe, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CurrencySelector } from '../components/currency/CurrencySelector';
import { LiveRateDisplay } from '../components/currency/LiveRateDisplay';
import { CurrencyInput } from '../components/currency/CurrencyInput';
import { useEnhancedCurrency } from '../contexts/EnhancedCurrencyContext';

const CurrencyDemo: React.FC = () => {
  const navigate = useNavigate();
  const { 
    supportedCurrencies, 
    exchangeRates, 
    lastUpdated, 
    isLoading,
    isOnline,
    userPreferences,
    formatCurrency,
    convertAmount,
    getCurrencyInfo
  } = useEnhancedCurrency();

  // Demo state
  const [selectedCurrency1, setSelectedCurrency1] = useState('USD');
  const [selectedCurrency2, setSelectedCurrency2] = useState('INR');
  const [amount1, setAmount1] = useState<number | ''>(100);
  const [amount2, setAmount2] = useState<number | ''>('');
  const [targetCurrency, setTargetCurrency] = useState('EUR');

  // Demo scenarios
  const demoScenarios = [
    {
      title: "Pay Indian Bill from USD Account",
      description: "₹10,000 Indian electric bill from Chase USD account",
      fromCurrency: "USD",
      toCurrency: "INR",
      amount: 10000,
      type: "bill"
    },
    {
      title: "European Vacation Goal",
      description: "€5,000 vacation goal, saving from USD salary",
      fromCurrency: "USD",
      toCurrency: "EUR",
      amount: 5000,
      type: "goal"
    },
    {
      title: "Singapore Shopping Transaction",
      description: "S$150 shopping expense from USD credit card",
      fromCurrency: "USD",
      toCurrency: "SGD",
      amount: 150,
      type: "transaction"
    },
    {
      title: "UK Student Loan Payment",
      description: "£350 monthly loan payment from USD account",
      fromCurrency: "USD",
      toCurrency: "GBP",
      amount: 350,
      type: "liability"
    }
  ];

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'bill': return <Zap className="text-yellow-500" size={20} />;
      case 'goal': return <TrendingUp className="text-green-500" size={20} />;
      case 'transaction': return <DollarSign className="text-blue-500" size={20} />;
      case 'liability': return <Globe className="text-red-500" size={20} />;
      default: return <DollarSign className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Multi-Currency Demo</h1>
              <p className="text-sm text-gray-500">Test all currency features</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* System Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Supported Currencies</div>
              <div className="text-2xl font-bold text-blue-600">{supportedCurrencies.length}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Exchange Rates Loaded</div>
              <div className="text-2xl font-bold text-green-600">{Object.keys(exchangeRates).length}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Connection Status</div>
              <div className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-sm text-gray-900">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
          {isLoading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-700">Updating exchange rates...</span>
              </div>
            </div>
          )}
        </div>

        {/* User Preferences */}
        {userPreferences && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Preferences</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Primary Currency:</span>
                <span className="font-medium">{userPreferences.primary_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Display Currency:</span>
                <span className="font-medium">{userPreferences.display_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auto Convert:</span>
                <span className="font-medium">{userPreferences.auto_convert ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Show Original Amounts:</span>
                <span className="font-medium">{userPreferences.show_original_amounts ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Currency Selector Demo */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency Selector</h2>
          <div className="space-y-4">
            <CurrencySelector
              label="Select Currency"
              value={selectedCurrency1}
              onChange={setSelectedCurrency1}
              showFlag={true}
              showFullName={true}
            />
            <div className="text-sm text-gray-600">
              Selected: {getCurrencyInfo(selectedCurrency1)?.name} ({selectedCurrency1})
            </div>
          </div>
        </div>

        {/* Live Rate Display Demo */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Exchange Rates</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <LiveRateDisplay
                fromCurrency={selectedCurrency1}
                toCurrency={selectedCurrency2}
                amount={100}
                showTrend={true}
                showLastUpdated={true}
              />
            </div>
            <div className="flex space-x-2">
              <CurrencySelector
                value={selectedCurrency1}
                onChange={setSelectedCurrency1}
                popularOnly={true}
                showFlag={true}
              />
              <CurrencySelector
                value={selectedCurrency2}
                onChange={setSelectedCurrency2}
                popularOnly={true}
                showFlag={true}
              />
            </div>
          </div>
        </div>

        {/* Currency Input Demo */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency Input</h2>
          <div className="space-y-4">
            <CurrencyInput
              label="Amount"
              value={amount1}
              currency={selectedCurrency1}
              onValueChange={setAmount1}
              onCurrencyChange={setSelectedCurrency1}
              showConversion={true}
              targetCurrency={targetCurrency}
              onTargetCurrencyChange={setTargetCurrency}
              showLiveRate={true}
            />
            
            {amount1 !== '' && typeof amount1 === 'number' && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Conversion Result:</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(amount1, selectedCurrency1)} = {' '}
                  {convertAmount(amount1, selectedCurrency1, targetCurrency) 
                    ? formatCurrency(convertAmount(amount1, selectedCurrency1, targetCurrency)!, targetCurrency)
                    : 'N/A'
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-World Scenarios</h2>
          <div className="space-y-4">
            {demoScenarios.map((scenario, index) => {
              const convertedAmount = convertAmount(scenario.amount, scenario.toCurrency, scenario.fromCurrency);
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {getScenarioIcon(scenario.type)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{scenario.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                      <div className="flex items-center justify-between">
                        <LiveRateDisplay
                          fromCurrency={scenario.fromCurrency}
                          toCurrency={scenario.toCurrency}
                          amount={scenario.amount}
                          compact={true}
                          showTrend={false}
                        />
                        {convertedAmount && (
                          <div className="text-sm font-medium text-gray-900">
                            ≈ {formatCurrency(convertedAmount, scenario.fromCurrency)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Currency Rates Grid */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Rates (vs USD)</h2>
          <div className="grid grid-cols-2 gap-3">
            {supportedCurrencies.slice(0, 8).map((currency) => (
              <div key={currency.code} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{currency.flag_emoji}</span>
                  <span className="font-medium">{currency.code}</span>
                </div>
                <div className="text-sm text-gray-600">{currency.name}</div>
                <div className="text-lg font-bold text-gray-900">
                  {exchangeRates[currency.code] ? exchangeRates[currency.code].toFixed(currency.decimal_places) : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyDemo;
