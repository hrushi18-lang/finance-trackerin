import React, { ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={clsx(
        'backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-lg',
        hover && 'hover:bg-white/10 hover:border-white/15 transition-all duration-300 hover:shadow-xl hover:scale-105',
        className
      )}
    >
      {children}
    </div>
  );
};
