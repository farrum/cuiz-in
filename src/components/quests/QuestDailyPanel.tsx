import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { getDailyTributeStatus, claimDailyTribute } from '@/services/dailyTributeService';
import { logGemsEarned } from '@/utils/gemsService';
import { Gift, ScrollText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskRow {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardGems: number;
  rewardStars: number;
  claimed: boolean;
}

const claimKey = (userId: string, taskId: string) => `cuizin_user_task_${userId}_${taskId}`;

/**
 * Web counterpart of the mobile Hub tribute + contracts board so quest players
 * on the website get the same daily rewards surface.
 */
const QuestDailyPanel: React.FC<{ className?: string }> = ({ className }) => {
  const { toast } = useToast();
  const [userId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.USER_ID));
  const [tribute, setTribute] = useState<{ canClaim: boolean; streak: number; rewardStars: number } | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('empire_tasks' as any)
        .select('*')
        .or(`assigned_to.eq.${userId},assigned_to.is.null`)
        .neq('status', 'claimed');

      if (error || !data) {
        setTasks([]);
        return;
      }

      const { data: progress } = await supabase
        .from('user_task_progress' as any)
        .select('task_id, progress')
        .eq('user_id', userId);

      const progressMap = new Map<string, number>();
      (progress || []).forEach((p: any) => progressMap.set(String(p.task_id), Number(p.progress) || 0));

      const mapped: TaskRow[] = (data as any[]).map((t: any) => {
        let localProg: any = null;
        try { localProg = JSON.parse(localStorage.getItem(claimKey(userId, t.id)) || 'null'); } catch { localProg = null; }
        return {
          id: String(t.id),
          title: t.title,
          description: t.description || '',
          targetCount: Number(t.target_count) || 1,
          currentCount: progressMap.get(String(t.id)) ?? localProg?.currentCount ?? 0,
          rewardGems: Number(t.reward_gems) || 0,
          rewardStars: Number(t.reward_stars) || 0,
          claimed: localProg?.status === 'claimed',
        };
      });
      setTasks(mapped.filter((t) => !t.claimed));
    } catch (e) {
      console.warn('[QuestDailyPanel] task load failed', e);
      setTasks([]);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const status = await getDailyTributeStatus(userId);
      if (!active) return;
      setTribute({ canClaim: status.canClaim, streak: status.streak, rewardStars: status.rewardStars });
      await loadTasks();
      if (active) setLoading(false);
    };
    load();
    window.addEventListener('baronTasksUpdated', loadTasks);
    return () => {
      active = false;
      window.removeEventListener('baronTasksUpdated', loadTasks);
    };
  }, [userId, loadTasks]);

  const handleTribute = async () => {
    setClaiming('tribute');
    const res = await claimDailyTribute(userId);
    setClaiming(null);
    if (res.success) {
      setTribute({ canClaim: false, streak: res.streak, rewardStars: res.rewardStars });
      toast({ title: '🎁 Daily Tribute claimed!', description: `+${res.rewardStars} ⭐ · Day ${res.streak} streak` });
    } else {
      toast({ title: 'Already claimed today', description: 'Come back tomorrow for a bigger tribute.' });
    }
  };

  const handleClaimTask = async (task: TaskRow) => {
    if (!userId) return;
    setClaiming(task.id);
    try {
      localStorage.setItem(
        claimKey(userId, task.id),
        JSON.stringify({ currentCount: task.currentCount, status: 'claimed' })
      );
      if (task.rewardGems > 0) {
        await logGemsEarned(task.rewardGems, userId);
      }
      if (task.rewardStars > 0) {
        try {
          await (supabase as any).rpc('award_currency', {
            p_points_delta: 0,
            p_stars_delta: task.rewardStars,
            p_reason: 'quest_contract',
          });
          window.dispatchEvent(new CustomEvent('starsUpdated'));
        } catch (e) {
          console.warn('[QuestDailyPanel] star award failed', e);
        }
      }
      window.dispatchEvent(new CustomEvent('gemsUpdated'));
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast({
        title: '⚔️ Contract claimed!',
        description: `+${task.rewardGems} 💎 · +${task.rewardStars} ⭐`,
      });
    } finally {
      setClaiming(null);
    }
  };

  if (!userId) return null;

  return (
    <div className={cn('rounded-2xl border bg-card p-4 space-y-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-card-foreground">
            <Gift className="h-4 w-4 text-primary" />
            Daily Tribute
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tribute
              ? tribute.canClaim
                ? `Day ${tribute.streak} · +${tribute.rewardStars} ⭐ waiting`
                : `Claimed today · Day ${tribute.streak} streak`
              : 'Checking...'}
          </p>
        </div>
        <Button
          size="sm"
          disabled={!tribute?.canClaim || claiming === 'tribute'}
          onClick={handleTribute}
        >
          {claiming === 'tribute' ? <Loader2 className="h-4 w-4 animate-spin" /> : tribute?.canClaim ? 'Claim' : 'Claimed'}
        </Button>
      </div>

      <div>
        <h3 className="font-bold flex items-center gap-2 text-sm text-card-foreground mb-2">
          <ScrollText className="h-4 w-4 text-primary" />
          Active contracts
        </h3>
        {loading ? (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading contracts...
          </p>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active contracts right now. Play quests to unlock more.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const done = task.currentCount >= task.targetCount;
              const pct = Math.min(100, Math.round((task.currentCount / task.targetCount) * 100));
              return (
                <li key={task.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-card-foreground">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={done ? 'default' : 'outline'}
                      disabled={!done || claiming === task.id}
                      onClick={() => handleClaimTask(task)}
                    >
                      {claiming === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? 'Claim' : `${task.currentCount}/${task.targetCount}`}
                    </Button>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Reward: +{task.rewardGems} 💎 · +{task.rewardStars} ⭐
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default QuestDailyPanel;
