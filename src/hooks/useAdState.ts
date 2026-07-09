
import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface AdState {
  adLoaded: boolean;
  adContent: string;
  adActive: boolean;
  adError: string | null;
  adDebug: string | null;
  adId: string | null;
  adVersion: string;
  instanceId: string;
}

export const useAdState = () => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adContent, setAdContent] = useState('');
  const [adActive, setAdActive] = useState(true);
  const [adId, setAdId] = useState<string | null>(null);
  const [adDebug, setAdDebug] = useState<string | null>(null);
  const [adError, setAdError] = useState<string | null>(null);
  const [adVersion, setAdVersion] = useState<string>('');
  
  // Refs for handling timing and component lifecycle
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const instanceId = useRef<string>(uuidv4());
  const adRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Setup and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
    };
  }, []);
  
  // Update ad state
  const updateAdState = useCallback((
    content: string,
    id: string | null,
    version: string,
    debug: string | null,
    isActive: boolean = true,
    error: string | null = null
  ) => {
    if (!isMountedRef.current) return;
    
    setAdContent(content);
    setAdId(id);
    setAdVersion(version);
    setAdDebug(debug);
    setAdLoaded(!!content);
    setAdActive(isActive);
    setAdError(error);
  }, []);
  
  // Handle throttling for ad fetches
  const canFetchAd = useCallback((force = false): boolean => {
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 5000) {
      return false;
    }
    lastFetchTimeRef.current = now;
    return true;
  }, []);
  
  return {
    adState: {
      adLoaded,
      adContent,
      adActive,
      adError,
      adDebug,
      adId,
      adVersion,
      instanceId: instanceId.current
    },
    updateAdState,
    canFetchAd,
    isMountedRef,
    adRefreshTimeoutRef,
    lastFetchTimeRef
  };
};
