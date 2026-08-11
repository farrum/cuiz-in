import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  type BannerAdOptions,
} from '@capacitor-community/admob';

import { ADMOB_AD_UNITS } from './admob';

const AD_UNIT_ID = ADMOB_AD_UNITS.banner;
// Google's official test unit — used automatically in dev builds.
const TEST_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

let initialized = false;
async function ensureInit() {
  if (initialized) return;
  await AdMob.initialize({ initializeForTesting: false });
  initialized = true;
}

/**
 * Native AdMob banner. Renders nothing in the DOM — the banner is
 * overlaid by the native SDK at the configured position. Returns null
 * on non-native platforms so the web fallback can render instead.
 */
export function AdMobBanner() {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;

    (async () => {
      try {
        await ensureInit();
        if (cancelled) return;
        const options: BannerAdOptions = {
          adId: import.meta.env.DEV ? TEST_AD_UNIT_ID : AD_UNIT_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 56, // sit above the bottom tab bar
          isTesting: import.meta.env.DEV,
        };
        await AdMob.showBanner(options);
        shownRef.current = true;
      } catch (e) {
        console.warn('[AdMob] banner failed to show', e);
      }
    })();

    return () => {
      cancelled = true;
      if (shownRef.current) {
        AdMob.removeBanner().catch(() => {});
        shownRef.current = false;
      }
    };
  }, []);

  return null;
}

export default AdMobBanner;