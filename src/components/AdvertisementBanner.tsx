
import React, { useState, useEffect } from 'react';

interface AdvertisementBannerProps {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'middle';
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ 
  position = 'top',
  className = '',
  size = 'medium',
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adContent, setAdContent] = useState('');
  const [adActive, setAdActive] = useState(true);
  
  useEffect(() => {
    // Load ad slots from localStorage
    const adSlots = JSON.parse(localStorage.getItem('quiz_app_ad_slots') || '[]');
    
    // Find a matching ad for this position
    const matchingAds = adSlots.filter((ad: any) => 
      ad.position === position && ad.active
    );
    
    if (matchingAds.length > 0) {
      // If multiple ads match the position, choose one randomly
      const randomIndex = Math.floor(Math.random() * matchingAds.length);
      const selectedAd = matchingAds[randomIndex];
      
      // Simulate ad loading
      setTimeout(() => {
        setAdContent(selectedAd.code);
        setAdLoaded(true);
      }, 1000);
      
      setAdActive(true);
    } else {
      // No matching ads or all are inactive
      setAdActive(false);
    }
  }, [position]);

  if (!adActive) {
    return null; // Don't render anything if no active ad for this position
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-2';
      case 'large':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'mb-6';
      case 'bottom':
        return 'mt-6';
      case 'left':
        return 'mr-6';
      case 'right':
        return 'ml-6';
      case 'middle':
        return 'my-6';
      default:
        return 'mb-6';
    }
  };
  
  return (
    <div 
      className={`w-full ${getSizeClasses()} bg-secondary/30 border border-secondary rounded-lg 
      flex items-center justify-center ${getPositionClasses()} 
      transition-all duration-300 ${adLoaded ? 'opacity-100' : 'opacity-50'} ${className}`}
    >
      {!adLoaded ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading advertisement...</p>
        </div>
      ) : (
        <div className="w-full">
          <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
          <div dangerouslySetInnerHTML={{ __html: adContent }} />
        </div>
      )}
    </div>
  );
};

export default AdvertisementBanner;
