
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
  adBlockDetected?: boolean;
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
  containerId,
  adBlockDetected = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  
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
  
  // Clean content of problematic scripts
  const cleanedContent = React.useMemo(() => {
    if (!adContent) return '';
    
    // Remove TCPusher and problematic scripts
    const blockedScripts = [
      'onclickpsh.com',
      'mrtnsvr.com',
      'TCPusher',
      'push.js',
      'vo2pn0.js'
    ];
    
    let content = adContent;
    
    // Remove script tags containing blocked domains
    blockedScripts.forEach(domain => {
      const regex = new RegExp(`<script[^>]*${domain}[^>]*>[\\s\\S]*?<\\/script>`, 'gi');
      content = content.replace(regex, '<!-- Problematic script removed -->');
    });
    
    // Remove service worker registrations
    content = content.replace(/navigator\.serviceWorker\.register\([^)]+\)/g, 
                              "console.log('Service worker registration blocked')");
    
    // Remove notification requests
    content = content.replace(/Notification\.requestPermission\([^)]*\)/g, 
                              "console.log('Notification permission request blocked')");
    
    return content;
  }, [adContent]);
  
  // Execute scripts in the ad content only after container is ready
  const scriptStatus = useScriptExecution(containerReady ? cleanedContent : '', containerId);
  
  // Effect to monitor script errors
  useEffect(() => {
    const handleScriptError = (event: ErrorEvent) => {
      // Only capture errors from this container
      const container = document.getElementById(containerId);
      if (container && event.target && container.contains(event.target as Node)) {
        console.error(`Script error in ${position} ad:`, event.message);
        setScriptError(event.message);
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleScriptError);
    
    return () => {
      window.removeEventListener('error', handleScriptError);
    };
  }, [containerId, position]);
  
  // Effect to monitor content changes and container status
  useEffect(() => {
    if (adLoaded && cleanedContent && containerReady && contentRef.current) {
      console.log(`Ad container ready for ${position}/${slotId || 'default'}, content length: ${cleanedContent.length}`);
      
      // Log the content for debugging, truncated to avoid console overflow
      if (isDevelopment) {
        console.log(`Ad content sample: ${cleanedContent.substring(0, 100)}...`);
        
        // Check if the content contains script tags
        const hasScriptTags = /<script[\s\S]*?>[\s\S]*?<\/script>/i.test(cleanedContent);
        console.log(`Content contains script tags: ${hasScriptTags}`);
        
        // Add data attributes for easier debugging
        if (contentRef.current) {
          contentRef.current.setAttribute('data-has-scripts', hasScriptTags.toString());
          contentRef.current.setAttribute('data-content-length', cleanedContent.length.toString());
        }
      }
    }
  }, [adLoaded, cleanedContent, containerReady, containerId, position, slotId, isDevelopment]);
  
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
      {isDevelopment && (adDebug || scriptError || adBlockDetected) && (
        <div className="mb-2 text-center">
          {adDebug && <p className="text-xs text-blue-500">{adDebug}</p>}
          {scriptError && <p className="text-xs text-red-500">Script error: {scriptError}</p>}
          {adBlockDetected && <p className="text-xs text-amber-500">Ad blocker detected</p>}
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
      <div 
        id={containerId} 
        ref={contentRef}
        data-ad-position={position}
        data-ad-slot={slotId || position}
        data-ad-ready={containerReady.toString()}
        className={`${getMinHeight()} flex items-center justify-center overflow-hidden`}
        dangerouslySetInnerHTML={{ __html: cleanedContent }}
      ></div>
    </div>
  );
};

export default AdContent;
