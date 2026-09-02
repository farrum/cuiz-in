import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';
import {
  hideAdMobBanner,
  listenForBannerState,
  resumeAdMobBanner,
  showAdMobBanner,
  suspendAdMobBanner,
  isFullScreenAdActive,
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
 * Determines if the route displays bottom tabs.
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

const DEFAULT_BANNER_HEIGHT = 50;

function measureBottomOffset(hasTabs: boolean): number {
  if (hasTabs) {
    const tabs = document.getElementById('mobile-bottom-tabs');
    if (tabs) return Math.max(0, Math.round(tabs.getBoundingClientRect().height));
  }

  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  const inset = Math.max(0, Math.round(parseFloat(getComputedStyle(probe).paddingBottom) || 0));
  probe.remove();
  return inset;
}

/**
 * Owns the AdMob banner surface for the entire app session.
 * Monitors router path changes and manages banner visibility and margins cleanly.
 */
export function BannerHost() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    let handle: Awaited<ReturnType<typeof listenForBannerState>> = null;

    void listenForBannerState((event) => {
      if (disposed) return;
      // If the banner is temporarily hidden (e.g. during a full-screen interstitial),
      // do NOT collapse the layout space to 0px — that causes the viewport to jump and flicker.
      if (event.state === 'hidden' && shouldShowBannerForRoute(location.pathname)) {
        return;
      }
      const filled = event.state === 'loaded';
      const height = filled ? Math.max(1, event.heightDp || DEFAULT_BANNER_HEIGHT) : (shouldShowBannerForRoute(location.pathname) ? DEFAULT_BANNER_HEIGHT : 0);
      document.documentElement.style.setProperty('--banner-h', `${height}px`);
      window.dispatchEvent(new CustomEvent('cuizin_banner_fill', { detail: { filled } }));
    }).then((listenerHandle) => {
      if (disposed) void listenerHandle?.remove();
      else handle = listenerHandle;
    });

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, [location.pathname]);

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
      if (shown) return; // native loaded/failed event owns visible fill state
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
        // Reserve the standard height while the first creative is loading; the
        // native loaded event replaces this with the actual adaptive height.
        document.documentElement.style.setProperty('--banner-h', `${DEFAULT_BANNER_HEIGHT}px`);
        const hasTabs = shouldShowTabsForRoute(location.pathname);
        const margin = measureBottomOffset(hasTabs);
        void requestBanner(margin, false);
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
    const background = () => {
      // Do not suspend the banner if the app state change is just an interstitial video opening
      if (!isFullScreenAdActive()) {
        void suspendAdMobBanner();
      }
    };
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
