import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
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
    xl: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with glassmorphism effect */}
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal Container with new styling system */}
      <div className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden modal-container animate-scale-in ${className}`}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <h2 className="modal-title">{title}</h2>
            <button
              onClick={onClose}
              className="modal-close-button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;