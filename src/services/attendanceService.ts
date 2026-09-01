import { supabase } from '@/integrations/supabase/client';

const LAST_MARK_KEY = 'cuizin_attendance_marked_date';

const todayIndiaDate = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

/**
 * Marks the signed-in user present for today (India time).
 * Safe to call on every app start — the RPC is idempotent and we also
 * short-circuit locally once per day.
 */
export const recordAttendance = async (): Promise<void> => {
  try {
    const today = todayIndiaDate();
    if (localStorage.getItem(LAST_MARK_KEY) === today) return;

    const { error } = await supabase.rpc('record_my_attendance' as any);
    if (error) {
      console.warn('[Attendance] record_my_attendance failed:', error.message);
      return;
    }
    localStorage.setItem(LAST_MARK_KEY, today);
  } catch (err) {
    console.warn('[Attendance] unexpected error:', err);
  }
};
