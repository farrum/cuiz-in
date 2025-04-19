
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useQuizAdSync = (setForceReloadAds?: React.Dispatch<React.SetStateAction<number>>) => {
  const [adsSynced, setAdsSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Initial sync on component mount
  useEffect(() => {
    syncAdSlots().catch(err => {
      console.error('Initial ad sync failed:', err);
    });
    
    // Listen for ad slot updates from other components
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    };
  }, []);
  
  const syncAdSlots = async () => {
    try {
      setSyncError(null);
      console.log('Syncing ad slots from server...');
      const { data: adSlots, error } = await supabase
        .from('ad_slots')
        .select('*')
        .eq('active', true);
        
      if (!error && adSlots) {
        console.log('Successfully loaded ad slots:', adSlots.length);
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
        setAdsSynced(true);
        
        // Force reload ads if the callback is provided
        if (setForceReloadAds) {
          setForceReloadAds(prev => prev + 1);
        }
        
        // Notify all components about ad slot updates
        window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: adSlots }));
        return true;
      } else {
        console.error('Error fetching ad slots:', error);
        setSyncError(error?.message || 'Failed to fetch ad slots');
        return false;
      }
    } catch (err) {
      console.error('Error syncing ad slots:', err);
      setSyncError(err instanceof Error ? err.message : 'Unknown error');
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
    syncError,
    syncAdSlots,
    handleAdSlotsUpdated
  };
};
