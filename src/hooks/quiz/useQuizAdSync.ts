
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncAdSlotsToLocal } from '@/utils/quizData';

export const useQuizAdSync = (setForceReloadAds?: React.Dispatch<React.SetStateAction<number>>) => {
  const [adsSynced, setAdsSynced] = useState(false);

  const syncAdSlots = async (reloadSetter?: React.Dispatch<React.SetStateAction<number>>) => {
    const setter = reloadSetter || setForceReloadAds;
    
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
        
        if (setter) {
          setter(prev => prev + 1);
        }
        
        window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: adSlots }));
      } else {
        console.error('Error fetching ad slots:', error);
        await syncAdSlotsToLocal();
        setAdsSynced(true);
      }
    } catch (err) {
      console.error('Error syncing ad slots:', err);
      await syncAdSlotsToLocal();
      setAdsSynced(true);
    }
    
    return true;
  };

  const handleAdSlotsUpdated = () => {
    console.log('Ad slots updated, refreshing ad display...');
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
