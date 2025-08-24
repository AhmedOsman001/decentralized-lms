import React from 'react';

export const GradientCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  blur = false,
  ...props 
}) => {
  const baseClasses = "rounded-lg shadow-lg backdrop-blur-sm border border-slate-700/50";
  
  const variants = {
    default: "bg-slate-800/90",
    glass: "bg-slate-800/80 backdrop-blur-md border-slate-600/50",
    solid: "bg-slate-900/95 text-white",
    primary: "bg-gradient-to-br from-blue-900/80 to-slate-800/80 border-blue-700/50",
    secondary: "bg-gradient-to-br from-slate-800/80 to-blue-900/80 border-slate-600/50",
    subtle: "bg-slate-800/60 backdrop-blur-sm border-slate-700/30",
    danger: "bg-gradient-to-br from-red-900/80 to-slate-800/80 border-red-700/50",
    info: "bg-gradient-to-br from-blue-900/80 to-slate-800/80 border-blue-600/50"
  };

  const blurClass = blur ? "backdrop-blur-md" : "";
  
  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${blurClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const GradientCardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 pb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const GradientCardContent = ({ children, className = '', ...props }) => (
  <div className={`px-6 pb-6 ${className}`} {...props}>
    {children}
  </div>
);

export const GradientCardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-semibold text-white mb-2 ${className}`} {...props}>
    {children}
  </h3>
);

export const GradientCardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-slate-300 text-sm ${className}`} {...props}>
    {children}
  </p>
);
