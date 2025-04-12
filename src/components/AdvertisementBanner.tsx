
import React, { useId } from 'react';
import { useAdvertisement } from '@/hooks/useAdvertisement';
import AdContainer from './ads/AdContainer';
import AdContent from './ads/AdContent';

interface AdvertisementBannerProps {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'sidebar';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  slotId?: string;
  pageSection?: string;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ 
  position = 'top',
  className = '',
  size = 'medium',
  slotId,
  pageSection
}) => {
  // Generate a stable unique ID for this ad container
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `${uniqueId}-ad-container`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const {
    adLoaded,
    adContent,
    adActive,
    adError,
    adDebug,
    instanceId,
    adId,
    adVersion,
    handleAdClick
  } = useAdvertisement({
    position,
    slotId,
    pageSection
  });

  if (!adActive) {
    if (isDevelopment) {
      return (
        <div className={`w-full bg-muted/30 border border-muted rounded-lg p-4 ${className} text-center text-xs text-muted-foreground`}>
          Ad slot inactive: {position} / {slotId}
          {adError && <div className="text-destructive mt-1">{adError}</div>}
        </div>
      );
    }
    return null;
  }

  return (
    <AdContainer
      position={position}
      size={size}
      className={className}
      adLoaded={adLoaded}
      onClick={handleAdClick}
      adData={{
        slotId,
        pageSection,
        adVersion,
        instanceId: instanceId.slice(0, 8)
      }}
    >
      <AdContent
        adLoaded={adLoaded}
        adContent={adContent}
        adDebug={adDebug}
        adError={adError}
        isDevelopment={isDevelopment}
        position={position}
        slotId={slotId}
        pageSection={pageSection}
        containerId={containerId}
      />
    </AdContainer>
  );
};

export default AdvertisementBanner;
