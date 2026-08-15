import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { motion } from 'framer-motion';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenSkeleton } from '@/mobile/components/ScreenSkeleton';

export function MobileShell() {
  const location = useLocation();
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
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
      <TopBannerAd />
      <BottomTabs />
    </div>
  );
}

export default MobileShell;