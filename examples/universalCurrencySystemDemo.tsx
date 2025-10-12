/**
 * ===================================================================
 * UNIVERSAL CURRENCY SYSTEM - COMPREHENSIVE DEMO
 * ===================================================================
 * 
 * This file demonstrates all features of the Universal Currency System
 * including:
 * - Basic currency conversion
 * - Transaction processing (income/expense/transfer)
 * - React hook integration
 * - Error handling
 * - Caching
 * - Manual rate overrides
 * 
 * @see src/services/universalCurrencySystem.ts
 * @see src/hooks/useUniversalCurrency.ts
 */

import React, { useState } from 'react';
import { useUniversalCurrency } from '../src/hooks/useUniversalCurrency';
import {
  getCurrencySystem,
  processTransaction,
  convertCurrency,
  getExchangeRate,
  formatCurrency,
  TransactionRequest
} from '../src/services/universalCurrencySystem';

// ===================================================================
// EXAMPLE 1: STANDALONE USAGE (NO REACT)
// ===================================================================

/**
 * Standalone example - can be used in any JavaScript/TypeScript environment
 */
async function standaloneExample() {
  console.log('='.repeat(60));
  console.log('EXAMPLE 1: STANDALONE USAGE');
  console.log('='.repeat(60));
  
  // Get the currency system
  const system = getCurrencySystem();
  
  // Example 1A: Simple conversion
  console.log('\n--- 1A: Simple Conversion ---');
  const conversion = await system.convertAmount(100, 'EUR', 'USD', 'INR');
  console.log('Input: €100');
  console.log('Account (USD):', conversion.accountFormatted);
  console.log('Base (INR):', conversion.baseFormatted);
  console.log('Rate EUR→USD:', conversion.rates.transactionToAccount);
  
  // Example 1B: Process expense transaction
  console.log('\n--- 1B: Expense Transaction ---');
  const expense = await system.processTransaction({
    amount: 50,
    currency: 'GBP',
    accountCurrency: 'USD',
    baseCurrency: 'INR',
    type: 'expense',
    accountId: 'acc_123',
    description: 'Lunch at London restaurant'
  });
  
  console.log('Transaction:', expense.transactionFormatted);
  console.log('Deducted from account:', expense.accountFormatted);
  console.log('Base currency:', expense.baseFormatted);
  console.log('Summary:', expense.summary.primary);
  
  // Example 1C: Process income transaction
  console.log('\n--- 1C: Income Transaction ---');
  const income = await system.processTransaction({
    amount: 1000,
    currency: 'USD',
    accountCurrency: 'USD',
    baseCurrency: 'INR',
    type: 'income',
    accountId: 'acc_456',
    description: 'Freelance payment'
  });
  
  console.log('Credited to account:', income.accountFormatted);
  console.log('Summary:', income.summary.primary);
  
  // Example 1D: Transfer between accounts
  console.log('\n--- 1D: Transfer Transaction ---');
  const transfer = await system.processTransaction({
    amount: 200,
    currency: 'EUR',
    accountCurrency: 'USD',
    baseCurrency: 'INR',
    type: 'transfer',
    accountId: 'acc_source',
    targetAccountId: 'acc_target',
    targetAccountCurrency: 'GBP',
    description: 'Transfer to savings'
  });
  
  console.log('From source:', transfer.summary.primary);
  console.log('To target:', transfer.summary.secondary);
  console.log('Target amount:', transfer.targetCurrencyFormatted);
  
  // Example 1E: Get exchange rate
  console.log('\n--- 1E: Get Exchange Rate ---');
  const rate = await system.getRate('JPY', 'USD');
  console.log(`1 JPY = ${rate.rate} USD`);
  console.log(`Source: ${rate.source}`);
  
  // Example 1F: Format currency
  console.log('\n--- 1F: Format Currency ---');
  console.log('USD:', system.formatCurrency(1234.56, 'USD'));
  console.log('EUR:', system.formatCurrency(1234.56, 'EUR'));
  console.log('JPY:', system.formatCurrency(1234.56, 'JPY'));
  console.log('INR:', system.formatCurrency(1234.56, 'INR'));
  
  // Example 1G: Manual rate override (for offline use)
  console.log('\n--- 1G: Manual Rate Override ---');
  const manualConversion = await system.convertAmount(100, 'EUR', 'USD', 'INR');
  console.log('Using API rate:', manualConversion.accountFormatted);
  
  const manualRate = await system.getRate('EUR', 'USD', 1.15); // Manual override
  console.log('Using manual rate (1.15):', system.formatCurrency(100 * 1.15, 'USD'));
}

// ===================================================================
// EXAMPLE 2: CONVENIENCE FUNCTIONS
// ===================================================================

async function convenienceFunctionsExample() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 2: CONVENIENCE FUNCTIONS');
  console.log('='.repeat(60));
  
  // Quick conversion
  const conversion = await convertCurrency(100, 'EUR', 'USD', 'INR');
  console.log('Converted:', conversion.accountFormatted);
  
  // Quick transaction
  const result = await processTransaction(
    50,           // amount
    'GBP',        // currency
    'USD',        // accountCurrency
    'INR',        // baseCurrency
    'expense',    // type
    'acc_123'     // accountId
  );
  console.log('Transaction:', result.summary.primary);
  
  // Quick rate lookup
  const rate = await getExchangeRate('EUR', 'USD');
  console.log('EUR → USD rate:', rate);
  
  // Quick formatting
  console.log('Formatted:', formatCurrency(1234.56, 'USD'));
}

// ===================================================================
// EXAMPLE 3: REACT COMPONENT WITH HOOK
// ===================================================================

const CurrencyConverterComponent: React.FC = () => {
  const {
    convertAmount,
    formatCurrency: formatAmount,
    getCurrencySymbol,
    isProcessing,
    error,
    lastResult
  } = useUniversalCurrency();
  
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [baseCurrency, setBaseCurrency] = useState('INR');
  
  const handleConvert = async () => {
    try {
      await convertAmount(
        parseFloat(amount),
        fromCurrency,
        toCurrency,
        baseCurrency
      );
    } catch (err) {
      console.error('Conversion error:', err);
    }
  };
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Currency Converter</h2>
      
      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter amount"
          />
        </div>
        
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">From Currency</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>
        
        {/* To Currency (Account) */}
        <div>
          <label className="block text-sm font-medium mb-1">To Currency (Account)</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>
        
        {/* Base Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">Base Currency</label>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>
        
        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isProcessing ? 'Converting...' : 'Convert'}
        </button>
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Result Display */}
        {lastResult && 'transactionFormatted' in lastResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <div>
              <span className="font-medium">Input:</span>{' '}
              {lastResult.transactionFormatted}
            </div>
            <div>
              <span className="font-medium">Account ({toCurrency}):</span>{' '}
              {lastResult.accountFormatted}
            </div>
            <div>
              <span className="font-medium">Base ({baseCurrency}):</span>{' '}
              {lastResult.baseFormatted}
            </div>
            <div className="text-sm text-gray-600 pt-2 border-t">
              <div>Rate: 1 {fromCurrency} = {lastResult.rates.transactionToAccount.toFixed(4)} {toCurrency}</div>
              <div>Path: {lastResult.conversionPath}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================================
// EXAMPLE 4: TRANSACTION FORM COMPONENT
// ===================================================================

const TransactionFormComponent: React.FC = () => {
  const {
    processTransaction: process,
    formatCurrency: format,
    isProcessing,
    error,
    lastResult
  } = useUniversalCurrency();
  
  const [formData, setFormData] = useState({
    amount: '100',
    currency: 'EUR',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    accountCurrency: 'USD',
    baseCurrency: 'INR',
    description: 'Sample transaction'
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const request: TransactionRequest = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        type: formData.type,
        accountId: 'acc_demo_123',
        accountCurrency: formData.accountCurrency,
        baseCurrency: formData.baseCurrency,
        description: formData.description
      };
      
      await process(request);
    } catch (err) {
      console.error('Transaction error:', err);
    }
  };
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Transaction Processor</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Transaction Type</label>
          <select
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => updateField('amount', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => updateField('currency', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        
        {/* Account Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">Account Currency</label>
          <select
            value={formData.accountCurrency}
            onChange={(e) => updateField('accountCurrency', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
        </div>
        
        {/* Base Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">Base Currency</label>
          <select
            value={formData.baseCurrency}
            onChange={(e) => updateField('baseCurrency', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        
        {/* Submit */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isProcessing ? 'Processing...' : 'Process Transaction'}
        </button>
        
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Result */}
        {lastResult && 'summary' in lastResult && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="font-bold text-lg">{lastResult.summary.action}</div>
            <div className="text-green-600">{lastResult.summary.primary}</div>
            <div className="text-gray-600">{lastResult.summary.secondary}</div>
            <div className="text-sm text-gray-500 pt-2 border-t">
              Balance change: {format(lastResult.accountBalanceChange, formData.accountCurrency)}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// ===================================================================
// EXAMPLE 5: COMPREHENSIVE REAL-WORLD SCENARIO
// ===================================================================

async function realWorldScenario() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 5: REAL-WORLD SCENARIO');
  console.log('='.repeat(60));
  console.log('\nScenario: User in India (INR) with USD account makes EUR purchase\n');
  
  const system = getCurrencySystem();
  
  // Step 1: Check exchange rates
  console.log('--- Step 1: Check Current Rates ---');
  const eurToUsd = await system.getRate('EUR', 'USD');
  const eurToInr = await system.getRate('EUR', 'INR');
  console.log(`EUR → USD: ${eurToUsd.rate.toFixed(4)}`);
  console.log(`EUR → INR: ${eurToInr.rate.toFixed(4)}`);
  
  // Step 2: Make purchase
  console.log('\n--- Step 2: Process Purchase ---');
  const purchase = await system.processTransaction({
    amount: 30,
    currency: 'EUR',
    type: 'expense',
    accountId: 'usd_account',
    accountCurrency: 'USD',
    baseCurrency: 'INR',
    description: 'Online purchase from EU store'
  });
  
  console.log('Purchase amount:', purchase.transactionFormatted);
  console.log('Deducted from USD account:', purchase.accountFormatted);
  console.log('Equivalent in INR:', purchase.baseFormatted);
  console.log('\nBalance changes:');
  console.log(`  USD account: ${purchase.accountBalanceChange} USD`);
  console.log(`  INR reporting: ${purchase.baseBalanceChange} INR`);
  
  // Step 3: Display summary
  console.log('\n--- Step 3: Transaction Summary ---');
  console.log(`Action: ${purchase.summary.action}`);
  console.log(`Details: ${purchase.summary.primary}`);
  console.log(`Display: ${purchase.summary.secondary}`);
  console.log(`Path: ${purchase.conversionPath}`);
  
  return purchase;
}

// ===================================================================
// RUN ALL EXAMPLES
// ===================================================================

export async function runAllExamples() {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(60) + '╗');
  console.log('║' + ' '.repeat(10) + 'UNIVERSAL CURRENCY SYSTEM DEMO' + ' '.repeat(19) + '║');
  console.log('╚' + '═'.repeat(60) + '╝');
  
  try {
    await standaloneExample();
    await convenienceFunctionsExample();
    await realWorldScenario();
    
    console.log('\n' + '='.repeat(60));
    console.log('ALL EXAMPLES COMPLETED SUCCESSFULLY! ✅');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Export components for use in your app
export {
  CurrencyConverterComponent,
  TransactionFormComponent
};

// If running directly in Node.js
if (typeof window === 'undefined') {
  runAllExamples().catch(console.error);
}

