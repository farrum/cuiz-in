
import { useCallback, useEffect, useRef } from 'react';
import { useAdState } from './useAdState';
import { useAdTracking } from './useAdTracking';
import { useAdFetch } from './useAdFetch';
import { getSessionId } from '@/services/adCacheService';

interface UseAdvertisementProps {
  position: string;
  slotId?: string;
  pageSection?: string;
}

export const useAdvertisement = ({ position, slotId, pageSection }: UseAdvertisementProps) => {
  // Initialize session ID
  getSessionId();
  
  const firstLoadCompleted = useRef(false);
  
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
    trackImpression
  });
  
  // Handle ad click using tracking hook
  const handleAdClick = useCallback(async () => {
    if (!adState.adId || !isMountedRef.current) return;
    await trackClick(adState.adId, position, slotId, pageSection, isMountedRef.current);
  }, [adState.adId, position, slotId, pageSection, trackClick, isMountedRef]);
  
  // Initial ad fetch and event listener setup
  useEffect(() => {
    console.log(`Ad hook mounted for ${position}/${slotId || 'default'} (id: ${adState.instanceId.slice(0,8)})`);
    isMountedRef.current = true;
    
    // Initial fetch for all ad positions
    fetchAds();
    firstLoadCompleted.current = true;
    
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
    
    const handleForceRefresh = () => {
      if (!isMountedRef.current) return;
      console.log(`Force refresh received for ${position}/${slotId || 'default'}`);
      fetchAds(true);
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    window.addEventListener('forceAdRefresh', handleForceRefresh);
    
    // Force refresh after initialization for ALL ad positions
    const initTimer = setTimeout(() => {
      if (isMountedRef.current) {
        console.log(`Forced refresh after initialization for ad position: ${position}`);
        fetchAds(true);
      }
    }, 2000);
    
    return () => {
      console.log(`Ad hook unmounting for ${position}/${slotId || 'default'} (id: ${adState.instanceId.slice(0,8)})`);
      isMountedRef.current = false;
      
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
      
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
      window.removeEventListener('forceAdRefresh', handleForceRefresh);
      clearTimeout(initTimer);
    };
  }, [fetchAds, position, slotId, adState.instanceId, adPositionKey]);
  
  return {
    ...adState,
    handleAdClick
  };
};
