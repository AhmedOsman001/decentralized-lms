import React from 'react';

export const GradientInput = ({ 
  className = '', 
  error = false,
  label,
  helperText,
  icon: Icon,
  ...props 
}) => {
  const baseClasses = "w-full px-4 py-3 rounded-lg border bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
  
  const normalClasses = "border-white/30 focus:border-white/50 focus:ring-white/50";
  const errorClasses = "border-red-400 focus:border-red-400 focus:ring-red-400";
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-300" />
          </div>
        )}
        <input
          className={`
            ${baseClasses} 
            ${error ? errorClasses : normalClasses}
            ${Icon ? 'pl-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {helperText && (
        <p className={`text-sm ${error ? 'text-red-300' : 'text-gray-300'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export const GradientSelect = ({ 
  className = '', 
  error = false,
  label,
  helperText,
  children,
  ...props 
}) => {
  const baseClasses = "w-full px-4 py-3 rounded-lg border bg-white/10 backdrop-blur-sm text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
  
  const normalClasses = "border-white/30 focus:border-white/50 focus:ring-white/50";
  const errorClasses = "border-red-400 focus:border-red-400 focus:ring-red-400";
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white">
          {label}
        </label>
      )}
      <select
        className={`
          ${baseClasses} 
          ${error ? errorClasses : normalClasses}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {helperText && (
        <p className={`text-sm ${error ? 'text-red-300' : 'text-gray-300'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};
