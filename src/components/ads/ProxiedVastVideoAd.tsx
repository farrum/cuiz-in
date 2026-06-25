import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
 * inventory is returned. Includes a loading spinner and 10-second loading timeout.
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
  const [status, setStatus] = useState<'resolving' | 'buffering' | 'playing' | 'failed'>('resolving');
  const trackedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Set a 10-second maximum timeout for resolving and buffering the ad.
    // If it doesn't play within this timeframe, skip gracefully to the next slide.
    timeoutRef.current = setTimeout(() => {
      if (trackedRef.current || cancelled) return;
      console.warn("[ProxiedVastVideoAd] Ad load timeout reached (10s)");
      setStatus('failed');
      onUnavailable?.();
    }, 10000);

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
          console.warn("[ProxiedVastVideoAd] failed to resolve tag or empty media:", error);
          setStatus('failed');
          onUnavailable?.();
          return;
        }
        data.impressions?.forEach((u) => u && fireBeacon(u));
        setMediaUrl(data.mediaUrl);
        setClickUrl(data.clickUrl);
        setStatus('buffering');
      } catch (err) {
        console.warn("[ProxiedVastVideoAd] unavailable:", err);
        if (!cancelled) {
          setStatus('failed');
          onUnavailable?.();
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagUrl]);

  if (status === 'failed') return null;

  const handleClick = () => {
    if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[250px]">
      {/* Loading Spinner overlay */}
      {(status === 'resolving' || status === 'buffering') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm rounded-2xl z-10 p-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-white text-xs font-semibold tracking-wide animate-pulse">
            {status === 'resolving' ? 'Resolving ad stream...' : 'Buffering video ad...'}
          </p>
        </div>
      )}

      {mediaUrl && (
        <video
          src={mediaUrl}
          autoPlay
          muted
          playsInline
          controls={false}
          onCanPlay={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (!trackedRef.current) {
              trackedRef.current = true;
              setStatus('playing');
              onReady?.();
            }
          }}
          onEnded={() => onComplete?.()}
          onError={(e) => {
            console.error("[ProxiedVastVideoAd] video loading or playback error:", e);
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setStatus('failed');
            onUnavailable?.();
          }}
          onClick={handleClick}
          className={className}
          style={{
            width: "100%",
            maxHeight: "60vh",
            objectFit: "contain",
            cursor: clickUrl ? "pointer" : "default",
            borderRadius: 16,
            opacity: status === 'playing' ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}
    </div>
  );
};

export default ProxiedVastVideoAd;