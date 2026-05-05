import React, { useId } from "react";
import { useAdvertisement } from "@/hooks/useAdvertisement";
import { useScriptExecution } from "@/hooks/useScriptExecution";
import AdPlaceholder from "./AdPlaceholder";
import { cn } from "@/lib/utils";
import { getPositionClasses } from "./adStyles";

interface SimpleAdBannerProps {
  position: "top" | "middle" | "bottom" | "sidebar" | "header" | "content" | "footer";
  className?: string;
  slotId?: string;
  pageSection?: string;
}

/**
 * AdSense Banner Component
 * Fetches and renders ads from the verified ad provider system.
 */
const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({ 
  position, 
  className,
  slotId,
  pageSection
}) => {
  const uniqueId = useId().replace(/:/g, "");
  const containerId = `ad-container-${position}-${uniqueId}`;
  
  const { adContent, adLoaded, adDebug, adError: error } = useAdvertisement({ 
    position,
    slotId,
    pageSection
  });

  // Execute scripts within the ad content safely
  const executionStatus = useScriptExecution(adContent, containerId);

  // If no ad content is available, show nothing
  if (!adContent) {
    return null;
  }

  return (
    <div 
      className={cn(
        "ad-banner-wrapper w-full overflow-hidden transition-all duration-300",
        adLoaded ? "opacity-100" : "opacity-0",
        getPositionClasses(position),
        className
      )}
    >
      <div 
        id={containerId}
        className="ad-container min-h-[1px] w-full flex justify-center"
        dangerouslySetInnerHTML={{ __html: adContent }}
        data-ad-position={position}
        data-ad-debug={adDebug}
        data-execution-status={executionStatus}
      />
      
      {error && process.env.NODE_ENV === 'development' && (
        <div className="text-[10px] text-destructive text-center mt-1">
          Ad Error: {error}
        </div>
      )}
    </div>
  );
};

export default SimpleAdBanner;

