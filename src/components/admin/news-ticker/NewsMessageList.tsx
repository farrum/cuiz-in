
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NewsMessageItem from './NewsMessageItem';

interface NewsMessage {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

interface NewsMessageListProps {
  messages: NewsMessage[];
  isLoading: boolean;
  onMessageUpdated: () => void;
}

const NewsMessageList: React.FC<NewsMessageListProps> = ({ 
  messages, 
  isLoading, 
  onMessageUpdated 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message List</CardTitle>
        <CardDescription>
          All news ticker messages in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && messages.length === 0 ? (
          <div className="text-center p-4">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-4 border rounded-md bg-muted/50">
            <p>No messages found. Add your first announcement above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <NewsMessageItem
                key={message.id}
                message={message}
                onMessageUpdated={onMessageUpdated}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsMessageList;
