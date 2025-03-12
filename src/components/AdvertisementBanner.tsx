
import React, { useState, useEffect } from 'react';

interface AdvertisementBannerProps {
  position?: 'top' | 'bottom';
  className?: string;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ 
  position = 'top',
  className = '',
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate ad loading
    const timer = setTimeout(() => {
      setAdLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`w-full px-4 py-3 bg-secondary/30 border border-secondary rounded-lg 
      flex items-center justify-center ${position === 'top' ? 'mb-6' : 'mt-6'} 
      transition-all duration-300 ${adLoaded ? 'opacity-100' : 'opacity-50'} ${className}`}
    >
      <div className="text-center">
        {!adLoaded ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading advertisement...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground mb-2">Advertisement</p>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                <span className="text-primary text-lg">Ad</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Sponsored message</p>
                <p className="text-xs text-muted-foreground">Learn more about our sponsors</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertisementBanner;
