import { supabase } from '@/integrations/supabase/client';
import { ExtendedDatabase } from '@/types/database-extensions';

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
    
    // For each profile, check their activity status using the database function
    for (const profile of profiles) {
      // Using the correct way to type the function name parameter and return type
      const { data: isActive, error: activityError } = await supabase.rpc(
        'has_user_been_active_in_days',
        { p_user_id: profile.id, p_days: 5 }
      );
      
      if (activityError) {
        console.error(`Error checking activity for ${profile.username}:`, activityError);
        continue;
      }
      
      if (!isActive) {
        console.log(`Suspending account for ${profile.username} due to inactivity for 5+ days`);
        await suspendUserAccount(profile.id);
        
        // Also update user_referrals table to keep status in sync
        await updateReferralStatus(profile.id, 'suspended');
      } else {
        console.log(`User ${profile.username} is active within the last 5 days`);
      }
    }
    
    console.log('Finished checking and suspending inactive accounts');
  } catch (error) {
    console.error('Error in checkAndSuspendInactiveAccounts:', error);
  }
};

/**
 * Helper function to suspend a user account
 */
const suspendUserAccount = async (userId: string): Promise<void> => {
  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        suspended: true, 
        reactivation_requested: false,
        reactivation_approved: false,
        reactivation_requested_at: null,
        reactivation_approved_at: null
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error(`Error suspending account ID ${userId}:`, updateError);
    } else {
      console.log(`Successfully suspended account ID ${userId}`);
    }
  } catch (error) {
    console.error('Error in suspendUserAccount:', error);
  }
};

/**
 * Update the status in user_referrals table to keep it in sync
 */
const updateReferralStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_referrals')
      .update({ status })
      .eq('referred_id', userId);
      
    if (error) {
      console.error(`Error updating referral status for user ${userId}:`, error);
    } else {
      console.log(`Successfully updated referral status for user ${userId} to ${status}`);
    }
  } catch (error) {
    console.error('Error in updateReferralStatus:', error);
  }
};

/**
 * Marks a user's reactivation request as approved by an admin
 */
export const approveReactivationRequest = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        reactivation_approved: true,
        reactivation_approved_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error approving reactivation request:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in approveReactivationRequest:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fully reactivates a suspended user account, clearing all reactivation flags
 */
export const reactivateUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        suspended: false,
        reactivation_requested: false,
        reactivation_approved: false,
        reactivation_requested_at: null,
        reactivation_approved_at: null
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error reactivating account:', error);
      return { success: false, error: error.message };
    }
    
    // Update the status in user_referrals table to keep it in sync
    await updateReferralStatus(userId, 'active');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in reactivateUserAccount:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Denies a user's reactivation request
 */
export const denyReactivationRequest = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        reactivation_requested: false,
        reactivation_requested_at: null
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error denying reactivation request:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in denyReactivationRequest:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Checks if a user is active (logged in within the last 5 days)
 * Used to standardize activity status checking across the app
 */
export const isUserActive = async (userId: string): Promise<boolean> => {
  try {
    // First check if the user is suspended directly in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('suspended')
      .eq('id', userId)
      .single();
      
    if (profileError || !profile) {
      console.error(`Error checking profile status for ${userId}:`, profileError);
      return false;
    }
    
    // If suspended in profile, they're not active
    if (profile.suspended) {
      return false;
    }

    // Using the correct way to use RPC function
    const { data: isActive, error: activityError } = await supabase.rpc(
      'has_user_been_active_in_days',
      { p_user_id: userId, p_days: 5 }
    );
    
    if (activityError) {
      console.error(`Error checking activity for ${userId}:`, activityError);
      return false;
    }
    
    return Boolean(isActive);
  } catch (error) {
    console.error('Error in isUserActive:', error);
    return false;
  }
};
