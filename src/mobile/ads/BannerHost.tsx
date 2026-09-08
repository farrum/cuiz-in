import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';
import {
  hideBanner,
  listenForBannerState,
  resumeBanner,
  showBanner,
  suspendBanner,
  isFullScreenAdActive,
} from './adManager';

function shouldShowBannerForRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  const nonBannerRoutes = ['/onboarding', '/login'];
  if (nonBannerRoutes.some(r => p === r || p.startsWith(r + '/'))) {
    return false;
  }
  return true;
}

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
    '/team-dashboard',
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
 * Owns the native ad banner surface for the mobile app session.
 * Keeps banner dimensions stable to eliminate layout shift and screen flickering.
 */
export function BannerHost() {
  const location = useLocation();
  const lastRequestedPath = useRef<string>('');

  // Native banner listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    let handle: Awaited<ReturnType<typeof listenForBannerState>> = null;

    void listenForBannerState((event) => {
      if (disposed) return;
      const filled = event.state === 'loaded';
      window.dispatchEvent(new CustomEvent('cuizin_banner_fill', { detail: { filled } }));
    }).then((listenerHandle) => {
      if (disposed) void listenerHandle?.remove();
      else handle = listenerHandle;
    });

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, []);

  // Route change handler
  useEffect(() => {
    const show = shouldShowBannerForRoute(location.pathname);

    if (show) {
      document.documentElement.style.setProperty('--banner-h', `${DEFAULT_BANNER_HEIGHT}px`);
      if (!Capacitor.isNativePlatform()) return;

      if (isFullScreenAdActive()) return;

      const timer = setTimeout(() => {
        const hasTabs = shouldShowTabsForRoute(location.pathname);
        const margin = measureBottomOffset(hasTabs);
        lastRequestedPath.current = location.pathname;
        void showBanner(margin, false);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      document.documentElement.style.setProperty('--banner-h', '0px');
      if (Capacitor.isNativePlatform()) {
        void hideBanner();
      }
    }
  }, [location.pathname]);

  // Handle app background/foreground
  useEffect(() => {
    const onBackground = () => {
      if (!isFullScreenAdActive()) void suspendBanner();
    };
    const onForeground = () => {
      if (!isFullScreenAdActive() && shouldShowBannerForRoute(location.pathname)) {
        void resumeBanner();
      }
    };
    window.addEventListener('cuizin_app_background', onBackground);
    window.addEventListener('cuizin_app_foreground', onForeground);
    return () => {
      window.removeEventListener('cuizin_app_background', onBackground);
      window.removeEventListener('cuizin_app_foreground', onForeground);
    };
  }, [location.pathname]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      void hideBanner();
    };
  }, []);

  return null;
}

export default BannerHost;
