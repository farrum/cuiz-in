/**
 * HubRewardsTab — "Rewards" tab panel.
 * Shows active contracts (Baron Tasks), Daily Bounty Board, and an in-tab ad.
 */
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DailyBountyBoard } from '@/components/home/DailyBountyBoard';
import { ScrollAdBanner } from '@/mobile/ads/ScrollAdBanner';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  type: string;
  rewardGems: number;
  rewardStars: number;
  rewardShards: number;
  shardType: string;
  status: 'active' | 'completed' | 'claimed';
}

interface Props {
  tasks: Task[];
  onClaimTask: (taskId: string, gems: number, stars: number, shards: number, shardType: string) => void;
}

export function HubRewardsTab({ tasks, onClaimTask }: Props) {
  const activeTasks = tasks.filter((t) => t.status !== 'claimed');

  return (
    <div className="hub-tab-panel px-4 py-3 pb-4 space-y-5">
      {/* Active Contracts */}
      {activeTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="h-px flex-1 section-divider-shimmer rounded-full" />
            <span className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-900/50">
              Active Contracts
            </span>
            <span className="h-px flex-1 section-divider-shimmer rounded-full" />
          </div>

          <div className="space-y-2.5">
            {activeTasks.map((task, idx) => {
              const pct = Math.min(100, (task.currentCount / task.targetCount) * 100);
              const isComplete = task.status === 'completed';
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: isComplete
                      ? 'linear-gradient(145deg, hsl(140 60% 97%) 0%, hsl(140 40% 94%) 100%)'
                      : 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
                    border: isComplete
                      ? '1px solid rgba(34,197,94,0.3)'
                      : '1px solid rgba(180,140,60,0.18)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 14px rgba(120,80,20,0.09)',
                  }}
                >
                  {isComplete && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 to-transparent pointer-events-none" />
                  )}

                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm uppercase tracking-wide truncate" style={{ color: 'hsl(30 55% 20%)' }}>
                          📜 {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-amber-800/50 font-medium mt-0.5 leading-snug">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {isComplete ? (
                        <Button
                          onClick={() => onClaimTask(task.id, task.rewardGems, task.rewardStars, task.rewardShards, task.shardType)}
                          className="h-8 px-3 text-[11px] font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shrink-0 animate-bounce shadow-md"
                        >
                          Claim
                        </Button>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-700/50 bg-amber-100 px-2 py-1 rounded-full shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-amber-800/40">
                        <span>Progress</span>
                        <span>{task.currentCount} / {task.targetCount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', isComplete ? 'bg-emerald-500' : 'bg-amber-400')}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Reward chips */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] font-black text-amber-800/40 uppercase tracking-wide">Rewards:</span>
                      {task.rewardGems   > 0 && <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">💎 {task.rewardGems}</span>}
                      {task.rewardStars  > 0 && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">⭐ {task.rewardStars}</span>}
                      {task.rewardShards > 0 && <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">🧩 {task.rewardShards}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* In-tab ad between contracts and bounty board */}
      <ScrollAdBanner slotId="hub-rewards-mid" position="hub-rewards" fallbackIndex={2} />

      {/* Daily Bounty Board */}
      <section>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
          <span className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-900/50">
            Daily Bounty Board
          </span>
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        </div>
        <DailyBountyBoard />
      </section>

      {/* Bottom ad */}
      <ScrollAdBanner slotId="hub-rewards-bottom" position="hub-rewards-bottom" fallbackIndex={3} />
    </div>
  );
}
