import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSimpleAd } from "@/hooks/ads/useSimpleAd";
import { ensureAclibLoaded, triggerBannerRescan, pushAdsByGoogle } from "@/utils/adProviderScripts";

interface SimpleAdBannerProps {
  position: "top" | "middle" | "bottom" | "sidebar" | "header" | "content" | "footer";
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ position, className = "" }) => {
  const normalizedPosition = mapPosition(position);
  const { content, isLoading, error } = useSimpleAd(normalizedPosition);
  const [hasError, setHasError] = useState<boolean>(false);
  const [hasRendered, setHasRendered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adId = `ad-container-${position}-${Math.random().toString(36).substring(2, 9)}`;
  const isMountedRef = useRef(true);

  // Initialize ad providers after content is set
  const initializeAdProviders = useCallback(async (adContent: string) => {
    if (!adContent || !containerRef.current || !isMountedRef.current) return;

    try {
      // Handle aclib ads
      if (adContent.includes('aclib.runBanner')) {
        console.log(`[SimpleAdBanner] Detected aclib ad for ${position}`);
        const aclibLoaded = await ensureAclibLoaded();
        
        if (aclibLoaded && typeof (window as any).aclib?.runBanner === 'function') {
          const zoneIdMatch = adContent.match(/zoneId:\s*['"]?(\d+)['"]?/);
          if (zoneIdMatch) {
            console.log(`[SimpleAdBanner] Running aclib banner for zone: ${zoneIdMatch[1]}`);
            try {
              (window as any).aclib.runBanner({ zoneId: zoneIdMatch[1] });
              setHasRendered(true);
            } catch (e) {
              console.error('[SimpleAdBanner] aclib.runBanner error:', e);
            }
          }
        } else {
          console.warn('[SimpleAdBanner] aclib not available after loading');
        }
      }

      // Trigger banner rescan for onclick/data-banner-id ads
      if (adContent.includes('data-banner-id')) {
        console.log(`[SimpleAdBanner] Detected banner-id ads for ${position}`);
        // Use requestAnimationFrame to ensure DOM is painted before rescan
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (isMountedRef.current && containerRef.current) {
              // Verify the banner elements exist in DOM before triggering rescan
              const bannerElements = containerRef.current.querySelectorAll('[data-banner-id]');
              if (bannerElements.length > 0) {
                console.log(`[SimpleAdBanner] Found ${bannerElements.length} banner elements, triggering rescan`);
                triggerBannerRescan();
                setHasRendered(true);
              } else {
                console.warn(`[SimpleAdBanner] No banner elements found in DOM for ${position}`);
              }
            }
          }, 300);
        });
      }

      // Push to adsbygoogle if present
      if (adContent.includes('adsbygoogle')) {
        console.log(`[SimpleAdBanner] Detected AdSense for ${position}`);
        setTimeout(() => {
          if (isMountedRef.current) {
            pushAdsByGoogle();
            setHasRendered(true);
          }
        }, 300);
      }
    } catch (error) {
      console.error('[SimpleAdBanner] Error initializing ad providers:', error);
    }
  }, [position]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (content && containerRef.current && isMountedRef.current) {
      try {
        console.log(`[SimpleAdBanner] Setting ad content for position: ${position}. Length: ${content.length}`);

        // Set content - but don't block aclib calls
        const safeContent = content
          .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API blocked')")
          .replace(/navigator\.serviceWorker\.register/g, "console.log");

        containerRef.current.innerHTML = safeContent;

        // Execute inline scripts (non-aclib ones)
        setTimeout(() => {
          if (!containerRef.current || !isMountedRef.current) return;
          
          try {
            const scripts = containerRef.current.querySelectorAll("script");
            scripts.forEach((oldScript) => {
              // Skip problematic scripts
              if (oldScript.src && (
                oldScript.src.includes("push.js") ||
                oldScript.src.includes("sdk/push") ||
                oldScript.src.includes("ServiceWorker")
              )) {
                console.log("[SimpleAdBanner] Blocked problematic script:", oldScript.src);
                return;
              }

              // Skip aclib inline scripts - we'll handle them separately
              if (oldScript.innerHTML.includes('aclib.runBanner')) {
                console.log("[SimpleAdBanner] Skipping aclib inline script - handled separately");
                return;
              }

              const newScript = document.createElement("script");
              Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
              });

              if (oldScript.src) {
                newScript.src = oldScript.src;
                newScript.onload = () => {
                  if (isMountedRef.current) setHasRendered(true);
                };
                newScript.onerror = () => {
                  console.error("[SimpleAdBanner] Script load error:", oldScript.src);
                };
              } else {
                newScript.innerHTML = oldScript.innerHTML;
              }

              oldScript.parentNode?.replaceChild(newScript, oldScript);
            });
          } catch (error) {
            console.error("[SimpleAdBanner] Error executing scripts:", error);
            setHasError(true);
          }
        }, 100);

        // Initialize ad providers
        initializeAdProviders(content);

      } catch (err) {
        console.error("[SimpleAdBanner] Error setting content:", err);
        setHasError(true);
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [content, position, initializeAdProviders]);

  // Return null for error states - no empty space
  if (!isLoading && (error || !content || hasError)) {
    return null;
  }

  // Don't show loading skeleton to avoid layout shift
  if (isLoading) {
    return null;
  }

  return (
    <div
      id={adId}
      className={`w-full ad-container overflow-hidden ${className}`}
      ref={containerRef}
      data-position={normalizedPosition}
      style={{ 
        contain: 'layout style',
        contentVisibility: 'auto',
        // Only reserve space if content has rendered, otherwise collapse
        minHeight: hasRendered ? 'auto' : '0'
      }}
    />
  );
};

function mapPosition(position: string): string {
  switch (position) {
    case "header":
      return "top";
    case "content":
      return "middle";
    case "footer":
      return "bottom";
    default:
      return position;
  }
}

export default SimpleAdBanner;
