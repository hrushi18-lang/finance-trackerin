/**
 * Initialize Exchange Rates
 * Sets up the exchange rates table and fetches initial rates
 */

import { exchangeRateService } from '../services/exchangeRateService';

export const initializeExchangeRates = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing exchange rates...');
    
    // Refresh all rates to populate the database
    const result = await exchangeRateService.refreshAllRates();
    
    console.log(`✅ Exchange rates initialized successfully`);
    console.log(`📊 Source: ${result.source}`);
    console.log(`🕒 Last updated: ${result.lastUpdated.toISOString()}`);
    console.log(`💱 Currencies loaded: ${Object.keys(result.rates).length}`);
    
    // Log some sample rates
    const sampleRates = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'HKD'];
    console.log('📈 Sample rates (USD base):');
    sampleRates.forEach(currency => {
      if (result.rates[currency]) {
        console.log(`  ${currency}: ${result.rates[currency]}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize exchange rates:', error);
    console.log('🔄 Falling back to hardcoded rates...');
  }
};

// Auto-initialize when this module is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  initializeExchangeRates();
}
