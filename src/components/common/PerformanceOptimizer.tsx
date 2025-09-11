import React, { useEffect, useRef } from 'react';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optimize for mobile performance
    const optimizeForMobile = () => {
      // Reduce animations on low-end devices
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
      }

      // Optimize touch events
      if (containerRef.current) {
        containerRef.current.style.touchAction = 'manipulation';
      }
    };

    optimizeForMobile();

    // Preload critical resources
    const preloadResources = () => {
      // Self-hosted fonts are already loaded via @font-face in CSS
      // No need to preload external fonts

      // Preload critical images
      const imagePreloads = [
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDA3Q0Y2Ii8+Cjwvc3ZnPgo='
      ];

      imagePreloads.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };

    preloadResources();

    // Optimize scroll performance
    const optimizeScroll = () => {
      if (containerRef.current) {
        containerRef.current.style.willChange = 'transform';
        containerRef.current.style.transform = 'translateZ(0)';
      }
    };

    optimizeScroll();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.style.willChange = 'auto';
        containerRef.current.style.transform = 'none';
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="performance-optimized">
      {children}
    </div>
  );
};
