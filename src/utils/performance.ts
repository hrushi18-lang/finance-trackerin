/**
 * Performance optimization utilities for production-ready finance app
 * Implements comprehensive performance measures for mobile and desktop
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';

// Debounce function for search and input handling
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return { start: Math.max(0, start - overscan), end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      ...item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Memoized data processing
export const useMemoizedData = <T>(
  data: T[],
  processor: (data: T[]) => T[],
  deps: any[] = []
) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];
    return processor(data);
  }, [data, ...deps]);
};

// Pagination hook
export const usePagination = <T>(
  items: T[],
  pageSize: number = 20
) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(items.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages - 1,
    hasPrev: currentPage > 0
  };
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(img);
    
    return () => observer.disconnect();
  }, [src]);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
  }, []);
  
  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
  }, []);
  
  return {
    imageSrc,
    isLoaded,
    isError,
    imgRef,
    handleLoad,
    handleError
  };
};

// Performance monitoring
export const performanceMonitor = {
  start: (label: string) => {
    performance.mark(`${label}-start`);
  },
  
  end: (label: string) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
    
    // Clean up marks
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
  },
  
  measure: (label: string, fn: () => void) => {
    this.start(label);
    fn();
    this.end(label);
  }
};

// Bundle size optimization
export const lazyLoadComponent = (importFn: () => Promise<any>) => {
  return React.lazy(importFn);
};

// Memory management
export const useMemoryOptimization = () => {
  const cleanupRefs = useRef<(() => void)[]>([]);
  
  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRefs.current.push(cleanup);
  }, []);
  
  useEffect(() => {
    return () => {
      cleanupRefs.current.forEach(cleanup => cleanup());
      cleanupRefs.current = [];
    };
  }, []);
  
  return { addCleanup };
};

// Data caching with TTL
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

export const dataCache = new DataCache();

// Optimized data processing
export const processFinancialData = (data: any[], filters: any = {}) => {
  return data
    .filter(item => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.dateRange) {
        const itemDate = new Date(item.date);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        if (itemDate < start || itemDate > end) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (filters.sortBy === 'amount') {
        return b.amount - a.amount;
      }
      return 0;
    });
};

// Mobile-specific optimizations
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const useMobileOptimizations = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(isMobile());
  
  useEffect(() => {
    const handleResize = throttle(() => {
      setIsMobileDevice(isMobile());
    }, 250);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    isMobile: isMobileDevice,
    pageSize: isMobileDevice ? 10 : 20,
    debounceDelay: isMobileDevice ? 300 : 150,
    animationDuration: isMobileDevice ? 200 : 300
  };
};

// Network optimization
export const useNetworkOptimization = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    shouldReduceAnimations: !isOnline || connectionType === 'slow-2g' || connectionType === '2g'
  };
};

// Image optimization
export const optimizeImage = (src: string, width?: number, height?: number): string => {
  if (!src) return '';
  
  // For external images, you might want to use a service like Cloudinary
  // For now, we'll just return the original src
  return src;
};

// Critical resource preloading
export const preloadCriticalResources = () => {
  // Self-hosted fonts are already loaded via @font-face in CSS
  // No need to preload external fonts
  console.log('Self-hosted fonts are loaded via CSS @font-face declarations');
};

// Performance metrics collection
export const collectPerformanceMetrics = () => {
  const metrics = {
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    firstPaint: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0
  };
  
  // Get paint metrics if available
  if ('getEntriesByType' in performance) {
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });
    
    // Get LCP if available
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
    }
  }
  
  return metrics;
};

// Export all utilities
export default {
  debounce,
  throttle,
  useVirtualScrolling,
  useMemoizedData,
  usePagination,
  useLazyImage,
  performanceMonitor,
  lazyLoadComponent,
  useMemoryOptimization,
  dataCache,
  processFinancialData,
  isMobile,
  useMobileOptimizations,
  useNetworkOptimization,
  optimizeImage,
  preloadCriticalResources,
  collectPerformanceMetrics
};
