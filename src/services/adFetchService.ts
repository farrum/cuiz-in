
import { supabase } from '@/integrations/supabase/client';
import { getAdPositionKey, setAdInCache } from './adCacheService';

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
}

// Fetch ads from localStorage
export const fetchAdsFromLocalStorage = (position: string): AdSlot[] | null => {
  const storedAds = localStorage.getItem('quiz_app_ad_slots');
  
  if (storedAds) {
    const adSlots = JSON.parse(storedAds);
    console.log(`Found ${adSlots.length} total ad slots in localStorage`);
    
    const matchingAds = adSlots.filter((ad: any) => 
      ad.position === position && ad.active
    );
    
    console.log(`Found ${matchingAds.length} matching ads for position ${position}`);
    
    if (matchingAds.length > 0) {
      return matchingAds;
    }
  }
  
  return null;
};

// Select ad from matching ads
export const selectAdFromMatching = (matchingAds: AdSlot[], position: string, slotId?: string, pageSection?: string): AdSlot | null => {
  if (matchingAds.length === 0) {
    return null;
  }
  
  const dayKey = new Date().toISOString().split('T')[0];
  const positionKey = getAdPositionKey(position, slotId, pageSection);
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
  return selectedAd;
};

// Fetch ads from Supabase
export const fetchAdsFromSupabase = async (position: string): Promise<AdSlot[] | null> => {
  try {
    const { data: supabaseAds, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('position', position)
      .eq('active', true);
    
    if (error) {
      console.error('Error fetching ads from Supabase:', error);
      return null;
    }
    
    if (supabaseAds && supabaseAds.length > 0) {
      console.log(`Found ${supabaseAds.length} ads from Supabase for position ${position}`);
      return supabaseAds;
    }
  } catch (err) {
    console.error('Error in fetching ads from Supabase:', err);
  }
  
  return null;
};

// Process selected ad and update cache
export const processSelectedAd = (
  selectedAd: AdSlot, 
  position: string, 
  slotId?: string, 
  pageSection?: string
): { 
  content: string;
  id: string;
  version: string;
  debug: string;
} => {
  const contentVersion = btoa(selectedAd.id + (selectedAd.last_updated || ''));
  const adPositionKey = getAdPositionKey(position, slotId, pageSection);
  
  setAdInCache(adPositionKey, selectedAd.code, selectedAd.id, contentVersion);
  
  const source = localStorage.getItem('quiz_app_ad_slots') ? 'Local' : 'Server';
  const debug = `${source} ad: ${selectedAd.name} (${selectedAd.position})`;
  
  return {
    content: selectedAd.code,
    id: selectedAd.id,
    version: contentVersion,
    debug
  };
};
