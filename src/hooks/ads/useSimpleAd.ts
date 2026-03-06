import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { containsBlockedContent } from '@/utils/adProviderScripts';

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
}

// Shared cache
const adCache = {
  slots: null as AdSlot[] | null,
  timestamp: 0,
  ttl: 60000
};

export const useSimpleAd = (position: string) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchAd = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const now = Date.now();
      let adSlots: AdSlot[] | null = null;

      if (!forceRefresh && adCache.slots && now - adCache.timestamp < adCache.ttl) {
        adSlots = adCache.slots;
      } else {
        // SECURITY: Clear any old localStorage cache that may contain malicious code
        try {
          const stored = localStorage.getItem('quiz_app_ad_slots');
          if (stored && (stored.includes('data-banner-id') || stored.includes('aclib') || stored.includes('acscdn'))) {
            console.warn('[useSimpleAd] Purging malicious ad cache from localStorage');
            localStorage.removeItem('quiz_app_ad_slots');
          }
        } catch (e) {}

        try {
          const { data, error: fetchError } = await supabase
            .from('ad_slots')
            .select('*')
            .eq('active', true);

          if (!fetchError && data && data.length > 0) {
            // SECURITY: Filter out any slots with malicious content
            const safeSlots = data.filter(slot => {
              if (containsBlockedContent(slot.code)) {
                console.warn(`[useSimpleAd] BLOCKED malicious ad slot: ${slot.name}`);
                return false;
              }
              if (slot.code.includes('data-banner-id') || slot.code.includes('aclib')) {
                console.warn(`[useSimpleAd] BLOCKED banner-id/aclib slot: ${slot.name}`);
                return false;
              }
              return true;
            });

            adSlots = safeSlots;
            adCache.slots = safeSlots;
            adCache.timestamp = now;
            // Only cache safe slots
            if (safeSlots.length > 0) {
              localStorage.setItem('quiz_app_ad_slots', JSON.stringify(safeSlots));
            }
          } else if (fetchError) {
            console.warn('[useSimpleAd] Supabase error:', fetchError.message);
          }
        } catch (e) {
          console.warn('[useSimpleAd] Fetch failed');
        }
      }

      if (!isMountedRef.current) return;

      if (adSlots && adSlots.length > 0) {
        const matchingAds = adSlots.filter(ad => 
          ad.position === position && ad.active && ad.code
        );

        if (matchingAds.length > 0) {
          const selectedAd = matchingAds[Math.floor(Math.random() * matchingAds.length)];
          setContent(selectedAd.code);
          setError(null);
        } else {
          setContent(null);
        }
      } else {
        setContent(null);
      }
    } catch (err) {
      console.error('[useSimpleAd] Error:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load ad');
        setContent(null);
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [position]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAd();
    const interval = setInterval(() => fetchAd(true), 300000);
    const handleUpdate = () => fetchAd(true);
    window.addEventListener('adSlotsUpdated', handleUpdate);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener('adSlotsUpdated', handleUpdate);
    };
  }, [fetchAd]);

  return { content, isLoading, error };
};
