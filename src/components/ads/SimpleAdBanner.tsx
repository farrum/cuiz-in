
import React, { useEffect, useRef, useState } from 'react';
import { useSimpleAd } from '@/hooks/ads/useSimpleAd';
import { useAdBlockerDetection } from '@/hooks/ads/useAdBlockerDetection';

// Updated interface to support both old and new position values
interface SimpleAdBannerProps {
  position: 'top' | 'middle' | 'bottom' | 'sidebar' | 'header' | 'content' | 'footer';
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ position, className = '' }) => {
  // Map old position names to new ones for database consistency
  const normalizedPosition = mapPosition(position);
  
  const { content, isLoading, error } = useSimpleAd(normalizedPosition);
  const { adBlockerDetected } = useAdBlockerDetection();
  const [hasError, setHasError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adId = `ad-container-${position}-${Math.random().toString(36).substring(2, 9)}`;
  
  useEffect(() => {
    if (content && containerRef.current) {
      try {
        const safeContent = content
          .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API call blocked')")
          .replace(/navigator\.serviceWorker\.register/g, "console.log")
          .replace(/TCPusher/g, "console.log")
          .replace(/new\s+Notification/g, "console.log");

        if (containerRef.current) {
          containerRef.current.innerHTML = safeContent;

          setTimeout(() => {
            try {
              const scripts = containerRef.current?.querySelectorAll('script');
              scripts?.forEach(oldScript => {
                if (oldScript.src && (
                  oldScript.src.includes('push.js') || 
                  oldScript.src.includes('sdk/push') ||
                  oldScript.src.includes('ServiceWorker') ||
                  oldScript.src.includes('TCPusher') ||
                  oldScript.src.includes('notification')
                )) {
                  console.log('Blocked problematic script:', oldScript.src);
                  return;
                }
                
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                
                newScript.setAttribute('data-safe-script', 'true');
                newScript.setAttribute('data-no-sw', 'true');
                
                if (oldScript.src) {
                  newScript.src = oldScript.src;
                } else {
                  let safeScriptContent = oldScript.innerHTML
                    .replace(/document\.browsingTopics/g, 'console.log')
                    .replace(/navigator\.serviceWorker\.register/g, 'console.log')
                    .replace(/new\s+TCPusher/g, 'console.log')
                    .replace(/Notification\.requestPermission/g, 'console.log')
                    .replace(/runAdAuction/g, 'console.log');
                    
                  newScript.innerHTML = safeScriptContent;
                }
                
                oldScript.parentNode?.replaceChild(newScript, oldScript);
              });
            } catch (error) {
              console.error('Error executing ad scripts:', error);
              setHasError(true);
            }
          }, 0);
        }
      } catch (err) {
        console.error('Error setting ad content:', err);
        setHasError(true);
      }
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [content, position]);
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${getPositionClasses(position)} ${className}`}>
        <p className="text-sm text-muted-foreground">Loading advertisement...</p>
      </div>
    );
  }
  
  return (
    <div className={`w-full ${getPositionClasses(position)} ${className}`} ref={containerRef}>
      {adBlockerDetected ? (
        <div className="ad-container flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Advertisement content blocked</p>
        </div>
      ) : hasError ? (
        <div className="ad-container flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Error loading advertisement</p>
        </div>
      ) : error ? (
        <div className="ad-container flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Advertisement unavailable</p>
        </div>
      ) : (
        <div className="ad-container flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Advertisement</p>
        </div>
      )}
    </div>
  );
};

// Function to map old position names to normalized ones for database query
function mapPosition(position: string): string {
  switch (position) {
    case 'header':
      return 'top';
    case 'content':
      return 'middle';
    case 'footer':
      return 'bottom';
    default:
      return position;
  }
}

const getPositionClasses = (position: string) => {
  switch (position) {
    case 'top':
    case 'header':
      return 'min-h-[90px] bg-secondary/10 rounded-lg';
    case 'sidebar':
      return 'min-h-[600px] bg-secondary/10 rounded-lg';
    case 'middle':
    case 'content':
      return 'min-h-[250px] bg-secondary/10 rounded-lg';
    case 'bottom':
    case 'footer':
      return 'min-h-[90px] bg-secondary/10 rounded-lg';
    default:
      return '';
  }
};

export default SimpleAdBanner;

