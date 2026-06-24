import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProxiedVastVideoAdProps {
  /** VAST tag URL to resolve (defaults to the configured spot). */
  tagUrl?: string;
  /** Called when a media file is loaded and ready to play. */
  onReady?: () => void;
  /** Called when no inventory / failure — caller should fall back. */
  onUnavailable?: () => void;
  /** Called when the video finishes. */
  onComplete?: () => void;
  className?: string;
}

interface VastResolution {
  mediaUrl: string | null;
  clickUrl: string | null;
  impressions: string[];
  error?: string;
}

/**
 * Resolves a VAST tag through the `vast-proxy` edge function (which requests
 * with a mobile User-Agent so the network actually fills with video, even on
 * desktop) and plays the resulting MP4. Falls back via `onUnavailable` when no
 * inventory is returned.
 */
const ProxiedVastVideoAd: React.FC<ProxiedVastVideoAdProps> = ({
  tagUrl,
  onReady,
  onUnavailable,
  onComplete,
  className,
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [clickUrl, setClickUrl] = useState<string | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fireBeacon = (url: string) => {
      try {
        const img = new Image();
        img.src = url;
      } catch {
        /* ignore */
      }
    };

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<VastResolution>(
          "vast-proxy",
          { body: { tagUrl } },
        );
        if (cancelled) return;
        if (error || !data?.mediaUrl) {
          onUnavailable?.();
          return;
        }
        data.impressions?.forEach((u) => u && fireBeacon(u));
        setMediaUrl(data.mediaUrl);
        setClickUrl(data.clickUrl);
      } catch (err) {
        console.warn("[ProxiedVastVideoAd] unavailable:", err);
        if (!cancelled) onUnavailable?.();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagUrl]);

  if (!mediaUrl) return null;

  const handleClick = () => {
    if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <video
      src={mediaUrl}
      autoPlay
      muted
      playsInline
      controls={false}
      onCanPlay={() => {
        if (!trackedRef.current) {
          trackedRef.current = true;
          onReady?.();
        }
      }}
      onEnded={() => onComplete?.()}
      onError={() => onUnavailable?.()}
      onClick={handleClick}
      className={className}
      style={{
        width: "100%",
        maxHeight: "60vh",
        objectFit: "contain",
        cursor: clickUrl ? "pointer" : "default",
        borderRadius: 16,
      }}
    />
  );
};

export default ProxiedVastVideoAd;