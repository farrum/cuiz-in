
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks and suspends accounts that have been inactive for more than 5 days
 */
export const checkAndSuspendInactiveAccounts = async (): Promise<void> => {
  try {
    // Get date from 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString();
    
    console.log('Checking for accounts inactive since:', fiveDaysAgoStr);
    
    // First, get all users from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('suspended', false); // Only check active accounts
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No active profiles found');
      return;
    }
    
    // For each profile, check their last login time
    for (const profile of profiles) {
      const { data: loginLogs, error: logsError } = await supabase
        .from('login_logs')
        .select('login_time')
        .eq('username', profile.username)
        .order('login_time', { ascending: false })
        .limit(1);
        
      if (logsError) {
        console.error(`Error fetching login logs for ${profile.username}:`, logsError);
        continue;
      }
      
      // If no login logs or last login was more than 5 days ago, suspend the account
      if (!loginLogs || loginLogs.length === 0 || new Date(loginLogs[0].login_time) < fiveDaysAgo) {
        console.log(`Suspending account for ${profile.username} due to inactivity`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ suspended: true })
          .eq('id', profile.id);
          
        if (updateError) {
          console.error(`Error suspending account for ${profile.username}:`, updateError);
        } else {
          console.log(`Successfully suspended account for ${profile.username}`);
        }
      }
    }
    
    console.log('Finished checking and suspending inactive accounts');
  } catch (error) {
    console.error('Error in checkAndSuspendInactiveAccounts:', error);
  }
};

/**
 * Reactivates a suspended user account
 */
export const reactivateUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ suspended: false })
      .eq('id', userId);
      
    if (error) {
      console.error('Error reactivating account:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in reactivateUserAccount:', error);
    return { success: false, error: error.message };
  }
};
