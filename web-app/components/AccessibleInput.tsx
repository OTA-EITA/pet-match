'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  showLabel?: boolean;
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      error,
      helperText,
      showLabel = true,
      required,
      className = '',
      ...props
    },
    ref
  ) => {
    const id = useId();
    const errorId = useId();
    const helperId = useId();

    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className={`block text-sm font-medium text-neutral-700 mb-2 ${
            !showLabel ? 'sr-only' : ''
          }`}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="必須">
              *
            </span>
          )}
        </label>
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-300 focus:border-primary-500'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          aria-required={required}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-neutral-600">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
