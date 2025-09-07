import { useEffect, useRef, useState } from 'react';

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

export const useMobileGestures = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const startY = useRef(0);
  const startX = useRef(0);
  const currentY = useRef(0);
  const currentX = useRef(0);
  const startTime = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startY.current = touch.clientY;
    startX.current = touch.clientX;
    currentY.current = touch.clientY;
    currentX.current = touch.clientX;
    startTime.current = Date.now();
    isDragging.current = false;
  };

  const handleTouchMove = (e: TouchEvent, options: SwipeOptions & PullToRefreshOptions) => {
    if (!e.touches[0]) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    const deltaX = touch.clientX - startX.current;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Start dragging if moved more than 10px
    if (distance > 10) {
      isDragging.current = true;
    }

    // Pull to refresh logic
    if (window.scrollY === 0 && deltaY > 0 && isDragging.current) {
      e.preventDefault();
      setIsPulling(true);
      const resistance = options.resistance || 0.5;
      const threshold = options.threshold || 80;
      const pullDistance = Math.min(deltaY * resistance, threshold * 1.5);
      setPullDistance(pullDistance);
    }

    // Swipe detection
    if (isDragging.current && Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > (options.threshold || 50)) {
        const velocity = Math.abs(deltaX) / (Date.now() - startTime.current);
        if (velocity > (options.velocityThreshold || 0.3)) {
          if (deltaX > 0 && options.onSwipeRight) {
            options.onSwipeRight();
          } else if (deltaX < 0 && options.onSwipeLeft) {
            options.onSwipeLeft();
          }
        }
      }
    }
  };

  const handleTouchEnd = async (e: TouchEvent, options: SwipeOptions & PullToRefreshOptions) => {
    if (!isDragging.current) return;

    const deltaY = currentY.current - startY.current;
    const deltaX = currentX.current - startX.current;
    const timeDelta = Date.now() - startTime.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / timeDelta;

    // Pull to refresh
    if (window.scrollY === 0 && deltaY > 0 && isPulling) {
      const threshold = options.threshold || 80;
      if (pullDistance > threshold) {
        setIsRefreshing(true);
        try {
          await options.onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setIsPulling(false);
      setPullDistance(0);
    }

    // Swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      const threshold = options.threshold || 50;
      if (Math.abs(deltaX) > threshold && velocity > (options.velocityThreshold || 0.3)) {
        if (deltaX > 0 && options.onSwipeRight) {
          options.onSwipeRight();
        } else if (deltaX < 0 && options.onSwipeLeft) {
          options.onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      const threshold = options.threshold || 50;
      if (Math.abs(deltaY) > threshold && velocity > (options.velocityThreshold || 0.3)) {
        if (deltaY > 0 && options.onSwipeDown) {
          options.onSwipeDown();
        } else if (deltaY < 0 && options.onSwipeUp) {
          options.onSwipeUp();
        }
      }
    }

    isDragging.current = false;
  };

  const addGestureListeners = (element: HTMLElement, options: SwipeOptions & PullToRefreshOptions) => {
    const touchStart = (e: TouchEvent) => handleTouchStart(e);
    const touchMove = (e: TouchEvent) => handleTouchMove(e, options);
    const touchEnd = (e: TouchEvent) => handleTouchEnd(e, options);

    element.addEventListener('touchstart', touchStart, { passive: false });
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('touchend', touchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('touchmove', touchMove);
      element.removeEventListener('touchend', touchEnd);
    };
  };

  return {
    addGestureListeners,
    isRefreshing,
    pullDistance,
    isPulling
  };
};

export const usePullToRefresh = (onRefresh: () => Promise<void>, options?: Partial<PullToRefreshOptions>) => {
  const { addGestureListeners, isRefreshing, pullDistance, isPulling } = useMobileGestures();
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const cleanup = addGestureListeners(elementRef.current, {
      onRefresh,
      ...options
    });

    return cleanup;
  }, [onRefresh, options]);

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    isPulling
  };
};

export const useSwipeGestures = (options: SwipeOptions) => {
  const { addGestureListeners } = useMobileGestures();
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const cleanup = addGestureListeners(elementRef.current, options);
    return cleanup;
  }, [options]);

  return { elementRef };
};
