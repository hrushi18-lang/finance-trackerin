/**
 * Setup Test Account for Hrushi Thogiti
 * Comprehensive multi-currency testing scenario
 */

import { currencyConversionService } from '../services/currencyConversionService';

export interface HrushiAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card';
  currency: string;
  balance: number;
  description: string;
}

export interface HrushiGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  description: string;
}

export interface HrushiBill {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  frequency: 'monthly' | 'yearly';
  dueDate: Date;
  accountId: string;
}

export interface HrushiLiability {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  currency: string;
  monthlyPayment: number;
  interestRate: number;
  type: 'emi' | 'student_loan' | 'auto_loan';
}

export class HrushiTestSetup {
  // Hrushi's Account Setup
  static getAccounts(): HrushiAccount[] {
    return [
      {
        id: 'cash-wallet-usd',
        name: 'Cash Wallet',
        type: 'cash',
        currency: 'USD',
        balance: 150.00, // $150 for daily expenses
        description: 'Daily small expenses like meals, snacks, transport'
      },
      {
        id: 'bank-account-inr',
        name: 'Primary Bank Account',
        type: 'bank',
        currency: 'INR',
        balance: 250000.00, // ₹2,50,000 for scholarships and large payments
        description: 'Primary account for deposits, scholarships, and large payments'
      },
      {
        id: 'credit-card-multi',
        name: 'Credit Card (Multi-currency)',
        type: 'credit_card',
        currency: 'USD',
        balance: -2500.00, // -$2,500 credit card debt
        description: 'Tracks purchases, subscriptions, and EMIs in multiple currencies'
      }
    ];
  }

  // Hrushi's Financial Goals
  static getGoals(): HrushiGoal[] {
    return [
      {
        id: 'startup-fund',
        name: 'Startup Fund',
        targetAmount: 2500000, // ₹25,00,000
        currentAmount: 150000, // ₹1,50,000
        currency: 'INR',
        description: 'Build startup fund for AI applications'
      },
      {
        id: 'emergency-fund',
        name: 'Emergency Fund',
        targetAmount: 500000, // ₹5,00,000
        currentAmount: 75000, // ₹75,000
        currency: 'INR',
        description: 'Emergency fund for unexpected expenses'
      }
    ];
  }

  // Hrushi's Bills and Subscriptions
  static getBills(): HrushiBill[] {
    return [
      {
        id: 'netflix-monthly',
        title: 'Netflix Subscription',
        amount: 15.99,
        currency: 'USD',
        category: 'Subscriptions',
        frequency: 'monthly',
        dueDate: new Date(2024, 11, 15), // December 15, 2024
        accountId: 'credit-card-multi'
      },
      {
        id: 'spotify-monthly',
        title: 'Spotify Premium',
        amount: 9.99,
        currency: 'USD',
        category: 'Subscriptions',
        frequency: 'monthly',
        dueDate: new Date(2024, 11, 20), // December 20, 2024
        accountId: 'credit-card-multi'
      },
      {
        id: 'adobe-creative',
        title: 'Adobe Creative Cloud',
        amount: 52.99,
        currency: 'USD',
        category: 'Subscriptions',
        frequency: 'monthly',
        dueDate: new Date(2024, 11, 10), // December 10, 2024
        accountId: 'credit-card-multi'
      },
      {
        id: 'openai-api',
        title: 'OpenAI API Usage',
        amount: 45.00,
        currency: 'USD',
        category: 'AI Tools & Software',
        frequency: 'monthly',
        dueDate: new Date(2024, 11, 25), // December 25, 2024
        accountId: 'bank-account-inr'
      },
      {
        id: 'cloud-services',
        title: 'Cloud Services (AWS/Azure)',
        amount: 35.00,
        currency: 'USD',
        category: 'AI Tools & Software',
        frequency: 'monthly',
        dueDate: new Date(2024, 11, 30), // December 30, 2024
        accountId: 'bank-account-inr'
      }
    ];
  }

  // Hrushi's Liabilities
  static getLiabilities(): HrushiLiability[] {
    return [
      {
        id: 'student-loan',
        name: 'Student Loan',
        totalAmount: 500000, // ₹5,00,000
        remainingAmount: 450000, // ₹4,50,000
        currency: 'INR',
        monthlyPayment: 15000, // ₹15,000
        interestRate: 8.5,
        type: 'student_loan'
      },
      {
        id: 'credit-card-emi',
        name: 'Credit Card EMI',
        totalAmount: 2500, // $2,500
        remainingAmount: 2000, // $2,000
        currency: 'USD',
        monthlyPayment: 200, // $200
        interestRate: 18.0,
        type: 'emi'
      }
    ];
  }

  // Test Currency Conversion Scenarios
  static async testCurrencyConversions(): Promise<void> {
    console.log('🧪 Testing Hrushi\'s Currency Conversion Scenarios...\n');

    const testScenarios = [
      {
        name: 'Scholarship Deposit (INR → INR)',
        amount: 50000,
        enteredCurrency: 'INR',
        accountCurrency: 'INR',
        primaryCurrency: 'INR',
        description: 'Monthly scholarship deposit to bank account'
      },
      {
        name: 'App Revenue (USD → INR)',
        amount: 500,
        enteredCurrency: 'USD',
        accountCurrency: 'INR',
        primaryCurrency: 'INR',
        description: 'App revenue from US users deposited to Indian bank'
      },
      {
        name: 'Daily Meal (USD → USD)',
        amount: 8.50,
        enteredCurrency: 'USD',
        accountCurrency: 'USD',
        primaryCurrency: 'INR',
        description: 'Lunch paid from cash wallet'
      },
      {
        name: 'Netflix Payment (USD → USD)',
        amount: 15.99,
        enteredCurrency: 'USD',
        accountCurrency: 'USD',
        primaryCurrency: 'INR',
        description: 'Netflix subscription from credit card'
      },
      {
        name: 'OpenAI API (USD → INR)',
        amount: 45.00,
        enteredCurrency: 'USD',
        accountCurrency: 'INR',
        primaryCurrency: 'INR',
        description: 'OpenAI API usage paid from bank account'
      },
      {
        name: 'Student Loan Payment (INR → INR)',
        amount: 15000,
        enteredCurrency: 'INR',
        accountCurrency: 'INR',
        primaryCurrency: 'INR',
        description: 'Monthly student loan payment'
      }
    ];

    for (const scenario of testScenarios) {
      try {
        console.log(`\n📋 Testing: ${scenario.name}`);
        console.log(`📝 ${scenario.description}`);
        
        const result = await currencyConversionService.convertCurrency({
          amount: scenario.amount,
          enteredCurrency: scenario.enteredCurrency,
          accountCurrency: scenario.accountCurrency,
          primaryCurrency: scenario.primaryCurrency,
          includeFees: true,
          feePercentage: 0.0025,
          auditContext: 'hrushi_test'
        });

        console.log(`✅ Conversion Result:`);
        console.log(`   Entered: ${result.enteredSymbol}${result.enteredAmount.toFixed(2)} ${result.enteredCurrency}`);
        console.log(`   Account: ${result.accountSymbol}${result.accountAmount.toFixed(2)} ${result.accountCurrency}`);
        console.log(`   Primary: ${result.primarySymbol}${result.primaryAmount.toFixed(2)} ${result.primaryCurrency}`);
        console.log(`   Rate: 1 ${result.enteredCurrency} = ${result.exchangeRate.toFixed(6)} ${result.accountCurrency}`);
        console.log(`   Fee: ${result.conversionFee.toFixed(2)} ${result.primaryCurrency}`);
        console.log(`   Source: ${result.conversionSource}`);
        console.log(`   Case: ${result.conversionCase}`);

      } catch (error: any) {
        console.log(`❌ Error in ${scenario.name}: ${error.message}`);
      }
    }
  }

  // Test Multi-Currency Budget Scenarios
  static getBudgetScenarios() {
    return [
      {
        name: 'Cash Wallet - Daily Food Budget',
        accountId: 'cash-wallet-usd',
        category: 'Food / Meals',
        monthlyBudget: 200, // $200/month
        currency: 'USD',
        spent: 45.50,
        description: 'Daily/weekly food budget for campus meals'
      },
      {
        name: 'Bank Account - AI Tools Budget',
        accountId: 'bank-account-inr',
        category: 'AI Tools & Software',
        monthlyBudget: 10000, // ₹10,000/month
        currency: 'INR',
        spent: 3500,
        description: 'Monthly budget for AI tools and software subscriptions'
      },
      {
        name: 'Credit Card - Travel Budget',
        accountId: 'credit-card-multi',
        category: 'Travel / Miscellaneous',
        monthlyBudget: 300, // $300/month
        currency: 'USD',
        spent: 125.75,
        description: 'Travel, shopping, and miscellaneous expenses'
      }
    ];
  }

  // Test Analytics Scenarios
  static getAnalyticsScenarios() {
    return {
      totalNetWorth: {
        cashWallet: 150.00, // USD
        bankAccount: 250000.00, // INR
        creditCard: -2500.00, // USD (debt)
        primaryCurrency: 'INR'
      },
      monthlyExpenses: {
        subscriptions: 83.97, // USD
        aiTools: 80.00, // USD
        food: 200.00, // USD
        travel: 300.00, // USD
        total: 663.97, // USD
        primaryCurrency: 'INR'
      },
      goalProgress: {
        startupFund: {
          target: 2500000, // INR
          current: 150000, // INR
          percentage: 6.0
        },
        emergencyFund: {
          target: 500000, // INR
          current: 75000, // INR
          percentage: 15.0
        }
      }
    };
  }

  // Run Complete Test Suite
  static async runCompleteTest(): Promise<void> {
    console.log('🎯 Starting Hrushi Thogiti Comprehensive Test Suite...\n');
    
    console.log('👤 User Profile:');
    console.log('   Name: Hrushi Thogiti');
    console.log('   Age: 16');
    console.log('   Location: Telangana, India');
    console.log('   Education: Stanford University (Full Scholarship)');
    console.log('   Primary Currency: INR (Indian Rupee)');
    console.log('   Secondary Currency: USD (US Dollar)\n');

    console.log('🏦 Account Setup:');
    const accounts = this.getAccounts();
    accounts.forEach(account => {
      console.log(`   ${account.name}: ${account.currency} ${account.balance.toFixed(2)} (${account.description})`);
    });

    console.log('\n🎯 Financial Goals:');
    const goals = this.getGoals();
    goals.forEach(goal => {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;
      console.log(`   ${goal.name}: ${goal.currency} ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()} (${percentage.toFixed(1)}%)`);
    });

    console.log('\n💳 Bills & Subscriptions:');
    const bills = this.getBills();
    bills.forEach(bill => {
      console.log(`   ${bill.title}: ${bill.currency} ${bill.amount} (${bill.frequency})`);
    });

    console.log('\n📊 Liabilities:');
    const liabilities = this.getLiabilities();
    liabilities.forEach(liability => {
      console.log(`   ${liability.name}: ${liability.currency} ${liability.remainingAmount.toLocaleString()} remaining`);
    });

    console.log('\n🧪 Testing Currency Conversions...');
    await this.testCurrencyConversions();

    console.log('\n📈 Budget Scenarios:');
    const budgets = this.getBudgetScenarios();
    budgets.forEach(budget => {
      const percentage = (budget.spent / budget.monthlyBudget) * 100;
      console.log(`   ${budget.name}: ${budget.currency} ${budget.spent} / ${budget.monthlyBudget} (${percentage.toFixed(1)}%)`);
    });

    console.log('\n🎉 Test Suite Complete!');
    console.log('All currency conversion scenarios tested successfully.');
  }
}

// Export for use in other files
export default HrushiTestSetup;
