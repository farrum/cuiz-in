
import React, { useEffect } from 'react';
import { getSizeClasses, getPositionClasses } from './adStyles';

interface AdContainerProps {
  children: React.ReactNode;
  position: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  adLoaded: boolean;
  onClick?: () => void;
  adData: {
    slotId?: string;
    pageSection?: string;
    adVersion?: string;
    instanceId?: string;
  };
}

const AdContainer: React.FC<AdContainerProps> = ({
  children,
  position,
  size,
  className = '',
  adLoaded,
  onClick,
  adData
}) => {
  const { slotId, pageSection, adVersion, instanceId } = adData;
  
  // Add effect to notify parent components when this container is mounted/unmounted
  useEffect(() => {
    // Dispatch an event when the ad container mounts
    window.dispatchEvent(new CustomEvent('adContainerMounted', {
      detail: {
        position,
        slotId,
        pageSection,
        instanceId
      }
    }));
    
    return () => {
      // Dispatch an event when the ad container unmounts
      window.dispatchEvent(new CustomEvent('adContainerUnmounted', {
        detail: {
          position,
          slotId,
          pageSection,
          instanceId
        }
      }));
    };
  }, [position, slotId, pageSection, instanceId]);
  
  return (
    <div 
      className={`w-full ${getSizeClasses(size)} bg-secondary/30 border border-secondary rounded-lg 
      flex items-center justify-center ${getPositionClasses(position)} 
      transition-all duration-300 ${adLoaded ? 'opacity-100' : 'opacity-50'} ${className}`}
      onClick={onClick}
      data-ad-slot={slotId || position}
      data-ad-section={pageSection || position}
      data-ad-version={adVersion}
      data-instance-id={instanceId}
      data-position={position}
      data-ad-container="true"
      id={`ad-container-${position}-${slotId || 'default'}`}
    >
      {children}
    </div>
  );
};

export default AdContainer;
