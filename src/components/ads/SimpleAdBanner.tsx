import React, { useId } from "react";
import { useAdvertisement } from "@/hooks/useAdvertisement";
import { useScriptExecution } from "@/hooks/useScriptExecution";
import { cn } from "@/lib/utils";
import { getPositionClasses } from "./adStyles";

interface SimpleAdBannerProps {
  position:
    | "top"
    | "middle"
    | "bottom"
    | "sidebar"
    | "header"
    | "content"
    | "footer"
    | "app-banner"
    | "app-interstitial"
    | "quiz-interstitial";
  className?: string;
  slotId?: string;
  pageSection?: string;
}

/**
 * Map page-level placement aliases to the ad_slots `position` values used in
 * the admin manager (top / middle / bottom). This lets pages keep semantic
 * names like "header"/"content"/"footer" while still matching managed slots.
 */
const POSITION_MAP: Record<string, string> = {
  header: "top",
  content: "middle",
  footer: "bottom",
};

const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({
  position,
  className,
  slotId,
  pageSection,
}) => {
  const uniqueId = useId().replace(/:/g, "");
  const resolvedPosition = POSITION_MAP[position] || position;
  const containerId = `ad-container-${resolvedPosition}-${uniqueId}`;

  const { adContent, adLoaded, adDebug, adError: error } = useAdvertisement({
    position: resolvedPosition,
    slotId,
    pageSection,
  });

  // Execute scripts within the ad content safely
  const executionStatus = useScriptExecution(adContent, containerId);

  // Strip the size metadata comment (e.g. <!-- size: 300x250 -->) for the
  // "is there anything to render" check.
  const renderableContent = adContent
    ? adContent.replace(/<!-- size: \d+x\d+ -->/, "").trim()
    : "";

  // Only Active slots produce content. When there is nothing to show, render
  // nothing at all (collapse) — no placeholder, no empty gap.
  if (!renderableContent) {
    return null;
  }

  return (
    <div
      className={cn(
        "ad-banner-wrapper w-full overflow-hidden transition-all duration-300",
        adLoaded ? "opacity-100" : "opacity-0",
        getPositionClasses(resolvedPosition),
        className
      )}
    >
      <div
        id={containerId}
        className="ad-container min-h-[1px] w-full flex justify-center"
        dangerouslySetInnerHTML={{ __html: adContent }}
        data-ad-position={resolvedPosition}
        data-ad-debug={adDebug}
        data-execution-status={executionStatus}
      />

      {error && process.env.NODE_ENV === "development" && (
        <div className="text-[10px] text-destructive text-center mt-1">
          Ad Error: {error}
        </div>
      )}
    </div>
  );
};

export default SimpleAdBanner;

