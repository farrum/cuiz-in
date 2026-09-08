import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { getAdSlotsByPosition } from '@/utils/adService';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { Capacitor } from '@capacitor/core';
import { showInterstitial } from './adManager';

interface InterstitialAdProps {
  open: boolean;
  onClose: () => void;
  skipSeconds?: number;
  seed?: number;
}

/**
 * Interstitial ad overlay. On native, invokes LevelPlay with a fast failsafe
 * timeout so that gameplay is never blocked if inventory is not ready.
 */
export function InterstitialAd({ open, onClose, skipSeconds = 5, seed = 0 }: InterstitialAdProps) {
  const [remaining, setRemaining] = useState(skipSeconds);
  const [hasDbAd, setHasDbAd] = useState(false);
  const [nativeShowing, setNativeShowing] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = useCallback(() => onCloseRef.current(), []);

  const requestedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      requestedFor.current = null;
      setNativeShowing(false);
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      setNativeShowing(false);
      return;
    }

    if (requestedFor.current === seed) return;
    requestedFor.current = seed;

    let cancelled = false;
    setNativeShowing(true);

    showInterstitial(1500)
      .catch(() => false)
      .then(() => {
        if (cancelled) return;
        setNativeShowing(false);
        close();
      });

    return () => {
      cancelled = true;
    };
  }, [open, seed, close]);

  useEffect(() => {
    if (open && !Capacitor.isNativePlatform()) {
      const dbAds = getAdSlotsByPosition('app-interstitial');
      setHasDbAd(dbAds && dbAds.length > 0);
    } else {
      setHasDbAd(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !hasDbAd) return;
    setRemaining(skipSeconds);
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [open, hasDbAd, skipSeconds, seed]);

  // If on web and no ad exists, close immediately
  useEffect(() => {
    if (!open || Capacitor.isNativePlatform()) return;
    if (!hasDbAd) {
      close();
    }
  }, [open, hasDbAd, close]);

  const canSkip = remaining <= 0;

  return (
    <AnimatePresence>
      {/* Native transition scrim: matches parchment background smoothly */}
      {Capacitor.isNativePlatform() && open && nativeShowing && (
        <motion.div
          key="native-ad-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center select-none px-6"
          style={{
            backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="relative mb-3">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-md shadow-amber-500/10"
            >
              <Shield className="w-7 h-7 text-amber-700" />
            </motion.div>
          </div>

          <h3 className="text-sm font-black tracking-wider text-amber-900 uppercase mb-1 font-serif">
            Royal Challenge
          </h3>
          <p className="text-xs text-amber-800/70 font-semibold tracking-wide">
            Preparing your scroll...
          </p>
        </motion.div>
      )}

      {/* Web fallback modal */}
      {!Capacitor.isNativePlatform() && open && !nativeShowing && hasDbAd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/80 text-white"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative">
            <div className="absolute top-4 left-4 text-[10px] font-black uppercase bg-white/20 px-2.5 py-1 rounded-full">
              Sponsor
            </div>
            <div className="absolute top-4 right-4">
              {canSkip ? (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
                >
                  Skip <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full tabular-nums">
                  Skip in {remaining}s
                </span>
              )}
            </div>

            <div className="w-full max-w-sm p-4 bg-white rounded-2xl flex justify-center items-center shadow-2xl overflow-hidden text-slate-800">
              <SimpleAdBanner position="app-interstitial" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InterstitialAd;