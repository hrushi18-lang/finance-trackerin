/**
 * Analytics API Endpoint
 * Handles analytics data submission to server
 */

interface AnalyticsData {
  errors: Record<string, unknown>[];
  performance: Record<string, unknown>[];
  events?: Record<string, unknown>[];
  user_id?: string;
  timestamp: number;
}

interface AnalyticsResponse {
  success: boolean;
  message?: string;
  processed_count?: number;
}

class AnalyticsAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_ANALYTICS_API_URL || '/api/analytics';
    this.apiKey = import.meta.env.VITE_ANALYTICS_API_KEY || '';
  }

  /**
   * Send analytics data to server
   */
  async sendAnalytics(data: AnalyticsData): Promise<AnalyticsResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          ...data,
          timestamp: Date.now(),
          user_agent: navigator.userAgent,
          platform: this.getPlatform(),
          app_version: import.meta.env.VITE_APP_VERSION || '1.0.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to send analytics data:', error);
      throw error;
    }
  }

  /**
   * Send error data specifically
   */
  async sendErrors(errors: Record<string, unknown>[], userId?: string): Promise<AnalyticsResponse> {
    return this.sendAnalytics({
      errors,
      performance: [],
      user_id: userId,
      timestamp: Date.now()
    });
  }

  /**
   * Send performance data specifically
   */
  async sendPerformance(performance: Record<string, unknown>[], userId?: string): Promise<AnalyticsResponse> {
    return this.sendAnalytics({
      errors: [],
      performance,
      user_id: userId,
      timestamp: Date.now()
    });
  }

  /**
   * Send events data specifically
   */
  async sendEvents(events: Record<string, unknown>[], userId?: string): Promise<AnalyticsResponse> {
    return this.sendAnalytics({
      errors: [],
      performance: [],
      events,
      user_id: userId,
      timestamp: Date.now()
    });
  }

  /**
   * Batch send multiple types of data
   */
  async sendBatch(data: {
    errors?: Record<string, unknown>[];
    performance?: Record<string, unknown>[];
    events?: Record<string, unknown>[];
    user_id?: string;
  }): Promise<AnalyticsResponse> {
    return this.sendAnalytics({
      errors: data.errors || [],
      performance: data.performance || [],
      events: data.events || [],
      user_id: data.user_id,
      timestamp: Date.now()
    });
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'web';
  }

  /**
   * Test analytics endpoint
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Analytics endpoint test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const analyticsAPI = new AnalyticsAPI();

// Export convenience functions
export const sendAnalytics = (data: AnalyticsData) => analyticsAPI.sendAnalytics(data);
export const sendErrors = (errors: Record<string, unknown>[], userId?: string) => analyticsAPI.sendErrors(errors, userId);
export const sendPerformance = (performance: Record<string, unknown>[], userId?: string) => analyticsAPI.sendPerformance(performance, userId);
export const sendEvents = (events: Record<string, unknown>[], userId?: string) => analyticsAPI.sendEvents(events, userId);
export const sendBatch = (data: Record<string, unknown>) => analyticsAPI.sendBatch(data);
export const testAnalyticsConnection = () => analyticsAPI.testConnection();

export default analyticsAPI;
