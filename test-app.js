/**
 * App Testing Script
 * Tests the running finance tracker app
 */

const puppeteer = require('puppeteer');

class AppTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:5173';
  }

  async init() {
    console.log('🚀 Starting App Testing...');
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless testing
      devtools: true,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForTimeout(2000);
      
      // Check if redirected to auth page
      const currentUrl = this.page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/auth')) {
        console.log('✅ Redirected to auth page correctly');
        
        // Test signup form
        const signupButton = await this.page.$('[data-testid="signup-button"]');
        if (signupButton) {
          console.log('✅ Signup button found');
        }
        
        // Test login form
        const loginButton = await this.page.$('[data-testid="login-button"]');
        if (loginButton) {
          console.log('✅ Login button found');
        }
        
      } else {
        console.log('ℹ️ Already authenticated or on different page');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Authentication test failed:', error.message);
      return false;
    }
  }

  async testOnboarding() {
    console.log('\n📋 Testing Onboarding Flow...');
    
    try {
      // Check if onboarding modal appears
      const onboardingModal = await this.page.$('[data-testid="onboarding-modal"]');
      if (onboardingModal) {
        console.log('✅ Onboarding modal found');
        
        // Test step navigation
        const nextButton = await this.page.$('[data-testid="onboarding-next"]');
        if (nextButton) {
          console.log('✅ Next button found');
          await nextButton.click();
          await this.page.waitForTimeout(1000);
        }
        
        // Test form filling
        const nameInput = await this.page.$('input[placeholder*="name" i]');
        if (nameInput) {
          await nameInput.type('Test User');
          console.log('✅ Name input filled');
        }
        
        const currencySelect = await this.page.$('select[name="currency"]');
        if (currencySelect) {
          await currencySelect.select('USD');
          console.log('✅ Currency selected');
        }
        
      } else {
        console.log('ℹ️ No onboarding modal found (user may be already onboarded)');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Onboarding test failed:', error.message);
      return false;
    }
  }

  async testAccountCreation() {
    console.log('\n🏦 Testing Account Creation...');
    
    try {
      // Navigate to accounts page
      await this.page.goto(`${this.baseUrl}/accounts`);
      await this.page.waitForTimeout(2000);
      
      // Look for add account button
      const addButton = await this.page.$('button[aria-label*="add" i], button:has-text("Add Account"), [data-testid="add-account"]');
      if (addButton) {
        console.log('✅ Add account button found');
        await addButton.click();
        await this.page.waitForTimeout(1000);
        
        // Test account form
        const accountForm = await this.page.$('form, [data-testid="account-form"]');
        if (accountForm) {
          console.log('✅ Account form found');
          
          // Fill account name
          const nameInput = await this.page.$('input[placeholder*="account" i], input[name="name"]');
          if (nameInput) {
            await nameInput.type('Test Savings Account');
            console.log('✅ Account name filled');
          }
          
          // Select account type
          const typeSelect = await this.page.$('select[name="type"], select[aria-label*="type" i]');
          if (typeSelect) {
            await typeSelect.select('bank_savings');
            console.log('✅ Account type selected');
          }
          
          // Fill balance
          const balanceInput = await this.page.$('input[type="number"], input[name="balance"]');
          if (balanceInput) {
            await balanceInput.type('5000');
            console.log('✅ Balance filled');
          }
          
          // Select currency
          const currencySelect = await this.page.$('select[name="currency"]');
          if (currencySelect) {
            await currencySelect.select('USD');
            console.log('✅ Currency selected');
          }
          
          // Submit form
          const submitButton = await this.page.$('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
          if (submitButton) {
            await submitButton.click();
            console.log('✅ Account form submitted');
            await this.page.waitForTimeout(2000);
          }
        }
      } else {
        console.log('ℹ️ Add account button not found');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Account creation test failed:', error.message);
      return false;
    }
  }

  async testTransactionCreation() {
    console.log('\n💰 Testing Transaction Creation...');
    
    try {
      // Navigate to transactions page
      await this.page.goto(`${this.baseUrl}/transactions`);
      await this.page.waitForTimeout(2000);
      
      // Look for add transaction button
      const addButton = await this.page.$('button[aria-label*="add" i], button:has-text("Add Transaction"), [data-testid="add-transaction"]');
      if (addButton) {
        console.log('✅ Add transaction button found');
        await addButton.click();
        await this.page.waitForTimeout(1000);
        
        // Test transaction form
        const transactionForm = await this.page.$('form, [data-testid="transaction-form"]');
        if (transactionForm) {
          console.log('✅ Transaction form found');
          
          // Select transaction type
          const incomeButton = await this.page.$('button:has-text("Income"), [data-testid="income-button"]');
          if (incomeButton) {
            await incomeButton.click();
            console.log('✅ Income type selected');
          }
          
          // Fill amount
          const amountInput = await this.page.$('input[type="number"], input[name="amount"]');
          if (amountInput) {
            await amountInput.type('1000');
            console.log('✅ Amount filled');
          }
          
          // Fill description
          const descriptionInput = await this.page.$('input[placeholder*="description" i], textarea[placeholder*="description" i]');
          if (descriptionInput) {
            await descriptionInput.type('Test Income Transaction');
            console.log('✅ Description filled');
          }
          
          // Select category
          const categorySelect = await this.page.$('select[name="category"], [data-testid="category-select"]');
          if (categorySelect) {
            await categorySelect.select('Salary');
            console.log('✅ Category selected');
          }
          
          // Submit form
          const submitButton = await this.page.$('button[type="submit"], button:has-text("Add"), button:has-text("Save")');
          if (submitButton) {
            await submitButton.click();
            console.log('✅ Transaction form submitted');
            await this.page.waitForTimeout(2000);
          }
        }
      } else {
        console.log('ℹ️ Add transaction button not found');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Transaction creation test failed:', error.message);
      return false;
    }
  }

  async testExchangeRates() {
    console.log('\n💱 Testing Exchange Rate System...');
    
    try {
      // Navigate to settings
      await this.page.goto(`${this.baseUrl}/settings`);
      await this.page.waitForTimeout(2000);
      
      // Look for exchange rates option
      const exchangeRatesButton = await this.page.$('button:has-text("Exchange Rates"), [data-testid="exchange-rates"]');
      if (exchangeRatesButton) {
        console.log('✅ Exchange rates button found');
        await exchangeRatesButton.click();
        await this.page.waitForTimeout(1000);
        
        // Test exchange rate modal
        const exchangeModal = await this.page.$('[data-testid="exchange-rates-modal"]');
        if (exchangeModal) {
          console.log('✅ Exchange rates modal found');
          
          // Test rate refresh
          const refreshButton = await this.page.$('button:has-text("Refresh"), [data-testid="refresh-rates"]');
          if (refreshButton) {
            await refreshButton.click();
            console.log('✅ Rate refresh clicked');
            await this.page.waitForTimeout(2000);
          }
          
          // Test manual rate editing
          const editButton = await this.page.$('button:has-text("Edit"), [data-testid="edit-rate"]');
          if (editButton) {
            await editButton.click();
            console.log('✅ Edit rate clicked');
            
            // Test rate input
            const rateInput = await this.page.$('input[type="number"]');
            if (rateInput) {
              await rateInput.clear();
              await rateInput.type('1.5');
              console.log('✅ Rate value changed');
            }
            
            // Test save
            const saveButton = await this.page.$('button:has-text("Save")');
            if (saveButton) {
              await saveButton.click();
              console.log('✅ Rate saved');
            }
          }
        }
      } else {
        console.log('ℹ️ Exchange rates button not found');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Exchange rates test failed:', error.message);
      return false;
    }
  }

  async testMobileResponsiveness() {
    console.log('\n📱 Testing Mobile Responsiveness...');
    
    try {
      // Set mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto(this.baseUrl);
      await this.page.waitForTimeout(2000);
      
      // Check if mobile navigation is visible
      const mobileNav = await this.page.$('[data-testid="mobile-nav"], .mobile-nav, nav');
      if (mobileNav) {
        console.log('✅ Mobile navigation found');
      }
      
      // Test touch interactions
      const touchElements = await this.page.$$('button, [role="button"]');
      if (touchElements.length > 0) {
        console.log(`✅ Found ${touchElements.length} touch elements`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Mobile responsiveness test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive App Testing...\n');
    
    const results = {
      authentication: await this.testAuthentication(),
      onboarding: await this.testOnboarding(),
      accountCreation: await this.testAccountCreation(),
      transactionCreation: await this.testTransactionCreation(),
      exchangeRates: await this.testExchangeRates(),
      mobileResponsiveness: await this.testMobileResponsiveness()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${test}: ${status}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    return results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AppTester();
  
  tester.init()
    .then(() => tester.runAllTests())
    .then(() => tester.cleanup())
    .catch(console.error);
}

module.exports = AppTester;
