import { useEffect, useState } from 'react';
import HouseBanner from '@/components/ads/HouseBanner';

interface NativeBannerAdProps {
  noMargin?: boolean;
}

/**
 * Banner ad slot. If native LevelPlay/Unity ad is loaded, reserves the exact
 * height for the native banner overlay. If no native ad feed is available,
 * gracefully falls back to a CuizIN in-house promo banner so the user never
 * sees an empty, broken blank space.
 */
export function NativeBannerAd({ noMargin = false }: NativeBannerAdProps) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const onFill = (e: Event) => {
      const detail = (e as CustomEvent<{ filled: boolean }>).detail;
      setFilled(detail?.filled === true);
    };
    window.addEventListener('cuizin_banner_fill', onFill);
    return () => window.removeEventListener('cuizin_banner_fill', onFill);
  }, []);

  return (
    <div
      className="shrink-0 w-full overflow-hidden transition-all duration-200"
      style={{
        minHeight: 'var(--banner-h, 50px)',
        marginBottom: noMargin ? 'env(safe-area-inset-bottom, 0px)' : undefined,
      }}
    >
      {!filled && (
        <div className={noMargin ? 'w-full' : 'px-3 pb-1'}>
          <HouseBanner variant="banner" />
        </div>
      )}
    </div>
  );
}

export default NativeBannerAd;
