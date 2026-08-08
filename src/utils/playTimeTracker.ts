import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

export interface PlaySession {
  id?: string;
  userId: string;
  gameType: string;
  durationSeconds: number;
  sessionDate: string;
}

/**
 * Log a gameplay session for duration tracking
 */
export const logPlaySession = async (gameType: string, durationSeconds: number) => {
  try {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId || durationSeconds <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // Persist session to Supabase user_play_sessions table if available, with local fallback storage
    const { error } = await supabase
      .from('user_play_sessions' as any)
      .insert({
        user_id: userId,
        game_type: gameType,
        duration_seconds: durationSeconds,
        session_date: todayStr
      });

    if (error) {
      console.log('Play session logging database notice:', error.message);
      // Fallback: Store locally in localStorage daily log
      const key = `cuizin_playtime_${userId}_${todayStr}`;
      const existingSeconds = Number(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(existingSeconds + durationSeconds));
    }
  } catch (err) {
    console.error('Error logging play session:', err);
  }
};

/**
 * Get aggregate daily play time in minutes for a user
 */
export const getDailyPlayTimeMinutes = async (userId: string): Promise<number> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Attempt database query first
    const { data, error } = await supabase
      .from('user_play_sessions' as any)
      .select('duration_seconds')
      .eq('user_id', userId)
      .eq('session_date', todayStr);

    if (!error && data && data.length > 0) {
      const totalSec = data.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0);
      return Math.round(totalSec / 60);
    }

    // Fallback to local storage
    const key = `cuizin_playtime_${userId}_${todayStr}`;
    const localSec = Number(localStorage.getItem(key) || '0');
    return Math.round(localSec / 60);
  } catch (err) {
    console.error('Error fetching play time:', err);
    return 0;
  }
};
