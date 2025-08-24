import React from 'react';

export const GradientButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
    secondary: "bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white shadow-lg hover:shadow-xl focus:ring-slate-500",
    success: "bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white shadow-lg hover:shadow-xl focus:ring-green-500",
    outline: "border-2 border-slate-500/50 bg-slate-800/50 backdrop-blur-sm text-white hover:bg-slate-700/50 hover:border-slate-400/50 focus:ring-slate-400/50",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white focus:ring-slate-500/50",
    glass: "bg-slate-800/60 backdrop-blur-md border border-slate-600/30 text-white hover:bg-slate-700/60 focus:ring-slate-400/50"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
