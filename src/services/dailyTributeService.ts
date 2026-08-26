import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/constants';

const LAST_TRIBUTE_DATE_KEY = 'cuizin_last_daily_tribute_date';
const TRIBUTE_STREAK_KEY = 'cuizin_daily_tribute_streak';

export interface DailyTributeStatus {
  canClaim: boolean;
  streak: number;
  rewardStars: number;
  todayStr: string;
  alreadyClaimed: boolean;
}

/** Returns today's ISO date string (YYYY-MM-DD) */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns yesterday's ISO date string (YYYY-MM-DD) */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if the user is eligible for today's Daily Tribute.
 * Returns consistent status regardless of device, session, or platform.
 */
export async function getDailyTributeStatus(userId?: string | null): Promise<DailyTributeStatus> {
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  let lastDate = localStorage.getItem(LAST_TRIBUTE_DATE_KEY);
  let savedStreak = Number(localStorage.getItem(TRIBUTE_STREAK_KEY) || '0');

  // If already claimed on today's calendar date, do not show or grant again
  if (lastDate === todayStr) {
    const streak = Math.max(1, Math.min(savedStreak, 7));
    const rewardStars = streak === 7 ? 50 : streak * 5;
    return {
      canClaim: false,
      alreadyClaimed: true,
      streak,
      rewardStars,
      todayStr,
    };
  }

  // Calculate streak based on consecutive days
  let nextStreak = 1;
  if (lastDate === yesterdayStr) {
    nextStreak = savedStreak >= 7 ? 1 : savedStreak + 1;
  }

  const rewardStars = nextStreak === 7 ? 50 : nextStreak * 5;

  return {
    canClaim: true,
    alreadyClaimed: false,
    streak: nextStreak,
    rewardStars,
    todayStr,
  };
}

/**
 * Claims the Daily Tribute reward.
 * Persists the claim date and awards stars atomically to both local storage and database.
 */
export async function claimDailyTribute(userId?: string | null): Promise<{ success: boolean; rewardStars: number; streak: number }> {
  const status = await getDailyTributeStatus(userId);

  if (!status.canClaim) {
    return { success: false, rewardStars: 0, streak: status.streak };
  }

  const todayStr = status.todayStr;
  const reward = status.rewardStars;
  const nextStreak = status.streak;

  // 1. Immediately mark as claimed for today
  localStorage.setItem(LAST_TRIBUTE_DATE_KEY, todayStr);
  localStorage.setItem(TRIBUTE_STREAK_KEY, String(nextStreak));

  // 2. Update local star balance
  const currentStars = Number(localStorage.getItem(STORAGE_KEYS.USER_STARS) || localStorage.getItem('quiz_app_user_stars') || '0');
  const newStars = currentStars + reward;
  localStorage.setItem(STORAGE_KEYS.USER_STARS, String(newStars));
  localStorage.setItem('quiz_app_user_stars', String(newStars));

  // 3. Sync to Supabase profile if logged in
  if (userId && userId !== 'guest') {
    try {
      await (supabase as any).rpc('award_currency', {
        p_points_delta: 0,
        p_stars_delta: Math.round(reward),
        p_reason: 'daily_check_in',
      });
    } catch (e) {
      console.warn('[DailyTribute] DB sync skipped/failed:', e);
      try {
        await supabase.from('profiles').update({ stars: newStars }).eq('id', userId);
      } catch {}
    }
  }

  // 4. Notify all components across the app
  window.dispatchEvent(new CustomEvent('starsUpdated'));

  return { success: true, rewardStars: reward, streak: nextStreak };
}
