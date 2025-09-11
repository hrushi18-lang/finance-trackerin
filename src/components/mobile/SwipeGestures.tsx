import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface SwipeGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  leftAction?: {
    icon: React.ComponentType<any>;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ComponentType<any>;
    label: string;
    color: string;
  };
  threshold?: number;
  className?: string;
}

export const SwipeGestures: React.FC<SwipeGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftAction,
  rightAction,
  threshold = 50,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [showLeftAction, setShowLeftAction] = useState(false);
  const [showRightAction, setShowRightAction] = useState(false);
  const [actionTriggered, setActionTriggered] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setDragCurrent({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
    setActionTriggered(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    
    setDragCurrent({ x: touch.clientX, y: touch.clientY });
    
    // Show action indicators
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold && rightAction) {
        setShowRightAction(true);
        setShowLeftAction(false);
      } else if (deltaX < -threshold && leftAction) {
        setShowLeftAction(true);
        setShowRightAction(false);
      } else {
        setShowLeftAction(false);
        setShowRightAction(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = dragCurrent.y - dragStart.y;
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
        setActionTriggered(true);
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
        setActionTriggered(true);
      }
    } else {
      // Vertical swipe
      if (deltaY > threshold && onSwipeDown) {
        onSwipeDown();
        setActionTriggered(true);
      } else if (deltaY < -threshold && onSwipeUp) {
        onSwipeUp();
        setActionTriggered(true);
      }
    }
    
    // Reset state
    setIsDragging(false);
    setShowLeftAction(false);
    setShowRightAction(false);
    setDragCurrent({ x: 0, y: 0 });
    
    // Reset action triggered after animation
    if (actionTriggered) {
      setTimeout(() => setActionTriggered(false), 300);
    }
  };

  const getTransform = () => {
    if (!isDragging) return 'translateX(0)';
    
    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = dragCurrent.y - dragStart.y;
    
    // Only apply horizontal transform for horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return `translateX(${deltaX * 0.3}px)`;
    }
    
    return 'translateX(0)';
  };

  const getActionStyle = (side: 'left' | 'right') => {
    const deltaX = dragCurrent.x - dragStart.x;
    const opacity = isDragging ? Math.min(Math.abs(deltaX) / threshold, 1) : 0;
    
    return {
      opacity,
      transform: `translateX(${side === 'left' ? -50 : 50}px) scale(${opacity})`,
    };
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Action Indicator */}
      {leftAction && (
        <div
          className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center z-10 transition-all duration-200"
          style={getActionStyle('left')}
        >
          <div className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${leftAction.color}`}>
            <leftAction.icon size={24} />
            <span className="text-xs font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right Action Indicator */}
      {rightAction && (
        <div
          className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center z-10 transition-all duration-200"
          style={getActionStyle('right')}
        >
          <div className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${rightAction.color}`}>
            <rightAction.icon size={24} />
            <span className="text-xs font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={containerRef}
        className="relative z-0 transition-transform duration-200"
        style={{
          transform: getTransform(),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Action Feedback */}
      {actionTriggered && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse">
            <Check size={20} />
            <span className="font-medium">Action completed!</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Swipeable Card Component
interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onDelete,
  onEdit,
  onArchive,
  className = ''
}) => {
  return (
    <SwipeGestures
      onSwipeLeft={onDelete}
      onSwipeRight={onEdit}
      leftAction={onDelete ? {
        icon: X,
        label: 'Delete',
        color: 'bg-red-500 text-white'
      } : undefined}
      rightAction={onEdit ? {
        icon: Check,
        label: 'Edit',
        color: 'bg-blue-500 text-white'
      } : undefined}
      className={className}
    >
      {children}
    </SwipeGestures>
  );
};
