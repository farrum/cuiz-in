
import React, { useId, useEffect, useState } from 'react';
import { useAdvertisement } from '@/hooks/advertisement';
import AdContainer from './ads/AdContainer';
import AdContent from './ads/AdContent';
import { toast } from 'sonner';

interface AdvertisementBannerProps {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'sidebar';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  slotId?: string;
  pageSection?: string;
  skipTopics?: boolean; // Add this prop to skip Topics API usage
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ 
  position = 'top',
  className = '',
  size = 'medium',
  slotId,
  pageSection,
  skipTopics = false // Default to false for backward compatibility
}) => {
  // Generate a stable unique ID for this ad container
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `${uniqueId}-ad-container`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [topicsError, setTopicsError] = useState(false);
  
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
    pageSection,
    skipTopics
  });

  // Detect ad blockers, script errors, and Topics API errors
  useEffect(() => {
    // Attempt to detect if scripts are being blocked
    const testScript = document.createElement('script');
    testScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    testScript.onerror = () => {
      console.log("Ad scripts might be blocked by browser extensions");
      setAdBlockDetected(true);
      if (isDevelopment) {
        toast.warning("Ad blocker detected", {
          description: "This may affect the functionality of advertisements"
        });
      }
    };
    document.body.appendChild(testScript);
    setTimeout(() => {
      if (document.body.contains(testScript)) {
        document.body.removeChild(testScript);
      }
    }, 1000);
    
    // Function to monitor for Topics API errors
    const handleTopicsError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("Attestation check for Topics")) {
        console.log("Topics API attestation error detected");
        setTopicsError(true);
        if (isDevelopment) {
          toast.error("Topics API error", {
            description: "Browser Privacy API attestation check failed"
          });
        }
        event.preventDefault();
        return true;
      }
      return false;
    };

    // Function to handle uncaught errors
    const handleUncaughtError = (event: ErrorEvent) => {
      // Check for Topics API errors first
      if (handleTopicsError(event)) {
        return true;
      }
      
      // Only handle errors related to ads
      if (event.message && (
          event.message.includes('TCPusher') || 
          event.message.includes('onclickpsh') ||
          event.message.includes('AAB') ||
          event.message.includes('push') ||
          event.message.includes('Notification') ||
          event.message.includes('mrtnsvr') ||
          event.message.includes('ServiceWorker') ||
          event.message.includes('register')
      )) {
        console.error(`Ad error intercepted (${position}):`, event.message);
        event.preventDefault();
        event.stopPropagation();
        return true; // Signal that we handled this error
      }
      return false;
    };
    
    // Handle unhandled promise rejections related to ads
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonStr = typeof reason === 'string' 
          ? reason 
          : (reason && reason.message ? reason.message : String(reason));
      
      // Check for Topics API errors first
      if (reasonStr && reasonStr.includes("Attestation check for Topics")) {
        console.log("Topics API attestation rejection detected");
        setTopicsError(true);
        event.preventDefault();
        return true;
      }
      
      if (reasonStr && (
          reasonStr.includes('TCPusher') || 
          reasonStr.includes('onclickpsh') ||
          reasonStr.includes('AAB') ||
          reasonStr.includes('push') ||
          reasonStr.includes('Notification') ||
          reasonStr.includes('mrtnsvr') ||
          reasonStr.includes('ServiceWorker') ||
          reasonStr.includes('register') ||
          reasonStr.includes('Va3pn0.js')
      )) {
        console.error(`Ad promise rejection intercepted (${position}):`, reasonStr);
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    // Add global error handlers specifically for ad-related errors
    window.addEventListener('error', handleUncaughtError, true);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    
    // Add event listener for specific TCPusher service worker errors
    const handleMessage = (event: MessageEvent) => {
      if (event.data && 
          typeof event.data === 'object' && 
          event.data.type === 'ERROR' && 
          event.data.message && 
          (event.data.message.includes('TCPusher') || 
           event.data.message.includes('ServiceWorker'))) {
        console.log('Intercepted TCPusher message:', event.data);
        event.stopPropagation();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('error', handleUncaughtError, true);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      window.removeEventListener('message', handleMessage);
    };
  }, [position, isDevelopment]);

  // Display nothing if ad is inactive and not in development mode
  if (!adActive) {
    if (isDevelopment) {
      return (
        <div className={`w-full bg-muted/30 border border-muted rounded-lg p-4 ${className} text-center text-xs text-muted-foreground`}>
          Ad slot inactive: {position} / {slotId}
          {adError && <div className="text-destructive mt-1">{adError}</div>}
          {adBlockDetected && <div className="text-amber-500 mt-1">Ad blocker detected</div>}
          {topicsError && <div className="text-red-500 mt-1">Topics API attestation failed</div>}
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
        adBlockDetected={adBlockDetected}
        topicsError={topicsError}
        skipTopics={skipTopics}
      />
    </AdContainer>
  );
};

export default AdvertisementBanner;
