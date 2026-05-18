import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import AdSenseUnit from '@/components/ads/AdSenseUnit';

interface QuizInterstitialProps {
  onContinue: () => void;
  /** Ad unit slot id from AdSense dashboard. Set in QuizPlayPage. */
  slotId: string;
  /** Seconds before skip enables and we auto-advance. */
  countdownSeconds?: number;
}

const QuizInterstitial: React.FC<QuizInterstitialProps> = ({
  onContinue,
  slotId,
  countdownSeconds = 5,
}) => {
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      const t = setTimeout(onContinue, 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onContinue]);

  const canSkip = true; // Always skippable for AdSense policy safety.

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
          disabled={!canSkip}
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
        {slotId ? (
          <AdSenseUnit
            slot={slotId}
            format="auto"
            responsive
            style={{ minHeight: 280, width: '100%' }}
          />
        ) : (
          <div className="text-xs text-muted-foreground">Ad slot not configured</div>
        )}
      </div>
    </div>
  );
};

export default QuizInterstitial;