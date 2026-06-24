import React, { useState } from "react";
import { cn } from "@/lib/utils";
import ProxiedVastVideoAd from "@/components/ads/ProxiedVastVideoAd";
import SimpleAdBanner from "@/components/ads/SimpleAdBanner";

interface SidebarVideoAdProps {
  /** VAST tag URL for the video ad. */
  tagUrl?: string;
  /** Fallback image ad slot id. */
  slotId?: string;
  /**
   * When true, this slot is dedicated to video only. It will NOT render the
   * managed image/display banner (used when a separate banner already shows
   * elsewhere in the sidebar). It collapses to nothing when video is
   * unavailable, avoiding duplicate/overlapping ads.
   */
  alwaysVideo?: boolean;
  className?: string;
}

const DEFAULT_VAST = "https://vast.yomeno.xyz/vast?spot_id=1494657";

/**
 * Sidebar ad that prefers a VAST video ad and falls back to the managed
 * image/display ad ("sidebar" position) when video inventory is unavailable
 * or fails to play. Video is resolved through the `vast-proxy` edge function
 * (mobile User-Agent) so it fills on desktop too.
 */
const SidebarVideoAd: React.FC<SidebarVideoAdProps> = ({
  tagUrl = DEFAULT_VAST,
  slotId,
  alwaysVideo = false,
  className,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  if (videoFailed) {
    // Dedicated video slot: collapse instead of showing a duplicate banner.
    if (alwaysVideo) return null;
    return (
      <SimpleAdBanner position="sidebar" slotId={slotId} className={className} />
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className="ad-banner-wrapper w-full overflow-hidden rounded-2xl bg-card border"
        aria-label="Sponsored video"
        style={{ display: videoReady ? "block" : "block" }}
      >
        {videoReady && (
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground px-2 pt-1">
            Sponsored
          </span>
        )}
        <ProxiedVastVideoAd
          tagUrl={tagUrl}
          onReady={() => setVideoReady(true)}
          onUnavailable={() => setVideoFailed(true)}
        />
      </div>
      {/* While the video is resolving and not yet ready, keep the image ad
          visible so the slot is never blank. */}
      {!videoReady && !alwaysVideo && (
        <SimpleAdBanner position="sidebar" slotId={slotId} />
      )}
    </div>
  );
};

export default SidebarVideoAd;