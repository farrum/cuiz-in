
import React, { useEffect, useRef } from 'react';
import { useScriptExecution } from '@/hooks/useScriptExecution';
import AdLoader from './AdLoader';

interface AdContentProps {
  adLoaded: boolean;
  adContent: string;
  adDebug: string | null;
  adError: string | null;
  isDevelopment: boolean;
  position: string;
  slotId?: string;
  pageSection?: string;
  containerId: string;
}

const AdContent: React.FC<AdContentProps> = ({
  adLoaded,
  adContent,
  adDebug,
  adError,
  isDevelopment,
  position,
  slotId,
  pageSection,
  containerId
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Execute scripts in the ad content
  const scriptStatus = useScriptExecution(adContent, containerId);
  
  // Effect to ensure container exists in DOM before any script execution
  useEffect(() => {
    if (adLoaded && adContent && contentRef.current) {
      // Ensure the container has an ID attribute
      if (contentRef.current.id !== containerId) {
        contentRef.current.id = containerId;
      }
      
      console.log(`Ad container ready for ${position}/${slotId || 'default'}, content length: ${adContent.length}`);
    }
  }, [adLoaded, adContent, containerId, position, slotId]);
  
  if (!adLoaded) {
    return <AdLoader error={adError} isDevelopment={isDevelopment} />;
  }
  
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
      {isDevelopment && (
        <div className="mb-2 text-center">
          {adDebug && <p className="text-xs text-blue-500">{adDebug}</p>}
          <p className="text-xs text-muted-foreground">
            Position: {position} / Slot: {slotId || position} / Section: {pageSection || 'default'}
          </p>
          {scriptStatus && <p className="text-xs text-green-500">Scripts executed: {scriptStatus}</p>}
        </div>
      )}
      {/* Set both id attribute and ref to ensure the container is accessible */}
      <div 
        id={containerId} 
        ref={contentRef}
        data-ad-position={position}
        data-ad-slot={slotId || position}
        className="min-h-[100px] flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: adContent }}
      ></div>
    </div>
  );
};

export default AdContent;
