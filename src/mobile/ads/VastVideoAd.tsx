import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VastVideoAdProps {
  /** VAST tag URL. */
  tagUrl: string;
  /** Called when a media file is loaded and ready to play. */
  onReady?: () => void;
  /** Called when the ad fails / no inventory — caller should fall back. */
  onUnavailable?: () => void;
  /** Called when the video finishes playing. */
  onComplete?: () => void;
  className?: string;
}

export function VastVideoAd({ tagUrl, onReady, onUnavailable, onComplete, className }: VastVideoAdProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [clickUrl, setClickUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'resolving' | 'buffering' | 'playing' | 'failed'>('resolving');
  const trackedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Set a 10-second maximum timeout for resolving and buffering the ad.
    // If it doesn't play within this timeframe, skip gracefully to the next step.
    timeoutRef.current = setTimeout(() => {
      if (trackedRef.current || cancelled) return;
      console.warn("[VastVideoAd] Ad load timeout reached (10s)");
      setStatus('failed');
      onUnavailable?.();
    }, 10000);

    const fireBeacon = (url: string | null) => {
      if (!url) return;
      try {
        const img = new Image();
        img.src = url;
      } catch { /* ignore */ }
    };

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "vast-proxy",
          { body: { tagUrl } },
        );
        if (cancelled) return;
        if (error || !data?.mediaUrl) {
          console.warn("[VastVideoAd] failed to resolve tag or empty media:", error);
          setStatus('failed');
          onUnavailable?.();
          return;
        }
        data.impressions?.forEach((u: string) => u && fireBeacon(u));
        setMediaUrl(data.mediaUrl);
        setClickUrl(data.clickUrl);
        setStatus('buffering');
      } catch (err) {
        console.warn("[VastVideoAd] unavailable:", err);
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
    if (clickUrl) window.open(clickUrl, '_blank', 'noopener,noreferrer');
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
          ref={videoRef}
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
            console.error("[VastVideoAd] video loading or playback error:", e);
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
            width: '100%',
            maxHeight: '60vh',
            objectFit: 'contain',
            cursor: clickUrl ? 'pointer' : 'default',
            borderRadius: 16,
            opacity: status === 'playing' ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}
    </div>
  );
}

export default VastVideoAd;