import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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