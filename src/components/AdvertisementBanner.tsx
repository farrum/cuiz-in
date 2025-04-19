
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
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  
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

  // Detect ad blockers and handle script errors
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
    
    // Function to handle uncaught errors
    const handleUncaughtError = (event: ErrorEvent) => {
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

  if (!adActive) {
    if (isDevelopment) {
      return (
        <div className={`w-full bg-muted/30 border border-muted rounded-lg p-4 ${className} text-center text-xs text-muted-foreground`}>
          Ad slot inactive: {position} / {slotId}
          {adError && <div className="text-destructive mt-1">{adError}</div>}
          {adBlockDetected && <div className="text-amber-500 mt-1">Ad blocker detected</div>}
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
      />
    </AdContainer>
  );
};

export default AdvertisementBanner;
