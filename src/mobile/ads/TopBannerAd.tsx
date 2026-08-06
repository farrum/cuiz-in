import { useEffect, useState } from 'react';
import { getAdPool, type AdCreative } from './adProvider';
import { getAdSlotsByPosition } from '@/utils/adService';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { Capacitor } from '@capacitor/core';
import { LevelPlayBanner } from './LevelPlayBanner';

// Rotate house creatives slowly — fast swaps read as the screen "blinking".
const REFRESH_MS = 30000;

/**
 * Thin banner ad (rendered at the bottom, above the tab bar) that
 * refreshes its creative every 30 seconds.
 * Renders nothing when no creative is available for the current user.
 */
export function TopBannerAd() {
  const isNative = Capacitor.isNativePlatform();
  const [pool] = useState<AdCreative[]>(() => (isNative ? [] : getAdPool('banner')));
  const [index, setIndex] = useState(0);
  const [hasDbAd, setHasDbAd] = useState(false);

  useEffect(() => {
    if (isNative) return;
    const dbAds = getAdSlotsByPosition('app-banner');
    setHasDbAd(dbAds && dbAds.length > 0);
  }, [isNative]);

  useEffect(() => {
    if (isNative || pool.length <= 1) return;
    const t = window.setInterval(() => setIndex((i) => i + 1), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [pool.length, isNative]);

  // Native builds use the Unity LevelPlay banner, which the SDK overlays
  // outside the WebView. Checked after all hooks so hook order stays stable.
  if (isNative) {
    return <LevelPlayBanner />;
  }

  if (hasDbAd) {
    return (
      <div className="px-3 py-1.5 max-h-16 overflow-hidden mb-10">
        <SimpleAdBanner position="app-banner" className="rounded-lg overflow-hidden max-h-12" />
      </div>
    );
  }

  if (pool.length === 0) return null;
  const ad = pool[index % pool.length];

  return (
    <div className="px-3 py-1.5 mb-10">
      {/* No enter/exit animation here: the creative swaps in place so a
          refresh never flashes the surrounding UI. */}
      <a
          href={ad.href || undefined}
          target={ad.href ? '_blank' : undefined}
          rel={ad.href ? 'noopener noreferrer' : undefined}
          className={`relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-gradient-to-r ${ad.bg} text-white shadow-sm overflow-hidden`}
        >
          <span className="absolute top-0.5 right-0.5 text-[7px] font-bold uppercase bg-black/30 px-1 py-0.5 rounded">
            {ad.sample ? 'Sample Ad' : 'Ad'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-tight truncate">{ad.headline}</p>
            <p className="text-[10px] opacity-90 leading-tight truncate">{ad.body}</p>
          </div>
          <span className="shrink-0 text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
            {ad.cta}
          </span>
      </a>
    </div>
  );
}

export default TopBannerAd;