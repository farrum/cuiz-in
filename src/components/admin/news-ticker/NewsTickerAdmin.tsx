
import React from 'react';
import { Button } from "@/components/ui/button";
import { Megaphone, RefreshCw } from 'lucide-react';
import AddNewsMessage from './AddNewsMessage';
import NewsMessageList from './NewsMessageList';
import { useNewsTickerMessages } from './useNewsTickerMessages';

const NewsTickerAdmin: React.FC = () => {
  const { messages, isLoading, fetchMessages } = useNewsTickerMessages();

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Megaphone className="mr-2 h-6 w-6" />
            News Ticker Management
          </h1>
          <p className="text-muted-foreground">
            Manage the scrolling messages that appear at the top of the application
          </p>
        </div>
        <Button 
          onClick={fetchMessages} 
          variant="outline" 
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <AddNewsMessage 
        onMessageAdded={fetchMessages}
        isLoading={isLoading}
      />
      
      <NewsMessageList 
        messages={messages}
        isLoading={isLoading}
        onMessageUpdated={fetchMessages}
      />
    </div>
  );
};

export default NewsTickerAdmin;
