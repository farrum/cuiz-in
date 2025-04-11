
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProfileAds = () => {
  const [forceReloadAds, setForceReloadAds] = useState(0);
  
  const adSlotsLoadedRef = useRef(false);
  const adRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastAdRefreshRef = useRef(0);
  
  // Handle ad slot updates
  useEffect(() => {
    const handleAdSlotsUpdated = () => {
      if (!isMountedRef.current) return;
      
      console.log('Ad slots updated event received in profile page');
      
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
      
      const now = Date.now();
      const timeSinceLastRefresh = now - lastAdRefreshRef.current;
      
      if (timeSinceLastRefresh < 5000) {
        console.log(`Throttling ad refresh, last refresh was ${timeSinceLastRefresh}ms ago`);
        
        adRefreshTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            console.log('Refreshing profile page ads after throttle delay...');
            lastAdRefreshRef.current = Date.now();
            setForceReloadAds(prev => prev + 1);
          }
          adRefreshTimeoutRef.current = null;
        }, 5000 - timeSinceLastRefresh);
        
        return;
      }
      
      adRefreshTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('Refreshing profile page ads after debounce...');
          lastAdRefreshRef.current = Date.now();
          setForceReloadAds(prev => prev + 1);
        }
        adRefreshTimeoutRef.current = null;
      }, 300);
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
    };
  }, []);
  
  // Sync ad slots from server
  useEffect(() => {
    if (adSlotsLoadedRef.current || !isMountedRef.current) return;
    
    const syncAdSlots = async () => {
      try {
        console.log('Syncing ad slots from server for profile page...');
        const { data: adSlots, error } = await supabase
          .from('ad_slots')
          .select('*')
          .eq('active', true);
          
        if (!error && adSlots && isMountedRef.current) {
          console.log(`Successfully loaded ${adSlots.length} ad slots for profile page`);
          
          // Make sure we have sidebar and bottom ads in our slots
          const hasBottomAd = adSlots.some(slot => slot.position === 'bottom');
          const hasSidebarAd = adSlots.some(slot => slot.position === 'sidebar');
          
          console.log(`Has bottom ads: ${hasBottomAd}, Has sidebar ads: ${hasSidebarAd}`);
          
          localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
          
          setForceReloadAds(1);
          adSlotsLoadedRef.current = true;
          lastAdRefreshRef.current = Date.now();
          
          window.dispatchEvent(new CustomEvent('adSlotsUpdated', { 
            detail: { source: 'profilePage', slots: adSlots }
          }));
        } else if (isMountedRef.current) {
          console.error('Error fetching ad slots for profile page:', error);
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error('Error syncing ad slots for profile page:', err);
        }
      }
    };
    
    syncAdSlots();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return {
    forceReloadAds
  };
};
