import { supabase } from '../lib/supabase';

export interface AnalyticsCacheData {
  user_id: string;
  cache_key: string;
  cache_data: any;
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  expires_at: string;
}

export class AnalyticsCacheService {
  private static instance: AnalyticsCacheService;
  private cache: Map<string, any> = new Map();

  static getInstance(): AnalyticsCacheService {
    if (!AnalyticsCacheService.instance) {
      AnalyticsCacheService.instance = new AnalyticsCacheService();
    }
    return AnalyticsCacheService.instance;
  }

  private generateCacheKey(
    type: string,
    userId: string,
    periodStart: string,
    periodEnd: string,
    filters?: Record<string, any>
  ): string {
    const filterString = filters ? JSON.stringify(filters) : '';
    return `${type}_${userId}_${periodStart}_${periodEnd}_${filterString}`;
  }

  private getExpirationTime(periodType: string): Date {
    const now = new Date();
    switch (periodType) {
      case 'daily':
        return new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
      case 'weekly':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
      case 'monthly':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      case 'quarterly':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      case 'yearly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    }
  }

  async getCachedData(
    type: string,
    userId: string,
    periodStart: string,
    periodEnd: string,
    periodType: string,
    filters?: Record<string, any>
  ): Promise<any | null> {
    const cacheKey = this.generateCacheKey(type, userId, periodStart, periodEnd, filters);
    
    // Check memory cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Check database cache
      const { data, error } = await supabase
        .from('analytics_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('cache_key', cacheKey)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Store in memory cache
      this.cache.set(cacheKey, data.cache_data);
      return data.cache_data;
    } catch (error) {
      console.error('Error fetching cached analytics data:', error);
      return null;
    }
  }

  async setCachedData(
    type: string,
    userId: string,
    periodStart: string,
    periodEnd: string,
    periodType: string,
    data: any,
    filters?: Record<string, any>
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(type, userId, periodStart, periodEnd, filters);
    const expiresAt = this.getExpirationTime(periodType);

    try {
      // Store in memory cache
      this.cache.set(cacheKey, data);

      // Store in database cache
      await supabase
        .from('analytics_cache')
        .upsert({
          user_id: userId,
          cache_key: cacheKey,
          cache_data: data,
          period_start: periodStart,
          period_end: periodEnd,
          period_type: periodType,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Error caching analytics data:', error);
    }
  }

  async clearCache(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Clear specific user's cache
        await supabase
          .from('analytics_cache')
          .delete()
          .eq('user_id', userId);
        
        // Clear memory cache for user
        for (const [key, value] of this.cache.entries()) {
          if (key.includes(userId)) {
            this.cache.delete(key);
          }
        }
      } else {
        // Clear all cache
        await supabase
          .from('analytics_cache')
          .delete()
          .lt('expires_at', new Date().toISOString());
        
        this.cache.clear();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async cleanupExpiredCache(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_analytics_cache');
      
      if (error) {
        console.error('Error cleaning up expired cache:', error);
        return 0;
      }
      
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
      return 0;
    }
  }

  // Predefined cache types
  static readonly CACHE_TYPES = {
    HOME_SUMMARY: 'home_summary',
    FINANCIAL_HEALTH: 'financial_health',
    SPENDING_ANALYSIS: 'spending_analysis',
    INCOME_ANALYSIS: 'income_analysis',
    CATEGORY_BREAKDOWN: 'category_breakdown',
    TREND_ANALYSIS: 'trend_analysis',
    PREDICTIVE_ANALYTICS: 'predictive_analytics',
    GOAL_PROGRESS: 'goal_progress',
    BUDGET_ANALYSIS: 'budget_analysis'
  } as const;
}
