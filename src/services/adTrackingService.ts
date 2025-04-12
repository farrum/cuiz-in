
import { supabase } from '@/integrations/supabase/client';

// Track ad impression
export const trackAdImpression = async (
  adSlotId: string, 
  position: string, 
  slotId?: string, 
  pageSection?: string
): Promise<void> => {
  try {
    const sessionId = localStorage.getItem('ad_tracking_session_id') || null;
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
    } else {
      console.log(`Ad impression tracked: ${adSlotId}`);
    }
  } catch (error) {
    console.error('Error tracking ad impression:', error);
  }
};

// Track ad click
export const trackAdClick = async (
  adId: string, 
  position: string, 
  slotId?: string, 
  pageSection?: string
): Promise<void> => {
  try {
    const sessionId = localStorage.getItem('ad_tracking_session_id') || null;
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
