
import React from 'react';
import { useSimpleAd } from '@/hooks/ads/useSimpleAd';

interface SimpleAdBannerProps {
  position: 'header' | 'sidebar' | 'content' | 'footer';
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ position, className = '' }) => {
  const { content, isLoading } = useSimpleAd(position);
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${getPositionClasses(position)} ${className}`}>
        <p className="text-sm text-muted-foreground">Loading advertisement...</p>
      </div>
    );
  }
  
  if (!content) return null;
  
  return (
    <div className={`w-full ${getPositionClasses(position)} ${className}`}>
      <div 
        className="ad-container"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

const getPositionClasses = (position: string) => {
  switch (position) {
    case 'header':
      return 'min-h-[90px] bg-secondary/10 rounded-lg';
    case 'sidebar':
      return 'min-h-[600px] bg-secondary/10 rounded-lg';
    case 'content':
      return 'min-h-[250px] bg-secondary/10 rounded-lg';
    case 'footer':
      return 'min-h-[90px] bg-secondary/10 rounded-lg';
    default:
      return '';
  }
};

export default SimpleAdBanner;
