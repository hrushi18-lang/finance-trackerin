import React, { useState } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';
import { simpleCurrencyService } from '../services/simpleCurrencyService';

const CurrencyTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testCurrencyConversions = () => {
    clearResults();
    
    addResult('🧪 Testing INR-based currency conversions...');
    addResult('📊 Base rates: 1 USD = ₹88.20, 1 EUR = ₹103.60, 1 GBP = ₹118.50');
    
    // Test 1: USD to INR
    const usdToInr = simpleCurrencyService.getRate('USD', 'INR');
    addResult(`✅ USD → INR: 1 USD = ₹${usdToInr}`);
    
    // Test 2: INR to USD
    const inrToUsd = simpleCurrencyService.getRate('INR', 'USD');
    addResult(`✅ INR → USD: ₹1 = $${inrToUsd.toFixed(4)}`);
    
    // Test 3: EUR to INR
    const eurToInr = simpleCurrencyService.getRate('EUR', 'INR');
    addResult(`✅ EUR → INR: 1 EUR = ₹${eurToInr}`);
    
    // Test 4: INR to EUR
    const inrToEur = simpleCurrencyService.getRate('INR', 'EUR');
    addResult(`✅ INR → EUR: ₹1 = €${inrToEur.toFixed(4)}`);
    
    // Test 5: USD to EUR
    const usdToEur = simpleCurrencyService.getRate('USD', 'EUR');
    addResult(`✅ USD → EUR: 1 USD = €${usdToEur.toFixed(4)}`);
    
    // Test 6: EUR to USD
    const eurToUsd = simpleCurrencyService.getRate('EUR', 'USD');
    addResult(`✅ EUR → USD: 1 EUR = $${eurToUsd.toFixed(4)}`);
    
    // Test 7: GBP to INR
    const gbpToInr = simpleCurrencyService.getRate('GBP', 'INR');
    addResult(`✅ GBP → INR: 1 GBP = ₹${gbpToInr}`);
    
    // Test 8: INR to GBP
    const inrToGbp = simpleCurrencyService.getRate('INR', 'GBP');
    addResult(`✅ INR → GBP: ₹1 = £${inrToGbp.toFixed(4)}`);
    
    // Test 9: Conversion examples
    addResult('🧮 Testing conversion examples...');
    
    // Example 1: $250 USD → INR
    const usd250ToInr = simpleCurrencyService.convert(250, 'USD', 'INR');
    addResult(`✅ $250 USD = ₹${usd250ToInr.toFixed(2)}`);
    
    // Example 2: ₹2000 INR → USD
    const inr2000ToUsd = simpleCurrencyService.convert(2000, 'INR', 'USD');
    addResult(`✅ ₹2000 INR = $${inr2000ToUsd.toFixed(2)}`);
    
    // Example 3: €100 EUR → INR
    const eur100ToInr = simpleCurrencyService.convert(100, 'EUR', 'INR');
    addResult(`✅ €100 EUR = ₹${eur100ToInr.toFixed(2)}`);
    
    // Example 4: ₹5000 INR → EUR
    const inr5000ToEur = simpleCurrencyService.convert(5000, 'INR', 'EUR');
    addResult(`✅ ₹5000 INR = €${inr5000ToEur.toFixed(2)}`);
    
    // Test 10: Transaction conversion
    addResult('💳 Testing transaction conversion...');
    
    const transaction = simpleCurrencyService.convertForTransaction(
      250, // $250 USD
      'USD', // Amount currency
      'INR', // Account currency
      'INR'  // Primary currency
    );
    
    addResult(`✅ Transaction: $${transaction.originalAmount} USD`);
    addResult(`   Account amount: ₹${transaction.accountAmount.toFixed(2)}`);
    addResult(`   Primary amount: ₹${transaction.primaryAmount.toFixed(2)}`);
    addResult(`   Exchange rate: 1 USD = ${transaction.exchangeRate} INR`);
    
    addResult('🎉 All tests completed successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Currency Conversion Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing INR-based currency conversions with hardcoded rates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Controls
            </h2>
            
            <div className="space-y-4">
              <Button
                onClick={testCurrencyConversions}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Run Currency Tests
              </Button>
              
              <Button
                onClick={clearResults}
                variant="outline"
                className="w-full"
              >
                Clear Results
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Current Rates (User-editable):
              </h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>1 USD = ₹88.20</div>
                <div>1 EUR = ₹103.60</div>
                <div>1 GBP = ₹120.00</div>
                <div>1 INR = ₹1.00</div>
              </div>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                💡 Edit rates in Settings → Currency Rates
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Click "Run Currency Tests" to see results
                </p>
              ) : (
                testResults.map((result, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded"
                  >
                    {result}
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default CurrencyTestPage;
