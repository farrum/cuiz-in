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
  try {
    const storedAds = localStorage.getItem('quiz_app_ad_slots');
    
    if (storedAds) {
      const adSlots = JSON.parse(storedAds);
      console.log(`Found ${adSlots.length} total ad slots in localStorage`);
      
      const matchingAds = adSlots.filter((ad: any) => 
        ad.position === position && ad.active && ad.code && ad.code.trim() !== ''
      );
      
      console.log(`Found ${matchingAds.length} matching ads for position ${position}`);
      
      if (matchingAds.length > 0) {
        return matchingAds;
      }
    }
  } catch (error) {
    console.error("Error fetching ads from local storage:", error);
  }
  
  return null;
};

// Select ad from matching ads
export const selectAdFromMatching = (matchingAds: AdSlot[], position: string, slotId?: string, pageSection?: string): AdSlot | null => {
  if (!matchingAds || matchingAds.length === 0) {
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
  
  // Log the selected ad for debugging
  console.log(`Selected ad for ${position}/${slotId || 'default'}: ${selectedAd.name || selectedAd.id}`);
  console.log(`Ad code length: ${selectedAd.code ? selectedAd.code.length : 0}`);
  
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
    
    // Filter out ads with empty code
    const validAds = supabaseAds?.filter(ad => ad.code && ad.code.trim() !== '') || [];
    
    if (validAds.length > 0) {
      console.log(`Found ${validAds.length} ads from Supabase for position ${position}`);
      
      // Also sync valid ads to localStorage for future use
      const existingAds = localStorage.getItem('quiz_app_ad_slots');
      let allAds = [];
      
      if (existingAds) {
        try {
          const parsedAds = JSON.parse(existingAds);
          // Remove old ads for this position
          const otherPositionAds = parsedAds.filter((ad: any) => ad.position !== position);
          allAds = [...otherPositionAds, ...validAds];
        } catch (e) {
          allAds = validAds;
        }
      } else {
        allAds = validAds;
      }
      
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify(allAds));
      return validAds;
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
  pageSection?: string,
  skipTopics: boolean = false
): { 
  content: string;
  id: string;
  version: string;
  debug: string;
} => {
  if (!selectedAd.code || selectedAd.code.trim() === '') {
    console.warn(`Ad ${selectedAd.id} has empty code content`);
  }
  
  const contentVersion = btoa(selectedAd.id + (selectedAd.last_updated || ''));
  const adPositionKey = getAdPositionKey(position, slotId, pageSection);
  
  // Process the ad code to work within an iframe
  let cleanedCode = selectedAd.code;
  
  // If skipTopics is true, remove Topics API related code
  if (skipTopics) {
    cleanedCode = cleanedCode.replace(
      /document\.browsingTopics\([^)]*\)/g, 
      'console.log("Topics API call blocked")'
    );
    
    // Remove adspector.io scripts
    cleanedCode = cleanedCode.replace(
      /<script[^>]*adspector\.io[^>]*>[^<]*<\/script>/gi,
      '<!-- adspector.io script removed -->'
    );
    
    // Remove Topics API scripts
    cleanedCode = cleanedCode.replace(
      /<script[^>]*topics[^>]*>[^<]*<\/script>/gi,
      '<!-- Topics API script removed -->'
    );
  }
  
  // Ensure scripts are loaded with proper attributes for iframe context
  cleanedCode = cleanedCode.replace(
    /<script/g,
    '<script async crossorigin="anonymous"'
  );
  
  setAdInCache(adPositionKey, cleanedCode, selectedAd.id, contentVersion);
  
  const source = localStorage.getItem('quiz_app_ad_slots') ? 'Local' : 'Server';
  const debug = `${source} ad: ${selectedAd.name} (${selectedAd.position})${skipTopics ? ' [Topics API disabled]' : ''}`;
  
  return {
    content: cleanedCode,
    id: selectedAd.id,
    version: contentVersion,
    debug
  };
};

// Clear cache for a specific position
export const clearAdCache = (position?: string): void => {
  if (position) {
    // Clear only for specified position
    localStorage.removeItem(`ad_index_${position}`);
    console.log(`Cleared ad index for position: ${position}`);
  } else {
    // Clear all cache
    localStorage.clear();
    console.log('Cleared all ad cache');
  }
};
