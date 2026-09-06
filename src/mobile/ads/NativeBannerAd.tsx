import { useEffect, useState } from 'react';
import HouseBanner from '@/components/ads/HouseBanner';
import { Capacitor } from '@capacitor/core';

/**
 * Layout spacer for the native banner. The banner itself is owned by
 * <BannerHost/> (mounted once in AppMobile) and overlaid by the SDK outside
 * the WebView — this component must never start or stop the ad, otherwise
 * every navigation tears the banner down and re-requests it (visible flicker).
 *
 * When AdMob reports no fill on web, the spacer shows an in-house promo so the strip
 * is never just empty space. On native, the spacer height remains stable.
 */
interface NativeBannerAdProps {
  noMargin?: boolean;
}

export function NativeBannerAd({ noMargin = false }: NativeBannerAdProps) {
  const [filled, setFilled] = useState(true);

  useEffect(() => {
    const onFill = (e: Event) => {
      const detail = (e as CustomEvent<{ filled: boolean }>).detail;
      setFilled(detail?.filled !== false);
    };
    window.addEventListener('cuizin_banner_fill', onFill);
    return () => window.removeEventListener('cuizin_banner_fill', onFill);
  }, []);

  if (!filled && !Capacitor.isNativePlatform()) {
    return (
      <div className={noMargin ? '' : 'px-3 pb-2'}>
        <HouseBanner variant="banner" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="shrink-0"
      style={{
        // Screens without bottom tabs sit flush against the system gesture bar,
        // and the native banner is positioned above that inset — so the spacer
        // must reserve the inset too, otherwise the banner covers the last row.
        height: noMargin
          ? 'calc(var(--banner-h, 0px) + env(safe-area-inset-bottom, 0px))'
          : 'var(--banner-h, 0px)',
      }}
    />
  );
}

export default NativeBannerAd;
