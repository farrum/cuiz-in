import React, { useId } from "react";
import { useAdvertisement } from "@/hooks/useAdvertisement";
import { useScriptExecution } from "@/hooks/useScriptExecution";
import { useAdFillCheck } from "@/hooks/useAdFillCheck";
import HouseBanner from "./HouseBanner";
import { cn } from "@/lib/utils";
import { getPositionClasses } from "./adStyles";
import { Capacitor } from "@capacitor/core";


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
  const resolvedPosition = POSITION_MAP[position] || position;

  // On native platform, web-based HTML ad slot scripts (like Adsterra) are
  // completely disabled to prevent layout shifts, script injection risks, and
  // conflicts with native AdMob/LevelPlay banner surfaces.
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  const uniqueId = useId().replace(/:/g, "");

  // The container id is stable for the lifetime of the component. Previously a
  // refresh nonce was baked into the id AND the React `key`, which destroyed
  // and recreated the whole ad node (plus re-injected its scripts/iframes)
  // every 30s — a visible flash and layout jump on every screen.
  const containerId = `ad-container-${resolvedPosition}-${uniqueId}`;

  const { adContent, adDebug, adError: error, refreshGeneration } = useAdvertisement({
    position: resolvedPosition,
    slotId,
    pageSection,
  });

  // Execute scripts within the ad content safely
  const executionStatus = useScriptExecution(adContent, containerId, true, refreshGeneration);

  // Strip the size metadata comment (e.g. <!-- size: 300x250 -->) for the
  // "is there anything to render" check.
  const renderableContent = adContent
    ? adContent.replace(/<!-- size: \d+x\d+ -->/, "").trim()
    : "";

  // The network can answer with an empty document (dead key, unapproved
  // domain, no fill). Detect that and swap in a house promo instead of
  // leaving a blank band on the page.
  const fillState = useAdFillCheck(
    containerId,
    !!renderableContent,
    refreshGeneration
  );
  const isEmpty = fillState === "empty";

  // Only Active slots produce content. When there is nothing to show, render
  // nothing at all (collapse) — no placeholder, no empty gap.
  if (!renderableContent) {
    return null;
  }

  return (
    <div
      className={cn(
        // No opacity transition: fading on every refresh is what reads as a
        // blink. The creative is swapped in place instead.
        "ad-banner-wrapper w-full overflow-hidden",
        getPositionClasses(resolvedPosition),
        className
      )}
    >
      <div
        id={containerId}
        className={cn(
          "ad-container min-h-[1px] w-full flex justify-center",
          isEmpty && "hidden"
        )}
        dangerouslySetInnerHTML={{ __html: adContent }}
        data-ad-position={resolvedPosition}
        data-ad-debug={adDebug}
        data-execution-status={executionStatus}
        data-ad-fill={fillState}
      />

      {isEmpty && (
        <HouseBanner
          variant={resolvedPosition === "sidebar" ? "box" : "banner"}
        />
      )}

      {isEmpty && import.meta.env.DEV && (
        <div className="text-[10px] text-muted-foreground text-center mt-1">
          Ad slot loaded but the network returned no creative.
        </div>
      )}

      {error && import.meta.env.DEV && (
        <div className="text-[10px] text-destructive text-center mt-1">
          Ad Error: {error}
        </div>
      )}
    </div>
  );
};


export default SimpleAdBanner;

