
import React, { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Using type assertion to handle the news_ticker table that's not yet in the TypeScript types
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
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch news ticker messages:', err);
      }
    };
    
    fetchMessages();
    
    // Set up subscription for real-time updates
    const subscription = supabase
      .channel('news_ticker_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'news_ticker'
      }, () => {
        fetchMessages();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [messages]);
  
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
