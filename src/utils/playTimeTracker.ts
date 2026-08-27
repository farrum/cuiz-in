import { STORAGE_KEYS } from '@/utils/quizData';

export interface PlaySession {
  id?: string;
  userId: string;
  gameType: string;
  durationSeconds: number;
  sessionDate: string;
}

const keyFor = (userId: string, dateStr: string) => `cuizin_playtime_${userId}_${dateStr}`;

/**
 * Log a gameplay session for duration tracking.
 * Stored locally — there is no `user_play_sessions` table in the database,
 * and attempting to write to it floods the Postgres logs with errors.
 */
export const logPlaySession = async (_gameType: string, durationSeconds: number) => {
  try {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId || durationSeconds <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const key = keyFor(userId, todayStr);
    const existingSeconds = Number(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(existingSeconds + durationSeconds));
  } catch (err) {
    console.error('Error logging play session:', err);
  }
};

/**
 * Get aggregate daily play time in minutes for a user (local storage based).
 */
export const getDailyPlayTimeMinutes = async (userId: string): Promise<number> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const localSec = Number(localStorage.getItem(keyFor(userId, todayStr)) || '0');
    return Math.round(localSec / 60);
  } catch (err) {
    console.error('Error fetching play time:', err);
    return 0;
  }
};
