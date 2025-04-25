
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
            const matchingAds = cachedAds.filter((ad: any) => 
              ad.position === position && ad.active && ad.code
            );
            
            // If we have matching ads, select one randomly
            if (matchingAds && matchingAds.length > 0) {
              // Select a random ad from matching ads
              const randomIndex = Math.floor(Math.random() * matchingAds.length);
              const selectedAd = matchingAds[randomIndex];
              
              if (selectedAd?.code) {
                console.log(`Using cached ad for position: ${position} (${selectedAd.name || 'Unnamed ad'})`);
                const sanitizedCode = sanitizeAdCode(selectedAd.code);
                setContent(sanitizedCode);
                setIsLoading(false);
                return;
              }
            } else {
              console.log(`No matching cached ads found for position: ${position}`);
            }
          } catch (cacheErr) {
            console.warn('Error parsing cached ads:', cacheErr);
          }
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
            // Store the fetched ads in localStorage cache
            const existingAdsStr = localStorage.getItem('quiz_app_ad_slots');
            let allAds = [];
            
            if (existingAdsStr) {
              try {
                const existingAds = JSON.parse(existingAdsStr);
                // Remove old ads for this position
                const otherPositionAds = existingAds.filter((ad: any) => ad.position !== position);
                allAds = [...otherPositionAds, ...data];
              } catch (e) {
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
              // Sanitize ad code to prevent common issues
              const sanitizedCode = sanitizeAdCode(selectedAd.code);
              setContent(sanitizedCode);
            } else {
              console.log('Selected ad has no code content');
              setContent(null);
              setError('No ad content available');
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
    // Block document.write calls
    .replace(/document\.write\(/g, "console.log('document.write blocked:', ")
    // Ensure data attributes for safety
    .replace(/<script/g, "<script data-safe=\"true\" data-skip-topics=\"true\"");
}
