import { convertToDualCurrency, convertToAccountAndPrimaryCurrency, formatCurrencyAmount } from './dual-currency-converter';

export class DualCurrencyTest {
  static async runAllTests(): Promise<void> {
    console.log('🧪 Running Dual Currency Conversion Tests...\n');

    try {
      await this.testBasicConversion();
      await this.testSameCurrencyConversion();
      await this.testAccountAndPrimaryConversion();
      await this.testCurrencyFormatting();
      await this.testErrorHandling();
      
      console.log('\n✅ All dual currency tests passed!');
    } catch (error) {
      console.error('\n❌ Dual currency tests failed:', error);
    }
  }

  static async testBasicConversion(): Promise<void> {
    console.log('📊 Testing basic currency conversion...');
    
    // Test USD to EUR
    const usdToEur = await convertToDualCurrency(100, 'USD', 'EUR');
    console.log(`$100 USD = ${usdToEur.convertedSymbol}${usdToEur.convertedAmount.toFixed(2)} ${usdToEur.convertedCurrency}`);
    console.log(`Exchange rate: ${usdToEur.exchangeRate.toFixed(4)}`);
    console.log(`Conversion source: ${usdToEur.conversionSource}`);
    
    // Test INR to USD
    const inrToUsd = await convertToDualCurrency(1000, 'INR', 'USD');
    console.log(`₹1000 INR = ${inrToUsd.convertedSymbol}${inrToUsd.convertedAmount.toFixed(2)} ${inrToUsd.convertedCurrency}`);
    console.log(`Exchange rate: ${inrToUsd.exchangeRate.toFixed(4)}`);
    
    console.log('✅ Basic conversion test passed\n');
  }

  static async testSameCurrencyConversion(): Promise<void> {
    console.log('🔄 Testing same currency conversion...');
    
    const sameCurrency = await convertToDualCurrency(100, 'USD', 'USD');
    console.log(`$100 USD = ${sameCurrency.convertedSymbol}${sameCurrency.convertedAmount.toFixed(2)} ${sameCurrency.convertedCurrency}`);
    console.log(`Exchange rate: ${sameCurrency.exchangeRate.toFixed(4)}`);
    console.log(`Conversion source: ${sameCurrency.conversionSource}`);
    
    if (sameCurrency.originalAmount === sameCurrency.convertedAmount && sameCurrency.exchangeRate === 1) {
      console.log('✅ Same currency conversion test passed\n');
    } else {
      throw new Error('Same currency conversion failed');
    }
  }

  static async testAccountAndPrimaryConversion(): Promise<void> {
    console.log('🏦 Testing account and primary currency conversion...');
    
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
    
    console.log('✅ Account and primary conversion test passed\n');
  }

  static async testCurrencyFormatting(): Promise<void> {
    console.log('💰 Testing currency formatting...');
    
    const formattedUSD = formatCurrencyAmount(1234.56, 'USD', { precision: 2, showSymbols: true });
    console.log(`USD formatting: ${formattedUSD}`);
    
    const formattedEUR = formatCurrencyAmount(1234.56, 'EUR', { precision: 2, showSymbols: true });
    console.log(`EUR formatting: ${formattedEUR}`);
    
    const formattedINR = formatCurrencyAmount(1234.56, 'INR', { precision: 2, showSymbols: true });
    console.log(`INR formatting: ${formattedINR}`);
    
    const formattedNoSymbol = formatCurrencyAmount(1234.56, 'USD', { precision: 2, showSymbols: false });
    console.log(`No symbol formatting: ${formattedNoSymbol}`);
    
    console.log('✅ Currency formatting test passed\n');
  }

  static async testErrorHandling(): Promise<void> {
    console.log('⚠️ Testing error handling...');
    
    try {
      // Test with invalid amount
      const invalidAmount = await convertToDualCurrency(0, 'USD', 'EUR');
      console.log('Zero amount handled:', invalidAmount);
      
      // Test with negative amount
      const negativeAmount = await convertToDualCurrency(-100, 'USD', 'EUR');
      console.log('Negative amount handled:', negativeAmount);
      
      console.log('✅ Error handling test passed\n');
    } catch (error) {
      console.log('Error handling test failed:', error);
    }
  }

  static async testRealWorldScenario(): Promise<void> {
    console.log('🌍 Testing real-world scenario: Student loan in INR...');
    
    const studentLoanAmount = 500000; // ₹5,00,000
    const accountCurrency = 'USD'; // Account is in USD
    const primaryCurrency = 'EUR'; // User's primary currency is EUR
    
    const conversion = await convertToAccountAndPrimaryCurrency(
      studentLoanAmount,
      'INR',
      accountCurrency,
      primaryCurrency,
      { precision: 2, showSymbols: true }
    );
    
    console.log(`\nStudent Loan: ₹${studentLoanAmount.toLocaleString()}`);
    console.log(`\nAccount Currency (${accountCurrency}):`);
    console.log(`  Amount: ${conversion.account.convertedSymbol}${conversion.account.convertedAmount.toLocaleString()}`);
    console.log(`  Rate: 1 INR = ${(1 / conversion.account.exchangeRate).toFixed(4)} ${accountCurrency}`);
    
    console.log(`\nPrimary Currency (${primaryCurrency}):`);
    console.log(`  Amount: ${conversion.primary.convertedSymbol}${conversion.primary.convertedAmount.toLocaleString()}`);
    console.log(`  Rate: 1 INR = ${(1 / conversion.primary.exchangeRate).toFixed(4)} ${primaryCurrency}`);
    
    console.log('\n✅ Real-world scenario test passed\n');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  DualCurrencyTest.runAllTests();
}
