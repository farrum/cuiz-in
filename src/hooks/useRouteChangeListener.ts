
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to detect route changes in React Router
 * @param callback Function to call when route changes
 */
export const useRouteChangeListener = (callback: (newLocation: string) => void) => {
  const location = useLocation();
  
  useEffect(() => {
    callback(location.pathname);
  }, [location, callback]);
  
  return location;
};
