/**
 * Transaction Validation Test
 * Tests transaction data validation and submission
 */

export interface TestTransactionData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  accountId: string;
  affectsBalance: boolean;
  status: 'completed' | 'pending' | 'scheduled' | 'cancelled';
  currencycode: string;
  notes?: string;
}

export class TransactionValidationTester {
  /**
   * Test transaction data validation
   */
  static validateTransactionData(data: Partial<TestTransactionData>): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    if (!data.type) missingFields.push('type');
    if (!data.amount || data.amount <= 0) missingFields.push('amount');
    if (!data.accountId) missingFields.push('accountId');
    if (!data.description) missingFields.push('description');
    if (!data.category) missingFields.push('category');
    if (!data.date) missingFields.push('date');
    if (data.affectsBalance === undefined) missingFields.push('affectsBalance');
    if (!data.status) missingFields.push('status');
    if (!data.currencycode) missingFields.push('currencycode');
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Test various transaction scenarios
   */
  static runValidationTests(): Array<{ name: string; data: Partial<TestTransactionData>; expectedValid: boolean }> {
    return [
      {
        name: 'Valid Complete Transaction',
        data: {
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD',
          notes: 'Test notes'
        },
        expectedValid: true
      },
      {
        name: 'Missing Type',
        data: {
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Amount',
        data: {
          type: 'expense',
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Zero Amount',
        data: {
          type: 'expense',
          amount: 0,
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Description',
        data: {
          type: 'expense',
          amount: 100,
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Category',
        data: {
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Account ID',
        data: {
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Date',
        data: {
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Affects Balance',
        data: {
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          status: 'completed',
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Status',
        data: {
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          currencycode: 'USD'
        },
        expectedValid: false
      },
      {
        name: 'Missing Currency Code',
        data: {
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          category: 'Food',
          date: new Date(),
          accountId: 'test-account-id',
          affectsBalance: true,
          status: 'completed'
        },
        expectedValid: false
      }
    ];
  }

  /**
   * Run all validation tests
   */
  static runAllTests(): void {
    console.log('🧪 Running Transaction Validation Tests...\n');
    
    const tests = this.runValidationTests();
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
      const result = this.validateTransactionData(test.data);
      const testPassed = result.isValid === test.expectedValid;
      
      console.log(`${testPassed ? '✅' : '❌'} ${test.name}`);
      
      if (!testPassed) {
        console.log(`   Expected: ${test.expectedValid ? 'Valid' : 'Invalid'}`);
        console.log(`   Got: ${result.isValid ? 'Valid' : 'Invalid'}`);
        if (result.missingFields.length > 0) {
          console.log(`   Missing fields: ${result.missingFields.join(', ')}`);
        }
        failed++;
      } else {
        passed++;
      }
      
      console.log('');
    });
    
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All validation tests passed!');
    } else {
      console.log('⚠️  Some validation tests failed.');
    }
  }
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runTransactionValidationTests = TransactionValidationTester.runAllTests;
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { TransactionValidationTester };
}
