import { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { showAdWithFallback } from '@/mobile/ads/admob';

/**
 * Full-screen video ad for mini-game rewards.
 *
 * Native builds: Google AdMob (rewarded → rewarded-interstitial), falling back
 * to Unity LevelPlay via `showAdWithFallback`. Both SDKs render their own
 * full-screen surface with their own skip timer — we never draw an overlay.
 *
 * Web/preview builds: no third-party video ad is shown at all (the old VAST
 * overlay has been removed); the reward callback fires immediately.
 */
export const useMiniGameVideoAd = () => {
  const [adActive, setAdActive] = useState(false);
  const inFlight = useRef(false);

  const showVideoAd = (callback: (shown: boolean) => void) => {
    if (inFlight.current) return;

    if (!Capacitor.isNativePlatform()) {
      callback(false);
      return;
    }

    inFlight.current = true;
    setAdActive(true);
    showAdWithFallback('interstitial')
      .catch(() => false)
      .then((shown) => {
        inFlight.current = false;
        setAdActive(false);
        callback(Boolean(shown));
      });
  };

  // Native SDKs own their UI — nothing to render from React.
  const adElement = null;

  return { showVideoAd, adElement, adActive };
};
