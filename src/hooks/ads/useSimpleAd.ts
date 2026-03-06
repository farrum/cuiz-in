import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  ttl: 60000 // 1 minute
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

      // Check memory cache first
      if (!forceRefresh && adCache.slots && now - adCache.timestamp < adCache.ttl) {
        adSlots = adCache.slots;
        console.log(`[useSimpleAd] Using memory cache for ${position}`);
      } else {
        // Try localStorage cache
        try {
          const stored = localStorage.getItem('quiz_app_ad_slots');
          if (stored) {
            const parsed = JSON.parse(stored);
            adSlots = Array.isArray(parsed) ? parsed : parsed?.data;
          }
        } catch (e) {
          console.warn('[useSimpleAd] localStorage parse error');
        }

        // Fetch from Supabase
        try {
          const { data, error: fetchError } = await supabase
            .from('ad_slots')
            .select('*')
            .eq('active', true);

          if (!fetchError && data && data.length > 0) {
            adSlots = data;
            adCache.slots = data;
            adCache.timestamp = now;
            localStorage.setItem('quiz_app_ad_slots', JSON.stringify(data));
            console.log(`[useSimpleAd] Fetched ${data.length} ad slots from Supabase`);
          } else if (fetchError) {
            console.warn('[useSimpleAd] Supabase error:', fetchError.message);
          }
        } catch (e) {
          console.warn('[useSimpleAd] Fetch failed, using cache');
        }
      }

      if (!isMountedRef.current) return;

      // Find matching ads for position
      if (adSlots && adSlots.length > 0) {
        const matchingAds = adSlots.filter(ad => 
          ad.position === position && ad.active && ad.code
        );

        if (matchingAds.length > 0) {
          const selectedAd = matchingAds[Math.floor(Math.random() * matchingAds.length)];
          // Don't sanitize document.write for ad code - some networks need it
          const adCode = sanitizeAdCode(selectedAd.code);
          setContent(adCode);
          setError(null);
          console.log(`[useSimpleAd] Loaded ad for ${position}: ${selectedAd.name}`);
        } else {
          console.log(`[useSimpleAd] No active ads for position: ${position}`);
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
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [position]);

  useEffect(() => {
    isMountedRef.current = true;
    
    fetchAd();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAd(true);
    }, 300000);

    // Listen for updates
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

function sanitizeAdCode(code: string): string {
  if (!code) return '';
  
  // Only sanitize truly problematic patterns, keep ad network functionality
  return code
    .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API blocked')")
    .replace(/navigator\.serviceWorker\.register/g, "console.log('SW blocked')")
    .replace(/Notification\.requestPermission/g, "console.log('Notification blocked')")
    .replace(/new\s+TCPusher/g, "console.log('TCPusher blocked')");
  // Note: Don't block document.write - some ad networks need it
}
