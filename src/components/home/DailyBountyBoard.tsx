import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { updateUserBalances } from '@/utils/shopData';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Coins, Star, Gift, Gamepad2, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface Quest {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  goal: number;
  rewardGems: number;
  rewardStars: number;
  progressKey: string;
  claimedKey: string;
}

export const DailyBountyBoard: React.FC = () => {
  const { toast } = useToast();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const today = getTodayString();

  const quests: Quest[] = [
    {
      id: 'boxes',
      name: 'Mystery Raider',
      description: 'Open 2 Daily Mystery Boxes in the games gallery.',
      icon: <Gift className="w-4 h-4 text-amber-500" />,
      goal: 2,
      rewardGems: 25,
      rewardStars: 0,
      progressKey: `cuizin_quest_boxes_opened_${today}`,
      claimedKey: `cuizin_quest_claimed_boxes_${today}`
    },
    {
      id: 'games',
      name: 'Hired Mercenary',
      description: 'Play 3 Mini-Games in the arcade lobby.',
      icon: <Gamepad2 className="w-4 h-4 text-indigo-400" />,
      goal: 3,
      rewardGems: 30,
      rewardStars: 0,
      progressKey: `cuizin_quest_games_played_${today}`,
      claimedKey: `cuizin_quest_claimed_games_${today}`
    },
    {
      id: 'riddle',
      name: 'Cryptic Scholar',
      description: 'Submit 1 daily riddle guess in the Riddle Vault.',
      icon: <Key className="w-4 h-4 text-yellow-500 animate-pulse" />,
      goal: 1,
      rewardGems: 20,
      rewardStars: 2,
      progressKey: `cuizin_quest_riddle_guess_${today}`,
      claimedKey: `cuizin_quest_claimed_riddle_${today}`
    }
  ];

  const getQuestState = (quest: Quest) => {
    const progress = parseInt(localStorage.getItem(quest.progressKey) || '0');
    const claimed = localStorage.getItem(quest.claimedKey) === 'true';
    return { progress, claimed };
  };

  const handleClaim = (quest: Quest) => {
    const { progress, claimed } = getQuestState(quest);
    if (progress < quest.goal || claimed) return;

    // Award balances
    updateUserBalances(quest.rewardGems, quest.rewardStars);
    localStorage.setItem(quest.claimedKey, 'true');
    setUpdateTrigger(prev => prev + 1);

    confetti({ particleCount: 80, spread: 60 });

    toast({
      title: "Bounty Claimed!",
      description: `You received 💎 ${quest.rewardGems} Gems ${quest.rewardStars > 0 ? `and ⭐ ${quest.rewardStars} Stars` : ''}!`,
    });
    
    // Dispatch events
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
    window.dispatchEvent(new CustomEvent('starsUpdated'));
  };

  return (
    <div 
      className="p-5 rounded-3xl max-w-xl mx-auto w-full"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, hsl(38 60% 98%) 100%)',
        boxShadow: '0 4px 0 rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-3 border-b border-amber-900/10 pb-3.5 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center shrink-0 shadow-sm">
          <ClipboardList className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h2 className="text-base font-black font-serif uppercase tracking-wider text-amber-950">Daily Bounty Board</h2>
          <p className="text-[10px] text-amber-900/70 font-black uppercase tracking-widest">Complete royal orders to unlock treasures</p>
        </div>
      </div>

      <div className="space-y-3">
        {quests.map((q) => {
          const { progress, claimed } = getQuestState(q);
          const percent = Math.min(100, Math.round((progress / q.goal) * 100));
          const canClaim = progress >= q.goal && !claimed;

          return (
            <div 
              key={q.id} 
              className="bg-white/90 border border-amber-900/10 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm transition-all hover:border-amber-400/40"
            >
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-sm">
                    {q.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">{q.name}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold leading-tight mt-0.5">{q.description}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black text-amber-900/60 uppercase">
                    <span>Progress</span>
                    <span className="text-amber-800 font-bold">{progress} / {q.goal}</span>
                  </div>
                  <div className="w-full bg-amber-100/60 h-2 rounded-full overflow-hidden border border-amber-200/50">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500 shadow-sm" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end sm:justify-start shrink-0">
                <div className="text-right text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                  {q.rewardGems > 0 && <span className="block text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/60">💎 +{q.rewardGems}</span>}
                  {q.rewardStars > 0 && <span className="block text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 mt-1">⭐ +{q.rewardStars}</span>}
                </div>

                <Button
                  onClick={() => handleClaim(q)}
                  disabled={progress < q.goal || claimed}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3.5 h-8 rounded-xl transition-all border shadow-sm",
                    claimed 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 cursor-default" 
                      : canClaim 
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black border-amber-400/80 shadow-md animate-bounce" 
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  )}
                >
                  {claimed ? 'Claimed ✓' : canClaim ? 'Claim Box' : 'Locked'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
