import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Zap, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { performanceMonitor, collectPerformanceMetrics } from '../../utils/performance';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  memoryUsage?: number;
  connectionType?: string;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showUI?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  showUI = false,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    if (!enabled) return;

    const perfMetrics = collectPerformanceMetrics();
    const newMetrics: PerformanceMetrics = {
      ...perfMetrics,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || null,
      connectionType
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    // Log performance issues
    if (perfMetrics.loadTime > 3000) {
      console.warn('Slow page load detected:', perfMetrics.loadTime + 'ms');
    }

    if (perfMetrics.firstContentfulPaint > 1500) {
      console.warn('Slow first contentful paint:', perfMetrics.firstContentfulPaint + 'ms');
    }
  }, [enabled, connectionType, onMetricsUpdate]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor memory usage
  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const updateMemoryUsage = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryUsage(memory.usedJSHeapSize);
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Collect metrics on mount and when online status changes
  useEffect(() => {
    if (enabled) {
      // Initial collection after a short delay
      const timer = setTimeout(collectMetrics, 1000);
      return () => clearTimeout(timer);
    }
  }, [enabled, collectMetrics]);

  // Monitor for performance issues
  useEffect(() => {
    if (!enabled || !metrics) return;

    // Check for performance issues
    const issues: string[] = [];

    if (metrics.loadTime > 5000) {
      issues.push('Very slow page load');
    }

    if (metrics.firstContentfulPaint > 2000) {
      issues.push('Slow first contentful paint');
    }

    if (metrics.largestContentfulPaint > 4000) {
      issues.push('Slow largest contentful paint');
    }

    if (memoryUsage && memoryUsage > 50 * 1024 * 1024) { // 50MB
      issues.push('High memory usage');
    }

    if (connectionType === 'slow-2g' || connectionType === '2g') {
      issues.push('Slow network connection');
    }

    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues);
    }
  }, [metrics, memoryUsage, connectionType, enabled]);

  // Don't render UI if not enabled or not showing UI
  if (!enabled || !showUI) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    return ms.toFixed(0) + 'ms';
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff size={16} className="text-red-500" />;
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      return <Wifi size={16} className="text-yellow-500" />;
    }
    return <Wifi size={16} className="text-green-500" />;
  };

  const getPerformanceStatus = () => {
    if (!metrics) return 'unknown';
    
    const score = 
      (metrics.loadTime < 2000 ? 1 : 0) +
      (metrics.firstContentfulPaint < 1500 ? 1 : 0) +
      (metrics.largestContentfulPaint < 2500 ? 1 : 0) +
      (isOnline ? 1 : 0);
    
    if (score >= 3) return 'good';
    if (score >= 2) return 'fair';
    return 'poor';
  };

  const status = getPerformanceStatus();
  const statusColor = status === 'good' ? 'text-green-500' : status === 'fair' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity size={16} className={statusColor} />
            <span className="text-sm font-body font-semibold">Performance</span>
          </div>
          {getConnectionIcon()}
        </div>

        {metrics && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-body" style={{ color: 'var(--text-secondary)' }}>Load Time:</span>
              <span className="font-numbers">{formatTime(metrics.loadTime)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-body" style={{ color: 'var(--text-secondary)' }}>First Paint:</span>
              <span className="font-numbers">{formatTime(metrics.firstPaint)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-body" style={{ color: 'var(--text-secondary)' }}>FCP:</span>
              <span className="font-numbers">{formatTime(metrics.firstContentfulPaint)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-body" style={{ color: 'var(--text-secondary)' }}>LCP:</span>
              <span className="font-numbers">{formatTime(metrics.largestContentfulPaint)}</span>
            </div>
            
            {memoryUsage && (
              <div className="flex justify-between">
                <span className="font-body" style={{ color: 'var(--text-secondary)' }}>Memory:</span>
                <span className="font-numbers">{formatBytes(memoryUsage)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="font-body" style={{ color: 'var(--text-secondary)' }}>Connection:</span>
              <span className="font-numbers capitalize">{connectionType}</span>
            </div>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
              Status: <span className={`font-semibold ${statusColor}`}>{status}</span>
            </span>
            {status === 'poor' && (
              <AlertTriangle size={14} className="text-red-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for performance monitoring
export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const handleMetricsUpdate = useCallback((newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
  }, []);

  return {
    metrics,
    PerformanceMonitor: (props: Omit<PerformanceMonitorProps, 'onMetricsUpdate'>) => (
      <PerformanceMonitor {...props} enabled={enabled} onMetricsUpdate={handleMetricsUpdate} />
    )
  };
};

export default PerformanceMonitor;
