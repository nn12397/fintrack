import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, startAdornment, endAdornment, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {startAdornment && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {startAdornment}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-gray-300 px-4 py-3.5 text-gray-900 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
              "placeholder:text-gray-400",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              startAdornment && "pl-10",
              endAdornment && "pr-10",
              error && "border-red-300 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {endAdornment}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;