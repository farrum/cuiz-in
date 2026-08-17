import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenSkeleton } from '@/mobile/components/ScreenSkeleton';

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
      className="fixed inset-0 flex flex-col overflow-hidden bg-background"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-background">
        {/* No AnimatePresence exit: waiting for the outgoing screen to animate
            away leaves an empty pane between routes, which reads as a
            blank-screen flicker. The new screen simply fades in. */}
        {/* No key on the wrapper: keying by pathname remounted the whole
            subtree on every navigation, which re-ran the fade from opacity 0
            and read as a flicker. */}
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="min-h-full"
        >
          <ErrorBoundary compact resetKey={location.pathname}>
            <Suspense fallback={<ScreenSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </div>
      {/* Banner spacer: the AdMob/LevelPlay banner is drawn by BannerHost
          outside the WebView at this physical position. This div reserves
          the exact same height so scroll content is never hidden under it.
          --banner-h defaults to 50px and is updated dynamically when the
          SDK fires bannerAdSizeChanged with the actual rendered height. */}
      <div aria-hidden className="shrink-0 h-[var(--banner-h)]" />
      <BottomTabs />
    </div>
  );
}

export default MobileShell;