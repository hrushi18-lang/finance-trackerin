/**
 * Test Currency Conversion System
 */

import { currencyConversionService } from '../services/currencyConversionService';

export async function testCurrencyConversion() {
  console.log('🧪 Testing Currency Conversion System...\n');
  
  const testCases = [
    {
      name: 'Case 1: All Same (USD)',
      amount: 100,
      enteredCurrency: 'USD',
      accountCurrency: 'USD',
      primaryCurrency: 'USD'
    },
    {
      name: 'Case 2: USD Account, INR Primary',
      amount: 100,
      enteredCurrency: 'USD',
      accountCurrency: 'USD',
      primaryCurrency: 'INR'
    },
    {
      name: 'Case 3: INR Amount, USD Account',
      amount: 8300,
      enteredCurrency: 'INR',
      accountCurrency: 'USD',
      primaryCurrency: 'INR'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Testing: ${testCase.name}`);
      
      const result = await currencyConversionService.convertCurrency({
        amount: testCase.amount,
        enteredCurrency: testCase.enteredCurrency,
        accountCurrency: testCase.accountCurrency,
        primaryCurrency: testCase.primaryCurrency,
        includeFees: true,
        feePercentage: 0.0025,
        auditContext: 'test'
      });
      
      console.log(`✅ Result:`);
      console.log(`   Entered: ${result.enteredSymbol}${result.enteredAmount.toFixed(2)} ${result.enteredCurrency}`);
      console.log(`   Account: ${result.accountSymbol}${result.accountAmount.toFixed(2)} ${result.accountCurrency}`);
      console.log(`   Primary: ${result.primarySymbol}${result.primaryAmount.toFixed(2)} ${result.primaryCurrency}`);
      console.log(`   Rate: ${result.exchangeRate.toFixed(6)}`);
      console.log(`   Source: ${result.conversionSource}`);
      
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Currency conversion tests completed!');
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testCurrencyConversion();
}
