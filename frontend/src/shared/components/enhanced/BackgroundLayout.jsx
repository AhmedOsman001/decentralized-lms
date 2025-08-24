import React from 'react';

export const BackgroundLayout = ({ 
  children, 
  className = '',
  blur = true,
  overlay = true,
  variant = 'blockchain'
}) => {
  const backgroundImages = {
    blockchain: '/blockchain-bg.jpg',
    education: '/hero-education.jpg'
  };

  const overlayClass = overlay ? 'bg-slate-900/70' : '';
  const blurClass = blur ? 'backdrop-blur-sm' : '';

  return (
    <div className={`min-h-screen relative overflow-hidden bg-slate-900 ${className}`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImages[variant]})`
        }}
      />
      
      {/* Overlay */}
      {overlay && (
        <div className={`absolute inset-0 ${overlayClass}`} />
      )}
      
      {/* Blur Layer */}
      {blur && (
        <div className="absolute inset-0 backdrop-blur-3xl bg-slate-900/20" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export const Header = ({ children, className = '', ...props }) => (
  <header className={`flex items-center justify-between p-6 relative z-10 ${className}`} {...props}>
    {children}
  </header>
);

export const Logo = ({ className = '', size = 'default' }) => {
  const sizes = {
    sm: 'w-12 h-12',
    default: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/dcampus-logo.png" 
        alt="dCampus Logo" 
        className={`${sizes[size]} object-contain`} 
      />
      <div>
        <h2 className="text-lg font-bold text-white">dCampus</h2>
        <p className="text-xs text-gray-300">Decentralized Learning</p>
      </div>
    </div>
  );
};
