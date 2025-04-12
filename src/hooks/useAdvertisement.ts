
import { useCallback, useEffect } from 'react';
import { useAdState } from './useAdState';
import { getSessionId, getAdPositionKey, getAdFromCache } from '@/services/adCacheService';
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
  
  // Handle ad click
  const handleAdClick = useCallback(async () => {
    if (!adState.adId || !isMountedRef.current) return;
    await trackAdClick(adState.adId, position, slotId, pageSection);
  }, [adState.adId, position, slotId, pageSection]);
  
  // Fetch ads
  const fetchAds = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;
    
    // Check if we should use the cache
    const cachedAd = getAdFromCache(adPositionKey, force);
    
    if (cachedAd) {
      if (cachedAd.version === adState.adVersion && adState.adLoaded && adState.adContent === cachedAd.content) {
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
        const selectedAd = selectAdFromMatching(localStorageAds, position, slotId, pageSection);
        
        if (selectedAd) {
          const { content, id, version, debug } = processSelectedAd(selectedAd, position, slotId, pageSection);
          
          updateAdState(content, id, version, debug);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              trackAdImpression(id, position, slotId, pageSection);
            }
          }, 300);
          
          return;
        }
      }
      
      // If no local storage ads, try Supabase
      const supabaseAds = await fetchAdsFromSupabase(position);
      
      if (supabaseAds && supabaseAds.length > 0 && isMountedRef.current) {
        // For Supabase ads, we want to randomly select one
        const randomIndex = Math.floor(Math.random() * supabaseAds.length);
        const selectedAd = supabaseAds[randomIndex];
        
        const { content, id, version, debug } = processSelectedAd(selectedAd, position, slotId, pageSection);
        
        if (version === adState.adVersion && adState.adLoaded) {
          console.log(`Ad content unchanged for ${position}, skipping server update`);
          return;
        }
        
        updateAdState(content, id, version, debug);
        
        if (id !== adState.adId) {
          trackAdImpression(id, position, slotId, pageSection);
        }
      } else {
        console.log('No active ads found for position:', position);
        updateAdState('', null, '', null, false, `No active ads for position: ${position}`);
      }
    } catch (err) {
      console.error('Error in ad fetching:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      updateAdState('', null, '', null, false, `Fetch error: ${errorMessage}`);
    }
  }, [position, slotId, pageSection, adState, updateAdState, adPositionKey, canFetchAd]);
  
  // Initial ad fetch and event listener setup
  useEffect(() => {
    fetchAds();
    
    const handleAdSlotsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      if (!isMountedRef.current) return;
      
      const updatedSlots = customEvent.detail || [];
      
      const slots = Array.isArray(updatedSlots) ? updatedSlots : 
                   (updatedSlots.slots && Array.isArray(updatedSlots.slots) ? updatedSlots.slots : []);
      
      const isRelevant = slots.some((slot: any) => slot.position === position);
      
      if (isRelevant) {
        console.log(`Relevant ad slots updated for instance ${adState.instanceId.slice(0,8)}, refreshing ad for ${position}...`);
        fetchAds(true);
      } else {
        console.log(`Ad slots updated but not relevant for position ${position}, skipping refresh`);
      }
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    };
  }, [fetchAds, position, adState.instanceId]);
  
  return {
    ...adState,
    handleAdClick
  };
};
