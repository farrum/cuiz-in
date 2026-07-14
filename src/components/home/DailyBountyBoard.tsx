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
    <div className="wooden-door p-5 rounded-3xl shadow-xl border-stone-850 text-slate-100 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-3 border-b border-stone-800 pb-3.5 mb-4">
        <ClipboardList className="w-6 h-6 text-yellow-500 animate-pulse" />
        <div>
          <h2 className="text-base font-black font-serif uppercase tracking-wider text-white">Daily Bounty Board</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complete royal orders to unlock treasures</p>
        </div>
      </div>

      <div className="space-y-4">
        {quests.map((q) => {
          const { progress, claimed } = getQuestState(q);
          const percent = Math.min(100, Math.round((progress / q.goal) * 100));
          const canClaim = progress >= q.goal && !claimed;

          return (
            <div key={q.id} className="bg-stone-950/70 border border-stone-850 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-yellow-500/20">
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center">
                    {q.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{q.name}</h3>
                    <p className="text-[10px] text-slate-400 leading-tight">{q.description}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>PROGRESS</span>
                    <span className="text-yellow-500/70">{progress} / {q.goal}</span>
                  </div>
                  <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end md:justify-start">
                <div className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {q.rewardGems > 0 && <span className="block text-amber-500">💎 {q.rewardGems}</span>}
                  {q.rewardStars > 0 && <span className="block text-yellow-500">⭐ {q.rewardStars}</span>}
                </div>

                <Button
                  onClick={() => handleClaim(q)}
                  disabled={progress < q.goal || claimed}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-4 h-8 rounded-xl transition-all border-0",
                    claimed 
                      ? "bg-emerald-950/20 text-emerald-500 border border-emerald-500/20 cursor-default" 
                      : canClaim 
                        ? "bg-yellow-500 hover:bg-yellow-600 text-slate-950 shadow-md shadow-yellow-500/10 animate-bounce" 
                        : "bg-stone-900 text-slate-500 border border-stone-800 cursor-not-allowed"
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
