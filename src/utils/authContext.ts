import { supabase } from '@/integrations/supabase/client';

/**
 * Sets the user context for legacy auth users
 * This allows RLS policies to work with custom authentication
 */
export const setUserContext = async (userId: string): Promise<void> => {
  try {
    await supabase.rpc('set_user_context', { user_id: userId });
  } catch (error) {
    console.error('Failed to set user context:', error);
  }
};

/**
 * Clears the user context (on logout)
 */
export const clearUserContext = async (): Promise<void> => {
  try {
    await supabase.rpc('set_user_context', { user_id: '' });
  } catch (error) {
    console.error('Failed to clear user context:', error);
  }
};
