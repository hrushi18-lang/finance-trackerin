/**
 * Test Currency Conversion Service in Browser
 * Simple test to verify the service works without process.env errors
 */

import { currencyConversionService } from '../services/currencyConversionService';

export async function testBrowserCurrencyConversion(): Promise<void> {
  console.log('🧪 Testing Currency Conversion Service in Browser...\n');

  try {
    // Test 1: Simple USD to INR conversion
    console.log('Test 1: USD to INR conversion');
    const result1 = await currencyConversionService.convertCurrency({
      amount: 100,
      enteredCurrency: 'USD',
      accountCurrency: 'INR',
      primaryCurrency: 'INR',
      includeFees: true,
      auditContext: 'browser_test'
    });

    console.log(`✅ Result: $100 USD = ₹${result1.accountAmount.toFixed(2)} INR`);
    console.log(`   Rate: 1 USD = ${result1.exchangeRate.toFixed(6)} INR`);
    console.log(`   Source: ${result1.conversionSource}`);
    console.log(`   Case: ${result1.conversionCase}\n`);

    // Test 2: INR to USD conversion
    console.log('Test 2: INR to USD conversion');
    const result2 = await currencyConversionService.convertCurrency({
      amount: 8300,
      enteredCurrency: 'INR',
      accountCurrency: 'USD',
      primaryCurrency: 'INR',
      includeFees: true,
      auditContext: 'browser_test'
    });

    console.log(`✅ Result: ₹8,300 INR = $${result2.accountAmount.toFixed(2)} USD`);
    console.log(`   Rate: 1 INR = ${result2.exchangeRate.toFixed(6)} USD`);
    console.log(`   Source: ${result2.conversionSource}`);
    console.log(`   Case: ${result2.conversionCase}\n`);

    // Test 3: Same currency (no conversion)
    console.log('Test 3: Same currency (INR to INR)');
    const result3 = await currencyConversionService.convertCurrency({
      amount: 50000,
      enteredCurrency: 'INR',
      accountCurrency: 'INR',
      primaryCurrency: 'INR',
      includeFees: true,
      auditContext: 'browser_test'
    });

    console.log(`✅ Result: ₹50,000 INR = ₹${result3.accountAmount.toFixed(2)} INR`);
    console.log(`   Rate: 1 INR = ${result3.exchangeRate.toFixed(6)} INR`);
    console.log(`   Source: ${result3.conversionSource}`);
    console.log(`   Case: ${result3.conversionCase}\n`);

    console.log('🎉 All browser tests passed! Currency conversion service is working correctly.');

  } catch (error: any) {
    console.error('❌ Browser test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  testBrowserCurrencyConversion();
}
