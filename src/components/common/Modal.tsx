import React, { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useSwipeGestures } from '../../hooks/useMobileGestures';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showCloseButton?: boolean;
  allowSwipeToClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  allowSwipeToClose = true,
  size = 'md',
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Mobile gestures for swipe to close
  useSwipeGestures({
    onSwipeDown: allowSwipeToClose ? onClose : undefined,
    threshold: 100,
    velocityThreshold: 0.5
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-xl animate-slide-up sm:animate-scale-in ${className}`} 
        style={{ backgroundColor: 'var(--background)', paddingBottom: '80px' }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
