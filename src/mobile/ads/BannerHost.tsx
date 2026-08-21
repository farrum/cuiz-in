import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { hideAdMobBanner, showAdMobBanner, isAdMobBannerShown } from './admob';

/**
 * Helper to determine if a route should show the bottom native banner ad.
 * Banner routes correspond to screens displayed inside the main MobileShell (with bottom tabs).
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
    '/team-dashboard'
  ];
  return bannerRoutes.some(route => p === route || p.startsWith(route + '/'));
}

/**
 * Owns the native banner surface for the whole app session.
 * Monitors router path changes and toggles banner visibility.
 * If moving between banner-eligible routes, the banner remains visible
 * without being destroyed and recreated, eliminating visual flashes/flickering.
 */
export function BannerHost() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const manageBanner = async () => {
      const show = shouldShowBannerForRoute(location.pathname);
      const isShown = isAdMobBannerShown();

      if (show && !isShown) {
        console.log('[BannerHost] Entering banner-eligible route, showing native banner');
        await showAdMobBanner();
      } else if (!show && isShown) {
        console.log('[BannerHost] Entering full-screen route, hiding native banner');
        await hideAdMobBanner();
      }
    };

    void manageBanner();
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
