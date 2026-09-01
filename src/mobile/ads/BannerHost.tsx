import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  hideAdMobBanner,
  resumeAdMobBanner,
  showAdMobBanner,
  suspendAdMobBanner,
} from './admob';

/**
 * Determines if a route should show the native AdMob banner.
 */
function shouldShowBannerForRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const bannerRoutes = [
    '/hub',
    '/leaderboard',
    '/hall',
    '/profile',
    '/settings',
    '/herald',
    '/shop',
    '/empire-quests',
    '/quests',
    '/kingdoms',
    '/team-dashboard',
    '/quiz',
    '/daily',
    '/minigames',
    '/game'
  ];
  return bannerRoutes.some(route => p === route || p.startsWith(route + '/') || p === '/');
}

/**
 * Determines if the route displays bottom tabs (requiring a 70px margin offset).
 */
function shouldShowTabsForRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const tabRoutes = [
    '/hub',
    '/leaderboard',
    '/hall',
    '/profile',
    '/settings',
    '/herald',
    '/shop',
    '/empire-quests',
    '/quests',
    '/kingdoms',
    '/team-dashboard'
  ];
  return tabRoutes.some(route => p === route || p.startsWith(route + '/') || p === '/');
}

const TAB_BAR_MARGIN = 70; // 62px bottom tabs + 8px floating safe margin
const SAFE_BOTTOM_MARGIN = 0; // Stick to bottom above system nav on full-screen quiz/game routes

/**
 * Owns the AdMob banner surface for the entire app session.
 * Monitors router path changes and manages banner visibility and margins cleanly.
 */
export function BannerHost() {
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    let retryTimer: number | undefined;
    let attempt = 0;

    const announceFill = (filled: boolean) => {
      window.dispatchEvent(
        new CustomEvent('cuizin_banner_fill', { detail: { filled } })
      );
    };

    const requestBanner = async (margin: number, forceRefresh = false) => {
      const shown = await showAdMobBanner(margin, forceRefresh);
      if (!isMounted) return;
      if (shown) {
        announceFill(true);
        return;
      }
      if (attempt >= 3) {
        // AdMob never delivered (no fill / init failure): let the layout show
        // an in-house promo instead of an empty strip.
        announceFill(false);
        return;
      }
      attempt += 1;
      // Retry no-fill/transient SDK startup failures without churning native views.
      retryTimer = window.setTimeout(() => void requestBanner(margin, false), 10_000);
    };

    const timer = setTimeout(() => {
      if (!isMounted) return;
      const show = shouldShowBannerForRoute(location.pathname);

      if (show) {
        document.documentElement.style.setProperty('--banner-h', '56px');
        const hasTabs = shouldShowTabsForRoute(location.pathname);
        const margin = hasTabs ? TAB_BAR_MARGIN : SAFE_BOTTOM_MARGIN;
        void requestBanner(margin, true);
      } else {
        document.documentElement.style.setProperty('--banner-h', '0px');
        announceFill(true);
        void hideAdMobBanner();
      }
    }, 80);


    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [location.pathname]);

  useEffect(() => {
    const background = () => void suspendAdMobBanner();
    const foreground = () => void resumeAdMobBanner();
    window.addEventListener('cuizin_app_background', background);
    window.addEventListener('cuizin_app_foreground', foreground);
    return () => {
      window.removeEventListener('cuizin_app_background', background);
      window.removeEventListener('cuizin_app_foreground', foreground);
    };
  }, []);

  // Hide the banner when host component unmounts
  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty('--banner-h', '0px');
      void hideAdMobBanner();
    };
  }, []);

  return null;
}

export default BannerHost;
