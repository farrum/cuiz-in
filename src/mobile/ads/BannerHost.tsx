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
 * Activated on:
 * - Homepage ('/hub', '/')
 * - Quiz pages ('/quiz', '/daily')
 * - Quest pages ('/empire-quests', '/quests')
 * - Profile pages ('/profile', '/settings')
 * - Team & Leaderboard pages ('/team-dashboard', '/kingdoms', '/leaderboard')
 * - Shop & Mini-Games ('/shop', '/minigames', '/game')
 */
function shouldShowBannerForRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const bannerRoutes = [
    '/hub',
    '/leaderboard',
    '/profile',
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
 * Determines if the route displays bottom tabs (requiring a 76px margin offset).
 */
function shouldShowTabsForRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const tabRoutes = [
    '/hub',
    '/leaderboard',
    '/profile',
    '/shop',
    '/empire-quests',
    '/quests',
    '/kingdoms',
    '/team-dashboard'
  ];
  return tabRoutes.some(route => p === route || p.startsWith(route + '/'));
}

const TAB_BAR_MARGIN = 76; // 68px tab bar + 8px safe margin
const SAFE_BOTTOM_MARGIN = 8;

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

    const requestBanner = async (margin: number) => {
      const shown = await showAdMobBanner(margin);
      if (!isMounted || shown || attempt >= 2) return;
      attempt += 1;
      // Retry no-fill/transient SDK startup failures without churning native views.
      retryTimer = window.setTimeout(() => void requestBanner(margin), 15_000);
    };

    const timer = setTimeout(() => {
      if (!isMounted) return;
      const show = shouldShowBannerForRoute(location.pathname);

      if (show) {
        const hasTabs = shouldShowTabsForRoute(location.pathname);
        const margin = hasTabs ? TAB_BAR_MARGIN : SAFE_BOTTOM_MARGIN;
        void requestBanner(margin);
      } else {
        void hideAdMobBanner();
      }
    }, 120);

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
      void hideAdMobBanner();
    };
  }, []);

  return null;
}

export default BannerHost;
