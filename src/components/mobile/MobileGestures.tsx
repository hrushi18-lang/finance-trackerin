import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Pinch, 
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface MobileGesturesProps {
  children: React.ReactNode;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onPan?: (x: number, y: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  enablePinch?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  className?: string;
}

export const MobileGestures: React.FC<MobileGesturesProps> = ({
  children,
  onPinch,
  onRotate,
  onPan,
  onDoubleTap,
  onLongPress,
  enablePinch = true,
  enableRotate = true,
  enablePan = true,
  className = ''
}) => {
  const [gestureState, setGestureState] = useState({
    scale: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
    isGesturing: false
  });
  
  const [lastTap, setLastTap] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const initialTouches = useRef<Touch[]>([]);
  const initialTransform = useRef({
    scale: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = Array.from(e.touches);
    initialTouches.current = touches;
    
    if (touches.length === 1) {
      // Single touch - handle tap, double tap, long press
      const now = Date.now();
      const timeDiff = now - lastTap;
      
      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap
        onDoubleTap?.();
        setLastTap(0);
      } else {
        setLastTap(now);
        
        // Start long press timer
        if (onLongPress) {
          const timer = setTimeout(() => {
            setIsLongPressing(true);
            onLongPress();
          }, 500);
          setLongPressTimer(timer);
        }
      }
    } else if (touches.length === 2) {
      // Multi-touch - store initial transform
      initialTransform.current = { ...gestureState };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    const touches = Array.from(e.touches);
    
    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (touches.length === 1 && enablePan) {
      // Single touch - pan
      const touch = touches[0];
      const initialTouch = initialTouches.current[0];
      
      if (initialTouch) {
        const deltaX = touch.clientX - initialTouch.clientX;
        const deltaY = touch.clientY - initialTouch.clientY;
        
        const newState = {
          ...gestureState,
          translateX: initialTransform.current.translateX + deltaX,
          translateY: initialTransform.current.translateY + deltaY,
          isGesturing: true
        };
        
        setGestureState(newState);
        onPan?.(newState.translateX, newState.translateY);
      }
    } else if (touches.length === 2 && (enablePinch || enableRotate)) {
      // Two touches - pinch and/or rotate
      const touch1 = touches[0];
      const touch2 = touches[1];
      const initialTouch1 = initialTouches.current[0];
      const initialTouch2 = initialTouches.current[1];
      
      if (initialTouch1 && initialTouch2) {
        // Calculate current distance and angle
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const initialDistance = Math.sqrt(
          Math.pow(initialTouch2.clientX - initialTouch1.clientX, 2) + 
          Math.pow(initialTouch2.clientY - initialTouch1.clientY, 2)
        );
        
        const currentAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );
        const initialAngle = Math.atan2(
          initialTouch2.clientY - initialTouch1.clientY,
          initialTouch2.clientX - initialTouch1.clientX
        );
        
        let newState = { ...gestureState };
        
        // Handle pinch (scale)
        if (enablePinch && initialDistance > 0) {
          const scale = (currentDistance / initialDistance) * initialTransform.current.scale;
          newState.scale = Math.max(0.5, Math.min(3, scale));
          onPinch?.(newState.scale);
        }
        
        // Handle rotation
        if (enableRotate) {
          const rotation = (currentAngle - initialAngle) * (180 / Math.PI) + initialTransform.current.rotation;
          newState.rotation = rotation;
          onRotate?.(newState.rotation);
        }
        
        newState.isGesturing = true;
        setGestureState(newState);
      }
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setIsLongPressing(false);
    
    // Reset gesture state after a delay
    setTimeout(() => {
      setGestureState(prev => ({
        ...prev,
        isGesturing: false
      }));
    }, 100);
  };

  const resetTransform = () => {
    setGestureState({
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0,
      isGesturing: false
    });
  };

  const getTransform = () => {
    const { scale, rotation, translateX, translateY } = gestureState;
    return `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Gesture Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={() => setGestureState(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.2) }))}
          className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setGestureState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.2) }))}
          className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => setGestureState(prev => ({ ...prev, rotation: prev.rotation + 90 }))}
          className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
          title="Rotate"
        >
          <RotateCw size={16} />
        </button>
        <button
          onClick={resetTransform}
          className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
          title="Reset"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="transition-transform duration-200 ease-out"
        style={{
          transform: getTransform(),
          transformOrigin: 'center center'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Long Press Indicator */}
      {isLongPressing && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse">
            <Pinch size={20} />
            <span className="font-medium">Long press detected!</span>
          </div>
        </div>
      )}

      {/* Gesture Info */}
      {gestureState.isGesturing && (
        <div className="absolute bottom-4 left-4 z-10 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm">
          <div>Scale: {gestureState.scale.toFixed(2)}</div>
          <div>Rotation: {gestureState.rotation.toFixed(0)}°</div>
          <div>Position: ({gestureState.translateX.toFixed(0)}, {gestureState.translateY.toFixed(0)})</div>
        </div>
      )}
    </div>
  );
};
