import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenSkeleton } from '@/mobile/components/ScreenSkeleton';
import { NativeBannerAd } from '../ads/NativeBannerAd';

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
 * NativeBannerAd only reserves the matching space and supplies the no-fill
 * house fallback; it never starts or stops the native SDK surface.
 */
export function MobileShell() {
  const location = useLocation();
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden living-sky"
      style={{
        paddingTop: 'var(--safe-top)',
        /* Living sky: slowly morphs through warm parchment → golden dusk → cool
           twilight over a 12 s cycle. The skyShift keyframe in index.css drives
           background-position across the 300%-wide gradient. */
        background: 'linear-gradient(160deg, hsl(38 65% 94%), hsl(30 75% 88%), hsl(24 60% 86%), hsl(210 45% 92%), hsl(38 65% 94%))',
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
      <NativeBannerAd />
      <BottomTabs />
    </div>
  );
}


export default MobileShell;