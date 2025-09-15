/**
 * Live Exchange Rate Tester Component
 * Tests the live exchange rate service for September 2025
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Globe, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { liveExchangeRateService } from '../../services/liveExchangeRateService';

interface RateTestResult {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  source: string;
  timestamp: string;
}

export const LiveExchangeRateTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<RateTestResult[]>([]);
  const [cacheStats, setCacheStats] = useState({ size: 0, lastFetch: null as string | null });
  const [error, setError] = useState<string | null>(null);

  // Test cases for September 2025 (Updated with current 2025 rates)
  const testCases = [
    { from: 'INR', to: 'USD', amount: 1500, description: '₹1,500 INR to USD (Expected: ~$17.00)' },
    { from: 'USD', to: 'INR', amount: 18, description: '$18 USD to INR (Expected: ~₹1,588)' },
    { from: 'EUR', to: 'USD', amount: 100, description: '€100 EUR to USD (Expected: ~$115)' },
    { from: 'GBP', to: 'USD', amount: 100, description: '£100 GBP to USD (Expected: ~$132)' },
    { from: 'JPY', to: 'USD', amount: 15000, description: '¥15,000 JPY to USD (Expected: ~$99)' },
    { from: 'CAD', to: 'USD', amount: 100, description: 'C$100 CAD to USD (Expected: ~$72)' },
    { from: 'AUD', to: 'USD', amount: 100, description: 'A$100 AUD to USD (Expected: ~$65)' },
    { from: 'CHF', to: 'USD', amount: 100, description: 'CHF100 to USD (Expected: ~$112)' },
    { from: 'CNY', to: 'USD', amount: 1000, description: '¥1,000 CNY to USD (Expected: ~$140)' },
    { from: 'SGD', to: 'USD', amount: 100, description: 'S$100 SGD to USD (Expected: ~$73)' }
  ];

  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    const stats = liveExchangeRateService.getCacheStats();
    setCacheStats(stats);
  };

  const runLiveRateTest = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults([]);

    try {
      console.log('🧪 Testing Live Exchange Rates for September 2025...');
      
      // Refresh rates for today
      await liveExchangeRateService.refreshRatesForToday();
      
      const results: RateTestResult[] = [];
      
      for (const testCase of testCases) {
        try {
          const rate = await liveExchangeRateService.getExchangeRate(testCase.from, testCase.to);
          const result = testCase.amount * rate;
          
          const rateResult: RateTestResult = {
            from: testCase.from,
            to: testCase.to,
            amount: testCase.amount,
            rate: rate,
            result: result,
            source: 'live_api',
            timestamp: new Date().toISOString()
          };
          
          results.push(rateResult);
          
          console.log(`✅ ${testCase.description}: ${testCase.amount} ${testCase.from} = ${result.toFixed(2)} ${testCase.to} (rate: ${rate})`);
        } catch (error) {
          console.error(`❌ Failed to test ${testCase.description}:`, error);
        }
      }
      
      setTestResults(results);
      updateCacheStats();
      
      console.log(`✅ Live rate test completed: ${results.length}/${testCases.length} successful`);
    } catch (error) {
      console.error('❌ Live rate test failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to test live rates');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    liveExchangeRateService.clearCache();
    updateCacheStats();
    setTestResults([]);
  };

  const formatCurrency = (amount: number, currency: string): string => {
    const symbols: Record<string, string> = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥',
      'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'SGD': 'S$'
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Live Exchange Rate Tester
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              September 2025 Live Rates
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={clearCache}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Cache
          </button>
          <button
            onClick={runLiveRateTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Testing...' : 'Test Live Rates'}</span>
          </button>
        </div>
      </div>

      {/* Cache Stats */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cache Status</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {cacheStats.size} rates cached
            {cacheStats.lastFetch && (
              <span className="ml-2">
                • Last fetch: {new Date(cacheStats.lastFetch).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Test Results</span>
          </h3>
          
          <div className="grid gap-4">
            {testResults.map((result, index) => (
              <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(result.amount, result.from)} = {formatCurrency(result.result, result.to)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Rate: 1 {result.from} = {result.rate.toFixed(6)} {result.to}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {result.source}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          Test Cases (September 2025)
        </h4>
        <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          {testCases.map((testCase, index) => (
            <div key={index}>
              • {testCase.description}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
