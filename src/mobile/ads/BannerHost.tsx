import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';
import {
  hideAdMobBanner,
  showAdMobBanner,
  setAdMobBannerMargin,
  setAdMobBannerFailedHandler,
} from './admob';
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
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let usedLevelPlay = false;

    const onFailed = () => {
      usedLevelPlay = true;
      void showLevelPlayBanner();
    };
    setAdMobBannerFailedHandler(onFailed);
    showAdMobBanner(onFailed);

    return () => {
      void hideAdMobBanner();
      if (usedLevelPlay) void hideLevelPlayBanner();
    };
  }, []);

  // Keep the banner glued to the top edge of the route's bottom chrome
  // (tab bar or screen footer) so there is never a gap underneath it.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let raf = 0;
    const measure = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-bottom-chrome]')
      ).filter((n) => n.offsetParent !== null);
      const offset = nodes.reduce((max, n) => {
        const rect = n.getBoundingClientRect();
        return Math.max(max, window.innerHeight - rect.top);
      }, 0);
      void setAdMobBannerMargin(offset);
    };
    raf = window.setTimeout(measure, 250) as unknown as number;
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(raf);
      window.removeEventListener('resize', measure);
    };
  }, [location.pathname]);

  return null;
}

export default BannerHost;
