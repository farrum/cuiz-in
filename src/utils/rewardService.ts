import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './constants';
export * from './gemsService'; // Re-export Gems functions

// Update total user stars in a consistent manner
export const updateTotalStars = async (stars: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Adding ${stars} to total stars for user ${userId}`);
  
  try {
    // Stars are only mutable server-side via the award_currency RPC
    const { data: result, error: rpcError } = await (supabase as any).rpc('award_currency', {
      p_points_delta: 0,
      p_stars_delta: Math.round(stars),
      p_reason: 'stars_earned'
    });

    if (rpcError || (result as any)?.error) {
      console.error('Error updating total stars:', rpcError || (result as any)?.error);
      return;
    }

    const newTotal = Number((result as any)?.stars ?? 0);
    
    // Update local storage
    localStorage.setItem(STORAGE_KEYS.USER_STARS, newTotal.toString());
    
    console.log(`Updated total stars for user ${userId} to ${newTotal}`);
    
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent('starsUpdated'));
    window.dispatchEvent(new CustomEvent('gemsUpdated')); // Dispatch gemsUpdated so header updates general currency
  } catch (error) {
    console.error('Error updating total stars:', error);
  }
};

// Log stars earned across the tracking system
export const logStarsEarned = async (stars: number, userId?: string | null) => {
  if (!userId || stars <= 0) return;
  console.log(`Logging ${stars} stars earned for user ${userId}`);
  await updateTotalStars(stars, userId);
};

// Get total user stars from localStorage
export const getTotalStars = (): number => {
  return parseFloat(localStorage.getItem(STORAGE_KEYS.USER_STARS) || '0');
};
