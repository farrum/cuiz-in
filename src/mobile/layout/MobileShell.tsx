import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenSkeleton } from '@/mobile/components/ScreenSkeleton';
import { TopBannerAd } from '../ads/TopBannerAd';

/**
 * MobileShell — root layout wrapper for all shell routes (Hub, Profile, etc.)
 *
 * Layout stack (top → bottom):
 *   [Status bar]          → covered by paddingTop: var(--safe-top) on the outer div
 *   [Screen content]      → flex-1 overflow-y-auto scroller
 *   [Banner spacer]       → h-[var(--banner-h)]  (native SDK banner drawn above this by BannerHost)
 *   [BottomTabs]          → fixed height ~68px + env(safe-area-inset-bottom)
 *
 * The native banner is managed by BannerHost (mounted once in AppMobile).
 * It is drawn OUTSIDE the WebView by the AdMob SDK. We never mount TopBannerAd
 * here — the NativeBannerAd spacer (h-[var(--banner-h)]) is all that's needed
 * to prevent scroll content from being hidden behind the SDK banner surface.
 */
export function MobileShell() {
  const location = useLocation();
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        paddingTop: 'var(--safe-top)',
        /* Pre-paint the same warm parchment gradient every screen uses.
           This prevents a white flash when a Suspense boundary fires
           because bg-background (white) would show until the chunk loads. */
        background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(24 49% 88%) 50%, hsl(200 40% 90%) 100%)',
      }}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* No AnimatePresence exit: waiting for the outgoing screen to animate
            away leaves an empty pane between routes, which reads as a
            blank-screen flicker. The new screen simply fades in. */}
        {/* No key on the wrapper: keying by pathname remounted the whole
            subtree on every navigation, which re-ran the fade from opacity 0
            and read as a flicker. */}
        <div className="min-h-full">
          <ErrorBoundary compact resetKey={location.pathname}>
            <Suspense fallback={<ScreenSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
      <TopBannerAd />
      <BottomTabs />
    </div>
  );
}


export default MobileShell;