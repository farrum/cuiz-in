
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
  is_published: boolean;
  order_index: number;
}

export const useFaqAdmin = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
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

  const addFaq = async (faq: Omit<Faq, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert([faq])
        .select();

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'FAQ added successfully',
      });
      
      await fetchFaqs();
      return data;
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to add FAQ',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateFaq = async (id: string, updates: Partial<Faq>) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'FAQ updated successfully',
      });
      
      await fetchFaqs();
      return true;
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to update FAQ',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'FAQ deleted successfully',
      });
      
      await fetchFaqs();
      return true;
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete FAQ',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  return { 
    faqs, 
    isLoading,
    addFaq,
    updateFaq,
    deleteFaq,
    refreshFaqs: fetchFaqs
  };
};
