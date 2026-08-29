import React, { useEffect, useState } from 'react';

export const QUIZ_REWARD_EVENT = 'cuizin:quiz-reward';

export const emitQuizReward = (gems: number, streak?: number) => {
  window.dispatchEvent(
    new CustomEvent(QUIZ_REWARD_EVENT, { detail: { gems, streak } })
  );
};

interface Reward {
  id: number;
  gems: number;
  streak?: number;
}

/**
 * Floating "+N gems" burst shown over the quiz, mirroring the mobile
 * Quiz Story reward feedback.
 */
const FloatingReward: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    let counter = 0;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (!detail.gems || detail.gems <= 0) return;
      const id = ++counter;
      setRewards((prev) => [...prev, { id, gems: detail.gems, streak: detail.streak }]);
      window.setTimeout(() => {
        setRewards((prev) => prev.filter((r) => r.id !== id));
      }, 1600);
    };
    window.addEventListener(QUIZ_REWARD_EVENT, handler);
    return () => window.removeEventListener(QUIZ_REWARD_EVENT, handler);
  }, []);

  if (rewards.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[130] flex flex-col items-center gap-2">
      {rewards.map((r) => (
        <div
          key={r.id}
          className="animate-scale-in rounded-full bg-primary/90 px-4 py-2 text-primary-foreground shadow-lg font-bold text-sm"
        >
          💎 +{r.gems} gems
          {r.streak && r.streak > 1 ? <span className="ml-2">🔥 {r.streak}</span> : null}
        </div>
      ))}
    </div>
  );
};

export default FloatingReward;
