
import React, { useState, useEffect, useId } from 'react';
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
  const sessionId = getSessionId();
  const containerId = useId().replace(/:/g, '-') + '-ad-container';
  
  // Use our custom hook to execute scripts in the ad content
  useScriptExecution(adContent, containerId);
  
  useEffect(() => {
    const fetchAds = async () => {
      try {
        // First try to get ads from Supabase
        const { data: supabaseAds, error } = await supabase
          .from('ad_slots')
          .select('*')
          .eq('position', position)
          .eq('active', true);
        
        if (error) {
          console.error('Error fetching ads from Supabase:', error);
          fallbackToLocalStorage();
          return;
        }
        
        if (supabaseAds && supabaseAds.length > 0) {
          // If Supabase has ads, use them
          const randomIndex = Math.floor(Math.random() * supabaseAds.length);
          const selectedAd = supabaseAds[randomIndex];
          
          setTimeout(() => {
            setAdContent(selectedAd.code);
            setAdId(selectedAd.id);
            setAdLoaded(true);
            
            // Track the ad impression
            trackAdImpression(selectedAd.id);
          }, 1000);
          
          setAdActive(true);
        } else {
          // If no ads from Supabase, fall back to localStorage
          fallbackToLocalStorage();
        }
      } catch (err) {
        console.error('Error in ad fetching:', err);
        fallbackToLocalStorage();
      }
    };
    
    const fallbackToLocalStorage = () => {
      // Load ad slots from localStorage as fallback
      const adSlots = JSON.parse(localStorage.getItem('quiz_app_ad_slots') || '[]');
      
      // Find a matching ad for this position
      const matchingAds = adSlots.filter((ad: any) => 
        ad.position === position && ad.active
      );
      
      if (matchingAds.length > 0) {
        // If multiple ads match the position, choose one randomly
        const randomIndex = Math.floor(Math.random() * matchingAds.length);
        const selectedAd = matchingAds[randomIndex];
        
        // Simulate ad loading
        setTimeout(() => {
          setAdContent(selectedAd.code);
          setAdId(selectedAd.id);
          setAdLoaded(true);
          
          // Track the ad impression
          trackAdImpression(selectedAd.id);
        }, 1000);
        
        setAdActive(true);
      } else {
        // No matching ads or all are inactive
        setAdActive(false);
      }
    };
    
    fetchAds();
  }, [position]);

  // Track ad impression when it's displayed
  const trackAdImpression = async (adSlotId: string) => {
    if (!adSlotId) return;
    
    try {
      const userId = localStorage.getItem('user_id') || null;
      const pageUrl = window.location.href;
      const deviceInfo = navigator.userAgent;
      
      // Record impression in database
      await supabase.from('ad_views').insert({
        ad_id: adSlotId,
        user_id: userId,
        session_id: sessionId,
        page_url: pageUrl,
        device_info: deviceInfo,
        ad_position: position,
        slot_id: slotId || position,
        page_section: pageSection || position
      });
      
      console.log(`Ad impression tracked: ${adSlotId} in ${slotId || position}`);
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  // Track ad click when user interacts with the ad
  const handleAdClick = async () => {
    if (!adId) return;
    
    try {
      const userId = localStorage.getItem('user_id') || null;
      const pageUrl = window.location.href;
      const deviceInfo = navigator.userAgent;
      
      // Record click in database
      await supabase.from('ad_clicks').insert({
        ad_id: adId,
        user_id: userId,
        session_id: sessionId,
        page_url: pageUrl,
        device_info: deviceInfo,
        ad_position: position,
        slot_id: slotId || position,
        page_section: pageSection || position
      });
      
      console.log(`Ad click tracked: ${adId} in ${slotId || position}`);
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  if (!adActive) {
    return null; // Don't render anything if no active ad for this position
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
        </div>
      ) : (
        <div className="w-full">
          <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
          <div id={containerId}></div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementBanner;
