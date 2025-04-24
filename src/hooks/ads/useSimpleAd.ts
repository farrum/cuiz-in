
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

        setContent(data?.code || null);
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
