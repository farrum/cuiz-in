import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';

export function MobileShell() {
  const location = useLocation();
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
      <TopBannerAd />
      <BottomTabs />
    </div>
  );
}

export default MobileShell;