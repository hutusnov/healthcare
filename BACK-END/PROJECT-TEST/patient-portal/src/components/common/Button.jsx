export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-400';

    const variants = {
        primary: 'bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-500 hover:shadow-lg hover:shadow-primary-600/30',
        secondary: 'bg-secondary-600 hover:bg-secondary-500 text-white focus:ring-secondary-500 hover:shadow-lg hover:shadow-secondary-600/30',
        outline: 'border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white focus:ring-primary-500',
        ghost: 'text-gray-300 hover:text-white hover:bg-dark-100 focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 hover:shadow-lg hover:shadow-red-600/30',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
    };

    const disabledClasses = disabled || loading
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer';

    return (
        <button
            className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${disabledClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};
