
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSimpleAd = (position: string) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First try to get from local storage cache
        const cachedAdsString = localStorage.getItem('quiz_app_ad_slots');
        if (cachedAdsString) {
          try {
            const cachedAds = JSON.parse(cachedAdsString);
            const matchingAd = cachedAds.find((ad: any) => 
              ad.position === position && ad.active && ad.code
            );
            
            if (matchingAd?.code) {
              console.log(`Using cached ad for position: ${position}`);
              const sanitizedCode = sanitizeAdCode(matchingAd.code);
              setContent(sanitizedCode);
              setIsLoading(false);
              return;
            }
          } catch (cacheErr) {
            console.warn('Error parsing cached ads:', cacheErr);
          }
        }
        
        // If no cached ad, try fetching from Supabase
        try {
          // Request as array instead of single object to avoid 406 errors
          const { data, error } = await supabase
            .from('ad_slots')
            .select('code')
            .eq('position', position)
            .eq('active', true);
            
          if (error) {
            console.error('Error fetching ad:', error);
            setContent(null);
            setError(`Failed to fetch ad: ${error.message}`);
            return;
          }
          
          if (data && data.length > 0) {
            const adData = data[0];
            if (adData?.code) {
              // Sanitize ad code to prevent common issues
              const sanitizedCode = sanitizeAdCode(adData.code);
              setContent(sanitizedCode);
            } else {
              setContent(null);
              setError('No ad content available');
            }
          } else {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
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
    // Ensure data attributes for safety
    .replace(/<script/g, "<script data-safe=\"true\" data-skip-topics=\"true\"");
}

