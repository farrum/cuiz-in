import React, { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface NewsTickerProps {
  className?: string;
}

interface NewsMessage {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

const NewsTicker: React.FC<NewsTickerProps> = ({ className }) => {
  const [messages, setMessages] = useState<NewsMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isListening } = useRealtimeUpdates('news_ticker');
  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('news_ticker')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }) as unknown as { 
            data: NewsMessage[] | null, 
            error: Error | null 
          };
        
        if (error) {
          console.error('Error fetching news ticker messages:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log('News ticker messages loaded:', data.length);
          setMessages(data);
        } else {
          console.log('No active news ticker messages found');
        }
      } catch (err) {
        console.error('Failed to fetch news ticker messages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    const channel = supabase
      .channel('news-ticker-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'news_ticker'
      }, () => {
        console.log('News ticker data changed, refreshing...');
        fetchMessages();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [messages]);
  
  if (isLoading) return null;
  if (messages.length === 0) return null;
  
  return (
    <div className={`bg-primary/10 text-primary py-2 px-4 ${className}`}>
      <div className="container max-w-7xl mx-auto flex items-center">
        <Megaphone className="w-4 h-4 mr-2 flex-shrink-0" />
        <div className="overflow-hidden relative whitespace-nowrap">
          <div className="animate-marquee inline-block">
            {messages[currentIndex]?.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
