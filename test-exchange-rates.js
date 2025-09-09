// Test script for exchange rate service
import { exchangeRateService } from './src/lib/exchange-rate-service.ts';

async function testExchangeRates() {
  console.log('🧪 Testing Exchange Rate Service...');
  
  try {
    // Test 1: Initialize daily rates
    console.log('\n1. Initializing daily rates...');
    await exchangeRateService.initializeDailyRates();
    
    // Test 2: Get exchange rate
    console.log('\n2. Testing exchange rate conversion...');
    const usdToInr = await exchangeRateService.getExchangeRate('USD', 'INR');
    console.log(`USD to INR rate: ${usdToInr}`);
    
    const inrToUsd = await exchangeRateService.getExchangeRate('INR', 'USD');
    console.log(`INR to USD rate: ${inrToUsd}`);
    
    // Test 3: Test conversion
    console.log('\n3. Testing currency conversion...');
    const converted = await exchangeRateService.getExchangeRate('USD', 'EUR');
    console.log(`USD to EUR rate: ${converted}`);
    
    // Test 4: Get available currencies
    console.log('\n4. Getting available currencies...');
    const currencies = await exchangeRateService.getAvailableCurrencies();
    console.log(`Available currencies: ${currencies.slice(0, 10).join(', ')}... (${currencies.length} total)`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testExchangeRates();
