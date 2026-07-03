import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './constants';
export * from './gemsService'; // Re-export Gems functions

// Update total user stars in a consistent manner
export const updateTotalStars = async (stars: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Adding ${stars} to total stars for user ${userId}`);
  
  try {
    // Get current stars
    const { data, error } = await supabase
      .from('profiles')
      .select('stars')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching total stars:', error);
      return;
    }
    
    const currentStars = data?.stars || 0;
    const newTotal = Number(currentStars) + stars;
    
    // Update stars in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stars: newTotal })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating total stars:', updateError);
      return;
    }
    
    // Update local storage
    localStorage.setItem(STORAGE_KEYS.USER_STARS, newTotal.toString());
    
    console.log(`Updated total stars for user ${userId} from ${currentStars} to ${newTotal}`);
    
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
