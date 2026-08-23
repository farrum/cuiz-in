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
 * Helper to determine if the route displays bottom tabs (requiring a 68px margin offset).
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

function getSafeBottomOnly(): number {
  try {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:0;left:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;';
    document.body.appendChild(el);
    const safeBottom = el.offsetHeight || 0;
    document.body.removeChild(el);
    return safeBottom;
  } catch {
    return 0;
  }
}

function getBottomMargin(): number {
  try {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:0;left:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;';
    document.body.appendChild(el);
    const safeBottom = el.offsetHeight || 0;
    document.body.removeChild(el);
    return Math.max(68, 68 + safeBottom);
  } catch {
    return 80;
  }
}

/**
 * Owns the native banner surface for the whole app session.
 * Monitors router path changes and toggles banner visibility.
 * If moving between banner-eligible routes, the banner remains visible
 * without being destroyed and recreated, adjusting its bottom offset dynamically.
 */
export function BannerHost() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const manageBanner = async () => {
      const show = shouldShowBannerForRoute(location.pathname);
      const isShown = isAdMobBannerShown();

      if (show) {
        const hasTabs = shouldShowTabsForRoute(location.pathname);
        const margin = hasTabs ? getBottomMargin() : getSafeBottomOnly();
        await showAdMobBanner(margin);
      } else if (isShown) {
        console.log('[BannerHost] Hiding native banner');
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

