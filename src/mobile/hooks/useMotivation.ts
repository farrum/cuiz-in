import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MotivationContext =
  | 'on_open'
  | 'on_correct'
  | 'on_wrong'
  | 'streak_milestone'
  | 'idle'
  | 'low_gems'
  | 'daily_reminder';

export interface MotivationMessage {
  id: string;
  text: string;
  emoji?: string;
  trigger_context: MotivationContext;
}

// Built-in fallback bank so the mobile app feels alive even if the
// motivational_messages table is empty.
const FALLBACK: Record<MotivationContext, MotivationMessage[]> = {
  on_open: [
    { id: 'f1', trigger_context: 'on_open', emoji: '👋', text: "Welcome back! Ready to grow your gem stash?" },
    { id: 'f2', trigger_context: 'on_open', emoji: '⚡', text: "Your brain missed you. Let's warm it up." },
    { id: 'f3', trigger_context: 'on_open', emoji: '🎯', text: "One quiz, two quiz... three. Let's go!" },
  ],
  on_correct: [
    { id: 'c1', trigger_context: 'on_correct', emoji: '🔥', text: "You're on fire!" },
    { id: 'c2', trigger_context: 'on_correct', emoji: '💎', text: "Gems! Gems! Gems!" },
    { id: 'c3', trigger_context: 'on_correct', emoji: '🌟', text: "Genius move." },
  ],
  on_wrong: [
    { id: 'w1', trigger_context: 'on_wrong', emoji: '💪', text: "Oof — but the next one is yours." },
    { id: 'w2', trigger_context: 'on_wrong', emoji: '🧠', text: "Brains grow on mistakes. Keep going!" },
    { id: 'w3', trigger_context: 'on_wrong', emoji: '⚡', text: "One tap away from a streak save." },
  ],
  streak_milestone: [
    { id: 's1', trigger_context: 'streak_milestone', emoji: '🚀', text: "Streak unlocked! Don't drop it now." },
    { id: 's2', trigger_context: 'streak_milestone', emoji: '👑', text: "Royalty mode engaged." },
  ],
  idle: [
    { id: 'i1', trigger_context: 'idle', emoji: '👀', text: "Leaderboard is moving without you..." },
    { id: 'i2', trigger_context: 'idle', emoji: '⏳', text: "30 seconds. One question. Easy gems." },
  ],
  low_gems: [
    { id: 'l1', trigger_context: 'low_gems', emoji: '💎', text: "Top up the gem stash — quick quiz?" },
  ],
  daily_reminder: [
    { id: 'd1', trigger_context: 'daily_reminder', emoji: '🔥', text: "Don't break your streak today!" },
  ],
};

let cache: MotivationMessage[] | null = null;

async function fetchMessages(): Promise<MotivationMessage[]> {
  if (cache) return cache;
  try {
    const { data, error } = await supabase
      .from('motivational_messages' as any)
      .select('id, text, emoji, trigger_context')
      .eq('is_active', true);
    if (error || !data) return [];
    cache = data as unknown as MotivationMessage[];
    return cache;
  } catch { return []; }
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useMotivation(context: MotivationContext, deps: any[] = []) {
  const [message, setMessage] = useState<MotivationMessage | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await fetchMessages();
      const matches = remote.filter((m) => m.trigger_context === context);
      const pool = matches.length ? matches : FALLBACK[context] || [];
      if (!cancelled) setMessage(pickRandom(pool));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, ...deps]);
  return message;
}

export function getMotivationSync(context: MotivationContext): MotivationMessage | null {
  if (cache) {
    const matches = cache.filter((m) => m.trigger_context === context);
    if (matches.length) return pickRandom(matches);
  }
  return pickRandom(FALLBACK[context] || []);
}