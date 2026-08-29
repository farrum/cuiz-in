import React, { useCallback, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import QuizInterstitial from '@/components/quiz/QuizInterstitial';
import { showAdWithFallback } from '@/mobile/ads/admob';

/**
 * Rewarded ad for web boosters (double gems, revive streak).
 *
 * Web: shows the existing VAST/display interstitial surface in a modal and
 * grants the reward once the break completes.
 * Native: delegates to the AdMob rewarded unit.
 */
export const useWebRewardedAd = () => {
  const [open, setOpen] = useState(false);
  const callbackRef = useRef<((rewarded: boolean) => void) | null>(null);
  const inFlight = useRef(false);

  const finish = useCallback((rewarded: boolean) => {
    setOpen(false);
    inFlight.current = false;
    const cb = callbackRef.current;
    callbackRef.current = null;
    cb?.(rewarded);
  }, []);

  const showRewardedAd = useCallback(
    (callback: (rewarded: boolean) => void) => {
      if (inFlight.current) return;
      inFlight.current = true;

      if (Capacitor.isNativePlatform()) {
        showAdWithFallback('rewarded')
          .catch(() => false)
          .then((shown) => {
            inFlight.current = false;
            callback(Boolean(shown));
          });
        return;
      }

      callbackRef.current = callback;
      setOpen(true);
    },
    []
  );

  const rewardedAdElement = open ? (
    <div className="fixed inset-0 z-[140] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg">
        <QuizInterstitial onContinue={() => finish(true)} countdownSeconds={10} />
      </div>
    </div>
  ) : null;

  return { showRewardedAd, rewardedAdElement, rewardedAdOpen: open };
};

export default useWebRewardedAd;
