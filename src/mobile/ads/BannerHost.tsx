import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { hideAdMobBanner, showAdMobBanner, isAdMobBannerShown } from './admob';

/**
 * Helper to determine if a route should show the bottom native banner ad.
 */
function shouldShowBannerForRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const bannerRoutes = [
    '/hub',
    '/leaderboard',
    '/profile',
    '/shop',
    '/empire-quests',
    '/kingdoms',
    '/team-dashboard',
    '/quiz',
    '/daily',
    '/minigames',
    '/game'
  ];
  return bannerRoutes.some(route => p === route || p.startsWith(route + '/'));
}

/**
 * Helper to determine if the route displays bottom tabs (requiring a 76px margin offset).
 */
function shouldShowTabsForRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const tabRoutes = [
    '/hub',
    '/leaderboard',
    '/profile',
    '/shop',
    '/empire-quests',
    '/kingdoms',
    '/team-dashboard'
  ];
  return tabRoutes.some(route => p === route || p.startsWith(route + '/'));
}

const TAB_BAR_MARGIN = 76; // 68px tab bar + 8px safe margin
const SAFE_BOTTOM_MARGIN = 8;

/**
 * Owns the native banner surface for the whole app session.
 * Monitors router path changes and toggles banner visibility cleanly.
 */
export function BannerHost() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      const show = shouldShowBannerForRoute(location.pathname);
      const isShown = isAdMobBannerShown();

      if (show) {
        const hasTabs = shouldShowTabsForRoute(location.pathname);
        const margin = hasTabs ? TAB_BAR_MARGIN : SAFE_BOTTOM_MARGIN;
        void showAdMobBanner(margin);
      } else if (isShown) {
        void hideAdMobBanner();
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [location.pathname]);

  // Hide the banner when this host component is unmounted
  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform()) {
        void hideAdMobBanner();
      }
    };
  }, []);

  return null;
}

export default BannerHost;
