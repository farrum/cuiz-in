
import { useCallback } from 'react';
import { getAdPositionKey, getAdFromCache, debugAvailableAds } from '@/services/adCacheService';
import { 
  fetchAdsFromLocalStorage, 
  fetchAdsFromSupabase, 
  selectAdFromMatching,
  processSelectedAd
} from '@/services/adFetchService';

interface UseAdFetchProps {
  position: string;
  slotId?: string;
  pageSection?: string;
  adState: any;
  updateAdState: (content: string, id: string | null, version: string, debug: string | null, isActive?: boolean, error?: string | null) => void;
  canFetchAd: (force?: boolean) => boolean;
  isMountedRef: React.MutableRefObject<boolean>;
  lastFetchTimeRef: React.MutableRefObject<number>;
  trackImpression: (id: string, position: string, slotId?: string, pageSection?: string) => Promise<void>;
}

export const useAdFetch = ({
  position,
  slotId,
  pageSection,
  adState,
  updateAdState,
  canFetchAd,
  isMountedRef,
  lastFetchTimeRef,
  trackImpression
}: UseAdFetchProps) => {
  
  const adPositionKey = getAdPositionKey(position, slotId, pageSection);
  
  // Fetch ads with retry logic
  const fetchAds = useCallback(async (force = false, retryCount = 0) => {
    if (!isMountedRef.current) return;
    
    // Print debugging info for this ad request
    console.log(`📢 Ad fetch request: position=${position}, slotId=${slotId || 'default'}, section=${pageSection || 'default'}, force=${force}, retry=${retryCount}`);
    
    // Additional debugging for all positions
    debugAvailableAds();
    
    // Check if we should use the cache
    const cachedAd = getAdFromCache(adPositionKey, force);
    
    if (cachedAd) {
      if (cachedAd.version === adState.adVersion && adState.adLoaded && adState.adContent === cachedAd.content) {
        console.log(`Ad content unchanged for ${position}, skipping update`);
        return;
      }
      
      console.log(`Using cached ad for ${position} (id: ${cachedAd.id.substring(0, 8)})`);
      updateAdState(
        cachedAd.content,
        cachedAd.id,
        cachedAd.version,
        `Cached ad: ${cachedAd.id.substring(0, 8)}`
      );
      
      return;
    }
    
    // Check if we should throttle the fetch
    if (!canFetchAd(force)) {
      console.log(`Skipping ad fetch for ${position}, throttled (last fetch ${Date.now() - lastFetchTimeRef.current}ms ago)`);
      return;
    }
    
    try {
      // Try to get ads from localStorage first
      const localStorageAds = fetchAdsFromLocalStorage(position);
      
      if (localStorageAds && localStorageAds.length > 0) {
        console.log(`Found ${localStorageAds.length} matching ads in localStorage for position ${position}`);
        
        const selectedAd = selectAdFromMatching(localStorageAds, position, slotId, pageSection);
        
        if (selectedAd && selectedAd.code) {
          console.log(`Selected ad from localStorage: ${selectedAd.name || selectedAd.id}`);
          
          const { content, id, version, debug } = processSelectedAd(selectedAd, position, slotId, pageSection);
          
          updateAdState(content, id, version, debug);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              trackImpression(id, position, slotId, pageSection).catch(err => {
                console.warn(`Failed to track impression for ${id}:`, err);
              });
            }
          }, 300);
          
          return;
        } else {
          console.log(`No valid ad was selected from matching ads for position ${position}`);
        }
      } else {
        console.log(`No ads found in localStorage for position ${position}, trying Supabase...`);
      }
      
      // If no local storage ads, try Supabase
      const supabaseAds = await fetchAdsFromSupabase(position);
      
      if (supabaseAds && supabaseAds.length > 0 && isMountedRef.current) {
        console.log(`Found ${supabaseAds.length} ads from Supabase for position ${position}`);
        
        // For Supabase ads, we want to randomly select one
        const randomIndex = Math.floor(Math.random() * supabaseAds.length);
        const selectedAd = supabaseAds[randomIndex];
        
        if (selectedAd && selectedAd.code) {
          console.log(`Selected ad from Supabase: ${selectedAd.name || selectedAd.id}`);
          
          const { content, id, version, debug } = processSelectedAd(selectedAd, position, slotId, pageSection);
          
          if (version === adState.adVersion && adState.adLoaded) {
            console.log(`Ad content unchanged for ${position}, skipping server update`);
            return;
          }
          
          updateAdState(content, id, version, debug);
          
          if (id !== adState.adId) {
            trackImpression(id, position, slotId, pageSection).catch(err => {
              console.warn(`Failed to track impression for ${id}:`, err);
            });
          }
        } else {
          console.log(`Selected ad has no valid content for position ${position}`);
          updateAdState('', null, '', null, false, `No valid ad content for position: ${position}`);
          
          // If we run out of retries, show fallback content
          if (retryCount >= 2) {
            const fallbackContent = `<div style="text-align:center;padding:10px;font-size:12px;">Ad content unavailable</div>`;
            updateAdState(
              fallbackContent, 
              'fallback', 
              'fallback-' + Date.now(), 
              'Using fallback content',
              true,
              null
            );
          }
        }
      } else if (retryCount < 2) {
        // Retry logic - try again after a delay if no ads found
        console.log(`No active ads found for position: ${position}, will retry (${retryCount + 1}/2)`);
        
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchAds(true, retryCount + 1);
          }
        }, 2000 * (retryCount + 1)); // Exponential backoff
        
      } else {
        // Final failure after retries
        console.log(`Failed to fetch ads for position: ${position} after ${retryCount} retries`);
        updateAdState('', null, '', null, false, `No active ads for position: ${position} after retries`);
      }
    } catch (err) {
      console.error('Error in ad fetching:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      updateAdState('', null, '', null, false, `Fetch error: ${errorMessage}`);
      
      // Retry on error if we haven't exceeded retry count
      if (retryCount < 2) {
        console.log(`Will retry ad fetch due to error for ${position} (${retryCount + 1}/2)`);
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchAds(true, retryCount + 1);
          }
        }, 3000 * (retryCount + 1)); // Exponential backoff
      }
    }
  }, [position, slotId, pageSection, adState, updateAdState, adPositionKey, canFetchAd, trackImpression, isMountedRef, lastFetchTimeRef]);
  
  return {
    fetchAds,
    adPositionKey
  };
};
