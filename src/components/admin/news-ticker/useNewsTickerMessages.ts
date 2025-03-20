
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export interface NewsMessage {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

export function useNewsTickerMessages() {
  const [messages, setMessages] = useState<NewsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { lastUpdate } = useSupabaseRealtime('news_ticker');

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setMessages(data as NewsMessage[]);
      }
    } catch (error) {
      console.error('Error fetching news ticker messages:', error);
      toast({
        title: "Error",
        description: "Failed to load news ticker messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [lastUpdate]);

  return {
    messages,
    isLoading,
    fetchMessages
  };
}
