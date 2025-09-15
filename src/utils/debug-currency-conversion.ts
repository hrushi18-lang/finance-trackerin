/**
 * Debug Currency Conversion
 * Test the conversion logic to identify the issue
 */

import { liveExchangeRateService } from '../services/liveExchangeRateService';
import { Decimal } from 'decimal.js';

export async function debugCurrencyConversion() {
  console.log('🔍 Debugging Currency Conversion...');
  
  // Test case: $250 USD to INR
  const amount = 250;
  const fromCurrency = 'USD';
  const toCurrency = 'INR';
  
  console.log(`\n📊 Test Case:`);
  console.log(`Amount: ${amount} ${fromCurrency}`);
  console.log(`Converting to: ${toCurrency}`);
  
  try {
    // Get the exchange rate
    const rate = await liveExchangeRateService.getExchangeRate(fromCurrency, toCurrency);
    console.log(`\n💱 Exchange Rate: ${rate}`);
    
    // Calculate conversion
    const amountDecimal = new Decimal(amount);
    const convertedAmount = amountDecimal.mul(rate);
    
    console.log(`\n🧮 Calculation:`);
    console.log(`${amount} × ${rate} = ${convertedAmount.toString()}`);
    console.log(`Expected: ~22,055 INR (at rate ~88.22)`);
    console.log(`Actual: ${convertedAmount.toString()} ${toCurrency}`);
    
    // Check if rate is inverted
    const invertedRate = 1 / rate;
    const invertedConversion = amountDecimal.mul(invertedRate);
    console.log(`\n🔄 If rate is inverted:`);
    console.log(`Inverted rate: ${invertedRate}`);
    console.log(`${amount} × ${invertedRate} = ${invertedConversion.toString()}`);
    
    // Test reverse conversion
    console.log(`\n🔄 Reverse Test (INR to USD):`);
    const reverseRate = await liveExchangeRateService.getExchangeRate(toCurrency, fromCurrency);
    console.log(`Reverse rate: ${reverseRate}`);
    const reverseConversion = new Decimal(22055).mul(reverseRate);
    console.log(`22,055 INR × ${reverseRate} = ${reverseConversion.toString()} USD`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug function
debugCurrencyConversion();
