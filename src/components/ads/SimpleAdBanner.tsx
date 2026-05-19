import React from "react";
import AdSenseUnit from "./AdSenseUnit";
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
// Default AdSense slot (horizontal responsive unit)
const DEFAULT_ADSENSE_SLOT = "3705941132";

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({
  position,
  className,
  slotId,
}) => {
  // Use the provided slotId if it looks like an AdSense numeric slot;
  // otherwise fall back to the default horizontal slot.
  const adSlot = slotId && /^\d{6,}$/.test(slotId) ? slotId : DEFAULT_ADSENSE_SLOT;

  return (
    <div
      className={cn(
        "ad-banner-wrapper w-full overflow-hidden",
        getPositionClasses(position),
        className
      )}
      data-ad-position={position}
    >
      <AdSenseUnit
        slot={adSlot}
        format="auto"
        responsive
        style={{ display: "block", width: "100%" }}
      />
    </div>
  );
};

export default SimpleAdBanner;

