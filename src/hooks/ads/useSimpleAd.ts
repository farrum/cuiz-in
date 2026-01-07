
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSimpleAd = (position: string) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchAttemptRef = useRef(0);

  useEffect(() => {
    const fetchAd = async () => {
      const attemptNumber = ++fetchAttemptRef.current;
      
      // Timeout for the entire fetch operation
      const timeoutId = setTimeout(() => {
        if (fetchAttemptRef.current === attemptNumber) {
          console.log(`Ad fetch timeout for position: ${position}`);
          setIsLoading(false);
          setError('Ad loading timeout');
        }
      }, 8000);
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching ad for position: ${position}`);
        
        // First try to get from local storage cache
        const cachedAdsString = localStorage.getItem('quiz_app_ad_slots');
        if (cachedAdsString) {
          try {
            const cachedAds = JSON.parse(cachedAdsString);
            if (Array.isArray(cachedAds)) {
              const matchingAds = cachedAds.filter((ad: any) => 
                ad.position === position && ad.active && ad.code
              );
              
              if (matchingAds.length > 0) {
                const randomIndex = Math.floor(Math.random() * matchingAds.length);
                const selectedAd = matchingAds[randomIndex];
                
                if (selectedAd?.code) {
                  console.log(`Using cached ad for position: ${position}`);
                  const sanitizedCode = sanitizeAdCode(selectedAd.code);
                  setContent(sanitizedCode);
                  clearTimeout(timeoutId);
                  setIsLoading(false);
                  return;
                }
              }
            }
          } catch (cacheErr) {
            console.warn('Error parsing cached ads:', cacheErr);
          }
        }
        
        // Fetch from Supabase if no cached ad
        try {
          const { data, error: fetchError } = await supabase
            .from('ad_slots')
            .select('*')
            .eq('position', position)
            .eq('active', true);
            
          if (fetchError) {
            console.error('Error fetching ads:', fetchError);
            setContent(null);
            setError(`Failed to fetch ads: ${fetchError.message}`);
            clearTimeout(timeoutId);
            setIsLoading(false);
            return;
          }
          
          if (data && data.length > 0) {
            console.log(`Found ${data.length} ads from Supabase for position: ${position}`);
            
            // Update cache
            const existingAdsStr = localStorage.getItem('quiz_app_ad_slots');
            let allAds = [];
            
            if (existingAdsStr) {
              try {
                const existingAds = JSON.parse(existingAdsStr);
                if (Array.isArray(existingAds)) {
                  const otherPositionAds = existingAds.filter((ad: any) => ad.position !== position);
                  allAds = [...otherPositionAds, ...data];
                } else {
                  allAds = data;
                }
              } catch {
                allAds = data;
              }
            } else {
              allAds = data;
            }
            
            localStorage.setItem('quiz_app_ad_slots', JSON.stringify(allAds));
            
            // Select and use a random ad
            const randomIndex = Math.floor(Math.random() * data.length);
            const selectedAd = data[randomIndex];
            
            if (selectedAd?.code) {
              const sanitizedCode = sanitizeAdCode(selectedAd.code);
              setContent(sanitizedCode);
              clearTimeout(timeoutId);
            } else {
              setContent(null);
              setError('No ad content available');
            }
          } else {
            console.log(`No ads available for position: ${position}`);
            setContent(null);
            setError(`No ads for position: ${position}`);
          }
        } catch (supabaseErr) {
          console.error('Error in Supabase fetch:', supabaseErr);
          setError(`Fetch error: ${supabaseErr}`);
        }
      } catch (err) {
        console.error('Error in ad fetch:', err);
        setContent(null);
        setError(`Unexpected error: ${err}`);
      } finally {
        clearTimeout(timeoutId);
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
  
  return code
    .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API blocked')")
    .replace(/navigator\.serviceWorker\.register/g, "console.log('Service worker reg blocked')")
    .replace(/Notification\.requestPermission/g, "console.log('Notification blocked')")
    .replace(/new\s+TCPusher/g, "console.log('TCPusher blocked')")
    .replace(/document\.write\(/g, "console.log('document.write blocked:', ")
    .replace(/<script/g, "<script data-safe=\"true\" data-skip-topics=\"true\"");
}
