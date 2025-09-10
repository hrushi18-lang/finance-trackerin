// Test script for daily rate fetcher
import { dailyRateFetcher } from './src/lib/daily-rate-fetcher.js';
import { currencyConversionService } from './src/lib/currency-conversion-service.js';

async function testDailyRates() {
  console.log('🧪 Testing Daily Rate Fetcher...\n');
  
  try {
    // Test 1: Check if rates exist for today
    console.log('1. Checking if rates exist for today...');
    const hasRates = await dailyRateFetcher.hasRatesForToday();
    console.log(`   Result: ${hasRates ? '✅ Yes' : '❌ No'}\n`);
    
    // Test 2: Fetch today's rates
    console.log('2. Fetching today\'s rates...');
    const rates = await dailyRateFetcher.fetchTodaysRates();
    console.log(`   Fetched ${rates.length} rates\n`);
    
    // Test 3: Get a specific rate
    console.log('3. Getting USD to INR rate...');
    const usdToInrRate = await dailyRateFetcher.getRate('USD', 'INR');
    if (usdToInrRate) {
      console.log(`   Rate: ${usdToInrRate.rate} (${usdToInrRate.fx_source}) on ${usdToInrRate.fx_date}`);
      console.log(`   Is Stale: ${usdToInrRate.is_stale}\n`);
    } else {
      console.log('   ❌ No rate found\n');
    }
    
    // Test 4: Test currency conversion
    console.log('4. Testing currency conversion...');
    const conversion = await currencyConversionService.convert(
      currencyConversionService.toMinorUnits(100, 'USD'), // $100 in minor units
      'USD',
      'INR'
    );
    
    if (conversion) {
      console.log(`   Original: ${currencyConversionService.formatAmountMinor(conversion.originalAmount, 'USD')}`);
      console.log(`   Converted: ${currencyConversionService.formatAmountMinor(conversion.convertedAmount, 'INR')}`);
      console.log(`   Rate: ${conversion.fxRate} (${conversion.fxSource}) on ${conversion.fxDate}`);
      console.log(`   Transparency: ${conversion.displayText}\n`);
    } else {
      console.log('   ❌ Conversion failed\n');
    }
    
    // Test 5: Check for stale rates
    console.log('5. Checking for stale rates...');
    const isStale = await dailyRateFetcher.checkStaleRates();
    console.log(`   Has Stale Rates: ${isStale ? '⚠️ Yes' : '✅ No'}\n`);
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDailyRates();
