import React, { useEffect, useRef, useState } from "react";
import { useSimpleAd } from "@/hooks/ads/useSimpleAd";
import { pushAdsByGoogle, containsBlockedContent } from "@/utils/adProviderScripts";

interface SimpleAdBannerProps {
  position: "top" | "middle" | "bottom" | "sidebar" | "header" | "content" | "footer";
  className?: string;
}

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ position, className = "" }) => {
  const normalizedPosition = mapPosition(position);
  const { content, isLoading, error } = useSimpleAd(normalizedPosition);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!content || !containerRef.current || !isMountedRef.current) return;

    // SECURITY: Block any content containing known malicious domains
    if (containsBlockedContent(content)) {
      console.warn(`[SimpleAdBanner] BLOCKED malicious ad content for ${position}`);
      setHasError(true);
      return;
    }

    // SECURITY: Block data-banner-id ads (compromised ad network)
    if (content.includes('data-banner-id') || content.includes('aclib')) {
      console.warn(`[SimpleAdBanner] BLOCKED banner-id/aclib ad for ${position}`);
      setHasError(true);
      return;
    }

    try {
      // Only allow Google AdSense content
      if (content.includes('adsbygoogle')) {
        containerRef.current.innerHTML = content;
        setTimeout(() => {
          if (isMountedRef.current) pushAdsByGoogle();
        }, 300);
      } else {
        // Block all non-AdSense ad content
        console.warn(`[SimpleAdBanner] Non-AdSense ad blocked for ${position}`);
        containerRef.current.innerHTML = '';
      }
    } catch (err) {
      console.error("[SimpleAdBanner] Error:", err);
      setHasError(true);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [content, position]);

  const getMinHeight = () => {
    switch (position) {
      case 'sidebar': return '250px';
      case 'top': case 'bottom': return '90px';
      default: return '90px';
    }
  };

  if (!isLoading && (error || !content || hasError)) {
    return <div className={`w-full rounded-lg bg-muted/20 ${className}`} style={{ minHeight: getMinHeight() }} />;
  }

  if (isLoading) {
    return <div className={`w-full rounded-lg bg-muted/30 animate-pulse ${className}`} style={{ minHeight: getMinHeight() }} />;
  }

  return (
    <div
      className={`w-full ad-container overflow-hidden ${className}`}
      ref={containerRef}
      data-position={normalizedPosition}
      style={{ contain: 'layout style', contentVisibility: 'auto', minHeight: getMinHeight() }}
    />
  );
};

function mapPosition(position: string): string {
  switch (position) {
    case "header": return "top";
    case "content": return "middle";
    case "footer": return "bottom";
    default: return position;
  }
}

export default SimpleAdBanner;
