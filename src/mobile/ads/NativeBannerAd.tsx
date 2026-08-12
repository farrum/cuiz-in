import { useEffect, useRef, useState } from 'react';
import { hideAdMobBanner, showAdMobBanner } from './admob';
import { hideLevelPlayBanner, showLevelPlayBanner } from './levelplay';

/**
 * Native banner slot. Tries Google AdMob first and falls back to Unity
 * LevelPlay if AdMob fails to fill. Both SDKs overlay the banner outside the
 * WebView, so we render an empty spacer to reserve the layout height.
 */
interface NativeBannerAdProps {
  noMargin?: boolean;
}

export function NativeBannerAd({ noMargin = false }: NativeBannerAdProps) {
  const usedLevelPlay = useRef(false);
  const [, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    showAdMobBanner(() => {
      if (cancelled) return;
      usedLevelPlay.current = true;
      showLevelPlayBanner();
    }).then(() => !cancelled && setReady(true));

    return () => {
      cancelled = true;
      hideAdMobBanner();
      if (usedLevelPlay.current) hideLevelPlayBanner();
    };
  }, []);

  return <div aria-hidden className={`h-[50px] shrink-0 ${noMargin ? '' : 'mb-10'}`} />;
}

export default NativeBannerAd;
