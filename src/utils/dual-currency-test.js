// Simple test for dual currency conversion
const { convertToDualCurrency, convertToAccountAndPrimaryCurrency, formatCurrencyAmount } = require('./dual-currency-converter');

async function runDualCurrencyTests() {
  console.log('🧪 Running Dual Currency Conversion Tests...\n');

  try {
    // Test basic conversion
    console.log('📊 Testing basic currency conversion...');
    const usdToEur = await convertToDualCurrency(100, 'USD', 'EUR');
    console.log(`$100 USD = ${usdToEur.convertedSymbol}${usdToEur.convertedAmount.toFixed(2)} ${usdToEur.convertedCurrency}`);
    console.log(`Exchange rate: ${usdToEur.exchangeRate.toFixed(4)}`);
    console.log(`Conversion source: ${usdToEur.conversionSource}`);
    
    // Test INR to USD
    const inrToUsd = await convertToDualCurrency(1000, 'INR', 'USD');
    console.log(`₹1000 INR = ${inrToUsd.convertedSymbol}${inrToUsd.convertedAmount.toFixed(2)} ${inrToUsd.convertedCurrency}`);
    console.log(`Exchange rate: ${inrToUsd.exchangeRate.toFixed(4)}`);
    
    // Test same currency
    console.log('\n🔄 Testing same currency conversion...');
    const sameCurrency = await convertToDualCurrency(100, 'USD', 'USD');
    console.log(`$100 USD = ${sameCurrency.convertedSymbol}${sameCurrency.convertedAmount.toFixed(2)} ${sameCurrency.convertedCurrency}`);
    console.log(`Exchange rate: ${sameCurrency.exchangeRate.toFixed(4)}`);
    
    // Test account and primary conversion
    console.log('\n🏦 Testing account and primary currency conversion...');
    const conversion = await convertToAccountAndPrimaryCurrency(
      1000, // amount
      'INR', // original currency
      'USD', // account currency
      'EUR', // primary currency
      { precision: 2, showSymbols: true }
    );
    
    console.log('Account Currency Conversion:');
    console.log(`  Original: ${conversion.account.originalSymbol}${conversion.account.originalAmount.toFixed(2)} ${conversion.account.originalCurrency}`);
    console.log(`  Converted: ${conversion.account.convertedSymbol}${conversion.account.convertedAmount.toFixed(2)} ${conversion.account.convertedCurrency}`);
    console.log(`  Rate: ${conversion.account.exchangeRate.toFixed(4)}`);
    
    console.log('\nPrimary Currency Conversion:');
    console.log(`  Original: ${conversion.primary.originalSymbol}${conversion.primary.originalAmount.toFixed(2)} ${conversion.primary.originalCurrency}`);
    console.log(`  Converted: ${conversion.primary.convertedSymbol}${conversion.primary.convertedAmount.toFixed(2)} ${conversion.primary.convertedCurrency}`);
    console.log(`  Rate: ${conversion.primary.exchangeRate.toFixed(4)}`);
    
    // Test formatting
    console.log('\n💰 Testing currency formatting...');
    const formattedUSD = formatCurrencyAmount(1234.56, 'USD', { precision: 2, showSymbols: true });
    console.log(`USD formatting: ${formattedUSD}`);
    
    const formattedEUR = formatCurrencyAmount(1234.56, 'EUR', { precision: 2, showSymbols: true });
    console.log(`EUR formatting: ${formattedEUR}`);
    
    const formattedINR = formatCurrencyAmount(1234.56, 'INR', { precision: 2, showSymbols: true });
    console.log(`INR formatting: ${formattedINR}`);
    
    console.log('\n✅ All dual currency tests passed!');
  } catch (error) {
    console.error('\n❌ Dual currency tests failed:', error);
  }
}

// Run tests
runDualCurrencyTests();
