
import { useCallback, useEffect } from 'react';
import { useAdState } from './useAdState';
import { useAdTracking } from './useAdTracking';
import { useAdFetch } from './useAdFetch';
import { getSessionId } from '@/services/adCacheService';

interface UseAdvertisementProps {
  position: string;
  slotId?: string;
  pageSection?: string;
  skipTopics?: boolean;
  refreshTrigger?: number;
}

export const useAdvertisement = ({ 
  position, 
  slotId, 
  pageSection, 
  skipTopics = false,
  refreshTrigger = 0
}: UseAdvertisementProps) => {
  // Initialize session ID
  getSessionId();
  
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
    skipTopics
  });
  
  // Handle ad click using tracking hook
  const handleAdClick = useCallback(async () => {
    if (!adState.adId || !isMountedRef.current) return;
    await trackClick(adState.adId, position, slotId, pageSection, isMountedRef.current);
  }, [adState.adId, position, slotId, pageSection, trackClick, isMountedRef]);
  
  // Expose refresh function
  const refreshAd = useCallback((force: boolean = false) => {
    console.log(`Manual refresh requested for ad: ${position}/${slotId || 'default'}`);
    fetchAds(force);
  }, [fetchAds, position, slotId]);
  
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
  
  // Effect for manual refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log(`Refresh trigger activated (${refreshTrigger}) for ${position}/${slotId || 'default'}`);
      fetchAds(true);
    }
  }, [refreshTrigger, fetchAds, position, slotId]);
  
  return {
    ...adState,
    handleAdClick,
    refreshAd
  };
};
