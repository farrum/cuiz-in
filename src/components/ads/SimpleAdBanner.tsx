
import React, { useEffect, useRef, useState } from 'react';
import { useSimpleAd } from '@/hooks/ads/useSimpleAd';
import { useAdBlockerDetection } from '@/hooks/ads/useAdBlockerDetection';

interface SimpleAdBannerProps {
  position: 'top' | 'middle' | 'bottom' | 'sidebar' | 'header' | 'content' | 'footer';
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ position, className = '' }) => {
  const normalizedPosition = mapPosition(position);
  const { content, isLoading, error } = useSimpleAd(normalizedPosition);
  const { adBlockerDetected } = useAdBlockerDetection();
  const [hasError, setHasError] = useState<boolean>(false);
  const [hasRendered, setHasRendered] = useState<boolean>(false);
  const [shouldCollapse, setShouldCollapse] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adId = `ad-container-${position}-${Math.random().toString(36).substring(2, 9)}`;
  
  useEffect(() => {
    if (content && containerRef.current) {
      try {
        console.log(`Setting ad content for position: ${position}. Content length: ${content.length}`);
        
        // Set a timeout to collapse if ad doesn't render in 3 seconds
        const renderTimeout = setTimeout(() => {
          if (!hasRendered && containerRef.current) {
            const hasVisibleContent = containerRef.current.offsetHeight > 50;
            if (!hasVisibleContent) {
              console.log(`Ad at ${position} didn't render, collapsing...`);
              setShouldCollapse(true);
            }
          }
        }, 3000);
        
        const safeContent = content
          .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API call blocked')")
          .replace(/navigator\.serviceWorker\.register/g, "console.log");

        if (containerRef.current) {
          containerRef.current.innerHTML = safeContent;

          setTimeout(() => {
            try {
              const scripts = containerRef.current?.querySelectorAll('script');
              scripts?.forEach(oldScript => {
                if (oldScript.src && (
                  oldScript.src.includes('push.js') || 
                  oldScript.src.includes('sdk/push') ||
                  oldScript.src.includes('ServiceWorker')
                )) {
                  console.log('Blocked problematic script:', oldScript.src);
                  return;
                }
                
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                
                if (oldScript.src) {
                  newScript.src = oldScript.src;
                  newScript.onload = () => {
                    setHasRendered(true);
                    clearTimeout(renderTimeout);
                  };
                  newScript.onerror = () => {
                    console.error('Ad script failed to load:', oldScript.src);
                    setHasError(true);
                    setShouldCollapse(true);
                  };
                } else {
                  newScript.innerHTML = oldScript.innerHTML;
                  setHasRendered(true);
                }
                
                oldScript.parentNode?.replaceChild(newScript, oldScript);
              });
            } catch (error) {
              console.error('Error executing ad scripts:', error);
              setHasError(true);
              setShouldCollapse(true);
            }
          }, 0);
        }
        
        return () => {
          clearTimeout(renderTimeout);
        };
      } catch (err) {
        console.error('Error setting ad content:', err);
        setHasError(true);
        setShouldCollapse(true);
      }
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [content, position, normalizedPosition]);
  
  // Don't render anything if should collapse or has error/no content
  if (shouldCollapse || (!isLoading && (error || !content || hasError || adBlockerDetected))) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className={`w-full overflow-hidden transition-all duration-300 ${className}`}>
        <div className={`flex items-center justify-center p-4 bg-secondary/5 rounded-lg ${getLoadingHeight(position)}`}>
          <p className="text-xs text-muted-foreground">Loading ad...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      id={adId} 
      className={`w-full ad-container overflow-hidden transition-all duration-300 ${getContainerClasses(position, hasRendered)} ${className}`} 
      ref={containerRef}
      data-position={normalizedPosition}
    />
  );
};

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

const getLoadingHeight = (position: string) => {
  switch (position) {
    case 'sidebar':
      return 'h-24';
    default:
      return 'h-16';
  }
};

const getContainerClasses = (position: string, hasRendered: boolean) => {
  const baseClasses = 'bg-transparent rounded-lg';
  
  if (!hasRendered) {
    return baseClasses;
  }
  
  // Only add min-height after content has rendered
  switch (position) {
    case 'top':
    case 'header':
    case 'bottom':
    case 'footer':
      return `${baseClasses} min-h-[90px]`;
    case 'middle':
    case 'content':
      return `${baseClasses} min-h-[250px]`;
    case 'sidebar':
      return `${baseClasses} min-h-[600px]`;
    default:
      return baseClasses;
  }
};

export default SimpleAdBanner;
