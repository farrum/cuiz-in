
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useQuizAdSync = (setForceReloadAds?: React.Dispatch<React.SetStateAction<number>>) => {
  const [adsSynced, setAdsSynced] = useState(false);
  
  const syncAdSlots = async () => {
    try {
      console.log('Syncing ad slots from server...');
      const { data: adSlots, error } = await supabase
        .from('ad_slots')
        .select('*')
        .eq('active', true);
        
      if (!error && adSlots) {
        console.log('Successfully loaded ad slots:', adSlots.length);
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
        setAdsSynced(true);
        
        if (setForceReloadAds) {
          setForceReloadAds(prev => prev + 1);
        }
        
        window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: adSlots }));
        return true;
      } else {
        console.error('Error fetching ad slots:', error);
        return false;
      }
    } catch (err) {
      console.error('Error syncing ad slots:', err);
      return false;
    }
  };
  
  const handleAdSlotsUpdated = () => {
    console.log('Ad slots updated, triggering refresh...');
    if (setForceReloadAds) {
      setForceReloadAds(prev => prev + 1);
    }
  };
  
  return {
    adsSynced,
    syncAdSlots,
    handleAdSlotsUpdated
  };
};
