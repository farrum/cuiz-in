
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to perform Supabase operations on tables that might not be 
 * in the generated TypeScript types
 */
export const safeSupabaseOperation = {
  /**
   * Safely select from a table, with type assertion
   */
  from: <T = any>(table: string) => {
    // @ts-ignore - We're deliberately bypassing TypeScript's type checking here
    return supabase.from(table) as any;
  },
  
  /**
   * Safely create a realtime channel subscription
   */
  createChannel: (channelName: string) => {
    return supabase.channel(channelName);
  }
};
