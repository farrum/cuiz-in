
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface UseAdvertisementProps {
  position: string;
  slotId?: string;
  pageSection?: string;
}

interface CachedAd {
  content: string;
  id: string;
  version: string;
  timestamp: number;
}

// Shared cache across all ad instances
const adContentCache = new Map<string, CachedAd>();

// Helper to get a consistent session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('ad_tracking_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('ad_tracking_session_id', sessionId);
  }
  return sessionId;
};

export const useAdvertisement = ({ position, slotId, pageSection }: UseAdvertisementProps) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adContent, setAdContent] = useState('');
  const [adActive, setAdActive] = useState(true);
  const [adId, setAdId] = useState<string | null>(null);
  const [adDebug, setAdDebug] = useState<string | null>(null);
  const [adError, setAdError] = useState<string | null>(null);
  const [adVersion, setAdVersion] = useState<string>('');
  
  const sessionId = getSessionId();
  const adPositionKey = `${position}-${slotId || 'default'}-${pageSection || 'default'}`;
  
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const instanceId = useRef<string>(uuidv4());
  const adRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const trackAdImpression = async (adSlotId: string) => {
    if (!adSlotId || !isMountedRef.current) return;
    
    try {
      const userId = localStorage.getItem('user_id') || null;
      const pageUrl = window.location.href;
      const deviceInfo = navigator.userAgent;
      
      console.log(`Tracking impression for ad: ${adSlotId} in ${slotId || position} / ${pageSection || 'unknown'}`);
      
      const { error } = await supabase.from('ad_views').insert({
        ad_id: adSlotId,
        user_id: userId,
        session_id: sessionId,
        page_url: pageUrl,
        device_info: deviceInfo,
        ad_position: position,
        slot_id: slotId || position,
        page_section: pageSection || 'default'
      });
      
      if (error) {
        console.error('Error tracking ad impression:', error);
        setAdError(`Impression tracking error: ${error.message}`);
      } else {
        console.log(`Ad impression tracked: ${adSlotId}`);
      }
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      setAdError(`Impression tracking error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAdClick = async () => {
    if (!adId || !isMountedRef.current) return;
    
    try {
      const userId = localStorage.getItem('user_id') || null;
      const pageUrl = window.location.href;
      const deviceInfo = navigator.userAgent;
      
      console.log(`Tracking click for ad: ${adId} in ${slotId || position} / ${pageSection || 'unknown'}`);
      
      const { error } = await supabase.from('ad_clicks').insert({
        ad_id: adId,
        user_id: userId,
        session_id: sessionId,
        page_url: pageUrl,
        device_info: deviceInfo,
        ad_position: position,
        slot_id: slotId || position,
        page_section: pageSection || 'default'
      });
      
      if (error) {
        console.error('Error tracking ad click:', error);
      } else {
        console.log(`Ad click tracked: ${adId}`);
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };
  
  const fetchAds = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    const cachedAd = adContentCache.get(adPositionKey);
    
    if (!force && cachedAd && now - cachedAd.timestamp < 300000) {
      console.log(`Using cached ad for ${adPositionKey} (${(now - cachedAd.timestamp) / 1000}s old)`);
      
      if (cachedAd.version === adVersion && adLoaded && adContent === cachedAd.content) {
        console.log(`Ad content unchanged for ${position}, skipping update`);
        return;
      }
      
      setAdContent(cachedAd.content);
      setAdId(cachedAd.id);
      setAdVersion(cachedAd.version);
      setAdDebug(`Cached ad: ${cachedAd.id}`);
      setAdLoaded(true);
      setAdActive(true);
      
      return;
    }
    
    if (!force && now - lastFetchTimeRef.current < 5000) {
      console.log(`Skipping ad fetch for ${position}, throttled (last fetch ${now - lastFetchTimeRef.current}ms ago)`);
      return;
    }
    
    lastFetchTimeRef.current = now;
    
    try {
      console.log(`Fetching ads for position: ${position}, slotId: ${slotId || 'default'}, pageSection: ${pageSection || 'default'}`);
      setAdError(null);
      
      const storedAds = localStorage.getItem('quiz_app_ad_slots');
      
      if (storedAds) {
        const adSlots = JSON.parse(storedAds);
        console.log(`Found ${adSlots.length} total ad slots in localStorage`);
        
        const matchingAds = adSlots.filter((ad: any) => 
          ad.position === position && ad.active
        );
        
        console.log(`Found ${matchingAds.length} matching ads for position ${position}`);
        
        if (matchingAds.length > 0) {
          const currentTime = Date.now(); 
          const dayKey = new Date().toISOString().split('T')[0];
          const positionKey = `${position}-${slotId || 'default'}-${pageSection || 'default'}`;
          const consistencyKey = `${dayKey}-${positionKey}`;
          
          let index = 0;
          const savedIndex = localStorage.getItem(`ad_index_${consistencyKey}`);
          if (savedIndex) {
            index = parseInt(savedIndex);
          } else {
            index = Math.floor(Math.random() * matchingAds.length);
            localStorage.setItem(`ad_index_${consistencyKey}`, index.toString());
          }
          
          const selectedAd = matchingAds[index % matchingAds.length];
          
          const contentVersion = btoa(selectedAd.id + (selectedAd.last_updated || ''));
          
          adContentCache.set(adPositionKey, {
            content: selectedAd.code,
            id: selectedAd.id,
            version: contentVersion,
            timestamp: currentTime
          });
          
          console.log(`Ad selected from localStorage: ${selectedAd.id} (${selectedAd.name}) - position: ${position}`);
          setAdDebug(`Local ad: ${selectedAd.name} (${selectedAd.position})`);
          setAdContent(selectedAd.code);
          setAdId(selectedAd.id);
          setAdVersion(contentVersion);
          setAdLoaded(true);
          setAdActive(true);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              trackAdImpression(selectedAd.id);
            }
          }, 300);
          
          return; // We found a matching ad, no need to query Supabase
        } else {
          console.log(`No matching ads found in localStorage for position: ${position}`);
        }
      }
      
      const { data: supabaseAds, error } = await supabase
        .from('ad_slots')
        .select('*')
        .eq('position', position)
        .eq('active', true);
      
      if (error) {
        console.error('Error fetching ads from Supabase:', error);
        setAdError(`Database error: ${error.message}`);
        return;
      }
      
      if (supabaseAds && supabaseAds.length > 0 && isMountedRef.current) {
        console.log(`Found ${supabaseAds.length} ads from Supabase for position ${position}`);
        const randomIndex = Math.floor(Math.random() * supabaseAds.length);
        const selectedAd = supabaseAds[randomIndex];
        
        const contentVersion = btoa(selectedAd.id + selectedAd.last_updated);
        
        adContentCache.set(adPositionKey, {
          content: selectedAd.code,
          id: selectedAd.id,
          version: contentVersion,
          timestamp: now
        });
        
        if (contentVersion === adVersion && adLoaded) {
          console.log(`Ad content unchanged for ${position}, skipping server update`);
          return;
        }
        
        console.log(`Ad updated from server: ${selectedAd.id} (${selectedAd.name}) - position: ${position}`);
        setAdDebug(`Server ad: ${selectedAd.name}`);
        
        setAdContent(selectedAd.code);
        setAdId(selectedAd.id);
        setAdVersion(contentVersion);
        setAdLoaded(true);
        setAdActive(true);
        
        if (selectedAd.id !== adId) {
          trackAdImpression(selectedAd.id);
        }
      } else {
        console.log('No active ads found in Supabase for position:', position);
        setAdError(`No active ads for position: ${position}`);
        setAdActive(false);
      }
    } catch (err) {
      console.error('Error in ad fetching:', err);
      setAdError(`Fetch error: ${err instanceof Error ? err.message : String(err)}`);
      setAdActive(false);
    }
  }, [position, slotId, pageSection, adVersion, adLoaded, adContent, adId, adPositionKey]);

  // Initial ad fetch and event listener setup
  useEffect(() => {
    isMountedRef.current = true;
    
    fetchAds();
    
    const handleAdSlotsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      if (!isMountedRef.current) return;
      
      const updatedSlots = customEvent.detail || [];
      
      const slots = Array.isArray(updatedSlots) ? updatedSlots : 
                   (updatedSlots.slots && Array.isArray(updatedSlots.slots) ? updatedSlots.slots : []);
      
      const isRelevant = slots.some((slot: any) => slot.position === position);
      
      if (isRelevant) {
        console.log(`Relevant ad slots updated for instance ${instanceId.current.slice(0,8)}, refreshing ad for ${position}...`);
        fetchAds(true);
      } else {
        console.log(`Ad slots updated but not relevant for position ${position}, skipping refresh`);
      }
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
    };
  }, [fetchAds, position]);

  return {
    adLoaded,
    adContent,
    adActive,
    adError,
    adDebug,
    instanceId: instanceId.current,
    adId,
    adVersion,
    handleAdClick
  };
};
