
import { clearAdCache } from './adCacheService';

// Track the current route to detect real changes
let currentRoute: string | null = null;
let lastRefreshTime = 0;
const THROTTLE_TIME = 3000; // 3 seconds between refreshes

/**
 * Handle navigation events to reset ad caches
 * @param newRoute The new route path
 * @returns boolean indicating if ads should be refreshed
 */
export const handleRouteChange = (newRoute: string): boolean => {
  // Don't trigger on initial load
  if (currentRoute === null) {
    currentRoute = newRoute;
    return false;
  }
  
  // Only trigger if route actually changed
  if (newRoute !== currentRoute) {
    console.log(`Route changed from ${currentRoute} to ${newRoute}, refreshing ads`);
    
    // Clear ad cache to force fresh ads
    clearAdCache();
    
    // Update current route
    currentRoute = newRoute;
    
    // Dispatch event that global navigation happened
    window.dispatchEvent(new CustomEvent('navigationOccurred', {
      detail: { route: newRoute }
    }));
    
    return true;
  }
  
  return false;
};

/**
 * Force reload of all ads on the current page
 */
export const forceAdRefresh = () => {
  clearAdCache();
  window.dispatchEvent(new CustomEvent('forceAdRefresh', {
    detail: { timestamp: Date.now() }
  }));
  return true;
};
