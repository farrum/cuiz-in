import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { getAdSlotsByPosition } from '@/utils/adService';
import { Capacitor } from '@capacitor/core';
import ProxiedVastVideoAd from '@/components/ads/ProxiedVastVideoAd';

interface QuizInterstitialProps {
  onContinue: () => void;
  /** Seconds before skip enables and we auto-advance. */
  countdownSeconds?: number;
}

const QuizInterstitial: React.FC<QuizInterstitialProps> = ({
  onContinue,
  countdownSeconds = 10,
}) => {
  const [remaining, setRemaining] = useState(countdownSeconds);
  const [videoFailed, setVideoFailed] = useState(false);

  const isWeb = !Capacitor.isNativePlatform();
  const hasAd = isWeb || getAdSlotsByPosition('quiz-interstitial').length > 0;

  useEffect(() => {
    if (!hasAd) onContinue();
  }, [hasAd, onContinue]);

  useEffect(() => {
    if (!hasAd) return;
    if (remaining <= 0) {
      const t = setTimeout(onContinue, 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onContinue, hasAd]);

  if (!hasAd) return null;

  return (
    <div
      className="bg-card border rounded-2xl p-4 mb-3 flex flex-col items-center"
      data-no-auto-ads="true"
      aria-label="Sponsored break"
    >
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Sponsored
        </span>
        <Button
          size="sm"
          variant={remaining > 0 ? 'outline' : 'default'}
          onClick={onContinue}
          className="gap-1"
        >
          {remaining > 0 ? `Skip in ${remaining}s` : 'Next question'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div
        className="w-full flex items-center justify-center"
        style={{ minHeight: 280 }}
      >
        {isWeb ? (
          videoFailed ? (
            // No video inventory — fall back to a managed display slot so the
            // break still shows an ad instead of silently skipping.
            <SimpleAdBanner position="middle" pageSection="quiz-interstitial" />
          ) : (
            <ProxiedVastVideoAd
              tagUrl="https://vast.yomeno.xyz/vast?spot_id=1465097"
              onUnavailable={() => setVideoFailed(true)}
              onComplete={onContinue}
              className="rounded-xl overflow-hidden max-h-[300px]"
            />
          )
        ) : (
          <SimpleAdBanner position="quiz-interstitial" slotId="quiz-interstitial" />
        )}
      </div>
    </div>
  );
};

export default QuizInterstitial;