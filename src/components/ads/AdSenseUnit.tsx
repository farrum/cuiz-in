import React, { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Layout variant for in-feed/in-article formats */
  layout?: string;
  layoutKey?: string;
}

const ADSENSE_CLIENT = 'ca-pub-2831295465597549';

/**
 * Thin, AdSense-policy-safe wrapper around <ins class="adsbygoogle">.
 * Push only once per mount. Parent should remount via `key` to load a fresh ad.
 */
const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className,
  style,
  layout,
  layoutKey,
}) => {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      // @ts-expect-error - adsbygoogle is loaded from the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push failed', e);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className || ''}`}
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
      {...(layout ? { 'data-ad-layout': layout } : {})}
      {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
    />
  );
};

export default AdSenseUnit;