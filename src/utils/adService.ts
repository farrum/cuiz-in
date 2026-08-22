
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './constants';

// Function to sync ad slots from Supabase to local storage
export const syncAdSlotsToLocal = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('active', true);
      
    if (error) {
      console.error('Error fetching ad slots:', error);
      return false;
    }
    
    if (data) {
      localStorage.setItem(STORAGE_KEYS.AD_SLOTS, JSON.stringify(data));
      console.log(`Synced ${data.length} ad slots to localStorage`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in syncAdSlotsToLocal:', error);
    return false;
  }
};

// Function to get top performers from Supabase
export const getTopPerformers = async (timeframe: 'daily' | 'monthly' = 'daily', limit: number = 10) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Different approaches based on timeframe
    if (timeframe === 'daily') {
      // Get today's top performers from daily_gems table
      const { data, error } = await supabase
        .from('daily_points')
        .select('user_id, gems:points')
        .eq('date', today)
        .order('points', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Error fetching daily top performers:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Get usernames for these top performers
      const userIds = data.map(item => item.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profile data:', profilesError);
        return [];
      }
      
      // Map profile data to results
      const profileMap: Record<string, string> = {};
      profiles?.forEach(profile => {
        profileMap[profile.id] = profile.username;
      });
      
      // Build result with rankings
      return data.map((item, index) => ({
        userId: item.user_id,
        username: profileMap[item.user_id] || 'Unknown User',
        gems: Number(item.gems),
        rank: index + 1
      }));
      
    } else {
      // Get this month's top performers from monthly_gems table
      const { data, error } = await supabase
        .from('monthly_points')
        .select('user_id, gems:points')
        .eq('month', currentMonth)
        .order('points', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Error fetching monthly top performers:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Get usernames for these top performers
      const userIds = data.map(item => item.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profile data:', profilesError);
        return [];
      }
      
      // Map profile data to results
      const profileMap: Record<string, string> = {};
      profiles?.forEach(profile => {
        profileMap[profile.id] = profile.username;
      });
      
      // Build result with rankings
      return data.map((item, index) => ({
        userId: item.user_id,
        username: profileMap[item.user_id] || 'Unknown User',
        gems: Number(item.gems),
        rank: index + 1
      }));
    }
  } catch (error) {
    console.error(`Error fetching ${timeframe} top performers:`, error);
    return [];
  }
};

// Function to trigger ad slots update event
export const triggerAdSlotsUpdate = (slots: any[] = []) => {
  window.dispatchEvent(new CustomEvent('adSlotsUpdated', { 
    detail: { slots, source: 'adService' }
  }));
};

/**
 * Force every mounted ad banner to pull a fresh creative immediately.
 * Used when the user advances to a new quiz question.
 */
export const triggerAdRefresh = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('refreshAllAds'));
};


// Function to get available ad slots for a specific position
export const getAdSlotsByPosition = (position: string): any[] => {
  try {
    const storedAds = localStorage.getItem(STORAGE_KEYS.AD_SLOTS);
    if (!storedAds) return [];
    
    const adSlots = JSON.parse(storedAds);
    return adSlots.filter((ad: any) => ad.position === position && ad.active);
  } catch (error) {
    console.error('Error getting ad slots by position:', error);
    return [];
  }
};
