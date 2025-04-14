
import { v4 as uuidv4 } from 'uuid';

interface CachedAd {
  content: string;
  id: string;
  version: string;
  timestamp: number;
}

// Shared cache across all ad instances
const adContentCache = new Map<string, CachedAd>();

// Helper to get a consistent session ID
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('ad_tracking_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('ad_tracking_session_id', sessionId);
  }
  return sessionId;
};

// Get cache key for ad position and slot
export const getAdPositionKey = (position: string, slotId?: string, pageSection?: string): string => {
  return `${position}-${slotId || 'default'}-${pageSection || 'default'}`;
};

// Check if ad is in cache and still valid
export const getAdFromCache = (adPositionKey: string, force = false): CachedAd | null => {
  const now = Date.now();
  const cachedAd = adContentCache.get(adPositionKey);
  
  if (!force && cachedAd && now - cachedAd.timestamp < 300000) {
    console.log(`Using cached ad for ${adPositionKey} (${(now - cachedAd.timestamp) / 1000}s old)`);
    return cachedAd;
  }
  
  console.log(`No valid cache found for ${adPositionKey}${force ? ' (force refresh)' : ''}`);
  return null;
};

// Set ad in cache
export const setAdInCache = (adPositionKey: string, content: string, id: string, version: string): void => {
  console.log(`Caching ad for position: ${adPositionKey}, id: ${id.substring(0, 8)}...`);
  adContentCache.set(adPositionKey, {
    content,
    id,
    version,
    timestamp: Date.now()
  });
};

// Debug function to check all ads in localStorage
export const debugAvailableAds = (): void => {
  try {
    const storedAds = localStorage.getItem('quiz_app_ad_slots');
    if (storedAds) {
      let adSlots;
      try {
        const parsed = JSON.parse(storedAds);
        if (Array.isArray(parsed)) {
          adSlots = parsed;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          adSlots = parsed.data;
        }
      } catch (err) {
        console.error('Error parsing ad slots:', err);
        return;
      }
      
      if (adSlots) {
        console.group('Available Ad Slots');
        console.log(`Total ad slots: ${adSlots.length}`);
        
        // Group by position
        const groupedByPosition: Record<string, any[]> = {};
        adSlots.forEach((ad: any) => {
          if (!groupedByPosition[ad.position]) {
            groupedByPosition[ad.position] = [];
          }
          groupedByPosition[ad.position].push(ad);
        });
        
        Object.entries(groupedByPosition).forEach(([position, ads]) => {
          console.group(`Position: ${position} (${ads.length} slots)`);
          ads.forEach((ad: any) => {
            console.log(`${ad.name} - Active: ${ad.active} - ID: ${ad.id.substring(0, 8)}...`);
          });
          console.groupEnd();
        });
        
        console.groupEnd();
      }
    } else {
      console.warn('No ad slots found in localStorage');
    }
  } catch (e) {
    console.error('Error accessing localStorage:', e);
  }
};

