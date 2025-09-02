import React from 'react';
import { cn } from '../../utils/cn';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  center?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md',
  center = true
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 sm:px-6 py-4',
    lg: 'px-6 sm:px-8 py-6'
  };

  const containerClasses = cn(
    'w-full',
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    center && 'mx-auto',
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridColsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  const responsiveClasses = cn(
    'grid',
    gridColsClasses[cols.default],
    cols.sm && `sm:${gridColsClasses[cols.sm]}`,
    cols.md && `md:${gridColsClasses[cols.md]}`,
    cols.lg && `lg:${gridColsClasses[cols.lg]}`,
    cols.xl && `xl:${gridColsClasses[cols.xl]}`,
    gapClasses[gap],
    className
  );

  return (
    <div className={responsiveClasses}>
      {children}
    </div>
  );
};

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  clickable = false
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const cardClasses = cn(
    'bg-forest-800/30 backdrop-blur-md rounded-xl border border-forest-600/20',
    paddingClasses[padding],
    hover && 'hover:border-forest-500/40 hover:bg-forest-700/30 transition-all duration-200',
    clickable && 'cursor-pointer',
    className
  );

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

// Responsive Modal Component
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-lg sm:max-w-2xl',
    xl: 'max-w-2xl sm:max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn(
        'w-full bg-forest-900 border border-forest-600/30 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden',
        sizeClasses[size],
        className
      )}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-forest-600/30">
            <h2 className="text-xl font-heading font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="text-gray-400 text-xl">×</span>
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Responsive Navigation Component
interface ResponsiveNavProps {
  children: React.ReactNode;
  className?: string;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  children,
  className = '',
  mobileMenuOpen = false,
  onMobileMenuToggle
}) => {
  return (
    <nav className={cn(
      'bg-forest-800/80 backdrop-blur-md border-b border-forest-600/30',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {children}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={onMobileMenuToggle}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="text-white text-xl">
                {mobileMenuOpen ? '×' : '☰'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-forest-600/30">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {children}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Responsive Form Layout
interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    default: number;
    sm?: number;
    md?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  className = '',
  columns = { default: 1, sm: 2 },
  gap = 'md'
}) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridColsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3'
  };

  const formClasses = cn(
    'grid',
    gridColsClasses[columns.default],
    columns.sm && `sm:${gridColsClasses[columns.sm]}`,
    columns.md && `md:${gridColsClasses[columns.md]}`,
    gapClasses[gap],
    className
  );

  return (
    <div className={formClasses}>
      {children}
    </div>
  );
};
