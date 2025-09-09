import { dailyRateFetcher } from './daily-rate-fetcher';

class CronService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UTC_MIDNIGHT = 0; // 00:00 UTC

  // Start the daily rate fetching cron job
  startDailyRateFetch(): void {
    console.log('🕐 Starting daily rate fetch cron job...');
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('⚠️ Cron service running in browser - using setInterval instead of cron');
      this.startBrowserInterval();
      return;
    }

    // For server environments, we could use a proper cron library
    // For now, use setInterval as a fallback
    this.startBrowserInterval();
  }

  // Browser-compatible interval-based approach
  private startBrowserInterval(): void {
    // Check every hour if we need to fetch rates
    this.intervalId = setInterval(async () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      
      // Only run at UTC midnight (00:00)
      if (utcHour === this.UTC_MIDNIGHT) {
        console.log('🕐 UTC midnight reached, fetching daily rates...');
        await this.fetchDailyRates();
      }
    }, 60 * 60 * 1000); // Check every hour

    // Also run immediately on startup
    this.fetchDailyRates();
  }

  // Fetch daily rates
  private async fetchDailyRates(): Promise<void> {
    try {
      console.log('🚀 Starting daily rate fetch...');
      
      const rates = await dailyRateFetcher.fetchTodaysRates();
      
      if (rates.length > 0) {
        console.log(`✅ Successfully fetched ${rates.length} daily rates`);
      } else {
        console.log('ℹ️ No new rates to fetch (already up to date)');
      }
    } catch (error) {
      console.error('❌ Error in daily rate fetch:', error);
    }
  }

  // Stop the cron job
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Daily rate fetch cron job stopped');
    }
  }

  // Manual trigger for testing
  async triggerDailyFetch(): Promise<void> {
    console.log('🔧 Manual trigger for daily rate fetch');
    await this.fetchDailyRates();
  }

  // Check if rates are stale
  async checkStaleRates(): Promise<boolean> {
    return await dailyRateFetcher.checkStaleRates();
  }
}

export const cronService = new CronService();
