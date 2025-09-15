/**
 * Live Rate Test Page
 * Test the live rate fetching functionality in the browser
 */

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';
import { liveExchangeRateService } from '../services/liveExchangeRateService';

const LiveRateTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ size: number; lastFetch: string | null }>({ size: 0, lastFetch: null });

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testLiveRates = async () => {
    setIsLoading(true);
    clearResults();
    
    try {
      addResult('🧪 Starting live rate tests...');
      addResult('📡 Using ExchangeRate-API with database fallback...');
      
      // Test 1: USD to INR (with USD as primary)
      addResult('📊 Testing USD → INR (USD primary)...');
      const usdToInr = await liveExchangeRateService.getExchangeRate('USD', 'INR', 'USD');
      addResult(`✅ Rate: 1 USD = ${usdToInr} INR`);
      
      // Test 2: INR to USD (with USD as primary)
      addResult('📊 Testing INR → USD (USD primary)...');
      const inrToUsd = await liveExchangeRateService.getExchangeRate('INR', 'USD', 'USD');
      addResult(`✅ Rate: 1 INR = ${inrToUsd} USD`);
      
      // Test 3: INR to USD (with INR as primary)
      addResult('📊 Testing INR → USD (INR primary)...');
      const inrToUsdInrPrimary = await liveExchangeRateService.getExchangeRate('INR', 'USD', 'INR');
      addResult(`✅ Rate: 1 INR = ${inrToUsdInrPrimary} USD`);
      
      // Test 3: Conversion calculation
      addResult('🧮 Testing conversion calculation...');
      const amount = 250;
      const convertedAmount = amount * usdToInr;
      addResult(`✅ ${amount} USD × ${usdToInr} = ${convertedAmount} INR`);
      
      // Test 4: Reverse conversion
      addResult('🔄 Testing reverse conversion...');
      const reverseAmount = convertedAmount * inrToUsd;
      addResult(`✅ ${convertedAmount} INR × ${inrToUsd} = ${reverseAmount} USD`);
      
      // Test 5: Multiple currencies
      addResult('🌍 Testing multiple currencies...');
      const currencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
      for (const currency of currencies) {
        const rate = await liveExchangeRateService.getExchangeRate('USD', currency);
        addResult(`✅ 1 USD = ${rate} ${currency}`);
      }
      
      // Test 6: Cache statistics
      addResult('📈 Testing cache statistics...');
      const stats = liveExchangeRateService.getCacheStats();
      setCacheStats(stats);
      addResult(`✅ Cache size: ${stats.size} rates`);
      addResult(`✅ Last fetch: ${stats.lastFetch || 'Never'}`);
      
      // Test 7: Rate source verification
      addResult('🔍 Verifying rate source...');
      if (usdToInr === 1.0) {
        addResult('⚠️ WARNING: Using fallback rate (1.0) - no live rates available');
      } else {
        addResult('✅ SUCCESS: Using live rates from ExchangeRate-API');
      }
      
      // Test 8: Rate timestamp
      addResult('⏰ Testing rate timestamp...');
      const rateTimestamp = await liveExchangeRateService.getRateTimestamp('USD', 'INR', 'USD');
      if (rateTimestamp) {
        const formattedTimestamp = liveExchangeRateService.formatRateTimestamp(rateTimestamp);
        addResult(`✅ Rate timestamp: ${formattedTimestamp}`);
      } else {
        addResult('⚠️ No rate timestamp available');
      }
      
      // Test 9: Fetch rates with INR as primary
      addResult('🔄 Testing rate fetch with INR as primary...');
      await liveExchangeRateService.refreshRatesForToday('INR');
      addResult('✅ Rates fetched with INR as primary currency');
      
      addResult('🎉 All tests completed successfully!');
      
    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRates = async () => {
    setIsLoading(true);
    addResult('🔄 Refreshing live rates...');
    
    try {
      await liveExchangeRateService.refreshRatesForToday();
      addResult('✅ Rates refreshed successfully!');
      
      // Update cache stats
      const stats = liveExchangeRateService.getCacheStats();
      setCacheStats(stats);
      
    } catch (error) {
      addResult(`❌ Failed to refresh rates: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    liveExchangeRateService.clearCache();
    setCacheStats({ size: 0, lastFetch: null });
    addResult('🗑️ Cache cleared');
  };

  useEffect(() => {
    // Update cache stats on mount
    const stats = liveExchangeRateService.getCacheStats();
    setCacheStats(stats);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Live Rate Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test the live exchange rate fetching functionality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Controls
            </h2>
            <div className="space-y-3">
              <Button
                onClick={testLiveRates}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Run Live Rate Tests'}
              </Button>
              
              <Button
                onClick={refreshRates}
                disabled={isLoading}
                variant="secondary"
                className="w-full"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Rates'}
              </Button>
              
              <Button
                onClick={clearCache}
                variant="outline"
                className="w-full"
              >
                Clear Cache
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Cache Statistics
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Cache Size:</span>
                <span className="font-mono text-gray-900 dark:text-white">{cacheStats.size} rates</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Last Fetch:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {cacheStats.lastFetch || 'Never'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Results
          </h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500">No test results yet. Click "Run Live Rate Tests" to start.</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LiveRateTestPage;
