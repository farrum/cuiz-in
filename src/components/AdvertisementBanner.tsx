import React, { useState, useEffect, useId, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useScriptExecution } from '@/hooks/useScriptExecution';

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('ad_tracking_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('ad_tracking_session_id', sessionId);
  }
  return sessionId;
};

const adContentCache = new Map<string, {
  content: string,
  id: string,
  version: string,
  timestamp: number
}>();

interface AdvertisementBannerProps {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'middle';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  slotId?: string;
  pageSection?: string;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ 
  position = 'top',
  className = '',
  size = 'medium',
  slotId,
  pageSection
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adContent, setAdContent] = useState('');
  const [adActive, setAdActive] = useState(true);
  const [adId, setAdId] = useState<string | null>(null);
  const [adDebug, setAdDebug] = useState<string | null>(null);
  const [adError, setAdError] = useState<string | null>(null);
  const [adVersion, setAdVersion] = useState<string>(''); // Track content version
  const sessionId = getSessionId();
  const containerId = useId().replace(/:/g, '-') + '-ad-container';
  
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const instanceId = useRef<string>(uuidv4());
  
  const adPositionKey = `${position}-${slotId || 'default'}-${pageSection || 'default'}`;
  
  useScriptExecution(adContent, containerId);
  
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
        const matchingAds = adSlots.filter((ad: any) => 
          ad.position === position && ad.active
        );
        
        if (matchingAds.length > 0) {
          const now = new Date();
          const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
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
          
          const selectedAd = matchingAds[index];
          
          const contentVersion = btoa(selectedAd.id + (selectedAd.last_updated || ''));
          
          adContentCache.set(adPositionKey, {
            content: selectedAd.code,
            id: selectedAd.id,
            version: contentVersion,
            timestamp: now
          });
          
          console.log(`Ad selected from localStorage: ${selectedAd.id} (${selectedAd.name})`);
          setAdDebug(`Local ad: ${selectedAd.name}`);
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
        
        console.log(`Ad updated from server: ${selectedAd.id} (${selectedAd.name})`);
        setAdDebug(`Server ad: ${selectedAd.name}`);
        
        setAdContent(selectedAd.code);
        setAdId(selectedAd.id);
        setAdVersion(contentVersion);
        setAdLoaded(true);
        setAdActive(true);
        
        if (selectedAd.id !== adId) {
          trackAdImpression(selectedAd.id);
        }
      } else if (!adLoaded) {
        console.log('No active ads found for position:', position);
        setAdError(`No active ads for position: ${position}`);
        setAdActive(false);
      }
    } catch (err) {
      console.error('Error in ad fetching:', err);
      setAdError(`Fetch error: ${err instanceof Error ? err.message : String(err)}`);
      setAdActive(false);
    }
  }, [position, slotId, pageSection, adVersion, adLoaded, adContent, adId, adPositionKey]);

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
    };
  }, [fetchAds, position]);

  if (!adActive) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`w-full bg-muted/30 border border-muted rounded-lg p-4 ${className} text-center text-xs text-muted-foreground`}>
          Ad slot inactive: {position} / {slotId}
          {adError && <div className="text-destructive mt-1">{adError}</div>}
        </div>
      );
    }
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-2';
      case 'large':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'mb-6';
      case 'bottom':
        return 'mt-6';
      case 'left':
        return 'mr-6';
      case 'right':
        return 'ml-6';
      case 'middle':
        return 'my-6';
      default:
        return 'mb-6';
    }
  };
  
  return (
    <div 
      className={`w-full ${getSizeClasses()} bg-secondary/30 border border-secondary rounded-lg 
      flex items-center justify-center ${getPositionClasses()} 
      transition-all duration-300 ${adLoaded ? 'opacity-100' : 'opacity-50'} ${className}`}
      onClick={handleAdClick}
      data-ad-slot={slotId || position}
      data-ad-section={pageSection || position}
      data-ad-version={adVersion}
      data-instance-id={instanceId.current.slice(0,8)}
    >
      {!adLoaded ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading advertisement...</p>
          {adError && process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-destructive">{adError}</p>
          )}
        </div>
      ) : (
        <div className="w-full">
          <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-2 text-center">
              {adDebug && <p className="text-xs text-blue-500">{adDebug}</p>}
              <p className="text-xs text-muted-foreground">Slot: {slotId || position} / Section: {pageSection || 'default'}</p>
            </div>
          )}
          <div id={containerId} dangerouslySetInnerHTML={{ __html: adContent }}></div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementBanner;
