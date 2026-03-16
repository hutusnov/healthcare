export const Card = ({ children, className = '', hover = true, ...props }) => {
    return (
        <div
            className={`
        bg-dark-200 rounded-xl border border-dark-100 p-6 
        transition-all duration-300
        ${hover ? 'hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-600/10' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-xl font-semibold text-white ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-gray-400 mt-1 ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`mt-4 pt-4 border-t border-dark-100 ${className}`}>{children}</div>
);
