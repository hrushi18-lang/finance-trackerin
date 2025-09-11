// Bundle optimization utilities
export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private bundleSize: number = 0;
  private loadedChunks: Set<string> = new Set();
  private performanceMetrics: Map<string, number> = new Map();

  static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer();
    }
    return BundleOptimizer.instance;
  }

  // Track bundle size
  trackBundleSize(chunkName: string, size: number) {
    this.bundleSize += size;
    this.performanceMetrics.set(chunkName, size);
    console.log(`Bundle chunk "${chunkName}" loaded: ${size} bytes`);
  }

  // Track loaded chunks
  trackChunkLoad(chunkName: string) {
    this.loadedChunks.add(chunkName);
    console.log(`Chunk "${chunkName}" loaded`);
  }

  // Get bundle statistics
  getBundleStats() {
    return {
      totalSize: this.bundleSize,
      loadedChunks: Array.from(this.loadedChunks),
      chunkSizes: Object.fromEntries(this.performanceMetrics),
      averageChunkSize: this.bundleSize / this.loadedChunks.size || 0
    };
  }

  // Analyze bundle performance
  analyzePerformance() {
    const stats = this.getBundleStats();
    const recommendations: string[] = [];

    // Check for large chunks
    Object.entries(stats.chunkSizes).forEach(([chunk, size]) => {
      if (size > 250000) { // 250KB
        recommendations.push(`Consider splitting large chunk "${chunk}" (${(size / 1024).toFixed(2)}KB)`);
      }
    });

    // Check total bundle size
    if (stats.totalSize > 1000000) { // 1MB
      recommendations.push(`Total bundle size is large (${(stats.totalSize / 1024 / 1024).toFixed(2)}MB). Consider code splitting.`);
    }

    // Check chunk count
    if (stats.loadedChunks.length > 20) {
      recommendations.push(`Many chunks loaded (${stats.loadedChunks.length}). Consider consolidating.`);
    }

    return {
      stats,
      recommendations,
      score: this.calculatePerformanceScore(stats)
    };
  }

  // Calculate performance score (0-100)
  private calculatePerformanceScore(stats: any): number {
    let score = 100;

    // Penalize large chunks
    Object.values(stats.chunkSizes).forEach((size: any) => {
      if (size > 250000) score -= 10;
      if (size > 500000) score -= 20;
    });

    // Penalize large total size
    if (stats.totalSize > 1000000) score -= 20;
    if (stats.totalSize > 2000000) score -= 30;

    // Penalize too many chunks
    if (stats.loadedChunks.length > 20) score -= 10;
    if (stats.loadedChunks.length > 50) score -= 20;

    return Math.max(0, score);
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2' },
      { href: '/icons/sprite.svg', as: 'image' },
      { href: '/css/critical.css', as: 'style' }
    ];

    criticalResources.forEach(resource => {
      this.preloadResource(resource.href, resource.as, resource.type);
    });
  }

  // Preload resource
  private preloadResource(href: string, as: string, type?: string) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  }

  // Prefetch non-critical resources
  prefetchNonCriticalResources() {
    const nonCriticalResources = [
      '/images/backgrounds/',
      '/icons/',
      '/fonts/'
    ];

    // Prefetch after page load
    setTimeout(() => {
      nonCriticalResources.forEach(resource => {
        this.prefetchResource(resource);
      });
    }, 2000);
  }

  // Prefetch resource
  private prefetchResource(href: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  // Optimize images
  optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // Enable service worker for caching
  enableServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  // Enable compression
  enableCompression() {
    // This would typically be handled by the server
    // Here we simulate some client-side optimizations
    console.log('Compression enabled for static assets');
  }

  // Initialize all optimizations
  initialize() {
    this.preloadCriticalResources();
    this.prefetchNonCriticalResources();
    this.optimizeImages();
    this.enableServiceWorker();
    this.enableCompression();
    
    console.log('Bundle optimization initialized');
  }
}

// Export singleton instance
export const bundleOptimizer = BundleOptimizer.getInstance();

// Performance monitoring utilities
export const performanceUtils = {
  // Measure function execution time
  measureExecutionTime<T>(fn: () => T, label: string): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label} executed in ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Measure async function execution time
  async measureAsyncExecutionTime<T>(fn: () => Promise<T>, label: string): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${label} executed in ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Create performance mark
  mark(name: string) {
    performance.mark(name);
  },

  // Measure between marks
  measure(name: string, startMark: string, endMark: string) {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    return measure.duration;
  },

  // Get performance entries
  getPerformanceEntries() {
    return performance.getEntriesByType('measure');
  },

  // Clear performance marks and measures
  clearPerformanceData() {
    performance.clearMarks();
    performance.clearMeasures();
  }
};
