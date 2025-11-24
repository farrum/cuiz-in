
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSimpleAd = (position: string) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      const timeoutId = setTimeout(() => {
        console.log(`Ad fetch timeout for position: ${position}`);
        setIsLoading(false);
        setError('Ad loading timeout');
      }, 5000);
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching ad for position: ${position}`);
        
        // First try to get from local storage cache
        const cachedAdsString = localStorage.getItem('quiz_app_ad_slots');
        if (cachedAdsString) {
          try {
            const cachedAds = JSON.parse(cachedAdsString);
            if (!Array.isArray(cachedAds)) {
              console.warn('Cached ads is not an array:', cachedAds);
              throw new Error('Invalid cached ads format');
            }
            
            console.log(`Found ${cachedAds.length} total cached ads`);
            
            const matchingAds = cachedAds.filter((ad: any) => 
              ad.position === position && ad.active && ad.code
            );
            
            console.log(`Found ${matchingAds.length} matching ads for position: ${position}`);
            
            // If we have matching ads, select one randomly
            if (matchingAds && matchingAds.length > 0) {
              // Select a random ad from matching ads
              const randomIndex = Math.floor(Math.random() * matchingAds.length);
              const selectedAd = matchingAds[randomIndex];
              
              if (selectedAd?.code) {
                console.log(`Using cached ad for position: ${position} (${selectedAd.name || 'Unnamed ad'})`);
                const sanitizedCode = sanitizeAdCode(selectedAd.code);
                setContent(sanitizedCode);
                clearTimeout(timeoutId);
                setIsLoading(false);
                return;
              }
            } else {
              console.log(`No matching cached ads found for position: ${position}`);
            }
          } catch (cacheErr) {
            console.warn('Error parsing cached ads:', cacheErr);
          }
        } else {
          console.log('No ad slots found in localStorage');
        }
        
        // If no cached ad, try fetching from Supabase
        try {
          console.log(`Fetching ads from Supabase for position: ${position}`);
          // Get all active ads for the position, not just one
          const { data, error } = await supabase
            .from('ad_slots')
            .select('*')
            .eq('position', position)
            .eq('active', true);
            
          if (error) {
            console.error('Error fetching ads:', error);
            setContent(null);
            setError(`Failed to fetch ads: ${error.message}`);
            return;
          }
          
          if (data && data.length > 0) {
            console.log(`Found ${data.length} ads from Supabase for position: ${position}`);
            // Store the fetched ads in localStorage cache
            const existingAdsStr = localStorage.getItem('quiz_app_ad_slots');
            let allAds = [];
            
            if (existingAdsStr) {
              try {
                const existingAds = JSON.parse(existingAdsStr);
                if (Array.isArray(existingAds)) {
                  // Remove old ads for this position
                  const otherPositionAds = existingAds.filter((ad: any) => ad.position !== position);
                  allAds = [...otherPositionAds, ...data];
                } else {
                  console.warn('Existing ads is not an array', existingAdsStr);
                  allAds = data;
                }
              } catch (e) {
                console.warn('Error parsing existing ads:', e);
                allAds = data;
              }
            } else {
              allAds = data;
            }
            
            localStorage.setItem('quiz_app_ad_slots', JSON.stringify(allAds));
            console.log(`Stored ${data.length} ads in cache for position: ${position}`);
            
            // Select a random ad from the fetched ads
            const randomIndex = Math.floor(Math.random() * data.length);
            const selectedAd = data[randomIndex];
            
            if (selectedAd?.code) {
              console.log(`Selected ad: ${selectedAd.name || selectedAd.id} for position: ${position}`);
              const sanitizedCode = sanitizeAdCode(selectedAd.code);
              setContent(sanitizedCode);
              clearTimeout(timeoutId);
            } else {
              console.log('Selected ad has no code content');
              setContent(null);
              setError('No ad content available');
              clearTimeout(timeoutId);
            }
          } else {
            console.log(`No ads available for position: ${position}`);
            setContent(null);
            setError(`No ads available for position: ${position}`);
          }
        } catch (supabaseErr) {
          console.error('Error in Supabase fetch:', supabaseErr);
          setError(`Fetch error: ${supabaseErr}`);
        }
      } catch (err) {
        console.error('Error in ad fetch:', err);
        setContent(null);
        setError(`Unexpected error: ${err}`);
        clearTimeout(timeoutId);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
    
    // Refresh ads every 5 minutes
    const refreshInterval = setInterval(fetchAd, 5 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [position]);

  return { content, isLoading, error };
};

function sanitizeAdCode(code: string): string {
  if (!code) return '';
  
  // Remove problematic script content
  return code
    // Block Topics API
    .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API blocked')")
    // Block service worker registration
    .replace(/navigator\.serviceWorker\.register/g, "console.log('Service worker reg blocked')")
    // Block notifications
    .replace(/Notification\.requestPermission/g, "console.log('Notification blocked')")
    // Block problematic scripting
    .replace(/new\s+TCPusher/g, "console.log('TCPusher blocked')")
    // Block document.write calls
    .replace(/document\.write\(/g, "console.log('document.write blocked:', ")
    // Ensure data attributes for safety
    .replace(/<script/g, "<script data-safe=\"true\" data-skip-topics=\"true\"");
}
