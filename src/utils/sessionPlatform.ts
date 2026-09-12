import { supabase } from '@/integrations/supabase/client';
import { getAppPlatform } from '@/utils/appVersion';

let reportedFor: string | null = null;

/**
 * Records where the signed-in player is right now (android / ios / web).
 * Called once per session so the admin "Platform" column stays accurate even
 * when the player never signs in again (long-lived sessions).
 */
export const reportSessionPlatform = async (userId?: string | null): Promise<void> => {
  try {
    const key = userId || 'current';
    if (reportedFor === key) return;
    reportedFor = key;
    const { error } = await supabase.rpc('record_session_platform', {
      p_platform: getAppPlatform(),
    });
    if (error) {
      reportedFor = null;
      console.warn('record_session_platform notice:', error.message);
    }
  } catch (err) {
    reportedFor = null;
    console.warn('Failed to report session platform:', err);
  }
};
