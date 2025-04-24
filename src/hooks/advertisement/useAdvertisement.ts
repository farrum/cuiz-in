
import { useCallback, useEffect, useState } from 'react';
import { useAdState } from './useAdState';
import { useAdTracking } from './useAdTracking';
import { useAdFetch } from './useAdFetch';
import { getSessionId } from '@/services/adCacheService';

interface UseAdvertisementProps {
  position: string;
  slotId?: string;
  pageSection?: string;
  skipTopics?: boolean;
  retryCount?: number;
}

export const useAdvertisement = ({ 
  position, 
  slotId, 
  pageSection, 
  skipTopics = true,
  retryCount = 2
}: UseAdvertisementProps) => {
  // Initialize session ID
  getSessionId();
  
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use the smaller hooks
  const {
    adState,
    updateAdState,
    canFetchAd,
    isMountedRef,
    adRefreshTimeoutRef,
    lastFetchTimeRef
  } = useAdState();
  
  const { handleAdClick: trackClick, trackImpression } = useAdTracking();
  
  const { fetchAds, adPositionKey } = useAdFetch({
    position,
    slotId,
    pageSection,
    adState,
    updateAdState,
    canFetchAd,
    isMountedRef,
    lastFetchTimeRef,
    trackImpression,
    skipTopics  // Pass this parameter to the fetchAds function
  });
  
  // Handle ad click using tracking hook
  const handleAdClick = useCallback(async () => {
    if (!adState.adId || !isMountedRef.current) return;
    await trackClick(adState.adId, position, slotId, pageSection, isMountedRef.current);
  }, [adState.adId, position, slotId, pageSection, trackClick, isMountedRef]);
  
  // Retry mechanism for ad loading failures
  const retryFetchAds = useCallback(() => {
    if (retryAttempts < retryCount && !adState.adLoaded && isMountedRef.current) {
      console.log(`Retrying ad fetch for ${position} (attempt ${retryAttempts + 1}/${retryCount})`);
      setIsRetrying(true);
      
      // Small delay before retry
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchAds(true);
          setRetryAttempts(prev => prev + 1);
          setIsRetrying(false);
        }
      }, 1000 * (retryAttempts + 1)); // Increasing backoff delay
    }
  }, [fetchAds, position, retryAttempts, retryCount, adState.adLoaded, isMountedRef]);
  
  // Effect to handle retry if initial load fails
  useEffect(() => {
    if (!adState.adLoaded && !isRetrying && retryAttempts < retryCount && isMountedRef.current) {
      const retryTimer = setTimeout(() => {
        retryFetchAds();
      }, 2000); // Wait 2 seconds after initial failure before first retry
      
      return () => clearTimeout(retryTimer);
    }
  }, [adState.adLoaded, retryFetchAds, isRetrying, retryAttempts, retryCount, isMountedRef]);
  
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
        console.log(`Relevant ad slots updated for instance ${adState.instanceId.slice(0,8)}, refreshing ad for ${position}...`);
        fetchAds(true);
        // Reset retry counter on manual refresh
        setRetryAttempts(0);
      } else {
        console.log(`Ad slots updated but not relevant for position ${position}, skipping refresh`);
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
    
    return () => {
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
      clearTimeout(initTimer);
    };
  }, [fetchAds, position, adState.instanceId, adPositionKey]);
  
  return {
    ...adState,
    handleAdClick,
    isRetrying,
    retryAttempts,
    retryFetch: retryFetchAds
  };
};
