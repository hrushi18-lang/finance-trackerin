import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helpText, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-body font-medium text-forest-200">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              "block w-full rounded-xl border-forest-600/30 bg-forest-900/20 backdrop-blur-sm text-white shadow-sm focus:border-forest-500 focus:ring-forest-500 transition-colors duration-200 placeholder-forest-400 py-3 font-body",
              icon && 'pl-10',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-error-400 font-body">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-xs text-forest-300 font-body">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';