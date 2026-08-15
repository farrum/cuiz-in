import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { hideAdMobBanner, showAdMobBanner } from './admob';
import { hideLevelPlayBanner, showLevelPlayBanner } from './levelplay';

/**
 * Owns the *single* native banner surface for the whole app session.
 *
 * Mounted once from AppMobile and never unmounted during navigation. Screens
 * used to each mount their own banner component, so every route change ran
 * removeBanner() followed by showBanner() — a visible flash, a layout jump and
 * a fresh ad request each time. Screens now only reserve layout height.
 */
export function BannerHost() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let usedLevelPlay = false;

    showAdMobBanner(() => {
      usedLevelPlay = true;
      void showLevelPlayBanner();
    });

    return () => {
      void hideAdMobBanner();
      if (usedLevelPlay) void hideLevelPlayBanner();
    };
  }, []);

  return null;
}

export default BannerHost;
