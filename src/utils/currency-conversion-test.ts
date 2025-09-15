/**
 * Currency Conversion Test Utility
 * Tests live currency conversion functionality
 */

import { liveCurrencyService } from '../services/liveCurrencyService';
import { exchangeRateService } from '../services/exchangeRateService';

export interface ConversionTestResult {
  testName: string;
  success: boolean;
  error?: string;
  result?: any;
  duration: number;
}

export class CurrencyConversionTester {
  private results: ConversionTestResult[] = [];

  /**
   * Run all currency conversion tests
   */
  async runAllTests(): Promise<ConversionTestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting Currency Conversion Tests...\n');
    
    // Test 1: Basic conversion
    await this.testBasicConversion();
    
    // Test 2: Same currency conversion
    await this.testSameCurrencyConversion();
    
    // Test 3: Live rate fetching
    await this.testLiveRateFetching();
    
    // Test 4: Rate caching
    await this.testRateCaching();
    
    // Test 5: Error handling
    await this.testErrorHandling();
    
    // Test 6: Multiple currency conversions
    await this.testMultipleConversions();
    
    // Test 7: Rate refresh
    await this.testRateRefresh();
    
    this.printResults();
    return this.results;
  }

  /**
   * Test basic currency conversion
   */
  private async testBasicConversion(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await liveCurrencyService.convertAmount(100, 'USD', 'EUR');
      
      this.addResult({
        testName: 'Basic Conversion (USD to EUR)',
        success: result.convertedAmount > 0 && result.exchangeRate > 0,
        result: {
          originalAmount: result.originalAmount,
          convertedAmount: result.convertedAmount,
          exchangeRate: result.exchangeRate,
          rateSource: result.rateSource
        },
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        testName: 'Basic Conversion (USD to EUR)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test same currency conversion
   */
  private async testSameCurrencyConversion(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await liveCurrencyService.convertAmount(100, 'USD', 'USD');
      
      this.addResult({
        testName: 'Same Currency Conversion (USD to USD)',
        success: result.convertedAmount === 100 && result.exchangeRate === 1.0,
        result: {
          originalAmount: result.originalAmount,
          convertedAmount: result.convertedAmount,
          exchangeRate: result.exchangeRate
        },
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        testName: 'Same Currency Conversion (USD to USD)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test live rate fetching
   */
  private async testLiveRateFetching(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const rates = await liveCurrencyService.getAllRates('USD');
      const hasMultipleRates = Object.keys(rates).length > 1;
      
      this.addResult({
        testName: 'Live Rate Fetching',
        success: hasMultipleRates,
        result: {
          rateCount: Object.keys(rates).length,
          sampleRates: Object.entries(rates).slice(0, 5)
        },
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        testName: 'Live Rate Fetching',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test rate caching
   */
  private async testRateCaching(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // First conversion
      const result1 = await liveCurrencyService.convertAmount(100, 'USD', 'EUR');
      const firstDuration = Date.now() - startTime;
      
      // Second conversion (should be cached)
      const cacheStart = Date.now();
      const result2 = await liveCurrencyService.convertAmount(100, 'USD', 'EUR');
      const secondDuration = Date.now() - cacheStart;
      
      const isCached = result2.rateSource === 'cached' || secondDuration < firstDuration;
      
      this.addResult({
        testName: 'Rate Caching',
        success: isCached,
        result: {
          firstDuration,
          secondDuration,
          firstRateSource: result1.rateSource,
          secondRateSource: result2.rateSource,
          isCached
        },
        duration: firstDuration + secondDuration
      });
    } catch (error) {
      this.addResult({
        testName: 'Rate Caching',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test with invalid currency
      const result = await liveCurrencyService.convertAmount(100, 'INVALID', 'USD');
      
      this.addResult({
        testName: 'Error Handling (Invalid Currency)',
        success: result.rateSource === 'fallback' || result.exchangeRate === 1.0,
        result: {
          rateSource: result.rateSource,
          exchangeRate: result.exchangeRate
        },
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        testName: 'Error Handling (Invalid Currency)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test multiple currency conversions
   */
  private async testMultipleConversions(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const conversions = [
        { from: 'USD', to: 'EUR', amount: 100 },
        { from: 'EUR', to: 'GBP', amount: 100 },
        { from: 'GBP', to: 'JPY', amount: 100 },
        { from: 'JPY', to: 'USD', amount: 10000 }
      ];
      
      const results = await Promise.all(
        conversions.map(conv => 
          liveCurrencyService.convertAmount(conv.amount, conv.from, conv.to)
        )
      );
      
      const allSuccessful = results.every(result => 
        result.convertedAmount > 0 && result.exchangeRate > 0
      );
      
      this.addResult({
        testName: 'Multiple Currency Conversions',
        success: allSuccessful,
        result: {
          conversionCount: results.length,
          results: results.map(r => ({
            rateSource: r.rateSource,
            exchangeRate: r.exchangeRate
          }))
        },
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        testName: 'Multiple Currency Conversions',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test rate refresh
   */
  private async testRateRefresh(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Clear cache first
      liveCurrencyService.clearCache();
      
      // Get initial rates
      const rates1 = await liveCurrencyService.getAllRates('USD');
      
      // Refresh rates
      await liveCurrencyService.refreshRates('USD');
      
      // Get rates again
      const rates2 = await liveCurrencyService.getAllRates('USD');
      
      this.addResult({
        testName: 'Rate Refresh',
        success: Object.keys(rates2).length > 0,
        result: {
          initialRateCount: Object.keys(rates1).length,
          refreshedRateCount: Object.keys(rates2).length
        },
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        testName: 'Rate Refresh',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Add test result
   */
  private addResult(result: ConversionTestResult): void {
    this.results.push(result);
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n📊 Currency Conversion Test Results:');
    console.log('=====================================\n');
    
    let passed = 0;
    let failed = 0;
    
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}ms`;
      
      console.log(`${status} ${result.testName} (${duration})`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.result) {
        console.log(`   Result: ${JSON.stringify(result.result, null, 2)}`);
      }
      
      console.log('');
      
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
    });
    
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Currency conversion is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the errors above.');
    }
  }
}

// Export test runner
export const runCurrencyConversionTests = async (): Promise<ConversionTestResult[]> => {
  const tester = new CurrencyConversionTester();
  return await tester.runAllTests();
};

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runCurrencyConversionTests = runCurrencyConversionTests;
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { runCurrencyConversionTests };
}
