
import React, { useState, useEffect, useId, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useScriptExecution } from '@/hooks/useScriptExecution';

// Get or create a session ID for tracking
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('ad_tracking_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('ad_tracking_session_id', sessionId);
  }
  return sessionId;
};

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
  const sessionId = getSessionId();
  const containerId = useId().replace(/:/g, '-') + '-ad-container';
  
  // Use our custom hook to execute scripts in the ad content
  useScriptExecution(adContent, containerId);
  
  const fetchAds = useCallback(async () => {
    try {
      console.log(`Fetching ads for position: ${position}, slotId: ${slotId || 'default'}, pageSection: ${pageSection || 'default'}`);
      setAdLoaded(false);
      setAdError(null);
      
      // First try to get ads from Supabase
      const { data: supabaseAds, error } = await supabase
        .from('ad_slots')
        .select('*')
        .eq('position', position)
        .eq('active', true);
      
      if (error) {
        console.error('Error fetching ads from Supabase:', error);
        setAdError(`Database error: ${error.message}`);
        fallbackToLocalStorage();
        return;
      }
      
      if (supabaseAds && supabaseAds.length > 0) {
        // If Supabase has ads, use them
        const randomIndex = Math.floor(Math.random() * supabaseAds.length);
        const selectedAd = supabaseAds[randomIndex];
        
        console.log(`Ad selected from server: ${selectedAd.id} (${selectedAd.name})`);
        setAdDebug(`Server ad: ${selectedAd.name}`);
        
        setTimeout(() => {
          setAdContent(selectedAd.code);
          setAdId(selectedAd.id);
          setAdLoaded(true);
          
          // Track the ad impression
          trackAdImpression(selectedAd.id);
        }, 300);
        
        setAdActive(true);
      } else {
        console.log('No active ads found in Supabase for position:', position);
        setAdError(`No active ads for position: ${position}`);
        fallbackToLocalStorage();
      }
    } catch (err) {
      console.error('Error in ad fetching:', err);
      setAdError(`Fetch error: ${err instanceof Error ? err.message : String(err)}`);
      fallbackToLocalStorage();
    }
  }, [position, slotId, pageSection]);
  
  const fallbackToLocalStorage = useCallback(() => {
    // Load ad slots from localStorage as fallback
    const adSlotsJson = localStorage.getItem('quiz_app_ad_slots');
    console.log('Falling back to localStorage ads');
    
    if (!adSlotsJson) {
      console.log('No ad slots found in localStorage');
      setAdError('No ad slots in localStorage');
      setAdActive(false);
      return;
    }
    
    try {
      const adSlots = JSON.parse(adSlotsJson);
      console.log(`Found ${adSlots.length} ad slots in localStorage`);
      
      // Find a matching ad for this position
      const matchingAds = adSlots.filter((ad: any) => 
        ad.position === position && ad.active
      );
      
      console.log(`Found ${matchingAds.length} matching ads for position: ${position}`);
      
      if (matchingAds.length > 0) {
        // If multiple ads match the position, choose one randomly
        const randomIndex = Math.floor(Math.random() * matchingAds.length);
        const selectedAd = matchingAds[randomIndex];
        
        console.log(`Ad selected from localStorage: ${selectedAd.id} (${selectedAd.name})`);
        setAdDebug(`Local ad: ${selectedAd.name}`);
        
        // Simulate ad loading
        setTimeout(() => {
          setAdContent(selectedAd.code);
          setAdId(selectedAd.id);
          setAdLoaded(true);
          
          // Track the ad impression
          trackAdImpression(selectedAd.id);
        }, 300);
        
        setAdActive(true);
      } else {
        // No matching ads or all are inactive
        console.log('No matching active ads found for position:', position);
        setAdError(`No active ads for position: ${position} in localStorage`);
        setAdActive(false);
      }
    } catch (error) {
      console.error('Error parsing ad slots from localStorage:', error);
      setAdError(`LocalStorage parse error: ${error instanceof Error ? error.message : String(error)}`);
      setAdActive(false);
    }
  }, [position]);

  // Track ad impression when it's displayed
  const trackAdImpression = async (adSlotId: string) => {
    if (!adSlotId) return;
    
    try {
      const userId = localStorage.getItem('user_id') || null;
      const pageUrl = window.location.href;
      const deviceInfo = navigator.userAgent;
      
      console.log(`Tracking impression for ad: ${adSlotId} in ${slotId || position} / ${pageSection || 'unknown'}`);
      
      // Record impression in database
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

  // Track ad click when user interacts with the ad
  const handleAdClick = async () => {
    if (!adId) return;
    
    try {
      const userId = localStorage.getItem('user_id') || null;
      const pageUrl = window.location.href;
      const deviceInfo = navigator.userAgent;
      
      console.log(`Tracking click for ad: ${adId} in ${slotId || position} / ${pageSection || 'unknown'}`);
      
      // Record click in database
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
    // Initial fetch of ads
    fetchAds();
    
    // Add listeners for ad slot updates
    const handleAdSlotsUpdated = () => {
      console.log('Ad slots updated, refreshing ad...');
      fetchAds();
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    };
  }, [fetchAds]);

  if (!adActive) {
    console.log(`Ad not active for position: ${position}`);
    // In development, return a placeholder to show where the ad would be
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`w-full bg-muted/30 border border-muted rounded-lg p-4 ${className} text-center text-xs text-muted-foreground`}>
          Ad slot inactive: {position} / {slotId}
          {adError && <div className="text-destructive mt-1">{adError}</div>}
        </div>
      );
    }
    return null; // In production, don't show anything
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
