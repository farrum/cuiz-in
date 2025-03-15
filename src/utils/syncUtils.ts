
import { STORAGE_KEYS } from '../types/quiz';

export const syncAllDataToSupabase = async () => {
  try {
    const { syncAllDataToSupabase } = await import('@/integrations/supabase/client');
    return syncAllDataToSupabase();
  } catch (error) {
    console.error('Error syncing all data:', error);
  }
};

export const syncQuizQuestionsToSupabase = async () => {
  try {
    const { syncQuizQuestionsToSupabase } = await import('@/integrations/supabase/client');
    return syncQuizQuestionsToSupabase();
  } catch (error) {
    console.error('Error syncing quiz questions:', error);
    throw error;
  }
};

export const syncAdSlotsToLocal = async () => {
  try {
    const { syncAdSlotsToLocal } = await import('@/integrations/supabase/client');
    return syncAdSlotsToLocal();
  } catch (error) {
    console.error('Error syncing ad slots:', error);
  }
};
