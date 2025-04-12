
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
  
  return null;
};

// Set ad in cache
export const setAdInCache = (adPositionKey: string, content: string, id: string, version: string): void => {
  adContentCache.set(adPositionKey, {
    content,
    id,
    version,
    timestamp: Date.now()
  });
};
