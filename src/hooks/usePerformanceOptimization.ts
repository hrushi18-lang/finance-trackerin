import { useEffect, useCallback, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

interface PerformanceOptimizationOptions {
  enableVirtualization?: boolean;
  enableDebouncing?: boolean;
  enableMemoization?: boolean;
  enableLazyLoading?: boolean;
  enableImageOptimization?: boolean;
  enableCodeSplitting?: boolean;
}

export const usePerformanceOptimization = (options: PerformanceOptimizationOptions = {}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0
  });

  const renderStartTime = useRef<number>(0);
  const performanceObserver = useRef<PerformanceObserver | null>(null);

  // Measure render performance
  const measureRender = useCallback((componentName: string) => {
    const startTime = performance.now();
    renderStartTime.current = startTime;
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.max(prev.renderTime, renderTime)
      }));
      
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    };
  }, []);

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }, []);

  // Throttle function for performance
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    let lastCall = 0;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    }) as T;
  }, []);

  // Virtual scrolling hook
  const useVirtualScrolling = useCallback((
    items: any[],
    itemHeight: number,
    containerHeight: number,
    overscan: number = 5
  ) => {
    const [scrollTop, setScrollTop] = useState(0);
    
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length
    );
    
    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(items.length, visibleEnd + overscan);
    
    const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
    
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;
    
    return {
      visibleItems,
      totalHeight,
      offsetY,
      setScrollTop
    };
  }, []);

  // Image lazy loading
  const useImageLazyLoading = useCallback(() => {
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [imageRefs, setImageRefs] = useState<Map<string, HTMLImageElement>>(new Map());
    
    const loadImage = useCallback((src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (loadedImages.has(src)) {
          resolve();
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, src]));
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    }, [loadedImages]);
    
    const registerImageRef = useCallback((src: string, ref: HTMLImageElement | null) => {
      if (ref) {
        setImageRefs(prev => new Map([...prev, [src, ref]]));
      }
    }, []);
    
    return {
      loadImage,
      registerImageRef,
      isImageLoaded: (src: string) => loadedImages.has(src)
    };
  }, []);

  // Bundle size optimization
  const optimizeBundle = useCallback(() => {
    // This would typically be done at build time
    // Here we simulate some runtime optimizations
    const optimizations = {
      treeShaking: true,
      minification: true,
      compression: true,
      codeSplitting: options.enableCodeSplitting ?? true,
      lazyLoading: options.enableLazyLoading ?? true
    };
    
    console.log('Bundle optimizations:', optimizations);
    return optimizations;
  }, [options]);

  // Memory usage monitoring
  const monitorMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
      }));
    }
  }, []);

  // Performance monitoring setup
  useEffect(() => {
    // Monitor performance metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            setMetrics(prev => ({
              ...prev,
              loadTime: entry.duration
            }));
          }
        });
      });
      
      performanceObserver.current.observe({ entryTypes: ['navigation', 'measure'] });
    }
    
    // Monitor memory usage
    const memoryInterval = setInterval(monitorMemoryUsage, 5000);
    
    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
      clearInterval(memoryInterval);
    };
  }, [monitorMemoryUsage]);

  // Preload critical resources
  const preloadResource = useCallback((href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }, []);

  // Prefetch resources
  const prefetchResource = useCallback((href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }, []);

  return {
    metrics,
    measureRender,
    debounce,
    throttle,
    useVirtualScrolling,
    useImageLazyLoading,
    optimizeBundle,
    preloadResource,
    prefetchResource,
    monitorMemoryUsage
  };
};
