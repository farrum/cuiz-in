import React, { useState, useEffect, useCallback } from 'react';
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

const NewsTicker: React.FC<NewsTickerProps> = ({
  className
}) => {
  const [messages, setMessages] = useState<NewsMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching news ticker messages:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('News ticker messages loaded:', data.length);
        setMessages(data as NewsMessage[]);
      } else {
        console.log('No active news ticker messages found');
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch news ticker messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up direct realtime subscription for news_ticker
  useEffect(() => {
    fetchMessages();

    // Create a dedicated channel for news ticker updates
    const channel = supabase
      .channel('news-ticker-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_ticker'
        },
        (payload) => {
          console.log('News ticker realtime update:', payload);
          // Refetch all messages on any change to ensure consistency
          fetchMessages();
        }
      )
      .subscribe((status) => {
        console.log('News ticker subscription status:', status);
      });

    return () => {
      console.log('Cleaning up news ticker realtime channel');
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  // Rotate through messages
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const interval = window.setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [messages.length]);

  if (isLoading) return null;
  if (messages.length === 0) return null;

  return (
    <div className={`bg-amber-100/50 text-amber-900 py-2 px-4 ${className}`}>
      <div className="container max-w-7xl flex items-center mx-0">
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