
import React, { useEffect, useRef, useState } from 'react';
import { useSimpleAd } from '@/hooks/ads/useSimpleAd';
import { useAdBlockerDetection } from '@/hooks/ads/useAdBlockerDetection';

interface SimpleAdBannerProps {
  position: 'header' | 'sidebar' | 'content' | 'footer';
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ position, className = '' }) => {
  const { content, isLoading } = useSimpleAd(position);
  const { adBlockerDetected } = useAdBlockerDetection();
  const [hasError, setHasError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adId = `ad-container-${position}-${Math.random().toString(36).substring(2, 9)}`;
  
  useEffect(() => {
    // Only try to run scripts if we have content and a container
    if (content && containerRef.current) {
      try {
        // Handle Topics API and other problematic scripts
        const safeContent = content
          // Remove Topics API calls
          .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API call blocked')")
          // Disable service worker registration
          .replace(/navigator\.serviceWorker\.register/g, "console.log")
          // Block other problematic patterns
          .replace(/TCPusher/g, "console.log")
          .replace(/new\s+Notification/g, "console.log");

        // Set the sanitized content
        if (containerRef.current) {
          containerRef.current.innerHTML = safeContent;

          // Execute scripts safely
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
                  return; // Skip this script
                }
                
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                
                // Add safety attributes
                newScript.setAttribute('data-safe-script', 'true');
                newScript.setAttribute('data-no-sw', 'true');
                
                // Set either src or inline content
                if (oldScript.src) {
                  newScript.src = oldScript.src;
                } else {
                  // Sanitize the content
                  let safeScriptContent = oldScript.innerHTML
                    .replace(/document\.browsingTopics/g, 'console.log')
                    .replace(/navigator\.serviceWorker\.register/g, 'console.log')
                    .replace(/new\s+TCPusher/g, 'console.log')
                    .replace(/Notification\.requestPermission/g, 'console.log');
                    
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
    
    // Cleanup
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
  
  if (!content || hasError || adBlockerDetected) {
    // Return an empty placeholder with proper styling
    return (
      <div className={`w-full ${getPositionClasses(position)} ${className}`}>
        {adBlockerDetected ? (
          <div className="ad-container flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Advertisement content blocked</p>
          </div>
        ) : hasError ? (
          <div className="ad-container flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Error loading advertisement</p>
          </div>
        ) : (
          <div className="ad-container flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Advertisement</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`w-full ${getPositionClasses(position)} ${className}`}>
      <div 
        id={adId}
        ref={containerRef}
        className="ad-container"
      />
    </div>
  );
};

const getPositionClasses = (position: string) => {
  switch (position) {
    case 'header':
      return 'min-h-[90px] bg-secondary/10 rounded-lg';
    case 'sidebar':
      return 'min-h-[600px] bg-secondary/10 rounded-lg';
    case 'content':
      return 'min-h-[250px] bg-secondary/10 rounded-lg';
    case 'footer':
      return 'min-h-[90px] bg-secondary/10 rounded-lg';
    default:
      return '';
  }
};

export default SimpleAdBanner;
