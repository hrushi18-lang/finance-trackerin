/**
 * Google Analytics and User Analytics Tracking
 * Comprehensive analytics for user behavior and app performance
 */

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, unknown>;
}

interface UserProperties {
  user_id?: string;
  email?: string;
  name?: string;
  age?: number;
  currency?: string;
  country?: string;
  platform?: string;
  app_version?: string;
}

interface PageView {
  page_title: string;
  page_location: string;
  page_path: string;
  custom_parameters?: Record<string, unknown>;
}

class AnalyticsService {
  private isInitialized = false;
  private measurementId: string;
  private userId: string | null = null;
  private userProperties: UserProperties = {};
  private eventQueue: AnalyticsEvent[] = [];
  private maxQueueSize = 50;
  private flushInterval = 10000; // 10 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
    this.initialize();
  }

  /**
   * Initialize Google Analytics
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Load Google Analytics script
    this.loadGoogleAnalytics();

    // Set up periodic flushing
    this.startFlushTimer();

    this.isInitialized = true;
  }

  /**
   * Load Google Analytics script
   */
  private loadGoogleAnalytics(): void {
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: false // We'll send page views manually
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
    this.userId = properties.user_id || null;

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', this.measurementId, {
        user_id: this.userId,
        custom_map: {
          dimension1: properties.email,
          dimension2: properties.name,
          dimension3: properties.age?.toString(),
          dimension4: properties.currency,
          dimension5: properties.country,
          dimension6: properties.platform,
          dimension7: properties.app_version
        }
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageView: PageView): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_title: pageView.page_title,
      page_location: pageView.page_location,
      page_path: pageView.page_path,
      ...pageView.custom_parameters
    });
  }

  /**
   * Track custom event
   */
  trackEvent(event: AnalyticsEvent): void {
    if (typeof window === 'undefined' || !window.gtag) {
      // Queue event if gtag not available
      this.eventQueue.push(event);
      return;
    }

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters
    });
  }

  /**
   * Track transaction
   */
  trackTransaction(transaction: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      quantity: number;
      price: number;
    }>;
  }): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'purchase', {
      transaction_id: transaction.transaction_id,
      value: transaction.value,
      currency: transaction.currency,
      items: transaction.items
    });
  }

  /**
   * Track financial action
   */
  trackFinancialAction(action: string, details: {
    amount?: number;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense' | 'transfer';
    account_type?: string;
    goal_id?: string;
    liability_id?: string;
    bill_id?: string;
  }): void {
    this.trackEvent({
      action,
      category: 'financial',
      label: details.category || details.type,
      value: details.amount,
      custom_parameters: {
        currency: details.currency,
        account_type: details.account_type,
        goal_id: details.goal_id,
        liability_id: details.liability_id,
        bill_id: details.bill_id
      }
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, details: {
    feature?: string;
    duration?: number;
    value?: number;
    metadata?: Record<string, any>;
  }): void {
    this.trackEvent({
      action,
      category: 'engagement',
      label: details.feature,
      value: details.value || details.duration,
      custom_parameters: details.metadata
    });
  }

  /**
   * Track app performance
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent({
      action: 'performance_metric',
      category: 'performance',
      label: metric,
      value: Math.round(value),
      custom_parameters: {
        unit,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track error
   */
  trackError(error: {
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    component?: string;
    metadata?: Record<string, any>;
  }): void {
    this.trackEvent({
      action: 'error',
      category: 'error',
      label: error.component || error.category,
      value: this.getSeverityValue(error.severity),
      custom_parameters: {
        error_message: error.message,
        severity: error.severity,
        ...error.metadata
      }
    });
  }

  /**
   * Track onboarding progress
   */
  trackOnboardingStep(step: string, completed: boolean, timeSpent?: number): void {
    this.trackEvent({
      action: completed ? 'onboarding_step_completed' : 'onboarding_step_started',
      category: 'onboarding',
      label: step,
      value: timeSpent,
      custom_parameters: {
        step,
        completed,
        time_spent: timeSpent
      }
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      action: `feature_${action}`,
      category: 'feature_usage',
      label: feature,
      custom_parameters: {
        feature,
        ...metadata
      }
    });
  }

  /**
   * Track conversion
   */
  trackConversion(conversion: {
    conversion_id: string;
    conversion_label: string;
    value: number;
    currency: string;
  }): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'conversion', {
      send_to: `${this.measurementId}/${conversion.conversion_id}`,
      value: conversion.value,
      currency: conversion.currency,
      transaction_id: conversion.conversion_label
    });
  }

  /**
   * Get severity value for analytics
   */
  private getSeverityValue(severity: string): number {
    const severityMap = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    return severityMap[severity as keyof typeof severityMap] || 2;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushQueuedEvents();
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush queued events
   */
  private flushQueuedEvents(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    events.forEach(event => {
      this.trackEvent(event);
    });
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.setUserProperties({ user_id: userId });
  }

  /**
   * Clear user data
   */
  clearUserData(): void {
    this.userId = null;
    this.userProperties = {};
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', this.measurementId, {
        user_id: null
      });
    }
  }

  /**
   * Get analytics data
   */
  getAnalyticsData(): {
    userId: string | null;
    userProperties: UserProperties;
    queuedEvents: number;
  } {
    return {
      userId: this.userId,
      userProperties: this.userProperties,
      queuedEvents: this.eventQueue.length
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flushQueuedEvents();
  }
}

// Create singleton instance
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
export const analytics = new AnalyticsService(measurementId);

// Export convenience functions
export const trackPageView = (pageView: PageView) => analytics.trackPageView(pageView);
export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event);
export const trackFinancialAction = (action: string, details: Record<string, unknown>) => analytics.trackFinancialAction(action, details);
export const trackEngagement = (action: string, details: Record<string, unknown>) => analytics.trackEngagement(action, details);
export const trackPerformance = (metric: string, value: number, unit?: string) => analytics.trackPerformance(metric, value, unit);
export const trackError = (error: Error | Record<string, unknown>) => analytics.trackError(error);
export const trackOnboardingStep = (step: string, completed: boolean, timeSpent?: number) => analytics.trackOnboardingStep(step, completed, timeSpent);
export const trackFeatureUsage = (feature: string, action: string, metadata?: Record<string, any>) => analytics.trackFeatureUsage(feature, action, metadata);
export const trackConversion = (conversion: Record<string, unknown>) => analytics.trackConversion(conversion);
export const setUserId = (userId: string) => analytics.setUserId(userId);
export const setUserProperties = (properties: UserProperties) => analytics.setUserProperties(properties);
export const clearUserData = () => analytics.clearUserData();

export default analytics;
