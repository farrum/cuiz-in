
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export const useFaqs = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (error) throw error;

        setFaqs(data || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        toast({
          title: 'Error',
          description: 'Unable to load FAQs. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return { faqs, isLoading };
};
