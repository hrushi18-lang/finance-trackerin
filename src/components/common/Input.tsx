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
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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
              "block w-full rounded-xl shadow-sm transition-colors duration-200 py-3",
              icon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
              '--tw-placeholder-opacity': '1',
              '--tw-placeholder-color': 'var(--text-tertiary)'
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        )}
        {helpText && !error && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
