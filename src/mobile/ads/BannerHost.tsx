import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { hideAdMobBanner, showAdMobBanner, isAdMobBannerShown } from './admob';
import { hideLevelPlayBanner, showLevelPlayBanner, isLevelPlayBannerShown } from './levelplay';

/**
 * Owns the *single* native banner surface for the whole app session.
 *
 * Mounted once from AppMobile and never unmounted during navigation. Screens
 * used to each mount their own banner component, so every route change ran
 * removeBanner() followed by showBanner() — a visible flash, a layout jump and
 * a fresh ad request each time. Screens now only reserve layout height.
 * 
 * This component listens to router path changes and refreshes the native ad
 * on navigation, keeping the spacer --banner-h constant to prevent the WebView from jumping.
 */
export function BannerHost() {
  const location = useLocation();
  const firstRender = useRef(true);

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

  // Refresh native ad on route change
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    // Skip the first render since initial load effect handles it
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const refreshBanner = async () => {
      console.log('[BannerHost] Route changed, refreshing native ad banner');
      const wasLevelPlay = isLevelPlayBannerShown();

      if (isAdMobBannerShown()) {
        try {
          await hideAdMobBanner(true);
        } catch {}
      }
      
      if (wasLevelPlay) {
        try {
          await hideLevelPlayBanner(true);
        } catch {}
      }

      showAdMobBanner(() => {
        void showLevelPlayBanner();
      });
    };

    void refreshBanner();
  }, [location.pathname]);

  return null;
}

export default BannerHost;
