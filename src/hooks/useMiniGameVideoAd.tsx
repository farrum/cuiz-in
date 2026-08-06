import { useState, useEffect } from 'react';
import { VastVideoAd } from '@/mobile/ads/VastVideoAd';
import { isNativeAds, showLevelPlayRewarded } from '@/mobile/ads/levelplay';

const SKIP_SECONDS = 10;

export const useMiniGameVideoAd = () => {
  const [adActive, setAdActive] = useState(false);
  const [onAdComplete, setOnAdComplete] = useState<(() => void) | null>(null);
  const [remaining, setRemaining] = useState(SKIP_SECONDS);
  const [pendingClose, setPendingClose] = useState(false);

  useEffect(() => {
    if (!adActive) return;
    setRemaining(SKIP_SECONDS);
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { window.clearInterval(t); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [adActive]);

  const canSkip = remaining <= 0;

  const showVideoAd = (callback: () => void) => {
    // Native builds: use the Unity LevelPlay rewarded placement. The web
    // VAST overlay is only used as a fallback when no native ad is available.
    if (isNativeAds()) {
      showLevelPlayRewarded().then(({ shown }) => {
        if (shown) {
          callback();
        } else {
          setOnAdComplete(() => callback);
          setPendingClose(false);
          setAdActive(true);
        }
      });
      return;
    }
    setOnAdComplete(() => callback);
    setPendingClose(false);
    setAdActive(true);
  };

  const handleComplete = () => {
    setAdActive(false);
    setPendingClose(false);
    if (onAdComplete) {
      onAdComplete();
    }
  };

  // If the video ends or has no inventory before the 5s minimum elapses,
  // close automatically as soon as the skip window opens.
  const markFinished = () => {
    if (canSkip) handleComplete();
    else setPendingClose(true);
  };

  useEffect(() => {
    if (adActive && canSkip && pendingClose) handleComplete();
  }, [adActive, canSkip, pendingClose]);

  const adElement = adActive ? (
    <div className="fixed inset-0 z-[99999] bg-black/95 flex flex-col items-center justify-center p-4" data-no-auto-ads="true">
      <div className="w-full max-w-lg flex items-center justify-between mb-4 px-2 text-white">
        <span className="text-xs font-black tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full text-slate-300">
          Sponsored Ad
        </span>
        {canSkip ? (
          <button
            onClick={handleComplete}
            className="text-xs font-semibold bg-white/10 text-slate-400 hover:text-white px-4 py-2 rounded-full transition-all"
          >
            Skip Ad
          </button>
        ) : (
          <span className="text-xs font-semibold bg-white/10 text-slate-400 px-4 py-2 rounded-full">
            Skip in {remaining}s
          </span>
        )}
      </div>
      <div className="w-full max-w-lg bg-black border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center min-h-[250px] shadow-2xl relative">
        <VastVideoAd
          tagUrl="https://vast.yomeno.xyz/vast?spot_id=1494657"
          onReady={() => console.log('Video ad loaded')}
          onUnavailable={markFinished}
          onComplete={markFinished}
          className="w-full max-h-[60vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  ) : null;

  return { showVideoAd, adElement, adActive };
};
