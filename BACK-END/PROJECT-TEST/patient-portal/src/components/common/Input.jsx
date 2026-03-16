import { forwardRef } from 'react';

export const Input = forwardRef(({
    label,
    error,
    helperText,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={`
          w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 
          text-white placeholder-gray-500 
          focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 
          transition-all duration-300
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-400">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
