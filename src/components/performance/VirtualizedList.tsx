import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { useVirtualScrolling, throttle } = usePerformanceOptimization({
    enableVirtualization: true,
    enableDebouncing: true
  });

  // Calculate visible items
  const { visibleItems, totalHeight, offsetY } = useVirtualScrolling(
    items,
    itemHeight,
    containerHeight,
    overscan
  );

  // Throttled scroll handler
  const handleScroll = useCallback(
    throttle((event: React.UIEvent<HTMLDivElement>) => {
      const target = event.target as HTMLDivElement;
      const newScrollTop = target.scrollTop;
      
      setScrollTop(newScrollTop);
      setIsScrolling(true);
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to stop scrolling state
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
      
      onScroll?.(newScrollTop);
    }, 16), // ~60fps
    [onScroll, throttle]
  );

  // Update virtual scrolling when scroll position changes
  useEffect(() => {
    // This will trigger re-calculation of visible items
  }, [scrollTop]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            transition: isScrolling ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.index}
              style={{
                height: itemHeight,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0
              }}
            >
              {renderItem(item, item.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimized transaction list using virtualization
interface OptimizedTransactionListProps {
  transactions: any[];
  onTransactionClick?: (transaction: any) => void;
  onTransactionEdit?: (transaction: any) => void;
  onTransactionDelete?: (transaction: any) => void;
  className?: string;
}

export function OptimizedTransactionList({
  transactions,
  onTransactionClick,
  onTransactionEdit,
  onTransactionDelete,
  className = ''
}: OptimizedTransactionListProps) {
  const ITEM_HEIGHT = 80; // Height of each transaction item
  const CONTAINER_HEIGHT = 400; // Height of the visible container

  const renderTransactionItem = useCallback((transaction: any, index: number) => (
    <div
      key={transaction.id}
      className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={() => onTransactionClick?.(transaction)}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {transaction.category?.charAt(0) || 'T'}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {transaction.description || 'No description'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {transaction.category || 'Uncategorized'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${
          transaction.type === 'income' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(transaction.date).toLocaleDateString()}
        </p>
      </div>
    </div>
  ), [onTransactionClick]);

  return (
    <VirtualizedList
      items={transactions}
      itemHeight={ITEM_HEIGHT}
      containerHeight={CONTAINER_HEIGHT}
      renderItem={renderTransactionItem}
      className={className}
    />
  );
}
