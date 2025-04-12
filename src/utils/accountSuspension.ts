import { supabase } from '@/integrations/supabase/client';
import { ExtendedDatabase } from '@/types/database-extensions';
import { 
  notifyAutoSuspended, 
  notifyReactivationRequest, 
  notifySuspensionRequest 
} from './notificationUtils';

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
const suspendUserAccount = async (userId: string, reason: string = 'admin action'): Promise<void> => {
  try {
    // First get the username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error(`Error getting profile for user ID ${userId}:`, profileError);
      return;
    }
    
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
      
      // Create notification about auto-suspension
      await notifyAutoSuspended(profileData.username, userId, reason);
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
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      return { success: false, error: `Error getting profile: ${profileError.message}` };
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
 * Allow a user to request reactivation of their account
 */
export const requestAccountReactivation = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username, suspended')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      return { success: false, error: `Error getting profile: ${profileError.message}` };
    }
    
    if (!profileData.suspended) {
      return { success: false, error: 'Account is not suspended' };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        reactivation_requested: true,
        reactivation_requested_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error requesting account reactivation:', error);
      return { success: false, error: error.message };
    }
    
    // Create notification for admin
    await notifyReactivationRequest(profileData.username, userId);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in requestAccountReactivation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Allow team leaders to request suspending a team member
 */
export const requestMemberSuspension = async (
  teamLeaderId: string, 
  memberId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify team leader has the right role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', teamLeaderId)
      .single();
      
    if (roleError || !roleData || !['team_leader', 'teamleader'].includes(roleData.role)) {
      return { success: false, error: 'Unauthorized: Only team leaders can request suspensions' };
    }
    
    // Get team leader username
    const { data: leaderData, error: leaderError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', teamLeaderId)
      .single();
      
    if (leaderError) {
      return { success: false, error: `Error getting team leader profile: ${leaderError.message}` };
    }
    
    // Get member username
    const { data: memberData, error: memberError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', memberId)
      .single();
      
    if (memberError) {
      return { success: false, error: `Error getting member profile: ${memberError.message}` };
    }
    
    // Create notification for admin
    await notifySuspensionRequest(
      leaderData.username, 
      memberData.username, 
      memberId, 
      reason
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in requestMemberSuspension:', error);
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
