import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
  className = ''
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pullIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsAtTop(scrollTop === 0);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || !isAtTop) return;
    
    setStartY(e.touches[0].clientY);
    setIsPulling(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isAtTop || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0) {
      e.preventDefault();
      const pullDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(pullDistance);
      setIsPulling(pullDistance > threshold);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isAtTop || isRefreshing) return;

    if (pullDistance > threshold) {
      setIsRefreshing(true);
      setIsPulling(false);
      
      try {
        await onRefresh();
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshing(false);
        }, 1000);
      } catch (error) {
        console.error('Refresh failed:', error);
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setIsPulling(false);
  };

  const getPullIndicatorStyle = () => {
    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 180;
    const scale = 0.5 + (progress * 0.5);
    
    return {
      transform: `translateY(${Math.min(pullDistance, threshold)}px) rotate(${rotation}deg) scale(${scale})`,
      opacity: progress,
    };
  };

  const getPullIndicatorContent = () => {
    if (isRefreshing) {
      return (
        <div className="flex items-center space-x-2 text-blue-500">
          <RefreshCw size={20} className="animate-spin" />
          <span className="text-sm font-medium">Refreshing...</span>
        </div>
      );
    }
    
    if (isSuccess) {
      return (
        <div className="flex items-center space-x-2 text-green-500">
          <Check size={20} />
          <span className="text-sm font-medium">Refreshed!</span>
        </div>
      );
    }
    
    if (isPulling) {
      return (
        <div className="flex items-center space-x-2 text-blue-500">
          <RefreshCw size={20} />
          <span className="text-sm font-medium">Release to refresh</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <RefreshCw size={20} />
        <span className="text-sm font-medium">Pull to refresh</span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Pull Indicator */}
      <div
        ref={pullIndicatorRef}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center py-4 transition-all duration-200"
        style={getPullIndicatorStyle()}
      >
        {getPullIndicatorContent()}
      </div>

      {/* Content Container */}
      <div
        ref={containerRef}
        className="h-full overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};
