import React, { useId, useEffect, useState } from 'react';
import { useAdvertisement } from '@/hooks/advertisement';
import AdContainer from './ads/AdContainer';
import AdContent from './ads/AdContent';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdvertisementBannerProps {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'sidebar';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  slotId?: string;
  pageSection?: string;
  skipTopics?: boolean;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ 
  position = 'top',
  className = '',
  size = 'medium',
  slotId,
  pageSection,
  skipTopics = false
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `${uniqueId}-ad-container`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [topicsError, setTopicsError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const {
    adLoaded,
    adContent,
    adActive,
    adError,
    adDebug,
    instanceId,
    adId,
    adVersion,
    handleAdClick,
    refreshAd
  } = useAdvertisement({
    position,
    slotId,
    pageSection,
    skipTopics,
    refreshTrigger
  });

  const forceRefreshAd = () => {
    if (isDevelopment) {
      setRefreshTrigger(prev => prev + 1);
      toast.info(`Refreshing ad: ${position}/${slotId || 'default'}`);
      
      if (refreshAd) {
        refreshAd(true);
      }
    }
  };

  useEffect(() => {
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

    const handleUncaughtError = (event: ErrorEvent) => {
      if (handleTopicsError(event)) {
        return true;
      }
      
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
        return true;
      }
      return false;
    };
    
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonStr = typeof reason === 'string' 
          ? reason 
          : (reason && reason.message ? reason.message : String(reason));
      
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
    
    window.addEventListener('error', handleUncaughtError, true);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    
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
          {topicsError && <div className="text-red-500 mt-1">Topics API attestation failed</div>}
          
          {isDevelopment && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={forceRefreshAd} 
              className="mt-2"
            >
              <Loader2 className="h-3 w-3 mr-1" />
              Retry Ad Load
            </Button>
          )}
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
      
      {isDevelopment && (
        <div className="absolute bottom-1 right-1 opacity-50 hover:opacity-100">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              forceRefreshAd();
            }}
            className="h-6 w-6 bg-secondary/50"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
          </Button>
        </div>
      )}
    </AdContainer>
  );
};

export default AdvertisementBanner;
