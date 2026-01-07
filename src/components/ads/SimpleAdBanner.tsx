import React, { useEffect, useRef, useState } from "react";
import { useSimpleAd } from "@/hooks/ads/useSimpleAd";
import { useAdBlockerDetection } from "@/hooks/ads/useAdBlockerDetection";

interface SimpleAdBannerProps {
  position: "top" | "middle" | "bottom" | "sidebar" | "header" | "content" | "footer";
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ position, className = "" }) => {
  const normalizedPosition = mapPosition(position);
  const { content, isLoading, error } = useSimpleAd(normalizedPosition);
  const { adBlockerDetected } = useAdBlockerDetection();
  const [hasError, setHasError] = useState<boolean>(false);
  const [hasRendered, setHasRendered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adId = `ad-container-${position}-${Math.random().toString(36).substring(2, 9)}`;
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (content && containerRef.current) {
      try {
        console.log(`Setting ad content for position: ${position}. Content length: ${content.length}`);

        // Extended timeout for slower ad networks (5 seconds)
        const renderTimeout = setTimeout(() => {
          if (!hasRendered && containerRef.current) {
            const hasVisibleContent = containerRef.current.offsetHeight > 50;
            if (!hasVisibleContent) {
              console.log(`Ad at ${position} didn't render within timeout`);
              // Try one more time before giving up
              if (retryCountRef.current < 1) {
                retryCountRef.current++;
                console.log(`Retrying ad render for ${position}...`);
              }
            }
          }
        }, 5000);

        const safeContent = content
          .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API call blocked')")
          .replace(/navigator\.serviceWorker\.register/g, "console.log");

        if (containerRef.current) {
          containerRef.current.innerHTML = safeContent;

          setTimeout(() => {
            try {
              const scripts = containerRef.current?.querySelectorAll("script");
              scripts?.forEach((oldScript) => {
                if (
                  oldScript.src &&
                  (oldScript.src.includes("push.js") ||
                    oldScript.src.includes("sdk/push") ||
                    oldScript.src.includes("ServiceWorker"))
                ) {
                  console.log("Blocked problematic script:", oldScript.src);
                  return;
                }

                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach((attr) => {
                  newScript.setAttribute(attr.name, attr.value);
                });

                if (oldScript.src) {
                  newScript.src = oldScript.src;
                  newScript.onload = () => {
                    setHasRendered(true);
                    clearTimeout(renderTimeout);
                  };
                  newScript.onerror = () => {
                    console.error("Ad script failed to load:", oldScript.src);
                    setHasError(true);
                  };
                } else {
                  newScript.innerHTML = oldScript.innerHTML;
                  setHasRendered(true);
                }

                oldScript.parentNode?.replaceChild(newScript, oldScript);
              });
            } catch (error) {
              console.error("Error executing ad scripts:", error);
              setHasError(true);
            }
          }, 0);
        }

        return () => {
          clearTimeout(renderTimeout);
        };
      } catch (err) {
        console.error("Error setting ad content:", err);
        setHasError(true);
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [content, position, normalizedPosition]);

  // Return null immediately for error states - no empty space
  if (!isLoading && (error || !content || hasError || adBlockerDetected)) {
    return null;
  }

  // Show minimal loading state
  if (isLoading) {
    return null; // Don't show loading skeleton to avoid layout shift
  }

  return (
    <div
      id={adId}
      className={`w-full ad-container overflow-hidden ${className}`}
      ref={containerRef}
      data-position={normalizedPosition}
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
