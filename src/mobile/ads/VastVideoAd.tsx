import { useEffect, useRef, useState } from 'react';

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

/** Maximum VAST wrapper redirects to follow before giving up. */
const MAX_WRAPPERS = 4;

function pickMediaFile(doc: Document): string | null {
  const medias = Array.from(doc.querySelectorAll('MediaFile'));
  if (medias.length === 0) return null;
  // Prefer mp4, then any media with the largest declared width.
  const scored = medias
    .map((m) => ({
      url: (m.textContent || '').trim(),
      type: (m.getAttribute('type') || '').toLowerCase(),
      width: Number(m.getAttribute('width') || 0),
    }))
    .filter((m) => m.url);
  if (scored.length === 0) return null;
  const mp4 = scored.filter((m) => m.type.includes('mp4'));
  const pool = mp4.length > 0 ? mp4 : scored;
  pool.sort((a, b) => b.width - a.width);
  return pool[0].url;
}

function getText(doc: Document, selector: string): string | null {
  const el = doc.querySelector(selector);
  return el ? (el.textContent || '').trim() || null : null;
}

/**
 * Minimal client-side VAST player. Fetches the VAST XML, follows wrapper
 * redirects, plays the first MP4 media file muted, and fires impression /
 * click tracking. Any error (CORS, no inventory, no media) triggers
 * `onUnavailable` so the caller can fall back to a display ad.
 */
export function VastVideoAd({ tagUrl, onReady, onUnavailable, onComplete, className }: VastVideoAdProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [clickUrl, setClickUrl] = useState<string | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fireBeacon = (url: string | null) => {
      if (!url) return;
      try {
        const img = new Image();
        img.src = url;
      } catch { /* ignore */ }
    };

    const resolve = async (url: string, depth: number): Promise<void> => {
      if (depth > MAX_WRAPPERS) throw new Error('too many wrappers');
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`vast http ${res.status}`);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'application/xml');

      // Fire any impression beacons declared at this level.
      doc.querySelectorAll('Impression').forEach((n) => fireBeacon((n.textContent || '').trim()));

      const wrapperUri = getText(doc, 'VASTAdTagURI');
      if (wrapperUri) return resolve(wrapperUri, depth + 1);

      const media = pickMediaFile(doc);
      if (!media) throw new Error('no media file');
      const click = getText(doc, 'ClickThrough');
      if (cancelled) return;
      setMediaUrl(media);
      setClickUrl(click);
    };

    resolve(tagUrl, 0).catch((err) => {
      console.warn('[VastVideoAd] unavailable:', err?.message || err);
      if (!cancelled) onUnavailable?.();
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagUrl]);

  if (!mediaUrl) return null;

  const handleClick = () => {
    if (clickUrl) window.open(clickUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <video
      ref={videoRef}
      src={mediaUrl}
      autoPlay
      muted
      playsInline
      controls={false}
      onCanPlay={() => {
        if (!trackedRef.current) { trackedRef.current = true; onReady?.(); }
      }}
      onEnded={() => onComplete?.()}
      onError={() => onUnavailable?.()}
      onClick={handleClick}
      className={className}
      style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', cursor: clickUrl ? 'pointer' : 'default', borderRadius: 16 }}
    />
  );
}

export default VastVideoAd;