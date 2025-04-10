import { supabase } from '@/integrations/supabase/client';
import { ExtendedDatabase } from '@/types/database-extensions';

/**
 * This function is now disabled as we only want admin-initiated suspensions
 * Keeping the function signature for backward compatibility
 */
export const checkAndSuspendInactiveAccounts = async (): Promise<void> => {
  // This function no longer suspends inactive accounts
  console.log('Automatic account suspension is disabled. Users will only be suspended by admin action.');
  return;
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
 * This function now only checks the suspended status in profiles, not inactivity
 */
export const isUserActive = async (userId: string): Promise<boolean> => {
  try {
    // Only check if the user is suspended directly in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('suspended')
      .eq('id', userId)
      .single();
      
    if (profileError || !profile) {
      console.error(`Error checking profile status for ${userId}:`, profileError);
      return false;
    }
    
    // User is active if not suspended
    return !profile.suspended;
  } catch (error) {
    console.error('Error in isUserActive:', error);
    return false;
  }
};
