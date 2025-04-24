
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSimpleAd = (position: string) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_slots')
          .select('code')
          .eq('position', position)
          .eq('active', true)
          .single();

        if (error) {
          console.error('Error fetching ad:', error);
          setContent(null);
          return;
        }

        if (data?.code) {
          // Sanitize ad code to prevent common issues
          const sanitizedCode = sanitizeAdCode(data.code);
          setContent(sanitizedCode);
        } else {
          setContent(null);
        }
      } catch (err) {
        console.error('Error in ad fetch:', err);
        setContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [position]);

  return { content, isLoading };
};

function sanitizeAdCode(code: string): string {
  // Remove problematic script content
  return code
    // Block Topics API
    .replace(/document\.browsingTopics\([^)]*\)/g, "console.log('Topics API blocked')")
    // Block service worker registration
    .replace(/navigator\.serviceWorker\.register/g, "console.log('Service worker reg blocked')")
    // Block notifications
    .replace(/Notification\.requestPermission/g, "console.log('Notification blocked')")
    // Block TCPusher
    .replace(/new\s+TCPusher/g, "console.log('TCPusher blocked')");
}
