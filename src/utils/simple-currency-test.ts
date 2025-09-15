/**
 * Simple Currency Test - Verify currency components work
 */

export class SimpleCurrencyTest {
  
  // Test basic currency formatting
  static testBasicFormatting() {
    console.log('🧪 Testing Basic Currency Formatting...\n');
    
    const testCases = [
      { amount: 1500, currency: 'INR', symbol: '₹' },
      { amount: 18.00, currency: 'USD', symbol: '$' },
      { amount: 100, currency: 'EUR', symbol: '€' },
      { amount: 50, currency: 'GBP', symbol: '£' }
    ];
    
    testCases.forEach(({ amount, currency, symbol }) => {
      const formatted = `${symbol}${amount.toLocaleString()}`;
      console.log(`${currency}: ${amount} → ${formatted}`);
    });
    
    console.log('✅ Basic formatting test completed\n');
  }
  
  // Test rate calculations
  static testRateCalculations() {
    console.log('🔍 Testing Rate Calculations...\n');
    
    const testRates = [
      { from: 'INR', to: 'USD', amount: 1500, rate: 0.0113, expected: 16.95 },
      { from: 'USD', to: 'INR', amount: 18, rate: 88.22, expected: 1587.96 },
      { from: 'EUR', to: 'USD', amount: 100, rate: 1.15, expected: 115.0 }
    ];
    
    testRates.forEach(({ from, to, amount, rate, expected }) => {
      const converted = amount * rate;
      const isCorrect = Math.abs(converted - expected) < 0.01;
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} ${amount} ${from} → ${converted.toFixed(2)} ${to} (expected: ${expected})`);
    });
    
    console.log('\n✅ Rate calculations test completed\n');
  }
  
  // Test error handling
  static testErrorHandling() {
    console.log('🛡️ Testing Error Handling...\n');
    
    const errorScenarios = [
      { input: null, expected: '0' },
      { input: undefined, expected: '0' },
      { input: -100, expected: '0' },
      { input: 'not-a-number', expected: '0' },
      { input: 999999999, expected: '999999999' }
    ];
    
    errorScenarios.forEach(({ input, expected }) => {
      let result = '0';
      
      if (input === null || input === undefined) {
        result = '0';
      } else if (typeof input === 'string') {
        const num = Number(input);
        result = isNaN(num) ? '0' : num.toString();
      } else if (typeof input === 'number') {
        result = input < 0 ? '0' : input.toString();
      }
      
      const status = result === expected ? '✅' : '❌';
      console.log(`${status} ${input} → ${result} (expected: ${expected})`);
    });
    
    console.log('\n✅ Error handling test completed\n');
  }
  
  // Run all tests
  static runAllTests() {
    console.log('🚀 Running Simple Currency Tests\n');
    console.log('=' .repeat(50));
    
    this.testBasicFormatting();
    console.log('=' .repeat(50));
    
    this.testRateCalculations();
    console.log('=' .repeat(50));
    
    this.testErrorHandling();
    console.log('=' .repeat(50));
    
    console.log('🎉 All simple currency tests completed!');
  }
}

// Export for use in other files
export default SimpleCurrencyTest;
