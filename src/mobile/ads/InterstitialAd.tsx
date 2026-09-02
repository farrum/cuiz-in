import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { getAdSlotsByPosition } from '@/utils/adService';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { Capacitor } from '@capacitor/core';
import { showAdWithFallback } from './admob';

interface InterstitialAdProps {
  open: boolean;
  onClose: () => void;
  /** Seconds before the ad becomes skippable (5–10). */
  skipSeconds?: number;
  /** Rotates the creative across consecutive shows. */
  seed?: number;
}

/**
 * Full-screen interstitial ad shown between quiz questions.
 * A countdown blocks skipping for `skipSeconds`, then a Skip button appears.
 * Renders nothing if no creative is available for the current user.
 */
export function InterstitialAd({ open, onClose, skipSeconds = 10, seed = 0 }: InterstitialAdProps) {
  const [remaining, setRemaining] = useState(skipSeconds);
  const [hasDbAd, setHasDbAd] = useState(false);
  // No built-in sample creatives: native SDKs or a managed slot only.
  const ad = null as null | { bg: string; sample?: boolean; headline: string; body: string; cta: string; href?: string };
  // Third-party network creatives (Adsterra / ClickAdilla / VAST) are removed.
  // Interstitials come from AdMob on native, or a managed DB slot on web.
  const hasNetworkAd = false;
  // True while the native AdMob interstitial is on screen (or being
  // requested) — the web overlay must stay hidden in that case.
  const [nativeShowing, setNativeShowing] = useState(false);

  // onClose is usually an inline arrow from the parent, so its identity changes
  // on every render. Keeping it in effect deps made the native-ad effect tear
  // down and re-run continuously: each pass fired ANOTHER showAdWithFallback()
  // and toggled state, which re-rendered, which re-ran the effect… That request
  // storm is what produced the white flash and the runaway flickering.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = useCallback(() => onCloseRef.current(), []);

  // Guards so each "open" transition triggers exactly one ad request / one close.
  const requestedFor = useRef<number | null>(null);
  const closedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      requestedFor.current = null;
      closedFor.current = null;
      setNativeShowing(false);
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      setNativeShowing(false);
      return;
    }
    if (requestedFor.current === seed) return; // already requested for this show
    requestedFor.current = seed;

    let cancelled = false;
    setNativeShowing(true);
    showAdWithFallback('interstitial')
      .catch(() => false)
      .then(() => {
        if (cancelled) return;
        setNativeShowing(false);
        if (closedFor.current === seed) return;
        closedFor.current = seed;
        close();
      });
    return () => {
      cancelled = true;
    };
  }, [open, seed, close]);

  useEffect(() => {
    if (open) {
      const dbAds = getAdSlotsByPosition('app-interstitial');
      setHasDbAd(dbAds && dbAds.length > 0);
    } else {
      setHasDbAd(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || (!ad && !hasDbAd && !hasNetworkAd)) return;
    setRemaining(skipSeconds);
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { window.clearInterval(t); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [open, ad, hasDbAd, skipSeconds, seed]);

  // If there's nothing to show, resolve once so the quiz keeps flowing.
  useEffect(() => {
    if (!open || Capacitor.isNativePlatform()) return;
    if (ad || hasDbAd || hasNetworkAd) return;
    if (closedFor.current === seed) return;
    closedFor.current = seed;
    close();
  }, [open, seed, hasDbAd, close]);

  const canSkip = remaining <= 0;

  return (
    <AnimatePresence>
      {/* Native transition scrim: covers the screen seamlessly during the 400ms–1000ms window
          while the native Android ad Activity is starting, eliminating the white screen. */}
      {Capacitor.isNativePlatform() && open && nativeShowing && (
        <motion.div
          key="native-ad-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#0c0a09] text-white select-none px-6"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative mb-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-900/40 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <Shield className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            </motion.div>
          </div>

          <h3 className="text-base font-black tracking-wider text-amber-200 uppercase mb-1 font-serif">
            Royal Challenge
          </h3>
          <p className="text-xs text-stone-400 font-medium tracking-wide">
            Preparing your scroll...
          </p>
        </motion.div>
      )}

      {!Capacitor.isNativePlatform() && open && !nativeShowing && (hasDbAd || ad || hasNetworkAd) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {hasDbAd ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-black/90 text-white relative">
              <div className="absolute top-3 left-3 text-[10px] font-bold uppercase bg-black/50 px-2 py-1 rounded">
                Ad
              </div>
              <div className="absolute top-3 right-3">
                {canSkip ? (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full"
                  >
                    Skip <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-full">
                    Skip in {remaining}s
                  </span>
                )}
              </div>
              
              <div className="w-full max-w-sm p-4 bg-white rounded-2xl flex justify-center items-center shadow-2xl overflow-hidden">
                <SimpleAdBanner position="app-interstitial" />
              </div>
            </div>
          ) : (
            ad && (
              <div className={`flex-1 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br ${ad.bg} text-white relative`}>
                {/* Label + skip control */}
                <div className="absolute top-3 left-3 text-[10px] font-bold uppercase bg-black/30 px-2 py-1 rounded">
                  {ad.sample ? 'Sample Ad' : 'Ad'}
                </div>
                <div className="absolute top-3 right-3">
                  {canSkip ? (
                    <button
                      onClick={onClose}
                      className="flex items-center gap-1 text-xs font-semibold bg-black/30 hover:bg-black/40 px-3 py-1.5 rounded-full"
                    >
                      Skip <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold bg-black/30 px-3 py-1.5 rounded-full">
                      Skip in {remaining}s
                    </span>
                  )}
                </div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="max-w-sm"
                >
                  <h2 className="text-3xl font-extrabold mb-4 leading-tight">{ad.headline}</h2>
                  <p className="text-base opacity-90 mb-8">{ad.body}</p>
                  <a
                    href={ad.href || undefined}
                    target={ad.href ? '_blank' : undefined}
                    rel={ad.href ? 'noopener noreferrer' : undefined}
                    className="inline-block bg-white text-foreground font-bold px-8 py-3 rounded-full shadow-lg"
                  >
                    {ad.cta}
                  </a>
                </motion.div>
              </div>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default InterstitialAd;