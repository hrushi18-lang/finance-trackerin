/**
 * Error Monitoring and Analytics
 * Centralized error tracking and performance monitoring
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'database' | 'validation' | 'security' | 'performance';
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorMonitoringService {
  private isInitialized = false;
  private errorQueue: ErrorInfo[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private maxQueueSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private severityThreshold: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  private storageKey = 'error_monitoring_queue';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize error monitoring
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Load persisted data from localStorage
    this.loadPersistedData();

    // Set up global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Set up periodic flushing
    this.startFlushTimer();

    // Set up beforeunload to persist data
    window.addEventListener('beforeunload', this.persistData.bind(this));

    this.isInitialized = true;
  }

  /**
   * Handle global JavaScript errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    const errorInfo: ErrorInfo = {
      message: event.message,
      stack: event.error?.stack,
      component: this.extractComponentFromStack(event.error?.stack),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity: this.determineSeverity(event.error),
      category: 'javascript',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    };

    this.captureError(errorInfo);
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const errorInfo: ErrorInfo = {
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      component: this.extractComponentFromStack(event.reason?.stack),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity: 'high',
      category: 'javascript',
      metadata: {
        reason: event.reason
      }
    };

    this.captureError(errorInfo);
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.measurePageLoadPerformance();
      }, 1000);
    });

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.capturePerformanceMetric({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(),
              metadata: {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }

  /**
   * Measure page load performance
   */
  private measurePageLoadPerformance(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics = [
      { name: 'dom_content_loaded', value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart },
      { name: 'load_complete', value: navigation.loadEventEnd - navigation.loadEventStart },
      { name: 'first_paint', value: this.getFirstPaint() },
      { name: 'first_contentful_paint', value: this.getFirstContentfulPaint() },
      { name: 'largest_contentful_paint', value: this.getLargestContentfulPaint() }
    ];

    metrics.forEach(metric => {
      if (metric.value > 0) {
        this.capturePerformanceMetric({
          ...metric,
          unit: 'ms',
          timestamp: new Date()
        });
      }
    });
  }

  /**
   * Get First Paint metric
   */
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Get First Contentful Paint metric
   */
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  /**
   * Get Largest Contentful Paint metric
   */
  private getLargestContentfulPaint(): number {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.capturePerformanceMetric({
              name: 'largest_contentful_paint',
              value: lastEntry.startTime,
              unit: 'ms',
              timestamp: new Date()
            });
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP monitoring not supported:', error);
      }
    }
    return 0;
  }

  /**
   * Extract component name from stack trace
   */
  private extractComponentFromStack(stack?: string): string | undefined {
    if (!stack) return undefined;

    const lines = stack.split('\n');
    for (const line of lines) {
      const match = line.match(/at\s+(\w+)/);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (!error) return 'medium';

    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('security') || message.includes('auth')) {
      return 'critical';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'low';
    }
    
    if (message.includes('database') || message.includes('supabase')) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Check if error meets severity threshold
   */
  private meetsSeverityThreshold(severity: 'low' | 'medium' | 'high' | 'critical'): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const thresholdLevel = severityLevels[this.severityThreshold];
    const errorLevel = severityLevels[severity];
    return errorLevel >= thresholdLevel;
  }

  /**
   * Capture an error
   */
  captureError(errorInfo: ErrorInfo): void {
    // Check severity threshold
    if (!this.meetsSeverityThreshold(errorInfo.severity)) {
      return;
    }

    // Sanitize metadata
    errorInfo.metadata = this.sanitizeMetadata(errorInfo.metadata);

    // Add user ID
    errorInfo.userId = this.userId;

    // Add to queue
    this.errorQueue.push(errorInfo);

    // Persist data immediately
    this.persistData();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorInfo);
    }

    // Flush if queue is full
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Capture a performance metric
   */
  capturePerformanceMetric(metric: PerformanceMetric): void {
    this.performanceQueue.push(metric);

    // Flush if queue is full
    if (this.performanceQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Capture a custom error
   */
  captureCustomError(
    message: string,
    category: ErrorInfo['category'] = 'javascript',
    severity: ErrorInfo['severity'] = 'medium',
    metadata?: Record<string, any>
  ): void {
    const errorInfo: ErrorInfo = {
      message,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity,
      category,
      metadata
    };

    this.captureError(errorInfo);
  }

  /**
   * Capture a user action
   */
  captureUserAction(action: string, metadata?: Record<string, any>): void {
    this.capturePerformanceMetric({
      name: 'user_action',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      metadata: {
        action,
        ...metadata
      }
    });
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
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
   * Flush queued data
   */
  async flush(): Promise<void> {
    if (this.errorQueue.length === 0 && this.performanceQueue.length === 0) {
      return;
    }

    try {
      // Send to analytics service
      await this.sendToAnalytics({
        errors: [...this.errorQueue],
        performance: [...this.performanceQueue]
      });

      // Clear queues
      this.errorQueue = [];
      this.performanceQueue = [];
    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
    }
  }

  /**
   * Send data to analytics service
   */
  private async sendToAnalytics(data: { errors: ErrorInfo[]; performance: PerformanceMetric[] }): Promise<void> {
    try {
      // Import analytics API dynamically to avoid circular dependencies
      const { analyticsAPI } = await import('../api/analytics');
      
      await analyticsAPI.sendBatch({
        errors: data.errors,
        performance: data.performance,
        user_id: this.userId || undefined
      });
    } catch (error) {
      console.error('Failed to send analytics data:', error);
      // Don't throw error to prevent infinite loops
    }
  }

  /**
   * Set user ID
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Set severity threshold
   */
  setSeverityThreshold(threshold: 'low' | 'medium' | 'high' | 'critical'): void {
    this.severityThreshold = threshold;
  }

  /**
   * Sanitize metadata to remove PII
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['email', 'password', 'token', 'ssn', 'credit_card', 'phone', 'address'];

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Load persisted data from localStorage
   */
  private loadPersistedData(): void {
    try {
      const persisted = localStorage.getItem(this.storageKey);
      if (persisted) {
        const data = JSON.parse(persisted);
        this.errorQueue = data.errors || [];
        this.performanceQueue = data.performance || [];
      }
    } catch (error) {
      console.warn('Failed to load persisted error monitoring data:', error);
    }
  }

  /**
   * Persist data to localStorage
   */
  private persistData(): void {
    try {
      const data = {
        errors: this.errorQueue,
        performance: this.performanceQueue,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist error monitoring data:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush();
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// Export convenience functions
export const captureError = (message: string, category?: ErrorInfo['category'], severity?: ErrorInfo['severity'], metadata?: Record<string, any>) => {
  errorMonitoring.captureCustomError(message, category, severity, metadata);
};

export const captureUserAction = (action: string, metadata?: Record<string, any>) => {
  errorMonitoring.captureUserAction(action, metadata);
};

export const capturePerformanceMetric = (name: string, value: number, unit: PerformanceMetric['unit'], metadata?: Record<string, any>) => {
  errorMonitoring.capturePerformanceMetric({
    name,
    value,
    unit,
    timestamp: new Date(),
    metadata
  });
};

export default errorMonitoring;
