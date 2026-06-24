import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import VastVideoAd from "@/mobile/ads/VastVideoAd";
import SimpleAdBanner from "@/components/ads/SimpleAdBanner";

interface SidebarVideoAdProps {
  /** VAST tag URL for the video ad. */
  tagUrl?: string;
  /** Fallback image ad slot id. */
  slotId?: string;
  className?: string;
}

const DEFAULT_VAST = "https://vast.yomeno.xyz/vast?spot_id=1494657";

/**
 * The ad server returns an empty `<VAST/>` when the request is missing a
 * cache-buster / size hints (it dedupes identical requests). Append a unique
 * `cb` plus width/height so it actually fills with video inventory.
 */
function withCacheBuster(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}cb=${Date.now()}${Math.floor(Math.random() * 1e6)}&width=300&height=250`;
}

/**
 * Sidebar ad that prefers a VAST video ad and falls back to the managed
 * image/display ad ("sidebar" position) when video inventory is unavailable
 * or fails to play.
 */
const SidebarVideoAd: React.FC<SidebarVideoAdProps> = ({
  tagUrl = DEFAULT_VAST,
  slotId,
  className,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const resolvedTagUrl = useMemo(() => withCacheBuster(tagUrl), [tagUrl]);

  if (videoFailed) {
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
        <VastVideoAd
          tagUrl={tagUrl}
          onReady={() => setVideoReady(true)}
          onUnavailable={() => setVideoFailed(true)}
        />
      </div>
      {/* While the video is resolving and not yet ready, keep the image ad
          visible so the slot is never blank. */}
      {!videoReady && (
        <SimpleAdBanner position="sidebar" slotId={slotId} />
      )}
    </div>
  );
};

export default SidebarVideoAd;