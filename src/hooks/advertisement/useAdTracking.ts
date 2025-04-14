
import { useCallback } from 'react';
import { trackAdImpression, trackAdClick } from '@/services/adTrackingService';

export const useAdTracking = () => {
  // Handle ad click
  const handleAdClick = useCallback(async (
    adId: string | null, 
    position: string, 
    slotId?: string, 
    pageSection?: string, 
    isMounted = true
  ) => {
    if (!adId || !isMounted) return;
    await trackAdClick(adId, position, slotId, pageSection);
  }, []);

  // Handle ad impression
  const trackImpression = useCallback(async (
    id: string,
    position: string,
    slotId?: string,
    pageSection?: string
  ) => {
    await trackAdImpression(id, position, slotId, pageSection);
  }, []);

  return {
    handleAdClick,
    trackImpression
  };
};
