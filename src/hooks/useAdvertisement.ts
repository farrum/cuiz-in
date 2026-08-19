
import { useCallback, useEffect, useRef } from 'react';
import { useAdState } from './useAdState';
import { getSessionId, getAdPositionKey, getAdFromCache, debugAvailableAds } from '@/services/adCacheService';
import { trackAdImpression, trackAdClick } from '@/services/adTrackingService';
import { 
  fetchAdsFromLocalStorage, 
  fetchAdsFromSupabase, 
  selectAdFromMatching,
  processSelectedAd
} from '@/services/adFetchService';

interface UseAdvertisementProps {
  position: string;
  slotId?: string;
  pageSection?: string;
}

export const useAdvertisement = ({ position, slotId, pageSection }: UseAdvertisementProps) => {
  // Initialize session ID
  getSessionId();
  
  const adPositionKey = getAdPositionKey(position, slotId, pageSection);
  
  const {
    adState,
    updateAdState,
    canFetchAd,
    isMountedRef,
    adRefreshTimeoutRef,
    lastFetchTimeRef
  } = useAdState();

  // Keep a ref of the latest ad state so `fetchAds` can read it without
  // taking a dependency on it. Depending on the whole state object made
  // `fetchAds` a new function on every render, which re-armed the effect
  // below in a loop (visible as an endless "Forced refresh" cycle).
  const adStateRef = useRef(adState);
  adStateRef.current = adState;
  
  // Handle ad click
  const handleAdClick = useCallback(async () => {
    const adId = adStateRef.current.adId;
    if (!adId || !isMountedRef.current) return;
    await trackAdClick(adId, position, slotId, pageSection);
  }, [position, slotId, pageSection]);
  
  // Fetch ads
  const fetchAds = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;
    
    // Additional debugging for bottom position
    const isBottomPosition = position === 'bottom';
    if (isBottomPosition) {
      console.log(`🔍 Fetching ads for BOTTOM position - slotId: ${slotId || 'default'}, pageSection: ${pageSection || 'default'}`);
      // Debug all available ads
      debugAvailableAds();
    }
    
    // Check if we should use the cache
    const cachedAd = getAdFromCache(adPositionKey, force);
    const current = adStateRef.current;
    
    if (cachedAd) {
      if (cachedAd.version === current.adVersion && current.adLoaded && current.adContent === cachedAd.content) {
        console.log(`Ad content unchanged for ${position}, skipping update`);
        return;
      }
      
      updateAdState(
        cachedAd.content,
        cachedAd.id,
        cachedAd.version,
        `Cached ad: ${cachedAd.id}`
      );
      
      return;
    }
    
    // Check if we should throttle the fetch
    if (!canFetchAd(force)) {
      console.log(`Skipping ad fetch for ${position}, throttled (last fetch ${Date.now() - lastFetchTimeRef.current}ms ago)`);
      return;
    }
    
    try {
      console.log(`Fetching ads for position: ${position}, slotId: ${slotId || 'default'}, pageSection: ${pageSection || 'default'}`);
      
      // Try to get ads from localStorage first
      const localStorageAds = fetchAdsFromLocalStorage(position);
      
      if (localStorageAds) {
        if (isBottomPosition) {
          console.log(`🔍 BOTTOM position: Found ${localStorageAds.length} matching ads in localStorage`);
          console.log('Matching ads:', localStorageAds);
        }
        
        const selectedAd = selectAdFromMatching(localStorageAds, position, slotId, pageSection);
        
        if (selectedAd) {
          if (isBottomPosition) {
            console.log(`🔍 BOTTOM position: Selected ad: ${selectedAd.name || selectedAd.id}`);
          }
          
          const { content, id, version, debug } = processSelectedAd(selectedAd, position, slotId, pageSection);
          
          updateAdState(content, id, version, debug);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              trackAdImpression(id, position, slotId, pageSection);
            }
          }, 300);
          
          return;
        } else if (isBottomPosition) {
          console.log(`🔍 BOTTOM position: No ad was selected from matching ads`);
        }
      } else if (isBottomPosition) {
        console.log(`🔍 BOTTOM position: No ads found in localStorage`);
      }
      
      // If no local storage ads, try Supabase
      const supabaseAds = await fetchAdsFromSupabase(position);
      
      if (supabaseAds && supabaseAds.length > 0 && isMountedRef.current) {
        if (isBottomPosition) {
          console.log(`🔍 BOTTOM position: Found ${supabaseAds.length} ads from Supabase`);
        }
        
        // For Supabase ads, we want to randomly select one
        const randomIndex = Math.floor(Math.random() * supabaseAds.length);
        const selectedAd = supabaseAds[randomIndex];
        
        const { content, id, version, debug } = processSelectedAd(selectedAd, position, slotId, pageSection);
        
        if (version === adStateRef.current.adVersion && adStateRef.current.adLoaded) {
          console.log(`Ad content unchanged for ${position}, skipping server update`);
          return;
        }
        
        updateAdState(content, id, version, debug);
        
        if (id !== current.adId) {
          trackAdImpression(id, position, slotId, pageSection);
        }
      } else {
        console.log(`No active ads found for position: ${position}`);
        if (isBottomPosition) {
          console.log(`🔍 BOTTOM position: No active ads found in Supabase`);
        }
        updateAdState('', null, '', null, false, `No active ads for position: ${position}`);
      }
    } catch (err) {
      console.error('Error in ad fetching:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      updateAdState('', null, '', null, false, `Fetch error: ${errorMessage}`);
    }
  }, [position, slotId, pageSection, updateAdState, adPositionKey, canFetchAd]);
  
  // Initial ad fetch and event listener setup
  useEffect(() => {
    // Initial fetch for all ad positions
    fetchAds();
    
    const handleAdSlotsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      if (!isMountedRef.current) return;
      
      const updatedSlots = customEvent.detail || [];
      
      const slots = Array.isArray(updatedSlots) ? updatedSlots : 
                   (updatedSlots.slots && Array.isArray(updatedSlots.slots) ? updatedSlots.slots : []);
      
      const isRelevant = slots.some((slot: any) => slot.position === position);
      
      if (isRelevant) {
        fetchAds(true);
      }
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    // Force refresh after initialization for ALL ad positions
    const initTimer = setTimeout(() => {
      if (isMountedRef.current) {
        console.log(`Forced refresh after initialization for ad position: ${position}`);
        fetchAds(true);
      }
    }, 2000);

    // Regular rotation interval (every 30s) so banner ads update regularly
    const refreshInterval = setInterval(() => {
      if (isMountedRef.current) {
        fetchAds(true);
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
      clearTimeout(initTimer);
      clearInterval(refreshInterval);
    };
  }, [fetchAds, position, adPositionKey]);
  
  return {
    ...adState,
    handleAdClick
  };
};
