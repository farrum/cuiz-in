
import React, { useId, useEffect, useState, useCallback } from 'react';
import { useAdvertisement } from '@/hooks/advertisement';
import AdContainer from './ads/AdContainer';
import AdContent from './ads/AdContent';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
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
  skipTopics = true  // Default to true to avoid Topics API errors
}) => {
  // Generate a stable unique ID for this ad container
  const uniqueId = useId().replace(/:/g, '-');
  const containerId = `${uniqueId}-ad-container`;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [topicsError, setTopicsError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  
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
    isRetrying,
    retryAttempts,
    retryFetch
  } = useAdvertisement({
    position,
    slotId,
    pageSection,
    skipTopics,
    retryCount: 3  // Allow up to 3 retry attempts
  });

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log(`Manual refresh triggered for ${position} ad`);
    
    // Dispatch custom event to refresh ads
    window.dispatchEvent(new CustomEvent('adSlotsUpdated', {
      detail: { slots: [{ position }] }
    }));
    
    // Reset error count on manual refresh
    setErrorCount(0);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  }, [position, isRefreshing]);

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
        setErrorCount(prev => prev + 1);
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
        setErrorCount(prev => prev + 1);
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

  // Effect to retry loading when error count gets high
  useEffect(() => {
    if (errorCount > 3 && !isRetrying && !isRefreshing) {
      console.log(`High error count (${errorCount}) detected for ${position} ad, triggering retry`);
      retryFetch();
    }
  }, [errorCount, isRetrying, isRefreshing, position, retryFetch]);

  // Display nothing if ad is inactive and not in development mode
  if (!adActive) {
    if (isDevelopment) {
      return (
        <div className={`w-full bg-muted/30 border border-muted rounded-lg p-4 ${className} text-center text-xs text-muted-foreground`}>
          <div className="flex flex-col items-center">
            <p>Ad slot inactive: {position} / {slotId}</p>
            {adError && <p className="text-destructive mt-1">{adError}</p>}
            {adBlockDetected && <p className="text-amber-500 mt-1">Ad blocker detected</p>}
            {topicsError && <p className="text-red-500 mt-1">Topics API attestation failed</p>}
            
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Try Again'}
            </Button>
          </div>
        </div>
      );
    }
    return null;
  }

  // Show retry UI in development mode
  const showDevRetryUI = isDevelopment && (isRetrying || retryAttempts > 0);

  return (
    <div className={`w-full ${className}`}>
      {showDevRetryUI && (
        <div className="text-xs text-center mb-1">
          <span className={isRetrying ? "text-amber-500" : "text-green-500"}>
            {isRetrying ? 
              `Retrying ad (attempt ${retryAttempts + 1}/3)...` : 
              `Ad loaded after ${retryAttempts} ${retryAttempts === 1 ? 'retry' : 'retries'}`
            }
          </span>
        </div>
      )}
      
      <AdContainer
        position={position}
        size={size}
        className=""
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
      
      {isDevelopment && !adLoaded && !isRetrying && retryAttempts >= 3 && (
        <div className="flex justify-center mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Manual Refresh'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdvertisementBanner;
