import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenSkeleton } from '@/mobile/components/ScreenSkeleton';

export function MobileShell() {
  const location = useLocation();
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-background">
        {/* No `mode="wait"`: waiting for the exit animation leaves an empty
            pane between screens, which reads as a blank-screen flicker. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-full"
          >
            <ErrorBoundary compact resetKey={location.pathname}>
              <Suspense fallback={<ScreenSkeleton />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
      <TopBannerAd />
      <BottomTabs />
    </div>
  );
}

export default MobileShell;