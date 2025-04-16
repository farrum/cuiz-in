
import React, { useEffect, useRef, useState } from 'react';
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
  const [containerReady, setContainerReady] = useState(false);
  
  // Set up container before executing scripts
  useEffect(() => {
    if (contentRef.current) {
      // Ensure the container has an ID attribute
      if (contentRef.current.id !== containerId) {
        contentRef.current.id = containerId;
      }
      setContainerReady(true);
      console.log(`Container initialized with ID: ${containerId}`);
    }
  }, [containerId]);
  
  // Execute scripts in the ad content only after container is ready
  const scriptStatus = useScriptExecution(containerReady ? adContent : '', containerId);
  
  // Effect to monitor content changes and container status
  useEffect(() => {
    if (adLoaded && adContent && containerReady && contentRef.current) {
      console.log(`Ad container ready for ${position}/${slotId || 'default'}, content length: ${adContent.length}`);
      
      // Log the content for debugging, truncated to avoid console overflow
      if (isDevelopment) {
        console.log(`Ad content sample: ${adContent.substring(0, 100)}...`);
        
        // Check if the content contains script tags
        const hasScriptTags = /<script[\s\S]*?>[\s\S]*?<\/script>/i.test(adContent);
        console.log(`Content contains script tags: ${hasScriptTags}`);
        
        // Add data attributes for easier debugging
        if (contentRef.current) {
          contentRef.current.setAttribute('data-has-scripts', hasScriptTags.toString());
          contentRef.current.setAttribute('data-content-length', adContent.length.toString());
        }
      }
    }
  }, [adLoaded, adContent, containerReady, containerId, position, slotId, isDevelopment]);
  
  if (!adLoaded) {
    return <AdLoader error={adError} isDevelopment={isDevelopment} />;
  }
  
  // Determine min-height based on position
  const getMinHeight = () => {
    if (position === 'sidebar') return 'min-h-[600px]';
    if (position === 'top' || position === 'bottom') return 'min-h-[120px]';
    return 'min-h-[250px]';
  };
  
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
      {isDevelopment && false && ( // Conditionally hide debug information
        <div className="mb-2 text-center">
          {adDebug && <p className="text-xs text-blue-500">{adDebug}</p>}
          <p className="text-xs text-muted-foreground">
            Position: {position} / Slot: {slotId || position} / Section: {pageSection || 'default'}
          </p>
          {scriptStatus && (
            <p className={`text-xs ${
              scriptStatus === 'No scripts found' ? 'text-yellow-500' : 
              scriptStatus === 'Container not ready' ? 'text-red-500' :
              'text-green-500'
            }`}>
              Scripts executed: {scriptStatus}
            </p>
          )}
          {containerReady ? (
            <p className="text-xs text-green-500">Container initialized: Yes</p>
          ) : (
            <p className="text-xs text-red-500">Container initialized: No</p>
          )}
        </div>
      )}
      {/* Set both id attribute and ref to ensure the container is accessible */}
      <div 
        id={containerId} 
        ref={contentRef}
        data-ad-position={position}
        data-ad-slot={slotId || position}
        data-ad-ready={containerReady.toString()}
        className={`${getMinHeight()} flex items-center justify-center overflow-hidden`}
        dangerouslySetInnerHTML={{ __html: adContent }}
      ></div>
    </div>
  );
};

export default AdContent;

