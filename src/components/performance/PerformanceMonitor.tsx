import React, { useState, useEffect } from 'react';
import { Activity, Zap, HardDrive, Clock, Download, AlertTriangle } from 'lucide-react';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

interface PerformanceMonitorProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  show = false,
  position = 'top-right',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  
  const { metrics, monitorMemoryUsage } = usePerformanceOptimization({
    enableVirtualization: true,
    enableDebouncing: true,
    enableMemoization: true,
    enableLazyLoading: true,
    enableCodeSplitting: true
  });

  // Monitor performance and generate alerts
  useEffect(() => {
    const checkPerformance = () => {
      const newAlerts: string[] = [];
      
      // Check render time
      if (metrics.renderTime > 100) {
        newAlerts.push(`Slow render: ${metrics.renderTime.toFixed(2)}ms`);
      }
      
      // Check memory usage
      if (metrics.memoryUsage > 100) {
        newAlerts.push(`High memory usage: ${metrics.memoryUsage.toFixed(2)}MB`);
      }
      
      // Check load time
      if (metrics.loadTime > 3000) {
        newAlerts.push(`Slow load time: ${metrics.loadTime.toFixed(2)}ms`);
      }
      
      setAlerts(newAlerts);
    };

    checkPerformance();
    const interval = setInterval(checkPerformance, 5000);
    
    return () => clearInterval(interval);
  }, [metrics]);

  // Monitor memory usage
  useEffect(() => {
    monitorMemoryUsage();
    const interval = setInterval(monitorMemoryUsage, 10000);
    
    return () => clearInterval(interval);
  }, [monitorMemoryUsage]);

  if (!show) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <Zap size={16} className="text-green-500" />;
    if (value <= thresholds.warning) return <Clock size={16} className="text-yellow-500" />;
    return <AlertTriangle size={16} className="text-red-500" />;
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <Activity size={20} className="text-blue-500" />
            <span className="text-sm font-medium text-white">Performance</span>
            {alerts.length > 0 && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="text-xs text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-700">
            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPerformanceIcon(metrics.renderTime, { good: 50, warning: 100 })}
                  <span className="text-xs text-gray-300">Render Time</span>
                </div>
                <span className={`text-xs font-mono ${
                  getPerformanceColor(metrics.renderTime, { good: 50, warning: 100 })
                }`}>
                  {metrics.renderTime.toFixed(2)}ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive size={16} className="text-blue-500" />
                  <span className="text-xs text-gray-300">Memory</span>
                </div>
                <span className={`text-xs font-mono ${
                  getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })
                }`}>
                  {metrics.memoryUsage.toFixed(2)}MB
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download size={16} className="text-green-500" />
                  <span className="text-xs text-gray-300">Load Time</span>
                </div>
                <span className={`text-xs font-mono ${
                  getPerformanceColor(metrics.loadTime, { good: 1000, warning: 3000 })
                }`}>
                  {metrics.loadTime.toFixed(2)}ms
                </span>
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-red-400 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>Alerts</span>
                </div>
                {alerts.map((alert, index) => (
                  <div key={index} className="text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">
                    {alert}
                  </div>
                ))}
              </div>
            )}

            {/* Performance Tips */}
            <div className="text-xs text-gray-400 space-y-1">
              <div className="font-medium text-gray-300">Tips:</div>
              <div>• Use lazy loading for heavy components</div>
              <div>• Enable virtualization for long lists</div>
              <div>• Optimize images and assets</div>
              <div>• Use code splitting</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};